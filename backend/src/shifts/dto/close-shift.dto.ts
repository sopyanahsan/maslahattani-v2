import { IsInt, IsPositive, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CloseShiftDto {
  @ApiProperty({
    example: 1250000,
    description: 'Jumlah uang cash fisik saat tutup shift (dalam rupiah)',
  })
  @IsInt()
  @Min(0)
  actualCash: number;

  @ApiProperty({
    example: 350000,
    description: 'Jumlah transaksi QRIS saat tutup shift (dalam rupiah)',
  })
  @IsInt()
  @Min(0)
  actualQRIS: number;

  @ApiPropertyOptional({
    example: 'Ada selisih Rp 5.000 karena kasir lupa catat kembalian',
    description: 'Catatan optional saat tutup shift (wajib kalau ada variance besar)',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
