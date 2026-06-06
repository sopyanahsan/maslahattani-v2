import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BrilinkCategoryEnum } from './create-brilink-transaction.dto';

export enum BrilinkStatusEnum {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
  VOIDED = 'VOIDED',
}

export class QueryBrilinkTransactionsDto {
  @IsString()
  @IsOptional()
  shopId?: string;

  @IsEnum(BrilinkCategoryEnum)
  @IsOptional()
  category?: BrilinkCategoryEnum;

  @IsEnum(BrilinkStatusEnum)
  @IsOptional()
  status?: BrilinkStatusEnum;

  @IsString()
  @IsOptional()
  cashierId?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}

export class QueryBrilinkStatsDto {
  @IsString()
  shopId: string;
}
