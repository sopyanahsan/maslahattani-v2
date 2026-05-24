import { IsString, IsInt, IsArray, IsEnum, IsOptional, ValidateNested, Min } from 'class-validator';
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
  @ApiProperty({ example: 'shop-id-123' })
  @IsString()
  shopId: string;

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
}
