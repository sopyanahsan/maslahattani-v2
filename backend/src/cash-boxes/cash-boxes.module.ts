import { Module } from '@nestjs/common';
import { CashBoxesController } from './cash-boxes.controller';
import { CashBoxesService } from './cash-boxes.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CashBoxesController],
  providers: [CashBoxesService],
  exports: [CashBoxesService],
})
export class CashBoxesModule {}
