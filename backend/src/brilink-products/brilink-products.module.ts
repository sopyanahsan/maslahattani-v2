import { Module } from '@nestjs/common';
import { BrilinkProductsController } from './brilink-products.controller';
import { BrilinkProductsService } from './brilink-products.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BrilinkProductsController],
  providers: [BrilinkProductsService],
  exports: [BrilinkProductsService],
})
export class BrilinkProductsModule {}
