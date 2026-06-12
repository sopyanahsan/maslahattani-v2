import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Cek Tagihan Pascabayar.
 * Tripay params: product, phone, no_pelanggan, api_trxid, pin
 */
export class TripayInquiryDto {
  @ApiProperty({ description: 'Kode produk pascabayar (PLNNONH, PDAMKOTA, dll)' })
  @IsString()
  productCode: string;

  @ApiProperty({ description: 'Nomor pelanggan / no tagihan' })
  @IsString()
  customerId: string;

  @ApiPropertyOptional({ description: 'No HP pelanggan (opsional, default = customerId)' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Shop ID (auto dari token jika kasir)' })
  @IsOptional()
  @IsString()
  shopId?: string;
}
