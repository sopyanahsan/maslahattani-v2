import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCashBoxCategoryDto {
  @ApiProperty({
    example: 'SUBSIDI_PUPUK',
    description:
      'Code unik kategori (UPPERCASE_SNAKE_CASE). Tidak bisa diubah setelah dibuat.',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message:
      'Code harus UPPERCASE_SNAKE_CASE (mis: RETAIL, SUBSIDI_PUPUK, LPG_3KG).',
  })
  code: string;

  @ApiProperty({
    example: 'Kas Subsidi Pupuk',
    description: 'Nama yang ditampilkan ke kasir',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example:
      'Penjualan pupuk subsidi pemerintah, terpisah dari kas retail biasa.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: 'amber',
    description: 'Tailwind color name atau hex untuk badge UI',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @ApiPropertyOptional({
    example: 'wheat',
    description: 'Lucide icon name (mis: shopping-cart, wheat, fuel)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({
    example: false,
    description:
      'Set true untuk jadikan kategori default. Hanya boleh ada 1 default.',
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
