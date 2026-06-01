import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateOpnameItemDto {
  @IsInt()
  @Min(0)
  actualQty: number;

  @IsString()
  @IsOptional()
  reason?: string; // HILANG | RUSAK | EXPIRED | SALAH_HITUNG | LAINNYA

  @IsString()
  @IsOptional()
  notes?: string;
}
