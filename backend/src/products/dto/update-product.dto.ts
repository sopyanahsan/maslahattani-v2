import { IsString, IsInt, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Beras 5kg Premium' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 80000, description: 'Harga jual (Rp)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 65000, description: 'Harga modal (Rp)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ example: 'supplier-id-456' })
  @IsOptional()
  @IsString()
  supplierId?: string;
}
