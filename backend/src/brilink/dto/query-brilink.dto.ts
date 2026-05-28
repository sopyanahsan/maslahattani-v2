import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BrilinkCategoryEnum } from './create-brilink-transaction.dto';

export class QueryBrilinkTransactionsDto {
  @IsString()
  @IsOptional()
  shopId?: string;

  @IsEnum(BrilinkCategoryEnum)
  @IsOptional()
  category?: BrilinkCategoryEnum;

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
