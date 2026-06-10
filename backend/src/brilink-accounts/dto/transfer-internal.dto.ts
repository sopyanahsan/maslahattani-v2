import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TransferInternalDto {
  @ApiProperty({ description: 'ID rekening asal' })
  @IsString()
  fromAccountId: string;

  @ApiProperty({ description: 'ID rekening tujuan' })
  @IsString()
  toAccountId: string;

  @ApiProperty({ example: 500000, description: 'Jumlah pindah (rupiah)' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ example: 'Pindah modal untuk topup saldo' })
  @IsString()
  @IsOptional()
  notes?: string;
}
