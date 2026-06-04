import { IsOptional, IsString, IsInt, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const PURCHASE_SORT_VALUES = [
  'collecting_finished_at_asc',
  'collecting_finished_at_desc',
  'max_price_asc',
  'max_price_desc',
  'published_at_asc',
  'published_at_desc',
  'updated_at_asc',
  'updated_at_desc',
] as const;

export class SearchPurchasesDto {
  @ApiPropertyOptional({ description: 'Search text for object info' })
  @IsOptional()
  @IsString()
  objectInfo?: string;

  @ApiPropertyOptional({ description: 'ИНН заказчика' })
  @IsOptional()
  @IsString()
  customer?: string;

  @ApiPropertyOptional({ description: 'ИНН организации-владельца версии плана-графика' })
  @IsOptional()
  @IsString()
  owner?: string;

  @ApiPropertyOptional({ description: 'ИНН организации, осуществляющей размещение' })
  @IsOptional()
  @IsString()
  responsible?: string;

  @ApiPropertyOptional({ description: 'Номер закупки' })
  @IsOptional()
  @IsString()
  purchaseNumber?: string;

  @ApiPropertyOptional({
    description: 'Параметры сортировки',
    enum: PURCHASE_SORT_VALUES,
    default: 'published_at_desc',
  })
  @IsOptional()
  @IsIn(PURCHASE_SORT_VALUES as unknown as string[])
  sort?: string;

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
