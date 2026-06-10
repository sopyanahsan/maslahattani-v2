import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateCashBoxSettingsDto {
  @ApiPropertyOptional({ example: 2000000, description: 'Threshold saldo rendah (rupiah)' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  lowBalanceThreshold?: number;

  @ApiPropertyOptional({ example: 'Catatan kas BRILink' })
  @IsString()
  @IsOptional()
  notes?: string;
}
