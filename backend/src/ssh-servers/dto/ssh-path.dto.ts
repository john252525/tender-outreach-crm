import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SshPathDto {
  @ApiProperty({ example: '/' })
  @IsString()
  @Matches(/^\//, { message: 'Путь должен быть абсолютным (начинаться с /)' })
  path: string;
}
