import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ApiMonitorController } from './api-monitor.controller';

import { ApiMonitorService } from './services/api-monitor/api-monitor.service';
import { ApiCheckerService } from './services/api-checker/api-checker.service';
import { ApiAlertMailService } from './services/api-alert-mail/api-alert-mail.service';

import {
  MonitoredApi,
  MonitoredApiSchema
} from './schemas/monitored-api.schema';

import {
  ApiCheckHistory,
  ApiCheckHistorySchema
} from './schemas/api-check-history.schema';

import {
  ApiIncident,
  ApiIncidentSchema
} from './schemas/api-incident.schema';

import { ApiMonitorGateway } from './gateways/api-monitor/api-monitor.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MonitoredApi.name,
        schema: MonitoredApiSchema
      },
      {
        name: ApiCheckHistory.name,
        schema: ApiCheckHistorySchema
      },
      {
        name: ApiIncident.name,
        schema: ApiIncidentSchema
      }
    ])
  ],
  controllers: [ApiMonitorController],
  providers: [
    ApiMonitorService,
    ApiCheckerService,
    ApiAlertMailService,
    ApiMonitorGateway
  ],
  exports: [ApiMonitorService, ApiCheckerService]
})
export class ApiMonitorModule {}