import { IsString, IsEnum, IsInt, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { BrilinkFeeType } from '@prisma/client';

export class UpdateBrilinkFeeDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxAmount?: number;

  @IsOptional()
  @IsEnum(BrilinkFeeType)
  feeType?: BrilinkFeeType;

  @IsOptional()
  @IsInt()
  @Min(0)
  feeAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  feePercent?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
