import { IsString, IsOptional } from 'class-validator';

export class UpdateRackDto {
  @IsString()
  @IsOptional()
  zoneId?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;
}
