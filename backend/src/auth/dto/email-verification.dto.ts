import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailCodeDto {
  @ApiProperty({ example: '123456', description: 'Kode verifikasi 6 digit dari email' })
  @IsString()
  @Length(6, 6, { message: 'Kode verifikasi harus 6 digit.' })
  code: string;
}
