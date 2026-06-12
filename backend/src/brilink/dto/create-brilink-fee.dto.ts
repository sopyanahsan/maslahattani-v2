import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { BrilinkCategoryEnum } from './create-brilink-transaction.dto';

export enum BrilinkFeeTypeEnum {
  FLAT = 'FLAT',
  PERCENT = 'PERCENT',
}

export class CreateBrilinkFeeDto {
  @IsString()
  @IsNotEmpty()
  shopId: string;

  @IsEnum(BrilinkCategoryEnum)
  category: BrilinkCategoryEnum;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsInt()
  @Min(0)
  minAmount: number;

  @IsInt()
  @Min(0)
  maxAmount: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  systemFee?: number;

  @IsEnum(BrilinkFeeTypeEnum)
  feeType: BrilinkFeeTypeEnum;

  @IsInt()
  @Min(0)
  feeAmount: number;

  @IsNumber()
  @Min(0)
  feePercent: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
