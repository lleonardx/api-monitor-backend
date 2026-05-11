import { PartialType } from '@nestjs/swagger';
import { CreateMonitoredApiDto } from './create-monitored-api.dto';

export class UpdateMonitoredApiDto extends PartialType(
  CreateMonitoredApiDto
) {}