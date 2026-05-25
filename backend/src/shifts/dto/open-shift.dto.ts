import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OpenShiftDto {
  @ApiProperty({ example: 'shop-id-123' })
  @IsString()
  shopId: string;

  @ApiProperty({ example: 'user-id-kasir' })
  @IsString()
  userId: string;
}
