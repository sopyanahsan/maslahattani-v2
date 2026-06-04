import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkUploadQueryDto {
  @ApiProperty({ example: 'shop-id-123' })
  @IsString()
  shopId: string;
}
