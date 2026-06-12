import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TripayMode {
  SANDBOX = 'sandbox',
  PRODUCTION = 'production',
}

export class UpdateTripayConfigDto {
  @ApiProperty({ description: 'API Key dari Tripay' })
  @IsString()
  apiKey: string;

  @ApiProperty({ description: 'Private Key untuk signature HMAC' })
  @IsString()
  privateKey: string;

  @ApiProperty({ description: 'Merchant Code dari Tripay' })
  @IsString()
  merchantCode: string;

  @ApiPropertyOptional({ enum: TripayMode, default: TripayMode.SANDBOX })
  @IsOptional()
  @IsEnum(TripayMode)
  mode?: TripayMode;

  @ApiPropertyOptional({ description: 'Aktifkan/nonaktifkan integrasi Tripay' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TripayConfigResponseDto {
  apiKey: string; // masked
  privateKey: string; // masked
  merchantCode: string;
  mode: TripayMode;
  isActive: boolean;
  lastVerifiedAt: string | null;
}
