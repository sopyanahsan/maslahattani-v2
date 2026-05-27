import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { BrilinkTransactionCategory, BrilinkFeeType } from '@prisma/client';

export class CreateBrilinkFeeDto {
  @IsString()
  @IsNotEmpty()
  shopId: string;

  @IsEnum(BrilinkTransactionCategory)
  category: BrilinkTransactionCategory;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxAmount?: number;

  @IsEnum(BrilinkFeeType)
  feeType: BrilinkFeeType;

  @IsOptional()
  @IsInt()
  @Min(0)
  feeAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  feePercent?: number;
}
