import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CashBoxActionDto {
  @ApiProperty({ example: 2000000, description: 'Jumlah (rupiah)' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ example: 'Modal pagi dari ATM' })
  @IsString()
  @IsOptional()
  notes?: string;
}
