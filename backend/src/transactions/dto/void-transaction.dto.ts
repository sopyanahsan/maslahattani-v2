import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VoidTransactionDto {
  @ApiProperty({ example: '123456', description: 'OTP admin untuk konfirmasi void' })
  @IsString()
  @MinLength(6)
  otp: string;

  @ApiProperty({ example: 'Produk rusak / salah input', description: 'Alasan pembatalan' })
  @IsString()
  @MinLength(3)
  reason: string;
}
