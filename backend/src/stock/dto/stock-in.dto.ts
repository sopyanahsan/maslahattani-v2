import { IsString, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockInDto {
  @ApiProperty({ example: 'shop-id-123' })
  @IsString()
  shopId: string;

  @ApiProperty({ example: 'product-id-123' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 25, description: 'Jumlah stok masuk' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'Restok dari supplier X' })
  @IsOptional()
  @IsString()
  notes?: string;
}
