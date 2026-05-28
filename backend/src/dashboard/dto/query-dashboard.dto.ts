import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Periode waktu untuk dashboard retail.
 * - TODAY  → window harian, granularity per jam (24 buckets)
 * - WEEK   → 7 hari terakhir, granularity per hari (7 buckets)
 * - MONTH  → 30 hari terakhir, granularity per hari (30 buckets)
 *
 * Semua periode dihitung pakai Asia/Jakarta (UTC+7) supaya konsisten dengan
 * server timezone yang dipakai di shift, transaksi, dll.
 */
export enum DashboardPeriod {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
}

export class QueryDashboardDto {
  @ApiProperty({ example: 'shop-id-123' })
  @IsString()
  shopId: string;

  @ApiPropertyOptional({ enum: DashboardPeriod, default: DashboardPeriod.TODAY })
  @IsEnum(DashboardPeriod)
  @IsOptional()
  period?: DashboardPeriod = DashboardPeriod.TODAY;

  @ApiPropertyOptional({ example: 5 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;
}
