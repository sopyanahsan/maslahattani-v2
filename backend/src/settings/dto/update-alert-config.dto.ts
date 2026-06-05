import { IsInt, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Body PATCH /api/settings/alerts.
 *
 * Semua field opsional — server merge dengan config existing (atau default
 * kalau belum ada). Validation: angka non-negatif.
 */
export class UpdateAlertConfigDto {
  @ApiPropertyOptional({
    example: 5,
    description: 'Minimum unit stok sebelum dianggap menipis.',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  lowStockThreshold?: number;

  @ApiPropertyOptional({
    example: 8,
    description: 'Jam kerja shift sebelum warning muncul.',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  shiftDurationWarningHours?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'H- berapa hari sebelum jatuh tempo mau di-warn (0 = exact dueDate).',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  overdueDebtDaysBeforeNotice?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Jumlah transaksi BRILink gagal per hari sebelum muncul alert.',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  brilinkFailedTransactionThreshold?: number;
}
