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
 * Nominal aktual cash & QRIS yang dihitung kasir di akhir shift,
 * per kategori cashbox.
 *
 * Variance dihitung server-side:
 *   varianceCash = actualCash - (startingCash + expectedCash)
 *   varianceQRIS = actualQRIS - expectedQRIS
 */
export class ActualCashByCategoryDto {
  @ApiProperty({ example: 'cashbox-retail' })
  @IsString()
  categoryId: string;

  @ApiProperty({
    example: 1755000,
    description: 'Total uang fisik di laci kas untuk kategori ini',
  })
  @IsInt()
  @Min(0)
  actualCash: number;

  @ApiProperty({
    example: 350000,
    description: 'Total QRIS yang masuk untuk kategori ini',
  })
  @IsInt()
  @Min(0)
  actualQRIS: number;
}

export class CloseShiftDto {
  @ApiProperty({
    type: [ActualCashByCategoryDto],
    description:
      'Aktual kas per kategori. Wajib mencakup semua kategori yang aktif di shift ini.',
    example: [
      { categoryId: 'cashbox-retail', actualCash: 1755000, actualQRIS: 350000 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActualCashByCategoryDto)
  actualByCategory: ActualCashByCategoryDto[];

  @ApiPropertyOptional({
    example: 'Selisih kecil karena kembalian receh',
    description: 'Catatan opsional saat tutup shift',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
