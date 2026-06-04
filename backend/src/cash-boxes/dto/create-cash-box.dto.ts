import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCashBoxDto {
  @ApiProperty({ example: 'shop-id-123' })
  @IsString()
  shopId: string;

  @ApiProperty({ example: 'Kas Retail' })
  @IsString()
  label: string;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  balance?: number;
}
