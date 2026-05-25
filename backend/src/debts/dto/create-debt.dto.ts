import { IsString, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDebtDto {
  @ApiProperty({ example: 'shop-id-123' })
  @IsString()
  shopId: string;

  @ApiProperty({ example: 'product-id-123' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 'Pak Ahmad' })
  @IsString()
  customerName: string;

  @ApiPropertyOptional({ example: '08123456789' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiProperty({ example: 3, description: 'Jumlah unit yang dihutang' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 0, description: 'Uang muka / DP (Rp)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  downPayment?: number;

  @ApiPropertyOptional({ example: '2026-06-30', description: 'Deadline bayar (opsional)' })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'Bayar akhir bulan' })
  @IsOptional()
  @IsString()
  notes?: string;
}
