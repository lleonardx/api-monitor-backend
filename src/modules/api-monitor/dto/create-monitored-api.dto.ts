import {
    IsArray,
    IsBoolean,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    IsUrl,
    Min
  } from 'class-validator';
  
  export class CreateMonitoredApiDto {
    @IsString()
    name: string;
  
    @IsUrl()
    url: string;
  
    @IsOptional()
    @IsString()
    method?: string;
  
    @IsOptional()
    @IsObject()
    headers?: Record<string, string>;
  
    @IsOptional()
    body?: any;
  
    @IsOptional()
    @IsNumber()
    @Min(5)
    intervalSeconds?: number;
  
    @IsOptional()
    @IsNumber()
    @Min(1000)
    timeoutMs?: number;
  
    @IsOptional()
    @IsArray()
    alertEmails?: string[];
  
    @IsOptional()
    @IsBoolean()
    active?: boolean;
  }