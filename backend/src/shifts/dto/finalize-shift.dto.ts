import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FinalizeShiftDto {
  @ApiPropertyOptional({
    example: 'Shift sudah diverifikasi, variance wajar karena kembalian receh.',
    description: 'Catatan admin saat finalize shift',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
