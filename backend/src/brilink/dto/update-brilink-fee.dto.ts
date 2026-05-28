import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { BrilinkFeeTypeEnum } from './create-brilink-fee.dto';

export class UpdateBrilinkFeeDto {
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
