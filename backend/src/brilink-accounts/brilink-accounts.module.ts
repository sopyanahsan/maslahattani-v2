import { Module } from '@nestjs/common';
import { BrilinkAccountsController } from './brilink-accounts.controller';
import { BrilinkAccountsService } from './brilink-accounts.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BrilinkAccountsController],
  providers: [BrilinkAccountsService],
  exports: [BrilinkAccountsService],
})
export class BrilinkAccountsModule {}
