import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import axios from 'axios';

import {
  ApiStatus,
  MonitoredApi,
  MonitoredApiDocument
} from '../../schemas/monitored-api.schema';

import {
  ApiCheckHistory,
  ApiCheckHistoryDocument
} from '../../schemas/api-check-history.schema';

import {
  ApiIncident,
  ApiIncidentDocument,
  ApiIncidentSeverity,
  ApiIncidentStatus
} from '../../schemas/api-incident.schema';

import { ApiAlertMailService } from '../api-alert-mail/api-alert-mail.service';
import { ApiMonitorGateway } from '../../gateways/api-monitor/api-monitor.gateway';

@Injectable()
export class ApiCheckerService {
  private readonly logger = new Logger(ApiCheckerService.name);

  constructor(
    @InjectModel(MonitoredApi.name)
    private readonly monitoredApiModel: Model<MonitoredApiDocument>,

    @InjectModel(ApiCheckHistory.name)
    private readonly apiCheckHistoryModel: Model<ApiCheckHistoryDocument>,

    @InjectModel(ApiIncident.name)
    private readonly apiIncidentModel: Model<ApiIncidentDocument>,

    private readonly apiAlertMailService: ApiAlertMailService,
    private readonly apiMonitorGateway: ApiMonitorGateway
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleApiChecks() {
    const apis = await this.monitoredApiModel.find({ active: true }).exec();

    for (const api of apis) {
      const lastCheckedAt = api.lastCheckedAt
        ? new Date(api.lastCheckedAt).getTime()
        : 0;

      const now = Date.now();
      const intervalMs = (api.intervalSeconds || 30) * 1000;

      if (now - lastCheckedAt >= intervalMs) {
        await this.checkApi(api);
      }
    }
  }

  async checkApi(api: MonitoredApiDocument) {
    const startedAt = Date.now();

    if (this.isInMaintenance(api)) {
      return this.processResult(api, {
        status: ApiStatus.MAINTENANCE,
        responseTimeMs: 0,
        error: api.maintenanceReason || 'API em modo manutenção'
      });
    }

    try {
      const response = await axios.request({
        url: api.url,
        method: api.method as any,
        headers: api.headers || {},
        data: api.body || undefined,
        timeout: api.timeoutMs || 10000,
        validateStatus: () => true
      });

      const responseTimeMs = Date.now() - startedAt;

      const validation = this.validateResponse(api, {
        statusCode: response.status,
        responseTimeMs,
        data: response.data
      });

      return this.processResult(api, {
        status: validation.status,
        statusCode: response.status,
        responseTimeMs,
        error: validation.error
      });
    } catch (error: any) {
      const responseTimeMs = Date.now() - startedAt;

      const status =
        error?.code === 'ECONNABORTED'
          ? ApiStatus.TIMEOUT
          : ApiStatus.OFFLINE;

      return this.processResult(api, {
        status,
        responseTimeMs,
        error: error?.message || 'Erro desconhecido'
      });
    }
  }

  private validateResponse(
    api: MonitoredApiDocument,
    response: {
      statusCode: number;
      responseTimeMs: number;
      data: any;
    }
  ): {
    status: ApiStatus;
    error?: string;
  } {
    const expectedStatusCodes = api.expectedStatusCodes?.length
      ? api.expectedStatusCodes
      : [200, 201, 202, 204];

    if (!expectedStatusCodes.includes(response.statusCode)) {
      return {
        status: ApiStatus.OFFLINE,
        error: `Status HTTP inesperado: ${response.statusCode}`
      };
    }

    if (
      api.maxResponseTimeMs &&
      response.responseTimeMs > api.maxResponseTimeMs
    ) {
      return {
        status: ApiStatus.TIMEOUT,
        error: `Tempo de resposta acima do limite: ${response.responseTimeMs}ms`
      };
    }

    if (api.expectedText) {
      const responseAsText =
        typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data);

      if (!responseAsText.includes(api.expectedText)) {
        return {
          status: ApiStatus.OFFLINE,
          error: `Texto esperado não encontrado: ${api.expectedText}`
        };
      }
    }

    return {
      status: ApiStatus.ONLINE
    };
  }

