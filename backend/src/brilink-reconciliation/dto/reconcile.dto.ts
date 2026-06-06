import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ReconciliationTarget {
  ACCOUNT = 'ACCOUNT',
  CASHBOX = 'CASHBOX',
}

export class ReconcileDto {
  @ApiProperty({ enum: ReconciliationTarget })
  @IsEnum(ReconciliationTarget)
  target: ReconciliationTarget;

  @ApiProperty({ description: 'accountId (for ACCOUNT) or shopId (for CASHBOX)' })
  @IsString()
  targetId: string;

  @ApiProperty({ example: 15500000, description: 'Saldo real yang diinput admin (rupiah)' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  realBalance: number;

  @ApiPropertyOptional({ example: 'Cek m-banking jam 21:00' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class QueryReconciliationHistoryDto {
  @ApiProperty()
  @IsString()
  shopId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
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
