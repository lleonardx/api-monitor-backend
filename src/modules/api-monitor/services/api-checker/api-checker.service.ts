// src/modules/api-monitor/services/api-checker/api-checker.service.ts

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

      const status =
        response.status >= 200 && response.status < 400
          ? ApiStatus.ONLINE
          : ApiStatus.OFFLINE;

      return this.processResult(api, {
        status,
        statusCode: response.status,
        responseTimeMs
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

    const totalChecks = (api.totalChecks || 0) + 1;

    const successChecks =
      (api.successChecks || 0) +
      (newStatus === ApiStatus.ONLINE ? 1 : 0);

    const failedChecks =
      (api.failedChecks || 0) +
      (newStatus !== ApiStatus.ONLINE ? 1 : 0);

    const uptimePercentage = Number(
      ((successChecks / totalChecks) * 100).toFixed(2)
    );

    const checkedAt = new Date();

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

    api.currentStatus = newStatus;
    api.lastStatusCode = result.statusCode;
    api.lastResponseTimeMs = result.responseTimeMs;
    api.lastCheckedAt = checkedAt;
    api.lastError = result.error;
    api.totalChecks = totalChecks;
    api.successChecks = successChecks;
    api.failedChecks = failedChecks;
    api.uptimePercentage = uptimePercentage;

    await api.save();

    if (previousStatus !== newStatus) {
      if (
        newStatus === ApiStatus.OFFLINE ||
        newStatus === ApiStatus.TIMEOUT
      ) {
        await this.apiAlertMailService.sendApiDownAlert(api, result);
      }

      if (
        previousStatus !== ApiStatus.ONLINE &&
        newStatus === ApiStatus.ONLINE
      ) {
        await this.apiAlertMailService.sendApiRecoveredAlert(api, result);
      }
    }

    const payload = {
      apiId: api._id,
      name: api.name,
      url: api.url,
      previousStatus,
      currentStatus: newStatus,
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      error: result.error,
      checkedAt,
      uptimePercentage,
      totalChecks,
      successChecks,
      failedChecks
    };

    this.apiMonitorGateway.emitStatusChanged(payload);
    this.apiMonitorGateway.emitApiChecked(payload);

    this.logger.log(
      `[${api.name}] ${newStatus} - ${result.statusCode || '-'} - ${
        result.responseTimeMs || 0
      }ms`
    );

    return payload;
  }
}