import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ChartPeriod {
  TODAY = 'today',
  SEVEN_DAYS = '7d',
  ONE_MONTH = '1m',
  THREE_MONTHS = '3m',
  CUSTOM = 'custom',
}

export enum ChartType {
  TRANSACTIONS = 'transactions',
  PROFIT = 'profit',
}

export class QueryChartDto {
  @ApiProperty({ example: 'shop-id-123' })
  @IsString()
  shopId: string;

  @ApiPropertyOptional({ enum: ChartPeriod, default: ChartPeriod.SEVEN_DAYS })
  @IsEnum(ChartPeriod)
  @IsOptional()
  period?: ChartPeriod = ChartPeriod.SEVEN_DAYS;

  @ApiPropertyOptional({ enum: ChartType, default: ChartType.TRANSACTIONS })
  @IsEnum(ChartType)
  @IsOptional()
  type?: ChartType = ChartType.TRANSACTIONS;

  @ApiPropertyOptional({ example: '2026-05-01', description: 'Start date for custom period (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-06-05', description: 'End date for custom period (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  endDate?: string;
}
