import { Module } from '@nestjs/common';
import { BrilinkController } from './brilink.controller';
import { BrilinkService } from './brilink.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BrilinkCashboxModule } from '../brilink-cashbox/brilink-cashbox.module';

@Module({
  imports: [PrismaModule, BrilinkCashboxModule],
  controllers: [BrilinkController],
  providers: [BrilinkService],
  exports: [BrilinkService],
})
export class BrilinkModule {}
