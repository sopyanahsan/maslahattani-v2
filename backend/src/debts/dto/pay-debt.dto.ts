import { IsString, IsInt, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class PayDebtDto {
  @ApiProperty({ example: 25000, description: 'Jumlah pembayaran (Rp)' })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: 'CASH' })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ example: 'ref-transfer-123' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: 'Cicilan ke-2' })
  @IsOptional()
  @IsString()
  notes?: string;
}
