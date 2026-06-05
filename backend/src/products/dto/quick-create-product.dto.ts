import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Minimal DTO for quick-creating a product from PO flow.
 * Only requires name + shopId. SKU is auto-generated.
 * Price/cost = 0 (filled later when PO is received).
 */
export class QuickCreateProductDto {
  @ApiProperty({ example: 'shop-id-123' })
  @IsString()
  shopId: string;

  @ApiProperty({ example: 'Beras Organik 5kg' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'pcs', description: 'Satuan: pcs, kg, liter, dus, karton' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: 'category-id-123' })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
