import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryCashMutationDto {
  @ApiPropertyOptional({ example: 'shop-id-123' })
  @IsOptional()
  @IsString()
  shopId?: string;

  @ApiPropertyOptional({ example: 'CASH_IN', description: 'Filter: CASH_IN atau CASH_OUT' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'MODAL_OPERASIONAL' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'cashbox-category-id', description: 'Filter by kas/kategori' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'cashbox-id', description: 'Filter by cashBoxId (for kas tanpa category)' })
  @IsOptional()
  @IsString()
  cashBoxId?: string;

  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-05-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
