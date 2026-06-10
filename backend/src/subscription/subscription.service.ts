import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PLAN_CONFIGS, PLAN_PRICING, calculateEndDate, calculateGraceEnd } from './plan-config';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a trial subscription for a new tenant.
   */
  async createTrialSubscription(tenantId: string) {
    const config = PLAN_CONFIGS.TRIAL;
    const startDate = new Date();
    const endDate = calculateEndDate(startDate, 'MONTHLY', 'TRIAL')!;

    return this.prisma.subscription.create({
      data: {
        tenantId,
        plan: 'TRIAL',
        cycle: 'MONTHLY',
        status: 'TRIAL',
        startDate,
        endDate,
        graceEndsAt: calculateGraceEnd(endDate, 'TRIAL'),
        maxBranches: config.maxBranches,
        maxUsers: config.maxUsers,
        maxProducts: config.maxProducts,
        brilinkEnabled: config.brilinkEnabled,
        exportEnabled: config.exportEnabled,
        opnameEnabled: config.opnameEnabled,
        supplierEnabled: config.supplierEnabled,
        transferEnabled: config.transferEnabled,
      },
    });
  }

  /**
   * Activate subscription after payment verification.
   */
  async activateSubscription(tenantId: string, plan: string, cycle: string) {
    const config = PLAN_CONFIGS[plan];
    if (!config) throw new BadRequestException(`Plan "${plan}" tidak valid.`);

    const startDate = new Date();
    const endDate = calculateEndDate(startDate, cycle, plan);
    const status = cycle === 'LIFETIME' ? 'LIFETIME' : 'ACTIVE';

    return this.prisma.subscription.upsert({
      where: { tenantId },
      create: {
        tenantId,
        plan: plan as any,
        cycle: cycle as any,
        status: status as any,
        startDate,
        endDate,
        graceEndsAt: endDate ? calculateGraceEnd(endDate, plan) : null,
        maxBranches: config.maxBranches,
        maxUsers: config.maxUsers,
        maxProducts: config.maxProducts === -1 ? 999 : config.maxProducts,
        brilinkEnabled: config.brilinkEnabled,
        exportEnabled: config.exportEnabled,
        opnameEnabled: config.opnameEnabled,
        supplierEnabled: config.supplierEnabled,
        transferEnabled: config.transferEnabled,
      },
      update: {
        plan: plan as any,
        cycle: cycle as any,
        status: status as any,
        startDate,
        endDate,
        graceEndsAt: endDate ? calculateGraceEnd(endDate, plan) : null,
        maxBranches: config.maxBranches,
        maxUsers: config.maxUsers,
        maxProducts: config.maxProducts === -1 ? 999 : config.maxProducts,
        brilinkEnabled: config.brilinkEnabled,
        exportEnabled: config.exportEnabled,
        opnameEnabled: config.opnameEnabled,
        supplierEnabled: config.supplierEnabled,
        transferEnabled: config.transferEnabled,
      },
    });
  }

  /**
   * Get subscription status for a tenant.
   */
  async getSubscription(tenantId: string) {
    return this.prisma.subscription.findUnique({ where: { tenantId } });
  }

  /**
   * Check if tenant can add more branches.
   */
  async canAddBranch(tenantId: string): Promise<boolean> {
    const sub = await this.getSubscription(tenantId);
    if (!sub) return false;
    if (sub.maxBranches === 999) return true; // unlimited

    const shopCount = await this.prisma.shop.count({ where: { tenantId } });
    return shopCount < sub.maxBranches;
  }

  /**
   * Check if tenant can add more users.
   */
  async canAddUser(tenantId: string): Promise<boolean> {
    const sub = await this.getSubscription(tenantId);
    if (!sub) return false;
    if (sub.maxUsers === 999) return true; // unlimited

    const userCount = await this.prisma.user.count({ where: { tenantId } });
    return userCount < sub.maxUsers;
  }

  /**
   * Check if tenant can add more products.
   */
  async canAddProduct(tenantId: string): Promise<boolean> {
    const sub = await this.getSubscription(tenantId);
    if (!sub) return false;
    if (sub.maxProducts === 999) return true; // unlimited

    const shops = await this.prisma.shop.findMany({
      where: { tenantId },
      select: { id: true },
    });
    const shopIds = shops.map((s) => s.id);
    const productCount = await this.prisma.product.count({
      where: { shopId: { in: shopIds }, deletedAt: null },
    });
    return productCount < sub.maxProducts;
  }

  /**
   * Get pricing info for billing page.
   */
  getPricing() {
    return PLAN_PRICING;
  }

  /**
   * Suspend a tenant (manual, by platform owner).
   */
  async suspendTenant(tenantId: string) {
    return this.prisma.subscription.update({
      where: { tenantId },
      data: { status: 'SUSPENDED' },
    });
  }

  /**
   * Get all tenants with subscription info (for owner dashboard).
   */
  async getAllTenantsWithSubscriptions(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        include: { subscription: true, _count: { select: { shops: true, users: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.tenant.count(),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
