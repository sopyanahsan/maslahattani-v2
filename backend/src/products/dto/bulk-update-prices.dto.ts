import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PriceUpdateItemDto {
  @IsString()
  productId: string;

  /** Harga beli (modal) baru dari nota supplier */
  @IsInt()
  @Min(0)
  cost: number;

  /**
   * Harga jual baru (opsional).
   * Jika tidak diisi, sistem hitung otomatis dari margin terakhir.
   */
  @IsInt()
  @Min(0)
  @IsOptional()
  price?: number;
}

export class BulkUpdatePricesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceUpdateItemDto)
  updates: PriceUpdateItemDto[];
}
