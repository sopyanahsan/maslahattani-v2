import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { BrilinkCategoryEnum } from './create-brilink-transaction.dto';
import { BrilinkFeeTypeEnum } from './create-brilink-fee.dto';

export class UpdateBrilinkFeeDto {
  @IsEnum(BrilinkCategoryEnum)
  @IsOptional()
  category?: BrilinkCategoryEnum;

  @IsString()
  @IsOptional()
  label?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxAmount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  systemFee?: number;

  @IsEnum(BrilinkFeeTypeEnum)
  @IsOptional()
  feeType?: BrilinkFeeTypeEnum;

  @IsInt()
  @Min(0)
  @IsOptional()
  feeAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  feePercent?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
