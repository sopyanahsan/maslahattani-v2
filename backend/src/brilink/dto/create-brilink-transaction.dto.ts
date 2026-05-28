import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export enum BrilinkCategoryEnum {
  TRANSFER_BRI = 'TRANSFER_BRI',
  TRANSFER_OTHER = 'TRANSFER_OTHER',
  TARIK_TUNAI = 'TARIK_TUNAI',
  TOPUP_PULSA = 'TOPUP_PULSA',
  TOPUP_DATA = 'TOPUP_DATA',
  TOPUP_EWALLET = 'TOPUP_EWALLET',
  TOPUP_PLN = 'TOPUP_PLN',
}

export class CreateBrilinkTransactionDto {
  @IsEnum(BrilinkCategoryEnum)
  category: BrilinkCategoryEnum;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsInt()
  @Min(1)
  amount: number;
}
