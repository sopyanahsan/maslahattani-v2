import { IsString, IsInt, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CashMutationType {
  CASH_IN = 'CASH_IN',
  CASH_OUT = 'CASH_OUT',
}

export enum CashOutCategory {
  MODAL_OPERASIONAL = 'MODAL_OPERASIONAL',
  PRIVE_OWNER = 'PRIVE_OWNER',
  BELANJA_STOK = 'BELANJA_STOK',
  LAINNYA = 'LAINNYA',
}

export enum CashInCategory {
  PENJUALAN = 'PENJUALAN',
  HUTANG_MASUK = 'HUTANG_MASUK',
  TAMBAHAN_MODAL = 'TAMBAHAN_MODAL',
  LAINNYA = 'LAINNYA',
}

export class CashMutationDto {
  @ApiProperty({ example: 'shop-id-123' })
  @IsString()
  shopId: string;

  @ApiProperty({ enum: CashMutationType, example: 'CASH_OUT' })
  @IsEnum(CashMutationType)
  type: CashMutationType;

  @ApiProperty({ example: 500000, description: 'Jumlah (Rp)' })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ example: 'MODAL_OPERASIONAL', description: 'Kategori pengeluaran/pemasukan (opsional kalau pakai categoryId)' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'cashbox-retail-id', description: 'ID CashBoxCategory (kalau multi-kas)' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Beli kantong plastik' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AuditCashDto {
  @ApiProperty({ example: 'shop-id-123' })
  @IsString()
  shopId: string;

  @ApiProperty({ example: 1500000, description: 'Saldo fisik saat audit (Rp)' })
  @IsInt()
  @Min(0)
  actualBalance: number;

  @ApiPropertyOptional({ example: 'Audit harian sore' })
  @IsOptional()
  @IsString()
  notes?: string;
}
