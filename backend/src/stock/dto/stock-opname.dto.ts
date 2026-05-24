import { IsString, IsInt, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpnameItemDto {
  @ApiProperty({ example: 'product-id-123' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 48, description: 'Stok fisik aktual' })
  @IsInt()
  @Min(0)
  actualQuantity: number;

  @ApiPropertyOptional({ example: 'Ada 2 unit rusak' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class StockOpnameDto {
  @ApiProperty({ example: 'shop-id-123' })
  @IsString()
  shopId: string;

  @ApiProperty({ type: [OpnameItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpnameItemDto)
  items: OpnameItemDto[];

  @ApiPropertyOptional({ example: 'Stok opname bulanan Mei 2026' })
  @IsOptional()
  @IsString()
  notes?: string;
}
