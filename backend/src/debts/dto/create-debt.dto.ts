import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Item manual untuk hutang tanpa link ke produk DB.
 * Dipakai saat admin catat hutang manual (bukan dari POS).
 */
export class ManualDebtItemDto {
  @ApiProperty({ example: 'Beras 5kg' })
  @IsString()
  name: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  qty: number;

  @ApiProperty({ example: 65000 })
  @IsInt()
  @Min(0)
  price: number;
}

/**
 * CreateDebtDto — Hybrid: bisa dari POS (transactionId) atau manual (manualItems/productId).
 *
 * 3 mode:
 * 1. manualItems[] — admin catat hutang manual multi-item
 * 2. productId — legacy single-product (backward compat)
 * 3. transactionId + totalAmount — dari POS kasir saat bayar HUTANG
 */
export class CreateDebtDto {
  @ApiProperty({ example: 'shop-id-123' })
  @IsString()
  shopId: string;

  @ApiProperty({ example: 'Pak Ahmad' })
  @IsString()
  customerName: string;

  @ApiPropertyOptional({ example: '08123456789' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  // === Mode 1: Manual items (multi-item) ===
  @ApiPropertyOptional({
    type: [ManualDebtItemDto],
    example: [
      { name: 'Beras 5kg', qty: 2, price: 65000 },
      { name: 'Minyak 1L', qty: 3, price: 18000 },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManualDebtItemDto)
  manualItems?: ManualDebtItemDto[];

  // === Mode 2: Single product (legacy) ===
  @ApiPropertyOptional({ example: 'product-id-123' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  // === Mode 3: From POS transaction ===
  @ApiPropertyOptional({ example: 'transaction-id-123' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ example: 150000, description: 'Total amount (used with transactionId)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalAmount?: number;

  // === Common fields ===
  @ApiPropertyOptional({ example: 0, description: 'Uang muka / DP (Rp)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  downPayment?: number;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'Bayar akhir bulan' })
  @IsOptional()
  @IsString()
  notes?: string;
}
