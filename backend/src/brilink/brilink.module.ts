import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BrilinkController } from './brilink.controller';
import { BrilinkService } from './brilink.service';

@Module({
  imports: [PrismaModule],
  controllers: [BrilinkController],
  providers: [BrilinkService],
  exports: [BrilinkService],
})
export class BrilinkModule {}
