import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * ShopScopeGuard — Enforces shopId isolation per branch + tenant.
 *
 * Must be used AFTER JwtAuthGuard (needs req.user populated).
 *
 * Behavior:
 * - SUPER_ADMIN: uses shopId from query/body or JWT. VALIDATES that shop
 *   belongs to the same tenant as the user (multi-tenant isolation).
 * - ADMIN / KASIR / CASHIER_SUPERVISOR: ALWAYS uses shopId from JWT.
 *   Any client-provided shopId is OVERWRITTEN with the JWT shopId.
 *
 * After guard runs, `req.shopId` is guaranteed to contain the effective shopId.
 */
@Injectable()
export class ShopScopeGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Autentikasi diperlukan.');
    }

    let resolvedShopId: string | null = null;

    if (user.role === Role.SUPER_ADMIN) {
      // Super Admin: prefer client-provided shopId, fallback to JWT
      resolvedShopId =
        request.query?.shopId ||
        request.body?.shopId ||
        user.shopId ||
        null;

      // Multi-tenant isolation: validate shop belongs to user's tenant
      if (resolvedShopId && user.tenantId) {
        const shop = await this.prisma.shop.findUnique({
          where: { id: resolvedShopId },
          select: { tenantId: true },
        });
        if (shop && shop.tenantId && shop.tenantId !== user.tenantId) {
          throw new ForbiddenException(
            'Anda tidak memiliki akses ke cabang ini.',
          );
        }
      }
      // Platform owner (tenantId=null) can access any shop
    } else {
      // Non-super-admin: ALWAYS from JWT, ignore client input
      resolvedShopId = user.shopId || null;
    }

    if (!resolvedShopId) {
      // Super Admin without a selected shop → let the request through
      if (user.role === Role.SUPER_ADMIN) {
        return true;
      }
      throw new ForbiddenException(
        'Tidak ada cabang aktif. Pilih cabang dulu sebelum melanjutkan.',
      );
    }

    // Inject shopId into request for easy access
    request.shopId = resolvedShopId;

    // Override query.shopId
    if (request.query) {
      request.query.shopId = resolvedShopId;
    }

    return true;
  }
}
