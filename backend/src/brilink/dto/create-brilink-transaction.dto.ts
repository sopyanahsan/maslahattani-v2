import { IsString, IsNotEmpty, IsEnum, IsInt, Min, IsOptional } from 'class-validator';
import { BrilinkTransactionCategory } from '@prisma/client';

export class CreateBrilinkTransactionDto {
  @IsString()
  @IsNotEmpty()
  shopId: string;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsEnum(BrilinkTransactionCategory)
  category: BrilinkTransactionCategory;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsInt()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  fee?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  processedBy?: string;
}