  private async processResult(
    api: MonitoredApiDocument,
    result: {
      status: ApiStatus;
      statusCode?: number;
      responseTimeMs?: number;
      error?: string;
    }
  ) {
    const previousStatus = api.currentStatus;
    const newStatus = result.status;
    const checkedAt = new Date();

    const isSuccess = newStatus === ApiStatus.ONLINE;
    const isFailure =
      newStatus === ApiStatus.OFFLINE || newStatus === ApiStatus.TIMEOUT;

    const totalChecks = (api.totalChecks || 0) + 1;
    const successChecks = (api.successChecks || 0) + (isSuccess ? 1 : 0);
    const failedChecks = (api.failedChecks || 0) + (isFailure ? 1 : 0);

    const uptimePercentage = Number(
      ((successChecks / totalChecks) * 100).toFixed(2)
    );

    if (isSuccess) {
      api.consecutiveSuccesses = (api.consecutiveSuccesses || 0) + 1;
      api.consecutiveFailures = 0;
    }

    if (isFailure) {
      api.consecutiveFailures = (api.consecutiveFailures || 0) + 1;
      api.consecutiveSuccesses = 0;
    }

    if (newStatus === ApiStatus.MAINTENANCE) {
      api.consecutiveFailures = 0;
      api.consecutiveSuccesses = 0;
    }

    const shouldOpenIncident =
      isFailure &&
      api.consecutiveFailures >= (api.failureThreshold || 3);

    const shouldRecover =
      isSuccess &&
      previousStatus !== ApiStatus.ONLINE &&
      api.consecutiveSuccesses >= (api.recoveryThreshold || 2);

    let finalStatus = previousStatus;

    if (shouldOpenIncident) {
      finalStatus = newStatus;
    }

    if (shouldRecover) {
      finalStatus = ApiStatus.ONLINE;
    }

    if (newStatus === ApiStatus.MAINTENANCE) {
      finalStatus = ApiStatus.MAINTENANCE;
    }

    await this.apiCheckHistoryModel.create({
      apiId: api._id,
      name: api.name,
      url: api.url,
      status: newStatus,
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      error: result.error,
      checkedAt
    });

    api.currentStatus = finalStatus;
    api.lastStatusCode = result.statusCode;
    api.lastResponseTimeMs = result.responseTimeMs;
    api.lastCheckedAt = checkedAt;
    api.lastError = result.error;
    api.totalChecks = totalChecks;
    api.successChecks = successChecks;
    api.failedChecks = failedChecks;
    api.uptimePercentage = uptimePercentage;

    await api.save();

    let incident: ApiIncidentDocument | null = null;

    if (shouldOpenIncident) {
      incident = await this.openIncidentIfNeeded(api, result);
    }

    if (shouldRecover) {
      incident = await this.resolveIncidentIfNeeded(api, result);
    }

    const payload = {
      apiId: api._id,
      name: api.name,
      url: api.url,
      previousStatus,
      currentStatus: finalStatus,
      checkStatus: newStatus,
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      error: result.error,
      checkedAt,
      uptimePercentage,
      totalChecks,
      successChecks,
      failedChecks,
      consecutiveFailures: api.consecutiveFailures,
      consecutiveSuccesses: api.consecutiveSuccesses,
      incidentId: incident?._id
    };

    this.apiMonitorGateway.emitApiChecked(payload);

    if (previousStatus !== finalStatus) {
      this.apiMonitorGateway.emitStatusChanged(payload);
    }

    this.logger.log(
      `[${api.name}] check=${newStatus} status=${finalStatus} failures=${api.consecutiveFailures} successes=${api.consecutiveSuccesses} - ${
        result.statusCode || '-'
      } - ${result.responseTimeMs || 0}ms`
    );

    return payload;
  }

  private async openIncidentIfNeeded(
    api: MonitoredApiDocument,
    result: {
      status: ApiStatus;
      statusCode?: number;
      responseTimeMs?: number;
      error?: string;
    }
  ) {
    const existingOpenIncident = await this.apiIncidentModel.findOne({
      apiId: api._id,
      status: ApiIncidentStatus.OPEN
    });

    if (existingOpenIncident) {
      return existingOpenIncident;
    }

    const incident = await this.apiIncidentModel.create({
      apiId: api._id,
      name: api.name,
      url: api.url,
      status: ApiIncidentStatus.OPEN,
      severity: ApiIncidentSeverity.CRITICAL,
      detectedStatus: result.status,
      startedAt: new Date(),
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      error: result.error,
      notifiedAt: new Date()
    });

    if (!api.maintenanceMode) {
      await this.apiAlertMailService.sendApiDownAlert(api, {
        ...result,
        incident
      });
    }

    this.apiMonitorGateway.emitStatusChanged({
      apiId: api._id,
      name: api.name,
      url: api.url,
      currentStatus: result.status,
      incidentId: incident._id,
      incidentStatus: ApiIncidentStatus.OPEN
    });

    return incident;
  }

  private async resolveIncidentIfNeeded(
    api: MonitoredApiDocument,
    result: {
      status: ApiStatus;
      statusCode?: number;
      responseTimeMs?: number;
      error?: string;
    }
  ) {
    const incident = await this.apiIncidentModel.findOne({
      apiId: api._id,
      status: ApiIncidentStatus.OPEN
    });

    if (!incident) {
      return null;
    }

    const endedAt = new Date();
    const startedAt = incident.startedAt
      ? new Date(incident.startedAt)
      : endedAt;

    const durationSeconds = Math.max(
      0,
      Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)
    );

    incident.status = ApiIncidentStatus.RESOLVED;
    incident.endedAt = endedAt;
    incident.durationSeconds = durationSeconds;
    incident.resolvedNotifiedAt = new Date();

    await incident.save();

    if (!api.maintenanceMode) {
      await this.apiAlertMailService.sendApiRecoveredAlert(api, {
        ...result,
        incident
      });
    }

    this.apiMonitorGateway.emitStatusChanged({
      apiId: api._id,
      name: api.name,
      url: api.url,
      currentStatus: ApiStatus.ONLINE,
      incidentId: incident._id,
      incidentStatus: ApiIncidentStatus.RESOLVED,
      durationSeconds
    });

    return incident;
  }

  private isInMaintenance(api: MonitoredApiDocument) {
    if (!api.maintenanceMode) {
      return false;
    }

    if (!api.maintenanceUntil) {
      return true;
    }

    return new Date(api.maintenanceUntil).getTime() > Date.now();
  }
}