import { IsOptional, IsString, IsInt, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchPurchasesDto {
  @ApiPropertyOptional({ description: 'Search text for object info' })
  @IsOptional()
  @IsString()
  objectInfo?: string;

  @ApiPropertyOptional({ description: 'Number of results to return', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;

  @ApiPropertyOptional({ description: 'Number of results to skip', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  skip?: number;

  @ApiPropertyOptional({ description: 'Purchase stage', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  stage?: number;

  @ApiPropertyOptional({ description: 'Region code', default: 52 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  region?: number;

  @ApiPropertyOptional({ description: 'Published after date (ISO string)' })
  @IsOptional()
  @IsString()
  publishedAfter?: string;

  @ApiPropertyOptional({ description: 'Published before date (ISO string)' })
  @IsOptional()
  @IsString()
  publishedBefore?: string;

  @ApiPropertyOptional({ description: 'Minimum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceGe?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceLe?: number;
}
