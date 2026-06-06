import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBrilinkProductDto {
  @ApiProperty()
  @IsString()
  shopId: string;

  @ApiProperty({ example: 'TOPUP_PULSA', description: 'TOPUP_PULSA | TOPUP_DATA | TOPUP_EWALLET | TOPUP_PLN' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ example: 'TELKOMSEL' })
  @IsString()
  @IsOptional()
  operator?: string;

  @ApiPropertyOptional({ example: 'GOPAY' })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiProperty({ example: 'Pulsa 10rb' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 10000 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  nominal?: number;

  @ApiProperty({ example: 10200, description: 'Harga beli dari BRI/supplier' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  buyPrice: number;

  @ApiProperty({ example: 12000, description: 'Harga jual ke nasabah' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sellPrice: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  sortOrder?: number;
}

export class UpdateBrilinkProductDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  nominal?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  buyPrice?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  sellPrice?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  sortOrder?: number;
}

export class QueryBrilinkProductsDto {
  @ApiProperty()
  @IsString()
  shopId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  operator?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
