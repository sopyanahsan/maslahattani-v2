import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Inquiry / cek tagihan (postpaid) atau cek harga (prepaid).
 */
export class TripayInquiryDto {
  @ApiProperty({ description: 'Kode produk Tripay, misal: PLNPRE, TSEL5, dst.' })
  @IsString()
  productCode: string;

  @ApiProperty({ description: 'Nomor pelanggan / tujuan (ID Pel, No HP, dll)' })
  @IsString()
  customerId: string;

  @ApiPropertyOptional({ description: 'Shop ID (auto dari token jika kasir)' })
  @IsOptional()
  @IsString()
  shopId?: string;
}
