import { IsInt, IsPositive, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpenShiftDto {
  @ApiProperty({
    example: 500000,
    description: 'Saldo kas awal (dalam rupiah)',
  })
  @IsInt()
  @IsPositive()
  startingCash: number;

  @ApiPropertyOptional({
    example: 'Saldo kas dari shift kemarin',
    description: 'Catatan optional saat buka shift',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
