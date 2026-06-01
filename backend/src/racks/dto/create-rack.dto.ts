import { IsString, IsOptional } from 'class-validator';

export class CreateRackDto {
  @IsString()
  shopId: string;

  @IsString()
  zoneId: string;

  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  name?: string;
}
