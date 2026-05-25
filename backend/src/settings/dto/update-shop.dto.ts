import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateShopDto {
  @ApiPropertyOptional({ example: 'Toko Maslahat Tani' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Jl. Merdeka No. 10, Sukabumi' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '08123456789' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreateShopDto {
  @ApiProperty({ example: 'Cabang Baru Cikole' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Jl. Cikole No. 5' })
  @IsString()
  address: string;

  @ApiProperty({ example: '08198765432' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'parent-shop-id', description: 'ID toko induk (untuk cabang)' })
  @IsOptional()
  @IsString()
  parentShopId?: string;
}
