import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TransferItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateTransferDto {
  @IsString()
  @IsNotEmpty()
  fromShopId: string;

  @IsString()
  @IsNotEmpty()
  toShopId: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  items: TransferItemDto[];
}

export class ApprovalNotesDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ReceiveTransferDto {
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items?: ReceiveItemDto[];
}

export class ReceiveItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(0)
  receivedQty: number;
}
