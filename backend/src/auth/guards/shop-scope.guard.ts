import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * ShopScopeGuard — Enforces shopId isolation per branch.
 *
 * Must be used AFTER JwtAuthGuard (needs req.user populated).
 *
 * Behavior:
 * - SUPER_ADMIN: uses shopId from query param or body (they can switch shops).
 *   If none provided, uses shopId from JWT (last selected shop).
 * - ADMIN / KASIR / CASHIER_SUPERVISOR: ALWAYS uses shopId from JWT.
 *   Any client-provided shopId is OVERWRITTEN with the JWT shopId.
 *   This prevents data leaks between branches.
 *
 * After guard runs, `req.shopId` is guaranteed to contain the effective shopId.
 * Additionally, `req.query.shopId` and `req.body.shopId` are overwritten
 * so existing service code that reads from these still works correctly.
 *
 * If no shopId can be resolved, throws ForbiddenException.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, ShopScopeGuard)
 *   @Get()
 *   async list(@Request() req) {
 *     // req.shopId is guaranteed
 *     // req.query.shopId is also set
 *   }
 */
@Injectable()
export class ShopScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
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
    } else {
      // Non-super-admin: ALWAYS from JWT, ignore client input
      resolvedShopId = user.shopId || null;
    }

    if (!resolvedShopId) {
      // Super Admin without a selected shop → let the request through
      // but don't inject shopId (services will return empty or all data)
      if (user.role === Role.SUPER_ADMIN) {
        return true;
      }
      throw new ForbiddenException(
        'Tidak ada cabang aktif. Pilih cabang dulu sebelum melanjutkan.',
      );
    }

    // Inject shopId into request for easy access
    request.shopId = resolvedShopId;

    // Override query.shopId and body.shopId to prevent bypass
    if (request.query) {
      request.query.shopId = resolvedShopId;
    }
    if (request.body && typeof request.body === 'object') {
      request.body.shopId = resolvedShopId;
    }

    return true;
  }
}
