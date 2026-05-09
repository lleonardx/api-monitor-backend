import { PartialType } from '@nestjs/mapped-types';
import { CreateMonitoredApiDto } from './create-monitored-api.dto';

export class UpdateMonitoredApiDto extends PartialType(
  CreateMonitoredApiDto
) {}