import { IsString, IsOptional, IsInt, Min, Max, IsIn, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSshServerDto {
  @ApiProperty({ example: 'Production Server' })
  @IsString()
  name: string;

  @ApiProperty({ example: '192.168.1.100' })
  @IsString()
  host: string;

  @ApiPropertyOptional({ example: 22 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;

  @ApiProperty({ example: 'root' })
  @IsString()
  username: string;

  @ApiPropertyOptional({ example: 'mypassword' })
  @ValidateIf((o) => o.authType === 'password')
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: '-----BEGIN RSA PRIVATE KEY-----...' })
  @ValidateIf((o) => o.authType === 'key')
  @IsOptional()
  @IsString()
  privateKey?: string;

  @ApiProperty({ example: 'password', enum: ['password', 'key'] })
  @IsIn(['password', 'key'], { message: 'authType должен быть "password" или "key"' })
  authType: 'password' | 'key';
}
