import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DashboardPeriod } from '../../dashboard/dto/query-dashboard.dto';

export class QueryDashboardBrilinkDto {
  @ApiProperty({ example: 'shop-id-123' })
  @IsString()
  shopId: string;

  @ApiPropertyOptional({ enum: DashboardPeriod, default: DashboardPeriod.TODAY })
  @IsEnum(DashboardPeriod)
  @IsOptional()
  period?: DashboardPeriod = DashboardPeriod.TODAY;

  @ApiPropertyOptional({ example: 5 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;
}

export class QueryShopOnlyDto {
  @ApiProperty({ example: 'shop-id-123' })
  @IsString()
  shopId: string;

  @ApiPropertyOptional({ example: 5 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 5;
}
