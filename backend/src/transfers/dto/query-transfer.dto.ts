import { IsEnum, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum TransferStatusEnum {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  IN_TRANSIT = 'IN_TRANSIT',
  RECEIVED = 'RECEIVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export class QueryTransfersDto {
  @IsString()
  @IsOptional()
  shopId?: string;

  @IsEnum(TransferStatusEnum)
  @IsOptional()
  status?: TransferStatusEnum;

  @IsIn(['in', 'out', 'all'])
  @IsOptional()
  direction?: 'in' | 'out' | 'all' = 'all';

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
