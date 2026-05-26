import { Module } from '@nestjs/common';
import { CashBoxCategoriesController } from './cashbox-categories.controller';
import { CashBoxCategoriesService } from './cashbox-categories.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CashBoxCategoriesController],
  providers: [CashBoxCategoriesService],
  exports: [CashBoxCategoriesService],
})
export class CashBoxCategoriesModule {}
