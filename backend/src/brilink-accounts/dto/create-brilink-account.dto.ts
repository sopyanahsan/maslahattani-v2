import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBrilinkAccountDto {
  @ApiProperty({ example: 'shop-id-123' })
  @IsString()
  shopId: string;

  @ApiProperty({ example: 'BRI Default' })
  @IsString()
  label: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  accountNumber: string;

  @ApiPropertyOptional({ example: 'Sopyan Ahsan' })
  @IsString()
  @IsOptional()
  accountHolder?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  balance?: number;

  @ApiPropertyOptional({ example: 1000000 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  lowBalanceThreshold?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
