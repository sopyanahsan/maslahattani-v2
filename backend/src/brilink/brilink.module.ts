import { Module } from '@nestjs/common';
import { BrilinkController } from './brilink.controller';
import { BrilinkService } from './brilink.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BrilinkController],
  providers: [BrilinkService],
  exports: [BrilinkService],
})
export class BrilinkModule {}
