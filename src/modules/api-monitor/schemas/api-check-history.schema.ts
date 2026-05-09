import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { ApiStatus } from './monitored-api.schema';

export type ApiCheckHistoryDocument =
  HydratedDocument<ApiCheckHistory>;

@Schema({
  timestamps: true,
  collection: 'api_check_history'
})
export class ApiCheckHistory {
  @Prop({
    type: Types.ObjectId,
    ref: 'MonitoredApi',
    required: true
  })
  apiId: Types.ObjectId;

  @Prop({
    required: true
  })
  name: string;

  @Prop({
    required: true
  })
  url: string;

  @Prop({
    enum: ApiStatus,
    required: true
  })
  status: ApiStatus;

  @Prop()
  statusCode?: number;

  @Prop()
  responseTimeMs?: number;

  @Prop()
  error?: string;

  @Prop({
    default: new Date()
  })
  checkedAt: Date;
}

export const ApiCheckHistorySchema =
  SchemaFactory.createForClass(ApiCheckHistory);

ApiCheckHistorySchema.index({ apiId: 1 });
ApiCheckHistorySchema.index({ checkedAt: -1 });
ApiCheckHistorySchema.index({ status: 1 });