import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DebtStatus } from '@prisma/client';

export enum DebtSortBy {
  NEWEST = 'newest',
  DUE_DATE = 'due_date',
  REMAINING_DESC = 'remaining_desc',
}

export class QueryDebtDto {
  @ApiPropertyOptional({ example: 'shop-id-123' })
  @IsOptional()
  @IsString()
  shopId?: string;

  @ApiPropertyOptional({ enum: DebtStatus })
  @IsOptional()
  @IsEnum(DebtStatus)
  status?: DebtStatus;

  @ApiPropertyOptional({ example: 'Pak Ahmad', description: 'Cari by nama customer' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ enum: DebtSortBy, description: 'Sort: newest | due_date | remaining_desc' })
  @IsOptional()
  @IsEnum(DebtSortBy)
  sortBy?: DebtSortBy;

  @ApiPropertyOptional({ example: '2026-06-01', description: 'Filter jatuh tempo dari tanggal' })
  @IsOptional()
  @IsString()
  dueDateFrom?: string;

  @ApiPropertyOptional({ example: '2026-06-30', description: 'Filter jatuh tempo sampai tanggal' })
  @IsOptional()
  @IsString()
  dueDateTo?: string;

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
