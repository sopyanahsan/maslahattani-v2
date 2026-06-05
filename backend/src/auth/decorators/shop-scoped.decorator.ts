import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ShopScopeGuard } from '../guards/shop-scope.guard';

/**
 * @ShopScoped() — Composite decorator that applies both JwtAuthGuard + ShopScopeGuard.
 *
 * Use this on controllers or individual endpoints that need shop-level data isolation.
 * After this decorator runs:
 * - req.user is populated (JWT validated)
 * - req.shopId is guaranteed (resolved from JWT or query/body for super-admin)
 * - req.query.shopId and req.body.shopId are overwritten with the resolved value
 *
 * Usage on controller (applies to all endpoints):
 *   @ShopScoped()
 *   @Controller('api/products')
 *   export class ProductsController { ... }
 *
 * Usage on individual endpoint:
 *   @ShopScoped()
 *   @Get()
 *   async findAll(@Request() req) { ... }
 *
 * For Super Admin:
 *   Uses shopId from query/body (they can switch shops).
 *
 * For Admin/Kasir:
 *   ALWAYS enforces shopId from JWT. Client-provided shopId is IGNORED.
 */
export function ShopScoped() {
  return applyDecorators(UseGuards(JwtAuthGuard, ShopScopeGuard));
}
