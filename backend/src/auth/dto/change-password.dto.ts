import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'newSecureP@ss123' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
