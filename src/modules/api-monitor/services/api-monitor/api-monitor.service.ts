import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

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
    ApiIncidentStatus
} from '../../schemas/api-incident.schema';

import { ApiCheckerService } from '../api-checker/api-checker.service';
import { CreateMonitoredApiDto } from '../../dto/create-monitored-api.dto';
import { UpdateMonitoredApiDto } from '../../dto/update-monitored-api.dto';

@Injectable()
export class ApiMonitorService {
  constructor(
    @InjectModel(MonitoredApi.name)
    private readonly monitoredApiModel: Model<MonitoredApiDocument>,

    @InjectModel(ApiCheckHistory.name)
    private readonly apiCheckHistoryModel: Model<ApiCheckHistoryDocument>,

    @InjectModel(ApiIncident.name)
    private readonly apiIncidentModel: Model<ApiIncidentDocument>,

    private readonly apiCheckerService: ApiCheckerService
  ) {}

  async create(dto: CreateMonitoredApiDto) {
    return this.monitoredApiModel.create({
      ...dto,
      method: dto.method || 'GET',
      expectedStatusCodes: dto.expectedStatusCodes?.length
        ? dto.expectedStatusCodes
        : [200, 201, 202, 204],
      maxResponseTimeMs: dto.maxResponseTimeMs || 5000,
      intervalSeconds: dto.intervalSeconds || 30,
      timeoutMs: dto.timeoutMs || 10000,
      failureThreshold: dto.failureThreshold || 3,
      recoveryThreshold: dto.recoveryThreshold || 2,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      alertEmails: dto.alertEmails || [],
      active: dto.active ?? true,
      maintenanceMode: dto.maintenanceMode ?? false,
      maintenanceUntil: dto.maintenanceUntil
        ? new Date(dto.maintenanceUntil)
        : undefined,
      maintenanceReason: dto.maintenanceReason
    });
  }

  async findAll() {
    return this.monitoredApiModel.find().sort({ createdAt: -1 }).lean();
  }

  async findOne(id: string) {
    const api = await this.monitoredApiModel.findById(id).lean();

    if (!api) {
      throw new NotFoundException('API monitorada não encontrada.');
    }

    return api;
  }

  async update(id: string, dto: UpdateMonitoredApiDto) {
    const payload: any = {
      ...dto
    };

    if (dto.maintenanceUntil) {
      payload.maintenanceUntil = new Date(dto.maintenanceUntil);
    }

    const updated = await this.monitoredApiModel
      .findByIdAndUpdate(id, payload, {
        new: true
      })
      .lean();

    if (!updated) {
      throw new NotFoundException('API monitorada não encontrada.');
    }

    return updated;
  }

  async remove(id: string) {
    const deleted = await this.monitoredApiModel.findByIdAndDelete(id).lean();

    if (!deleted) {
      throw new NotFoundException('API monitorada não encontrada.');
    }

    return {
      message: 'API monitorada removida com sucesso.',
      deleted
    };
  }

  async findHistory(params: { apiId?: string; limit?: number }) {
    const { apiId, limit = 100 } = params;

    const filter: any = {};

    if (apiId) {
      filter.apiId = new Types.ObjectId(apiId);
    }

    return this.apiCheckHistoryModel
      .find(filter)
      .sort({ checkedAt: -1 })
      .limit(limit)
      .lean();
  }

  async findIncidents(params: {
    apiId?: string;
    status?: string;
    limit?: number;
  }) {
    const { apiId, status, limit = 100 } = params;

    const filter: any = {};

    if (apiId) {
      filter.apiId = new Types.ObjectId(apiId);
    }

    if (status) {
      filter.status = status;
    }

    return this.apiIncidentModel
      .find(filter)
      .sort({ startedAt: -1 })
      .limit(limit)
      .lean();
  }

  async checkNow(id: string) {
    const api = await this.monitoredApiModel.findById(id);

    if (!api) {
      throw new NotFoundException('API monitorada não encontrada.');
    }

    return this.apiCheckerService.checkApi(api);
  }

  async getSummary() {
    const [
      total,
      online,
      offline,
      timeout,
      maintenance,
      active,
      inactive,
      openIncidents,
      apis
    ] = await Promise.all([
      this.monitoredApiModel.countDocuments(),
      this.monitoredApiModel.countDocuments({
        currentStatus: ApiStatus.ONLINE
      }),
      this.monitoredApiModel.countDocuments({
        currentStatus: ApiStatus.OFFLINE
      }),
      this.monitoredApiModel.countDocuments({
        currentStatus: ApiStatus.TIMEOUT
      }),
      this.monitoredApiModel.countDocuments({
        currentStatus: ApiStatus.MAINTENANCE
      }),
      this.monitoredApiModel.countDocuments({
        active: true
      }),
      this.monitoredApiModel.countDocuments({
        active: false
      }),
      this.apiIncidentModel.countDocuments({
        status: ApiIncidentStatus.OPEN
      }),
      this.monitoredApiModel
        .find()
        .select('uptimePercentage lastResponseTimeMs')
        .lean()
    ]);
  
    const averageUptime =
      apis.length > 0
        ? Number(
            (
              apis.reduce(
                (acc, api: any) => acc + (api.uptimePercentage || 0),
                0
              ) / apis.length
            ).toFixed(2)
          )
        : 0;
  
    const averageResponseTimeMs =
      apis.length > 0
        ? Number(
            (
              apis.reduce(
                (acc, api: any) => acc + (api.lastResponseTimeMs || 0),
                0
              ) / apis.length
            ).toFixed(0)
          )
        : 0;
  
    return {
      total,
      active,
      inactive,
      online,
      offline,
      timeout,
      maintenance,
      openIncidents,
      averageUptime,
      averageResponseTimeMs
    };
  }
  
  async pause(id: string) {
    const updated = await this.monitoredApiModel
      .findByIdAndUpdate(
        id,
        {
          active: false
        },
        {
          new: true
        }
      )
      .lean();
  
    if (!updated) {
      throw new NotFoundException('API monitorada não encontrada.');
    }
  
    return {
      message: 'Monitoramento pausado com sucesso.',
      api: updated
    };
  }
  
  async resume(id: string) {
    const updated = await this.monitoredApiModel
      .findByIdAndUpdate(
        id,
        {
          active: true,
          maintenanceMode: false,
          maintenanceUntil: undefined,
          maintenanceReason: undefined
        },
        {
          new: true
        }
      )
      .lean();
  
    if (!updated) {
      throw new NotFoundException('API monitorada não encontrada.');
    }
  
    return {
      message: 'Monitoramento retomado com sucesso.',
      api: updated
    };
  }
  
  async setMaintenance(
    id: string,
    dto: {
      maintenanceMode: boolean;
      maintenanceUntil?: string;
      maintenanceReason?: string;
    }
  ) {
    const payload: any = {
      maintenanceMode: dto.maintenanceMode,
      maintenanceReason: dto.maintenanceReason
    };
  
    if (dto.maintenanceUntil) {
      payload.maintenanceUntil = new Date(dto.maintenanceUntil);
    }
  
    if (!dto.maintenanceMode) {
      payload.maintenanceUntil = undefined;
      payload.maintenanceReason = undefined;
    }
  
    const updated = await this.monitoredApiModel
      .findByIdAndUpdate(id, payload, {
        new: true
      })
      .lean();
  
    if (!updated) {
      throw new NotFoundException('API monitorada não encontrada.');
    }
  
    return {
      message: dto.maintenanceMode
        ? 'Modo manutenção ativado com sucesso.'
        : 'Modo manutenção desativado com sucesso.',
      api: updated
    };
  }
}