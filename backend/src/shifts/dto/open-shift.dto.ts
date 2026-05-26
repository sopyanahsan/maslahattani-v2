import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Saldo kas awal untuk satu kategori cashbox (mis: RETAIL, SUBSIDI_PUPUK).
 *
 * Kasir bisa input untuk semua kategori aktif. Kategori yang tidak di-input
 * akan default startingCash = 0.
 */
export class StartingCashByCategoryDto {
  @ApiProperty({
    example: 'cashbox-retail',
    description: 'CashBoxCategory ID',
  })
  @IsString()
  categoryId: string;

  @ApiProperty({
    example: 500000,
    description: 'Saldo kas awal kategori ini (rupiah)',
  })
  @IsInt()
  @Min(0)
  startingCash: number;
}

export class OpenShiftDto {
  @ApiProperty({
    type: [StartingCashByCategoryDto],
    description:
      'Saldo awal per kategori cashbox. Minimal harus ada 1 kategori (default RETAIL). Kategori yang aktif tapi tidak di-list akan dibuat dengan startingCash = 0.',
    example: [
      { categoryId: 'cashbox-retail', startingCash: 500000 },
      { categoryId: 'cashbox-subsidi-pupuk', startingCash: 1000000 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StartingCashByCategoryDto)
  startingCashByCategory: StartingCashByCategoryDto[];

  @ApiPropertyOptional({
    example: 'Modal awal dari setoran shift kemarin',
    description: 'Catatan opsional saat buka shift',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
