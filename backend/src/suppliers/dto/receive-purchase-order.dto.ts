import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReceiveItemDto {
  @IsString()
  itemId: string;

  @IsInt()
  @Min(0)
  receivedQty: number;

  /**
   * Harga beli aktual dari nota supplier.
   * Wajib diisi saat terima barang — ini yang jadi referensi harga beli terbaru.
   */
  @IsInt()
  @Min(0)
  @IsOptional()
  actualCost?: number;
}

export class ReceivePurchaseOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  @IsOptional()
  items?: ReceiveItemDto[];
}
