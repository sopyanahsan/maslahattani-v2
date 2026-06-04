import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateOpnameItemDto {
  @IsInt()
  @Min(0)
  actualQty: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  countedById?: string;
}
