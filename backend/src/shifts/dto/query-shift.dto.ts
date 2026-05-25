import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryShiftDto {
  @ApiPropertyOptional({ example: 'shop-id-123' })
  @IsOptional()
  @IsString()
  shopId?: string;

  @ApiPropertyOptional({ example: 'user-id-123' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: '2026-05-24' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ example: 'OPEN', description: 'OPEN, CLOSED, FINALIZED' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
