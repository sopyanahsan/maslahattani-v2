import { IsString, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'shop-id-123' })
  @IsString()
  shopId: string;

  @ApiProperty({ example: 'Beras 5kg' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'BRS-5KG-001' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 75000, description: 'Harga jual (Rp)' })
  @IsInt()
  @Min(0)
  price: number;

  @ApiProperty({ example: 60000, description: 'Harga modal/cost (Rp)' })
  @IsInt()
  @Min(0)
  cost: number;

  @ApiPropertyOptional({ example: 'supplier-id-123' })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional({ example: 50, description: 'Stok awal' })
  @IsOptional()
  @IsInt()
  @Min(0)
  initialStock?: number;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/xxx/image/upload/v1/product.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'category-id-123' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'pcs', description: 'Satuan produk (pcs, kg, liter, dll)' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: '8991042001234', description: 'Barcode dari pabrik (EAN/UPC)' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: 'Beras kualitas premium' })
  @IsOptional()
  @IsString()
  description?: string;
}
