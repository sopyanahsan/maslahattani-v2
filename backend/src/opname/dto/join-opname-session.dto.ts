import { IsOptional, IsString, Length } from 'class-validator';

export class JoinOpnameSessionDto {
  @IsString()
  @Length(6, 6, { message: 'Passcode harus 6 karakter.' })
  passcode: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  deviceId?: string;
}
