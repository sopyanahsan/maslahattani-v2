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
   * - Summary: totalTransactions, volume, feeEarnings, avgFee, voidedCount
   * - Category breakdown (per kategori: count, volume, fee, percentVolume)
   * - Daily trend (volume + fee per hari)
   * - Per-kasir performance
   * - Top customers
   */
  async getBrilinkReport(shopId: string, startDate?: string, endDate?: string) {
    const where: any = { shopId, status: 'SUCCESS' };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate + 'T00:00:00.000+07:00');
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999+07:00');
    }

    const [totals, voidedCount, grouped, transactions, cashierGrouped, topCustomers] = await Promise.all([
      this.prisma.brilinkTransaction.aggregate({
        where,
        _sum: { amount: true, fee: true },
        _count: true,
      }),
      this.prisma.brilinkTransaction.count({
        where: { shopId, status: 'VOIDED', ...(where.createdAt ? { createdAt: where.createdAt } : {}) },
      }),
      this.prisma.brilinkTransaction.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true, fee: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      }),
      this.prisma.brilinkTransaction.findMany({
        where,
        select: { createdAt: true, amount: true, fee: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.brilinkTransaction.groupBy({
        by: ['cashierId'],
        where,
        _sum: { amount: true, fee: true },
        _count: true,
        orderBy: { _count: { cashierId: 'desc' } },
        take: 10,
      }),
      this.prisma.brilinkTransaction.groupBy({
        by: ['customerName'],
        where,
        _sum: { amount: true, fee: true },
        _count: true,
        orderBy: { _count: { customerName: 'desc' } },
        take: 10,
      }),
    ]);

    const totalTransactions = totals._count || 0;
    const volume = totals._sum.amount || 0;
    const feeEarnings = totals._sum.fee || 0;
    const avgFee = totalTransactions > 0 ? Math.round(feeEarnings / totalTransactions) : 0;

    const categoryBreakdown = grouped.map((g) => ({
      category: g.category,
      count: g._count,
      volume: g._sum.amount || 0,
      fee: g._sum.fee || 0,
      percentVolume: volume > 0 ? Math.round(((g._sum.amount || 0) / volume) * 1000) / 10 : 0,
    }));

    // Daily trend
    const dailyMap = new Map<string, { volume: number; fee: number; count: number }>();
    for (const trx of transactions) {
      const wibDate = new Date(trx.createdAt.getTime() + 7 * 60 * 60 * 1000);
      const day = wibDate.toISOString().slice(0, 10);
      const existing = dailyMap.get(day) || { volume: 0, fee: 0, count: 0 };
      existing.volume += trx.amount;
      existing.fee += trx.fee;
      existing.count += 1;
      dailyMap.set(day, existing);
    }
    const dailyTrend = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      volume: data.volume,
      fee: data.fee,
      transactions: data.count,
    }));

    // Per-kasir
    const cashierIds = cashierGrouped.map((c) => c.cashierId);
    const cashiers = await this.prisma.user.findMany({
      where: { id: { in: cashierIds } },
      select: { id: true, username: true, email: true },
    });
    const cashierPerformance = cashierGrouped.map((c) => {
      const user = cashiers.find((u) => u.id === c.cashierId);
      return {
        cashierId: c.cashierId,
        cashierName: user?.username || user?.email || '-',
        count: c._count,
        volume: c._sum.amount || 0,
        fee: c._sum.fee || 0,
      };
    });

    return {
      summary: { totalTransactions, volume, feeEarnings, avgFee, voidedCount },
      categoryBreakdown,
      dailyTrend,
      cashierPerformance,
      topCustomers: topCustomers.map((tc) => ({
        customerName: tc.customerName,
        count: tc._count,
        volume: tc._sum.amount || 0,
        fee: tc._sum.fee || 0,
      })),
    };
  }

  // ============================================
  // PRODUCT REPORT
  // ============================================

  async getProductReport(shopId: string, startDate?: string, endDate?: string) {
    const trxWhere: any = { shopId, status: TransactionStatus.COMPLETED };
    if (startDate || endDate) {
      trxWhere.createdAt = {};
      if (startDate) trxWhere.createdAt.gte = new Date(startDate);
      if (endDate) trxWhere.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }

    // All transaction items in period
    const itemsGrouped = await this.prisma.transactionItem.groupBy({
      by: ['productId'],
      where: { transaction: trxWhere },
      _sum: { quantity: true, subtotal: true },
      _count: true,
    });

    // All products in shop
    const allProducts = await this.prisma.product.findMany({
      where: { shopId, deletedAt: null },
      select: { id: true, name: true, sku: true, price: true, cost: true },
    });

    const salesMap = new Map(itemsGrouped.map((ig) => [ig.productId, ig]));

    // Top Selling (by revenue)
    const topSelling = [...itemsGrouped]
      .sort((a, b) => (b._sum.subtotal || 0) - (a._sum.subtotal || 0))
      .slice(0, 10)
      .map((ig) => {
        const p = allProducts.find((pr) => pr.id === ig.productId);
        return {
          productId: ig.productId,
          name: p?.name ?? 'Unknown',
          sku: p?.sku ?? '-',
          qtySold: ig._sum.quantity || 0,
          revenue: ig._sum.subtotal || 0,
          transactions: ig._count,
        };
      });

    // Slow Moving (products with 0 or lowest sales)
    const slowMoving = allProducts
      .map((p) => {
        const sale = salesMap.get(p.id);
        return {
          productId: p.id,
          name: p.name,
          sku: p.sku,
          price: p.price,
          qtySold: sale?._sum.quantity || 0,
          revenue: sale?._sum.subtotal || 0,
        };
      })
      .sort((a, b) => a.qtySold - b.qtySold)
      .slice(0, 10);

    // Highest Margin
    const highestMargin = allProducts
      .filter((p) => p.price > 0 && p.cost > 0)
      .map((p) => {
        const sale = salesMap.get(p.id);
        const margin = p.price - p.cost;
        const marginPercent = Math.round((margin / p.price) * 100);
        return {
          productId: p.id,
          name: p.name,
          sku: p.sku,
          price: p.price,
          cost: p.cost,
          margin,
          marginPercent,
          qtySold: sale?._sum.quantity || 0,
          totalProfit: (sale?._sum.quantity || 0) * margin,
        };
      })
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 10);

    // Category breakdown (sales per product category)
    const allProductsFull = await this.prisma.product.findMany({
      where: { shopId, deletedAt: null },
      select: { id: true, categoryId: true },
    });
    const categories = await this.prisma.productCategory.findMany({
      where: { shopId },
      select: { id: true, name: true },
    });

    const categoryMap = new Map<string, { name: string; qty: number; revenue: number; productCount: number }>();
    for (const cat of categories) {
      categoryMap.set(cat.id, { name: cat.name, qty: 0, revenue: 0, productCount: 0 });
    }
    // uncategorized
    categoryMap.set('_uncategorized', { name: 'Tanpa Kategori', qty: 0, revenue: 0, productCount: 0 });

    for (const p of allProductsFull) {
      const catId = p.categoryId || '_uncategorized';
      const catEntry = categoryMap.get(catId);
      if (catEntry) catEntry.productCount += 1;
      const sale = salesMap.get(p.id);
      if (sale && catEntry) {
        catEntry.qty += sale._sum.quantity || 0;
        catEntry.revenue += sale._sum.subtotal || 0;
      }
    }

    const categoryBreakdown = [...categoryMap.entries()]
      .map(([id, data]) => ({ categoryId: id, ...data }))
      .filter((c) => c.productCount > 0)
      .sort((a, b) => b.revenue - a.revenue);

    // Low stock products (below threshold from alertConfig)
    const alertConfig = await this.prisma.shopSetting.findUnique({
      where: { shopId },
      select: { alertConfig: true },
    });
    const threshold = (alertConfig?.alertConfig as any)?.lowStockThreshold ?? 5;

    const lowStockProducts = await this.prisma.stock.findMany({
      where: { shopId, quantity: { lte: threshold } },
      include: { product: { select: { id: true, name: true, sku: true, price: true, deletedAt: true } } },
      orderBy: { quantity: 'asc' },
      take: 20,
    });

    const lowStock = lowStockProducts
      .filter((s) => s.product && !s.product.deletedAt)
      .map((s) => ({
        productId: s.product.id,
        name: s.product.name,
        sku: s.product.sku,
        currentStock: s.quantity,
        threshold,
      }));

    return {
      totalProducts: allProducts.length,
      productsWithSales: itemsGrouped.length,
      productsWithoutSales: allProducts.length - itemsGrouped.length,
      topSelling,
      slowMoving,
      highestMargin,
      categoryBreakdown,
      lowStock,
      lowStockThreshold: threshold,
    };
  }

  // ============================================
  // CUSTOMER REPORT
  // ============================================

  async getCustomerReport(shopId: string, startDate?: string, endDate?: string) {
    const trxWhere: any = { shopId, status: TransactionStatus.COMPLETED, customerId: { not: null } };
    if (startDate || endDate) {
      trxWhere.createdAt = {};
      if (startDate) trxWhere.createdAt.gte = new Date(startDate);
      if (endDate) trxWhere.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }

    // Group transactions by customer
    const customerGrouped = await this.prisma.transaction.groupBy({
      by: ['customerId'],
      where: trxWhere,
      _sum: { totalPrice: true, totalCost: true },
      _count: true,
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: 20,
    });

    // Enrich with customer names
    const customerIds = customerGrouped.map((cg) => cg.customerId!).filter(Boolean);
    const customers = await this.prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, phone: true, createdAt: true },
    });

    // Top Spenders
    const topSpenders = customerGrouped.map((cg) => {
      const c = customers.find((cu) => cu.id === cg.customerId);
      return {
        customerId: cg.customerId,
        name: c?.name ?? 'Unknown',
        phone: c?.phone ?? null,
        totalSpent: cg._sum.totalPrice || 0,
        totalProfit: (cg._sum.totalPrice || 0) - (cg._sum.totalCost || 0),
        transactionCount: cg._count,
        avgPerVisit: cg._count > 0 ? Math.round((cg._sum.totalPrice || 0) / cg._count) : 0,
      };
    });

    // Repeat vs New (based on transaction count in period)
    const repeatCustomers = customerGrouped.filter((cg) => cg._count > 1).length;
    const newCustomers = customerGrouped.filter((cg) => cg._count === 1).length;

    // Total unique customers
    const totalUniqueCustomers = await this.prisma.transaction.groupBy({
      by: ['customerId'],
      where: trxWhere,
      _count: true,
    });

    // Customers created in this period (truly new)
    const newlyCreatedWhere: any = { shopId };
    if (startDate || endDate) {
      newlyCreatedWhere.createdAt = {};
      if (startDate) newlyCreatedWhere.createdAt.gte = new Date(startDate);
      if (endDate) newlyCreatedWhere.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }
    const newlyCreatedCount = await this.prisma.customer.count({ where: newlyCreatedWhere });

    return {
      summary: {
        totalUniqueCustomers: totalUniqueCustomers.length,
        repeatCustomers,
        newCustomers,
        newlyRegistered: newlyCreatedCount,
      },
      topSpenders,
    };
  }

  // ============================================
  // SALES COMPARISON (period vs previous period)
  // ============================================

  async getSalesComparison(shopId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate + 'T23:59:59.999Z');

    // Calculate previous period (same duration, before start)
    const durationMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    const [current, previous] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { shopId, status: TransactionStatus.COMPLETED, createdAt: { gte: start, lte: end } },
        _sum: { totalPrice: true, totalCost: true, totalDiscount: true },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: { shopId, status: TransactionStatus.COMPLETED, createdAt: { gte: prevStart, lte: prevEnd } },
        _sum: { totalPrice: true, totalCost: true, totalDiscount: true },
        _count: true,
      }),
    ]);

    const curOmzet = current._sum.totalPrice || 0;
    const prevOmzet = previous._sum.totalPrice || 0;
    const curProfit = curOmzet - (current._sum.totalCost || 0);
    const prevProfit = prevOmzet - (previous._sum.totalCost || 0);
    const curTrx = current._count || 0;
    const prevTrx = previous._count || 0;

    function pctChange(cur: number, prev: number): number {
      if (prev === 0) return cur > 0 ? 100 : 0;
      return Math.round(((cur - prev) / prev) * 100 * 10) / 10;
    }

    return {
      current: {
        period: `${startDate} — ${endDate}`,
        omzet: curOmzet,
        profit: curProfit,
        transactions: curTrx,
        aov: curTrx > 0 ? Math.round(curOmzet / curTrx) : 0,
      },
      previous: {
        period: `${prevStart.toISOString().slice(0, 10)} — ${prevEnd.toISOString().slice(0, 10)}`,
        omzet: prevOmzet,
        profit: prevProfit,
        transactions: prevTrx,
        aov: prevTrx > 0 ? Math.round(prevOmzet / prevTrx) : 0,
      },
      change: {
        omzet: pctChange(curOmzet, prevOmzet),
        profit: pctChange(curProfit, prevProfit),
        transactions: pctChange(curTrx, prevTrx),
      },
    };
  }
}
