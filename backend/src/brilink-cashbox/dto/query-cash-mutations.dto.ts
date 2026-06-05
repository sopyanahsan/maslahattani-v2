import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum CashMutationTypeFilter {
  TRX_IN = 'TRX_IN',
  TRX_OUT = 'TRX_OUT',
  SETOR = 'SETOR',
  TARIK = 'TARIK',
  ADJUSTMENT = 'ADJUSTMENT',
  VOID_REVERSE = 'VOID_REVERSE',
}

export class QueryCashMutationsDto {
  @ApiPropertyOptional()
  @IsString()
  shopId: string;

  @ApiPropertyOptional({ enum: CashMutationTypeFilter })
  @IsEnum(CashMutationTypeFilter)
  @IsOptional()
  type?: CashMutationTypeFilter;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-06-05' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}
