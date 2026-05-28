import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum BrilinkMutationTypeFilter {
  SETOR = 'SETOR',
  TARIK = 'TARIK',
  TRX_DEBIT = 'TRX_DEBIT',
  TRX_CREDIT = 'TRX_CREDIT',
  ADJUSTMENT = 'ADJUSTMENT',
}

export class QueryAllMutationsDto {
  @ApiProperty({ example: 'shop-id-123' })
  @IsString()
  shopId: string;

  @ApiPropertyOptional({ example: 'account-id-123' })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ enum: BrilinkMutationTypeFilter })
  @IsEnum(BrilinkMutationTypeFilter)
  @IsOptional()
  type?: BrilinkMutationTypeFilter;

  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-05-31' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}
