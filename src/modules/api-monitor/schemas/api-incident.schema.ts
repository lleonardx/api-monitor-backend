import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { ApiStatus } from './monitored-api.schema';

export type ApiIncidentDocument = HydratedDocument<ApiIncident>;

export enum ApiIncidentStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED'
}

export enum ApiIncidentSeverity {
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL'
}

@Schema({
  timestamps: true,
  collection: 'api_incidents'
})
export class ApiIncident {
  @Prop({
    type: Types.ObjectId,
    ref: 'MonitoredApi',
    required: true
  })
  apiId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  url: string;

  @Prop({
    enum: ApiIncidentStatus,
    default: ApiIncidentStatus.OPEN
  })
  status: ApiIncidentStatus;

  @Prop({
    enum: ApiIncidentSeverity,
    default: ApiIncidentSeverity.CRITICAL
  })
  severity: ApiIncidentSeverity;

  @Prop({
    enum: ApiStatus,
    required: true
  })
  detectedStatus: ApiStatus;

  @Prop()
  startedAt: Date;

  @Prop()
  endedAt?: Date;

  @Prop()
  durationSeconds?: number;

  @Prop()
  statusCode?: number;

  @Prop()
  responseTimeMs?: number;

  @Prop()
  error?: string;

  @Prop()
  notifiedAt?: Date;

  @Prop()
  resolvedNotifiedAt?: Date;
}

export const ApiIncidentSchema =
  SchemaFactory.createForClass(ApiIncident);

ApiIncidentSchema.index({ apiId: 1 });
ApiIncidentSchema.index({ status: 1 });
ApiIncidentSchema.index({ startedAt: -1 });