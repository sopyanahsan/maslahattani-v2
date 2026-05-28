import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class MutationActionDto {
  @ApiProperty({ example: 500000 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ example: 'REF-001' })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({ example: 'Setor tunai dari kasir' })
  @IsString()
  @IsOptional()
  notes?: string;
}
