import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus, Role } from '@prisma/client';

export class CreateKasirDto {
  @ApiProperty({ example: 'kasir.baru@gmail.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'shop-id-123' })
  @IsOptional()
  @IsString()
  shopId?: string;

  @ApiPropertyOptional({ enum: Role, example: 'KASIR', description: 'Role: KASIR (default) atau ADMIN (admin cabang)' })
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
}
