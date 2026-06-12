import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum PpobType {
  PREPAID = 'prepaid',
  POSTPAID = 'postpaid',
}

export class CreatePpobTransactionDto {
  @ApiProperty({ description: 'Kode produk Tripay (PLNPRE20, TSEL5, dst.)' })
  @IsString()
  productCode: string;

  @ApiProperty({ description: 'Nomor pelanggan / tujuan (No HP / ID Pelanggan)' })
  @IsString()
  customerId: string;

  @ApiProperty({ enum: PpobType })
  @IsEnum(PpobType)
  type: PpobType;

  @ApiPropertyOptional({ description: 'Nama pelanggan (opsional, dari inquiry)' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Nomor HP pelanggan' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({ description: 'Nominal (untuk prepaid variabel)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  amount?: number;

  @ApiPropertyOptional({ description: 'No meter PLN (khusus pembelian token PLN prabayar)' })
  @IsOptional()
  @IsString()
  noMeterPln?: string;

  @ApiPropertyOptional({ description: 'Order ID dari response cek tagihan (wajib untuk pascabayar)' })
  @IsOptional()
  @IsString()
  orderId?: string;
}

export class QueryPpobTransactionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shopId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
