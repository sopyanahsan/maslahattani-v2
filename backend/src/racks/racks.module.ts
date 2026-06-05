import { Module } from '@nestjs/common';
import { RacksController } from './racks.controller';
import { RacksService } from './racks.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RacksController],
  providers: [RacksService],
  exports: [RacksService],
})
export class RacksModule {}
