import { IsOptional, IsString, IsArray } from 'class-validator';

export class CreateOpnameSessionDto {
  @IsString()
  shopId: string;

  @IsString()
  @IsOptional()
  notes?: string;

  /** Kasir (petugas) yang ditugaskan menghitung fisik. Opsional. */
  @IsString()
  @IsOptional()
  assigneeId?: string;

  /** Filter opname per rak — hanya produk di rak ini yang masuk sesi. Opsional (kosong = semua produk). */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  rackIds?: string[];
}
