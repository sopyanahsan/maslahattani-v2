import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginPinDto {
  @ApiProperty({ example: 'soya', description: 'Username kasir' })
  @IsString()
  username: string;

  @ApiProperty({ example: '1234', description: 'PIN 4-6 digit' })
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  @Matches(/^\d{4,6}$/, { message: 'PIN harus 4-6 digit angka.' })
  pin: string;
}

export class ChangePinDto {
  @ApiProperty({ example: '1234', description: 'PIN lama' })
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  oldPin: string;

  @ApiProperty({ example: '5678', description: 'PIN baru (4-6 digit)' })
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  @Matches(/^\d{4,6}$/, { message: 'PIN baru harus 4-6 digit angka.' })
  newPin: string;
}
