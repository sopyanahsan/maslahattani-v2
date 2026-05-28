import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateBrilinkAccountDto {
  @ApiPropertyOptional({ example: 'BRI Cabang Cibodas' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'Sopyan Ahsan' })
  @IsString()
  @IsOptional()
  accountHolder?: string;

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

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
