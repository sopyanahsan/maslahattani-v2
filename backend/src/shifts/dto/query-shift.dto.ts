import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftStatus } from '@prisma/client';

export class QueryShiftDto {
  @ApiPropertyOptional({
    example: 'shop-id-123',
    description: 'Filter by shop ID (opsional, auto-filled dari JWT untuk non-superadmin)',
  })
  @IsOptional()
  @IsString()
  shopId?: string;

  @ApiPropertyOptional({
    example: 'user-id-123',
    description: 'Filter by user/kasir ID',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    enum: ShiftStatus,
    example: ShiftStatus.OPEN,
    description: 'Filter by status shift',
  })
  @IsOptional()
  @IsEnum(ShiftStatus)
  status?: ShiftStatus;

  @ApiPropertyOptional({
    example: '2026-05-01',
    description: 'Filter shift mulai dari tanggal (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-05-31',
    description: 'Filter shift sampai tanggal (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
