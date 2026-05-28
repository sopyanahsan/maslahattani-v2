import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Laporan ringkasan penjualan:
   * - Omzet, modal, profit, diskon
   * - Breakdown per metode bayar
   * - Top products
   * - Daily trend (omzet per hari)
   */
  async getSalesReport(shopId: string, startDate?: string, endDate?: string) {
    const where: any = { shopId, status: TransactionStatus.COMPLETED };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }

    // Aggregate totals
    const totals = await this.prisma.transaction.aggregate({
      where,
      _sum: { totalPrice: true, totalCost: true, totalDiscount: true },
      _count: true,
    });

    const voidedCount = await this.prisma.transaction.count({
      where: { ...where, status: TransactionStatus.VOIDED },
    });

    const omzet = totals._sum.totalPrice || 0;
    const modal = totals._sum.totalCost || 0;
    const diskon = totals._sum.totalDiscount || 0;
    const profit = omzet - modal;

    // Payment method breakdown
    const paymentWhere: any = { shopId, status: PaymentStatus.COMPLETED };
    if (startDate || endDate) {
      paymentWhere.createdAt = {};
      if (startDate) paymentWhere.createdAt.gte = new Date(startDate);
      if (endDate) paymentWhere.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const methodBreakdown = await this.prisma.payment.groupBy({
      by: ['method'],
      where: paymentWhere,
      _sum: { amount: true },
      _count: true,
    });

    // Top products (by quantity sold)
    const topProducts = await this.prisma.transactionItem.groupBy({
      by: ['productId'],
      where: {
        transaction: where,
      },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: 10,
    });

    // Enrich with product names
    const productIds = topProducts.map((tp) => tp.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true },
    });

    const topProductsEnriched = topProducts.map((tp) => {
      const product = products.find((p) => p.id === tp.productId);
      return {
        productId: tp.productId,
        productName: product?.name ?? 'Unknown',
        sku: product?.sku ?? '—',
        totalQty: tp._sum.quantity || 0,
        totalRevenue: tp._sum.subtotal || 0,
      };
    });

    // Daily trend
    const transactions = await this.prisma.transaction.findMany({
      where,
      select: { createdAt: true, totalPrice: true, totalCost: true },
      orderBy: { createdAt: 'asc' },
    });

    const dailyMap = new Map<string, { omzet: number; profit: number; count: number }>();
    for (const trx of transactions) {
      const day = trx.createdAt.toISOString().slice(0, 10);
      const existing = dailyMap.get(day) || { omzet: 0, profit: 0, count: 0 };
      existing.omzet += trx.totalPrice;
      existing.profit += trx.totalPrice - trx.totalCost;
      existing.count += 1;
      dailyMap.set(day, existing);
    }

    const dailyTrend = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      omzet: data.omzet,
      profit: data.profit,
      transactions: data.count,
    }));

    return {
      summary: {
        omzet,
        modal,
        profit,
        diskon,
        totalTransactions: totals._count,
        totalVoided: voidedCount,
        marginPercent: modal > 0 ? Math.round((profit / modal) * 100 * 10) / 10 : 0,
      },
      methodBreakdown: methodBreakdown.map((mb) => ({
        method: mb.method,
        totalAmount: mb._sum.amount || 0,
        count: mb._count,
      })),
      topProducts: topProductsEnriched,
      dailyTrend,
    };
  }

  /**
   * Laporan hutang:
   * - Total outstanding
   * - Overdue count
   * - Recent payments
   */
  async getDebtReport(shopId: string) {
    const debts = await this.prisma.debt.findMany({
      where: { shopId, status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] } },
    });

    const totalOutstanding = debts.reduce(
      (sum, d) => sum + (d.totalAmount - d.paidAmount),
      0,
    );
    const overdueCount = debts.filter((d) => d.status === 'OVERDUE').length;
    const totalDebtors = new Set(debts.map((d) => d.customerName)).size;

    // Recent debt payments
    const recentPayments = await this.prisma.debtPayment.findMany({
      where: { debt: { shopId } },
      include: { debt: { select: { customerName: true, totalAmount: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      summary: {
        totalOutstanding,
        overdueCount,
        totalDebtors,
        totalDebts: debts.length,
      },
      recentPayments: recentPayments.map((rp) => ({
        id: rp.id,
        customerName: rp.debt.customerName,
        amount: rp.amount,
        method: rp.method,
        createdAt: rp.createdAt,
      })),
    };
  }

  /**
   * Laporan BRILink:
   * - Summary: totalTransactions, volume, feeEarnings, avgFee
   * - Category breakdown
   */
  async getBrilinkReport(shopId: string, startDate?: string, endDate?: string) {
    const where: any = { shopId, status: 'SUCCESS' };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const totals = await this.prisma.brilinkTransaction.aggregate({
      where,
      _sum: { amount: true, fee: true },
      _count: true,
    });

    const totalTransactions = totals._count || 0;
    const volume = totals._sum.amount || 0;
    const feeEarnings = totals._sum.fee || 0;
    const avgFee = totalTransactions > 0 ? Math.round(feeEarnings / totalTransactions) : 0;

    // Category breakdown
    const grouped = await this.prisma.brilinkTransaction.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true, fee: true },
      _count: true,
    });

    const categoryBreakdown = grouped.map((g) => ({
      category: g.category,
      count: g._count,
      volume: g._sum.amount || 0,
      fee: g._sum.fee || 0,
    }));

    return {
      summary: { totalTransactions, volume, feeEarnings, avgFee },
      categoryBreakdown,
    };
  }
}
