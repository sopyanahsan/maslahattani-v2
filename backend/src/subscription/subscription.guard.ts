import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

export const SKIP_SUBSCRIPTION_CHECK = 'skip_subscription_check';

/**
 * SubscriptionGuard — Global guard yang cek status langganan tenant.
 *
 * Flow:
 * 1. Extract tenantId dari user JWT (user.tenantId)
 * 2. Skip jika: no tenantId (platform owner / legacy), atau route di-skip
 * 3. Cek subscription status:
 *    - ACTIVE / TRIAL / LIFETIME → allow
 *    - EXPIRED (masih grace period) → allow + inject warning header
 *    - SUSPENDED / CANCELLED → block 402 Payment Required
 * 4. Cek plan limits jika applicable (maxUsers, maxProducts, etc)
 *
 * Tidak block endpoint: auth, health, billing, landing
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked to skip subscription check
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_SUBSCRIPTION_CHECK, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // No user yet (pre-auth endpoints like login, register, health)
    if (!user) return true;

    // No tenantId = platform owner or legacy user (not yet multi-tenant)
    if (!user.tenantId) return true;

    // Fetch subscription
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId: user.tenantId },
    });

    // No subscription record → block (shouldn't happen but safety net)
    if (!subscription) {
      throw new HttpException(
        {
          statusCode: 402,
          error: 'Payment Required',
          message: 'Langganan tidak ditemukan. Hubungi admin Posify.',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const now = new Date();

    // LIFETIME & ACTIVE & TRIAL → always allow
    if (['ACTIVE', 'TRIAL', 'LIFETIME'].includes(subscription.status)) {
      // Check if trial/active has expired but status not yet updated
      if (subscription.endDate && subscription.endDate < now) {
        // Auto-transition to EXPIRED
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'EXPIRED',
            graceEndsAt: this.calcGraceEnd(subscription.endDate),
          },
        });
        // Still in grace? Allow with warning
        const graceEnd = this.calcGraceEnd(subscription.endDate);
        if (now < graceEnd) {
          request.subscriptionWarning = 'expired_grace';
          request.subscriptionGraceEndsAt = graceEnd.toISOString();
          return true;
        }
        // Grace period over → suspend
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'SUSPENDED' },
        });
        this.throwSuspended();
      }
      return true;
    }

    // EXPIRED — check grace period
    if (subscription.status === 'EXPIRED') {
      const graceEnd = subscription.graceEndsAt || this.calcGraceEnd(subscription.endDate!);
      if (now < graceEnd) {
        // Still in grace → allow with warning
        request.subscriptionWarning = 'expired_grace';
        request.subscriptionGraceEndsAt = graceEnd.toISOString();
        return true;
      }
      // Grace over → auto-suspend
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'SUSPENDED' },
      });
      this.throwSuspended();
    }

    // SUSPENDED or CANCELLED → block
    if (['SUSPENDED', 'CANCELLED'].includes(subscription.status)) {
      this.throwSuspended();
    }

    return true;
  }

  private calcGraceEnd(endDate: Date): Date {
    const grace = new Date(endDate);
    grace.setDate(grace.getDate() + 7); // 7 days grace
    return grace;
  }

  private throwSuspended(): never {
    throw new HttpException(
      {
        statusCode: 402,
        error: 'Payment Required',
        message: 'Langganan Anda telah berakhir. Silakan perpanjang untuk melanjutkan akses.',
        action: 'RENEW',
        billingUrl: '/admin/billing',
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
