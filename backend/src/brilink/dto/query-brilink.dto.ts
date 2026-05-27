import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { BrilinkTransactionCategory } from '@prisma/client';

export class QueryBrilinkTransactionDto {
  @IsOptional()
  @IsString()
  shopId?: string;

  @IsOptional()
  @IsEnum(BrilinkTransactionCategory)
  category?: BrilinkTransactionCategory;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class QueryBrilinkDashboardDto {
  @IsOptional()
  @IsString()
  shopId?: string;

  @IsOptional()
  @IsString()
  period?: string; // 'today' | 'week' | 'month' | 'year'
}
