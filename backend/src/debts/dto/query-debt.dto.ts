import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DebtStatus } from '@prisma/client';

export class QueryDebtDto {
  @ApiPropertyOptional({ example: 'shop-id-123' })
  @IsOptional()
  @IsString()
  shopId?: string;

  @ApiPropertyOptional({ enum: DebtStatus })
  @IsOptional()
  @IsEnum(DebtStatus)
  status?: DebtStatus;

  @ApiPropertyOptional({ example: 'Pak Ahmad', description: 'Cari by nama customer' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
