import { IsOptional, IsString } from 'class-validator';

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
}
