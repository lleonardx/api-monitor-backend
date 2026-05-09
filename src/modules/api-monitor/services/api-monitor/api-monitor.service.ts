import {
Injectable,
NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MonitoredApi, MonitoredApiDocument } from '../../schemas/monitored-api.schema';
import { ApiCheckHistory, ApiCheckHistoryDocument } from '../../schemas/api-check-history.schema';
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
  
      private readonly apiCheckerService: ApiCheckerService
    ) {}
  
    async create(dto: CreateMonitoredApiDto) {
      const created = await this.monitoredApiModel.create({
        ...dto,
        method: dto.method || 'GET',
        intervalSeconds: dto.intervalSeconds || 30,
        timeoutMs: dto.timeoutMs || 10000,
        alertEmails: dto.alertEmails || [],
        active: dto.active ?? true
      });
  
      return created;
    }
  
    async findAll() {
      return this.monitoredApiModel
        .find()
        .sort({ createdAt: -1 })
        .lean();
    }
  
    async findOne(id: string) {
      const api = await this.monitoredApiModel.findById(id).lean();
  
      if (!api) {
        throw new NotFoundException('API monitorada não encontrada.');
      }
  
      return api;
    }
  
    async update(id: string, dto: UpdateMonitoredApiDto) {
      const updated = await this.monitoredApiModel
        .findByIdAndUpdate(id, dto, {
          new: true
        })
        .lean();
  
      if (!updated) {
        throw new NotFoundException('API monitorada não encontrada.');
      }
  
      return updated;
    }
  
    async remove(id: string) {
      const deleted = await this.monitoredApiModel
        .findByIdAndDelete(id)
        .lean();
  
      if (!deleted) {
        throw new NotFoundException('API monitorada não encontrada.');
      }
  
      return {
        message: 'API monitorada removida com sucesso.',
        deleted
      };
    }
  
    async findHistory(params: {
      apiId?: string;
      limit?: number;
    }) {
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
  
    async checkNow(id: string) {
      const api = await this.monitoredApiModel.findById(id);
  
      if (!api) {
        throw new NotFoundException('API monitorada não encontrada.');
      }
  
      return this.apiCheckerService.checkApi(api);
    }
  }