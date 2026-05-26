import { Module } from '@nestjs/common';
import { OpnameController } from './opname.controller';
import { OpnameService } from './opname.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OpnameController],
  providers: [OpnameService],
  exports: [OpnameService],
})
export class OpnameModule {}
