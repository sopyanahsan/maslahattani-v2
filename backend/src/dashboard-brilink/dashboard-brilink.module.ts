import { Module } from '@nestjs/common';
import { DashboardBrilinkController } from './dashboard-brilink.controller';
import { DashboardBrilinkService } from './dashboard-brilink.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardBrilinkController],
  providers: [DashboardBrilinkService],
  exports: [DashboardBrilinkService],
})
export class DashboardBrilinkModule {}
