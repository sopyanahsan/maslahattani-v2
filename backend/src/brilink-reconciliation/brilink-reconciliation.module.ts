import { Module } from '@nestjs/common';
import { BrilinkReconciliationController } from './brilink-reconciliation.controller';
import { BrilinkReconciliationService } from './brilink-reconciliation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BrilinkCashboxModule } from '../brilink-cashbox/brilink-cashbox.module';

@Module({
  imports: [PrismaModule, BrilinkCashboxModule],
  controllers: [BrilinkReconciliationController],
  providers: [BrilinkReconciliationService],
  exports: [BrilinkReconciliationService],
})
export class BrilinkReconciliationModule {}
