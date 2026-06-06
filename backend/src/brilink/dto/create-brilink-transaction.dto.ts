import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BrilinkCategoryEnum {
  TRANSFER_BRI = 'TRANSFER_BRI',
  TRANSFER_OTHER = 'TRANSFER_OTHER',
  TARIK_TUNAI = 'TARIK_TUNAI',
  TOPUP_PULSA = 'TOPUP_PULSA',
  TOPUP_DATA = 'TOPUP_DATA',
  TOPUP_EWALLET = 'TOPUP_EWALLET',
  TOPUP_PLN = 'TOPUP_PLN',
}

export class CreateBrilinkTransactionDto {
  @ApiProperty({ enum: BrilinkCategoryEnum })
  @IsEnum(BrilinkCategoryEnum)
  category: BrilinkCategoryEnum;

  @ApiProperty({ example: 'Pak Adi' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiPropertyOptional({ example: '081234567890' })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiProperty({ example: '1234567890', description: 'No rek/HP/meter tujuan' })
  @IsString()
  @IsNotEmpty()
  destination: string;

  @ApiProperty({ example: 500000, description: 'Nominal transaksi (rupiah)' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ description: 'ID rekening BRI agen. Kosong = pakai rekening default.' })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Metode fee untuk tarik tunai: DALAM | LUAR | POTONG' })
  @IsString()
  @IsOptional()
  feeMethod?: string;

  // === Offline support fields ===

  @ApiPropertyOptional({ description: 'UUID dari client untuk dedup (offline)' })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'Waktu transaksi di device kasir (ISO string)' })
  @IsDateString()
  @IsOptional()
  clientCreatedAt?: string;
}
