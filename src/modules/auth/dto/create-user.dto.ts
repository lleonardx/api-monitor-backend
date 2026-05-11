import {
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    MinLength
} from 'class-validator';
  
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../schemas/user.schema';
  
  export class CreateUserDto {
    @ApiProperty({
      example: 'Administrador'
    })
    @IsString()
    name: string;
  
    @ApiProperty({
      example: 'admin@teste.com'
    })
    @IsEmail()
    email: string;
  
    @ApiProperty({
      example: '123456'
    })
    @IsString()
    @MinLength(6)
    password: string;
  
    @ApiPropertyOptional({
      enum: UserRole,
      example: UserRole.ADMIN
    })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}