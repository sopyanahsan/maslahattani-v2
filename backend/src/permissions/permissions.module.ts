import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { PermissionGuard } from './require-permission.guard';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * PermissionsModule — Global so PermissionsService can be injected anywhere.
 * PermissionGuard registered as global guard — only activates when
 * @RequirePermission() decorator is present on a handler.
 */
@Global()
@Module({
  imports: [PrismaModule],
  controllers: [PermissionsController],
  providers: [
    PermissionsService,
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
  exports: [PermissionsService],
})
export class PermissionsModule {}
