import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShopDto {
  @ApiProperty({ example: 'Maslahat Tani — Cabang Bandung' })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'Jl. Asia Afrika No. 88, Bandung' })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  address: string;

  @ApiProperty({ example: '022-77001100' })
  @IsString()
  @MinLength(5)
  @MaxLength(30)
  phone: string;

  @ApiPropertyOptional({
    example: 'shop-pusat',
    description: 'ID cabang induk untuk hierarki multi-cabang (opsional)',
  })
  @IsOptional()
  @IsString()
  parentShopId?: string;
}
