import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateRackZoneDto {
  @IsString()
  shopId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
