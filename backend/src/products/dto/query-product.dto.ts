import { IsOptional, IsString, IsInt, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ProductSortBy {
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  STOCK_ASC = 'stock_asc',
  STOCK_DESC = 'stock_desc',
  NEWEST = 'newest',
  OLDEST = 'oldest',
}

export class QueryProductDto {
  @ApiPropertyOptional({ example: 'shop-id-123' })
  @IsOptional()
  @IsString()
  shopId?: string;

  @ApiPropertyOptional({ example: 'beras', description: 'Cari by nama/SKU' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'all', description: 'Filter kategori produk' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: ProductSortBy, description: 'Sort produk' })
  @IsOptional()
  @IsEnum(ProductSortBy)
  sortBy?: ProductSortBy;

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
