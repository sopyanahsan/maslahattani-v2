import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FinalizeShiftDto {
  @ApiProperty({ example: 1500000, description: 'Total uang tunai fisik (Rp)' })
  @IsInt()
  @Min(0)
  actualCash: number;

  @ApiProperty({ example: 350000, description: 'Total QRIS fisik (Rp)' })
  @IsInt()
  @Min(0)
  actualQRIS: number;

  @ApiPropertyOptional({ example: 'Selisih Rp 5000, kemungkinan kembalian salah' })
  @IsOptional()
  @IsString()
  notes?: string;
}
