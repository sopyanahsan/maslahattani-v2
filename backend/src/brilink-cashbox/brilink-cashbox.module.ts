import { Module } from '@nestjs/common';
import { BrilinkCashboxController } from './brilink-cashbox.controller';
import { BrilinkCashboxService } from './brilink-cashbox.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BrilinkCashboxController],
  providers: [BrilinkCashboxService],
  exports: [BrilinkCashboxService],
})
export class BrilinkCashboxModule {}
