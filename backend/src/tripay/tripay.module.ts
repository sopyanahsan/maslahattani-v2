import { Module } from '@nestjs/common';
import { TripayController } from './tripay.controller';
import { TripayService } from './tripay.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TripayController],
  providers: [TripayService],
  exports: [TripayService],
})
export class TripayModule {}
