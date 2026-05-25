import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CloseShiftDto {
  @ApiPropertyOptional({ example: 'Shift selesai normal' })
  @IsOptional()
  @IsString()
  notes?: string;
}
