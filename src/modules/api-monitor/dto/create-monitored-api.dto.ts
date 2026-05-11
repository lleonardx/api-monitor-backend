import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    IsUrl,
    Min
} from 'class-validator';
  
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  
  export class CreateMonitoredApiDto {
    @ApiProperty({
      example: 'Google'
    })
    @IsString()
    name: string;
  
    @ApiProperty({
      example: 'https://www.google.com'
    })
    @IsUrl()
    url: string;
  
    @ApiPropertyOptional({
      example: 'GET'
    })
    @IsOptional()
    @IsString()
    method?: string;
  
    @ApiPropertyOptional({
      example: {
        Authorization: 'Bearer token'
      }
    })
    @IsOptional()
    @IsObject()
    headers?: Record<string, string>;
  
    @ApiPropertyOptional({
      example: {
        username: 'teste',
        password: '123'
      }
    })
    @IsOptional()
    body?: any;
  
    @ApiPropertyOptional({
      example: [200, 201, 204]
    })
    @IsOptional()
    @IsArray()
    expectedStatusCodes?: number[];
  
    @ApiPropertyOptional({
      example: 'success'
    })
    @IsOptional()
    @IsString()
    expectedText?: string;
  
    @ApiPropertyOptional({
      example: 2000
    })
    @IsOptional()
    @IsNumber()
    @Min(100)
    maxResponseTimeMs?: number;
  
    @ApiPropertyOptional({
      example: 30
    })
    @IsOptional()
    @IsNumber()
    @Min(5)
    intervalSeconds?: number;
  
    @ApiPropertyOptional({
      example: 10000
    })
    @IsOptional()
    @IsNumber()
    @Min(1000)
    timeoutMs?: number;
  
    @ApiPropertyOptional({
      example: 3
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    failureThreshold?: number;
  
    @ApiPropertyOptional({
      example: 2
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    recoveryThreshold?: number;
  
    @ApiPropertyOptional({
      example: ['teste@gmail.com']
    })
    @IsOptional()
    @IsArray()
    alertEmails?: string[];
  
    @ApiPropertyOptional({
      example: true
    })
    @IsOptional()
    @IsBoolean()
    active?: boolean;
  
    @ApiPropertyOptional({
      example: false
    })
    @IsOptional()
    @IsBoolean()
    maintenanceMode?: boolean;
  
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