import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from './permissions.service';
import { Role } from '@prisma/client';

export const PERMISSION_KEY = 'required_permission';

/**
 * Decorator: @RequirePermission('transactions.void')
 * Used on controller methods to enforce permission checks.
 */
export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);

/**
 * Guard that checks if the current user's role has the required permission.
 * SUPER_ADMIN always passes. KASIR always fails (no admin access).
 * ADMIN checked against role_permissions table.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permission required → allow
    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('User tidak terautentikasi.');
    }

    const role = user.role as Role;

    // Super Admin bypass
    if (role === Role.SUPER_ADMIN) return true;

    // Check permission
    const allowed = await this.permissionsService.hasPermission(role, requiredPermission);

    if (!allowed) {
      throw new ForbiddenException(
        `Anda tidak memiliki akses untuk fitur ini. Permission required: ${requiredPermission}`,
      );
    }

    return true;
  }
}
