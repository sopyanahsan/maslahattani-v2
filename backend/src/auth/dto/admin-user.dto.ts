import { IsEmail, IsString, IsOptional, IsEnum, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus, Role } from '@prisma/client';

export class CreateKasirDto {
  @ApiProperty({ example: 'Sopyan', description: 'Nama lengkap kasir' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'soya', description: 'Username unik untuk login' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: '1234', description: 'PIN awal 4-6 digit' })
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  @Matches(/^\d{4,6}$/, { message: 'PIN harus 4-6 digit angka.' })
  pin: string;

  @ApiPropertyOptional({ example: 'kasir@gmail.com', description: 'Email opsional' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'shop-id-123' })
  @IsOptional()
  @IsString()
  shopId?: string;

  @ApiPropertyOptional({ enum: Role, example: 'KASIR' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class UpdateKasirDto {
  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ example: 'shop-id-123' })
  @IsOptional()
  @IsString()
  shopId?: string;

  @ApiPropertyOptional({ example: 'Nama Baru' })
  @IsOptional()
  @IsString()
  name?: string;
}
