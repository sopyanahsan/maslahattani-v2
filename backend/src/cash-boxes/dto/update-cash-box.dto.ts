import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateCashBoxDto {
  @ApiPropertyOptional({ example: 'Kas Retail Baru' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ example: 500000, description: 'Update saldo manual (set langsung)' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  balance?: number;
}
