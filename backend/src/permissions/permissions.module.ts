import { Module, Global } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * PermissionsModule — Global so PermissionsService can be injected anywhere.
 * Used by RequirePermission guard in other controllers.
 */
@Global()
@Module({
  imports: [PrismaModule],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
