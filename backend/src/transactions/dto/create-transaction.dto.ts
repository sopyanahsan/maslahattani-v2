import {
  IsString,
  IsInt,
  IsArray,
  IsEnum,
  IsOptional,
  ValidateNested,
  Min,
  IsUUID,
  IsISO8601,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class TransactionItemDto {
  @ApiProperty({ example: 'product-id-123' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 0, description: 'Diskon per item (Rp)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  discount?: number;
}

export class CreateTransactionDto {
  /**
   * NOTE: shopId TIDAK diterima dari client. Diambil dari JWT user.shopId
   * supaya kasir tidak bisa spoof transaksi ke cabang lain.
   */

  @ApiProperty({ type: [TransactionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  items: TransactionItemDto[];

  @ApiProperty({ enum: PaymentMethod, example: 'CASH' })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 50000, description: 'Jumlah uang dibayar (untuk hitung kembalian)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  amountPaid?: number;

  @ApiPropertyOptional({ example: 'ref-qris-123', description: 'Referensi pembayaran (QRIS/Transfer)' })
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @ApiPropertyOptional({ example: 'Pak Ahmad', description: 'Nama pelanggan (wajib untuk hutang)' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: '08123456789', description: 'No HP pelanggan (wajib untuk hutang)' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({ example: true, description: 'Jika amountPaid < total, catat sisa sebagai hutang?' })
  @IsOptional()
  createDebtForRemainder?: boolean;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description:
      'Idempotency key (UUID) untuk dedup retry akibat sinyal jelek. Kalau dikirim ulang dengan key yang sama, server return transaksi existing tanpa create dobel.',
  })
  @IsOptional()
  @IsUUID()
  idempotencyKey?: string;

  @ApiPropertyOptional({
    example: '2026-05-25T14:30:00.000Z',
    description:
      'Waktu transaksi sebenarnya di kasir (ISO 8601). Berbeda dari createdAt (waktu sync ke server). Berguna untuk transaksi offline yang baru sync nanti.',
  })
  @IsOptional()
  @IsISO8601()
  clientCreatedAt?: string;
}
