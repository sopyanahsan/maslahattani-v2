import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SeedProductsDto {
  @ApiProperty()
  @IsString()
  shopId: string;

  @ApiProperty({ example: 'standard', description: 'Template: standard | premium | economy' })
  @IsString()
  template: string;
}
