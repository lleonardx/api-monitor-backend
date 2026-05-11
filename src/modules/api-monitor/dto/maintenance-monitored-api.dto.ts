import {
    IsBoolean,
    IsDateString,
    IsOptional,
    IsString
  } from 'class-validator';
  
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  
  export class MaintenanceMonitoredApiDto {
    @ApiProperty({
      example: true
    })
    @IsBoolean()
    maintenanceMode: boolean;
  
    @ApiPropertyOptional({
      example: '2026-05-11T18:00:00.000Z'
    })
    @IsOptional()
    @IsDateString()
    maintenanceUntil?: string;
  
    @ApiPropertyOptional({
      example: 'Manutenção programada no servidor'
    })
    @IsOptional()
    @IsString()
    maintenanceReason?: string;
  }