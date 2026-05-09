import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MonitoredApiDocument = HydratedDocument<MonitoredApi>;

export enum ApiStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  TIMEOUT = 'TIMEOUT'
}

@Schema({
  timestamps: true,
  collection: 'monitored_apis'
})
export class MonitoredApi {
  @Prop({
    required: true,
    trim: true
  })
  name: string;

  @Prop({
    required: true,
    trim: true
  })
  url: string;

  @Prop({
    default: 'GET'
  })
  method: string;

  @Prop({
    type: Object,
    default: {}
  })
  headers?: Record<string, string>;

  @Prop({
    type: Object,
    default: null
  })
  body?: any;

  @Prop({
    default: 30
  })
  intervalSeconds: number;

  @Prop({
    default: 10000
  })
  timeoutMs: number;

  @Prop({
    type: [String],
    default: []
  })
  alertEmails: string[];

  @Prop({
    enum: ApiStatus,
    default: ApiStatus.ONLINE
  })
  currentStatus: ApiStatus;

  @Prop()
  lastStatusCode?: number;

  @Prop()
  lastResponseTimeMs?: number;

  @Prop()
  lastCheckedAt?: Date;

  @Prop()
  lastError?: string;

  @Prop({
    default: 0
  })
  uptimePercentage?: number;

  @Prop({
    default: 0
  })
  totalChecks?: number;

  @Prop({
    default: 0
  })
  successChecks?: number;

  @Prop({
    default: 0
  })
  failedChecks?: number;

  @Prop({
    default: true
  })
  active: boolean;
}

export const MonitoredApiSchema =
  SchemaFactory.createForClass(MonitoredApi);

MonitoredApiSchema.index({ name: 1 });
MonitoredApiSchema.index({ currentStatus: 1 });
MonitoredApiSchema.index({ active: 1 });