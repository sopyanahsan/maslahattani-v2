import {
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Breakdown denominasi uang fisik per kategori saat tutup shift.
 * Format object dengan key string nominal (Rp) atau "lainnya":
 *
 *   { "100000": 5, "50000": 3, "20000": 2, ..., "100": 0, "lainnya": 5000 }
 *
 * - Setiap key kecuali "lainnya" merepresentasikan nominal lembar/koin,
 *   value-nya adalah jumlah (count) lembar/koin tersebut.
 * - Key "lainnya" = nominal raw (rupiah) untuk koin/recehan yang tidak
 *   masuk slot standar.
 *
 * Server validasi: sum(key * value for keys != "lainnya") + lainnya
 *   harus == actualCash (atau bisa server compute actualCash dari ini
 *   kalau actualCash tidak di-pass terpisah — TBD nanti).
 *
 * Hanya valid untuk denominasi rupiah standar:
 *   100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, lainnya.
 */
export type CashDenominations = {
  '100000'?: number;
  '50000'?: number;
  '20000'?: number;
  '10000'?: number;
  '5000'?: number;
  '2000'?: number;
  '1000'?: number;
  '500'?: number;
  '200'?: number;
  '100'?: number;
  /** Raw rupiah (bukan count) untuk koin/recehan/lainnya. */
  lainnya?: number;
};

/**
 * Daftar denominasi yang valid sebagai key dalam CashDenominations object.
 * Urut dari nominal terbesar ke terkecil.
 */
export const VALID_DENOMINATION_KEYS: readonly string[] = [
  '100000',
  '50000',
  '20000',
  '10000',
  '5000',
  '2000',
  '1000',
  '500',
  '200',
  '100',
  'lainnya',
];

/**
 * Compute total rupiah dari breakdown denominasi.
 * - Untuk slot standar: nominal * count
 * - Untuk "lainnya": value langsung (sudah dalam rupiah)
 */
export function computeTotalFromDenominations(
  denominations: CashDenominations,
): number {
  let total = 0;
  for (const [key, value] of Object.entries(denominations)) {
    if (typeof value !== 'number' || value < 0) continue;
    if (key === 'lainnya') {
      total += value;
    } else if (VALID_DENOMINATION_KEYS.includes(key)) {
      const nominal = parseInt(key, 10);
      if (!Number.isNaN(nominal)) {
        total += nominal * value;
      }
    }
  }
  return total;
}

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
    description:
      'Total uang fisik di laci kas untuk kategori ini. Server akan ' +
      'cross-check dengan denominations kalau di-pass.',
  })
  @IsInt()
  @Min(0)
  actualCash: number;

  @ApiProperty({
    example: 350000,
    description: 'Total QRIS yang masuk untuk kategori ini',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  actualQRIS?: number;

  @ApiPropertyOptional({
    description:
      'Breakdown denominasi uang fisik (opsional). Format object: ' +
      '{ "100000": 5, "50000": 3, ..., "lainnya": 5000 }. Sum harus match actualCash.',
    example: {
      '100000': 5,
      '50000': 10,
      '20000': 12,
      '10000': 0,
      '5000': 5,
      '2000': 0,
      '1000': 5,
      '500': 0,
      '200': 0,
      '100': 0,
      lainnya: 0,
    },
  })
  @IsOptional()
  @IsObject()
  denominations?: CashDenominations;
}

export class BrilinkAccountSnapshotDto {
  @ApiProperty({ example: 'acc-123' })
  @IsString()
  accountId: string;

  @ApiProperty({ example: 15000000, description: 'Saldo aktual rekening (dari cek mutasi/mobile banking)' })
  @IsInt()
  @Min(0)
  actualBalance: number;
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
    example: 500000,
    description: 'Aktual kas tunai BRILink fisik yang dihitung kasir',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  actualBrilinkCash?: number;

  @ApiPropertyOptional({
    type: [BrilinkAccountSnapshotDto],
    description: 'Snapshot saldo aktual per rekening BRILink (opsional, dari cek mobile banking)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BrilinkAccountSnapshotDto)
  brilinkAccountSnapshots?: BrilinkAccountSnapshotDto[];

  @ApiPropertyOptional({
    example: 'Selisih kecil karena kembalian receh',
    description: 'Catatan opsional saat tutup shift',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
