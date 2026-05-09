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
  
  import { ApiProperty } from '@nestjs/swagger';
  
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
  
    @ApiProperty({
      example: 'GET',
      required: false
    })
    @IsOptional()
    @IsString()
    method?: string;
  
    @ApiProperty({
      example: {
        Authorization: 'Bearer token'
      },
      required: false
    })
    @IsOptional()
    @IsObject()
    headers?: Record<string, string>;
  
    @ApiProperty({
      example: 10,
      required: false
    })
    @IsOptional()
    @IsNumber()
    @Min(5)
    intervalSeconds?: number;
  
    @ApiProperty({
      example: 5000,
      required: false
    })
    @IsOptional()
    @IsNumber()
    timeoutMs?: number;
  
    @ApiProperty({
      example: ['teste@gmail.com'],
      required: false
    })
    @IsOptional()
    @IsArray()
    alertEmails?: string[];
  
    @ApiProperty({
      example: true,
      required: false
    })
    @IsOptional()
    @IsBoolean()
    active?: boolean;
  }