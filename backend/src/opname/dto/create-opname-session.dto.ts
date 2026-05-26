import { IsOptional, IsString } from 'class-validator';

export class CreateOpnameSessionDto {
  @IsString()
  shopId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
