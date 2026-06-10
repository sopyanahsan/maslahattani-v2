import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLanguageDto {
  @ApiProperty({ example: 'shop-id-123' })
  @IsString()
  shopId: string;

  @ApiProperty({ example: 'id', description: 'Kode bahasa: id, en' })
  @IsString()
  language: string;
}

export class UpdateReceiptConfigDto {
  @ApiProperty({ example: 'shop-id-123' })
  @IsString()
  shopId: string;

  @ApiPropertyOptional({ example: true, description: 'Cetak struk otomatis' })
  @IsOptional()
  autoPrint?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Gabung semua layanan di 1 struk' })
  @IsOptional()
  mergeReceipts?: boolean;

  @ApiPropertyOptional({ example: 'Terima kasih sudah berbelanja!' })
  @IsOptional()
  @IsString()
  footerMessage?: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/xxx/image/upload/v1/logo.png', description: 'URL logo toko di struk' })
  @IsOptional()
  @IsString()
  logoUrl?: string;
}


export class UpdateTimezoneDto {
  @ApiProperty({ example: 'shop-id-123' })
  @IsString()
  shopId: string;

  @ApiProperty({
    example: 'Asia/Jakarta',
    description: 'IANA timezone: Asia/Jakarta (WIB), Asia/Makassar (WITA), Asia/Jayapura (WIT)',
  })
  @IsString()
  timezone: string;
}
