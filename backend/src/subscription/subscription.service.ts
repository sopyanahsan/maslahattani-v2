import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PLAN_CONFIGS,
  PLAN_PRICING,
  LYNK_PAYMENT_LINKS,
  BANK_TRANSFER_INFO,
  calculateEndDate,
  calculateGraceEnd,
} from './plan-config';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a trial subscription for a new tenant (30 days free).
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
        ppobEnabled: config.ppobEnabled,
        shiftEnabled: config.shiftEnabled,
        multiUserEnabled: config.multiUserEnabled,
        exportEnabled: config.exportEnabled,
        opnameEnabled: config.opnameEnabled,
        supplierEnabled: config.supplierEnabled,
        transferEnabled: config.transferEnabled,
        labelPrintEnabled: config.labelPrintEnabled,
        rackEnabled: config.rackEnabled,
        apiIntegrationEnabled: config.apiIntegrationEnabled,
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
        maxUsers: config.maxUsers === -1 ? 999 : config.maxUsers,
        maxProducts: config.maxProducts === -1 ? 99999 : config.maxProducts,
        brilinkEnabled: config.brilinkEnabled,
        ppobEnabled: config.ppobEnabled,
        shiftEnabled: config.shiftEnabled,
        multiUserEnabled: config.multiUserEnabled,
        exportEnabled: config.exportEnabled,
        opnameEnabled: config.opnameEnabled,
        supplierEnabled: config.supplierEnabled,
        transferEnabled: config.transferEnabled,
        labelPrintEnabled: config.labelPrintEnabled,
        rackEnabled: config.rackEnabled,
        apiIntegrationEnabled: config.apiIntegrationEnabled,
      },
      update: {
        plan: plan as any,
        cycle: cycle as any,
        status: status as any,
        startDate,
        endDate,
        graceEndsAt: endDate ? calculateGraceEnd(endDate, plan) : null,
        maxBranches: config.maxBranches,
        maxUsers: config.maxUsers === -1 ? 999 : config.maxUsers,
        maxProducts: config.maxProducts === -1 ? 99999 : config.maxProducts,
        brilinkEnabled: config.brilinkEnabled,
        ppobEnabled: config.ppobEnabled,
        shiftEnabled: config.shiftEnabled,
        multiUserEnabled: config.multiUserEnabled,
        exportEnabled: config.exportEnabled,
        opnameEnabled: config.opnameEnabled,
        supplierEnabled: config.supplierEnabled,
        transferEnabled: config.transferEnabled,
        labelPrintEnabled: config.labelPrintEnabled,
        rackEnabled: config.rackEnabled,
        apiIntegrationEnabled: config.apiIntegrationEnabled,
      },
    });
  }

  /**
   * Get subscription status for a tenant.
   */
  async getSubscription(tenantId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { tenantId } });
    if (!sub) return null;

    const now = new Date();
    const daysRemaining = sub.endDate
      ? Math.max(0, Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null; // null = lifetime

    return {
      ...sub,
      daysRemaining,
      isExpiringSoon: daysRemaining !== null && daysRemaining <= 7,
      planLabel: PLAN_CONFIGS[sub.plan]?.label || sub.plan,
    };
  }

  /**
   * Get pricing + Lynk.id links for billing page.
   */
  getPricing() {
    return {
      plans: PLAN_PRICING,
      configs: Object.entries(PLAN_CONFIGS)
        .filter(([key]) => key !== 'TRIAL')
        .map(([key, config]) => ({
          key,
          ...config,
          pricing: PLAN_PRICING[key],
        })),
      paymentLinks: LYNK_PAYMENT_LINKS,
      bankTransfer: BANK_TRANSFER_INFO,
    };
  }

  /**
   * Check if tenant can add more branches.
   */
  async canAddBranch(tenantId: string): Promise<boolean> {
    const sub = await this.prisma.subscription.findUnique({ where: { tenantId } });
    if (!sub) return false;
    if (sub.maxBranches >= 999) return true;
    const shopCount = await this.prisma.shop.count({ where: { tenantId } });
    return shopCount < sub.maxBranches;
  }

  /**
   * Check if tenant can add more users.
   */
  async canAddUser(tenantId: string): Promise<boolean> {
    const sub = await this.prisma.subscription.findUnique({ where: { tenantId } });
    if (!sub) return false;
    if (sub.maxUsers >= 999) return true;
    const userCount = await this.prisma.user.count({ where: { tenantId } });
    return userCount < sub.maxUsers;
  }

  /**
   * Check if tenant can add more products.
   */
  async canAddProduct(tenantId: string): Promise<boolean> {
    const sub = await this.prisma.subscription.findUnique({ where: { tenantId } });
    if (!sub) return false;
    if (sub.maxProducts >= 99999) return true;
    const shops = await this.prisma.shop.findMany({ where: { tenantId }, select: { id: true } });
    const shopIds = shops.map((s) => s.id);
    const productCount = await this.prisma.product.count({
      where: { shopId: { in: shopIds }, deletedAt: null },
    });
    return productCount < sub.maxProducts;
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
}
