import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsPeriod } from './dto/query-analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // HELPERS
  // ============================================

  private getDateRange(period: AnalyticsPeriod): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    let start: Date;

    switch (period) {
      case AnalyticsPeriod.TODAY:
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;
      case AnalyticsPeriod.WEEK:
        start = new Date(now);
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        break;
      case AnalyticsPeriod.MONTH:
        start = new Date(now);
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        break;
      case AnalyticsPeriod.YEAR:
        start = new Date(now);
        start.setFullYear(start.getFullYear() - 1);
        start.setDate(start.getDate() + 1);
        start.setHours(0, 0, 0, 0);
        break;
      default:
        start = new Date(now);
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
    }

    return { start, end };
  }

  // ============================================
  // OVERVIEW
  // ============================================

  async getOverview(shopId: string, period: AnalyticsPeriod) {
    const { start, end } = this.getDateRange(period);

    // Revenue & Profit from COMPLETED transactions
    const transactionAgg = await this.prisma.transaction.aggregate({
      where: {
        shopId,
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
      },
      _sum: {
        totalPrice: true,
        totalCost: true,
      },
      _count: true,
      _avg: {
        totalPrice: true,
      },
    });

    const totalRevenue = transactionAgg._sum.totalPrice || 0;
    const totalCost = transactionAgg._sum.totalCost || 0;
    const totalProfit = totalRevenue - totalCost;
    const totalTransactions = transactionAgg._count || 0;
    const avgTransactionValue = Math.round(transactionAgg._avg.totalPrice || 0);

    // BRILink stats
    const brilinkAgg = await this.prisma.brilinkTransaction.aggregate({
      where: {
        shopId,
        status: 'SUCCESS',
        createdAt: { gte: start, lte: end },
      },
      _count: true,
      _sum: {
        fee: true,
      },
    });

    const totalBrilink = brilinkAgg._count || 0;
    const totalBrilinkFee = brilinkAgg._sum.fee || 0;

    // Active debts
    const debtAgg = await this.prisma.debt.aggregate({
      where: {
        shopId,
        status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
      _count: true,
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    });

    const activeDebts = debtAgg._count || 0;
    const debtAmount =
      (debtAgg._sum.totalAmount || 0) - (debtAgg._sum.paidAmount || 0);

    return {
      totalRevenue,
      totalProfit,
      totalTransactions,
      avgTransactionValue,
      totalBrilink,
      totalBrilinkFee,
      activeDebts,
      debtAmount,
    };
  }

  // ============================================
  // REVENUE CHART
  // ============================================

  async getRevenueChart(shopId: string, period: AnalyticsPeriod) {
    const { start, end } = this.getDateRange(period);

    // Determine grouping based on period
    let truncFormat: string;
    let labelFormat: string;

    if (period === AnalyticsPeriod.YEAR) {
      truncFormat = 'month';
      labelFormat = 'YYYY-MM';
    } else {
      truncFormat = 'day';
      labelFormat = 'YYYY-MM-DD';
    }

    // Use raw query for date grouping
    const results: Array<{
      period_label: string;
      revenue: bigint | string;
      profit: bigint | string;
      transactions: bigint | string;
    }> = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        TO_CHAR(DATE_TRUNC('${truncFormat}', "createdAt"), '${labelFormat}') as period_label,
        COALESCE(SUM("totalPrice"), 0) as revenue,
        COALESCE(SUM("totalPrice") - SUM("totalCost"), 0) as profit,
        COUNT(*)::bigint as transactions
      FROM "transactions"
      WHERE "shopId" = $1
        AND "status" = 'COMPLETED'
        AND "createdAt" >= $2
        AND "createdAt" <= $3
      GROUP BY period_label
      ORDER BY period_label ASC
      `,
      shopId,
      start,
      end,
    );

    const labels = results.map((r) => r.period_label);
    const revenue = results.map((r) => Number(r.revenue));
    const profit = results.map((r) => Number(r.profit));
    const transactions = results.map((r) => Number(r.transactions));

    return {
      labels,
      datasets: {
        revenue,
        profit,
        transactions,
      },
    };
  }

  // ============================================
  // TOP PRODUCTS
  // ============================================

  async getTopProducts(shopId: string, period: AnalyticsPeriod, limit: number) {
    const { start, end } = this.getDateRange(period);

    const results: Array<{
      productId: string;
      name: string;
      sku: string;
      totalSold: bigint | string;
      totalRevenue: bigint | string;
      totalProfit: bigint | string;
    }> = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        p."id" as "productId",
        p."name",
        p."sku",
        COALESCE(SUM(ti."quantity"), 0)::bigint as "totalSold",
        COALESCE(SUM(ti."subtotal"), 0)::bigint as "totalRevenue",
        COALESCE(SUM(ti."subtotal" - (ti."quantity" * p."cost")), 0)::bigint as "totalProfit"
      FROM "transaction_items" ti
      JOIN "transactions" t ON ti."transactionId" = t."id"
      JOIN "products" p ON ti."productId" = p."id"
      WHERE t."shopId" = $1
        AND t."status" = 'COMPLETED'
        AND t."createdAt" >= $2
        AND t."createdAt" <= $3
      GROUP BY p."id", p."name", p."sku"
      ORDER BY "totalRevenue" DESC
      LIMIT $4
      `,
      shopId,
      start,
      end,
      limit,
    );

    return results.map((r) => ({
      productId: r.productId,
      name: r.name,
      sku: r.sku,
      totalSold: Number(r.totalSold),
      totalRevenue: Number(r.totalRevenue),
      totalProfit: Number(r.totalProfit),
    }));
  }

  // ============================================
  // PAYMENT BREAKDOWN
  // ============================================

  async getPaymentBreakdown(shopId: string, period: AnalyticsPeriod) {
    const { start, end } = this.getDateRange(period);

    const results = await this.prisma.payment.groupBy({
      by: ['method'],
      where: {
        shopId,
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
      },
      _sum: {
        amount: true,
      },
    });

    const breakdown: Record<string, number> = {
      cash: 0,
      qris: 0,
      transfer: 0,
      hutang: 0,
    };

    for (const row of results) {
      const key = row.method.toLowerCase();
      breakdown[key] = row._sum.amount || 0;
    }

    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

    return { ...breakdown, total };
  }

  // ============================================
  // HOURLY DISTRIBUTION
  // ============================================

  async getHourlyDistribution(shopId: string, period: AnalyticsPeriod) {
    const { start, end } = this.getDateRange(period);

    // Calculate number of days in range for averaging
    const daysDiff = Math.max(
      1,
      Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    const results: Array<{
      hour: number;
      count: bigint | string;
    }> = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        EXTRACT(HOUR FROM "createdAt")::int as hour,
        COUNT(*)::bigint as count
      FROM "transactions"
      WHERE "shopId" = $1
        AND "status" = 'COMPLETED'
        AND "createdAt" >= $2
        AND "createdAt" <= $3
      GROUP BY hour
      ORDER BY hour ASC
      `,
      shopId,
      start,
      end,
    );

    // Build full 0-23 hours array
    const hours: Array<{ hour: number; avgTransactions: number }> = [];
    const resultMap = new Map(
      results.map((r) => [r.hour, Number(r.count)]),
    );

    for (let h = 0; h < 24; h++) {
      const totalCount = resultMap.get(h) || 0;
      hours.push({
        hour: h,
        avgTransactions: Math.round((totalCount / daysDiff) * 10) / 10,
      });
    }

    return hours;
  }

  // ============================================
  // MONTH-OVER-MONTH COMPARISON
  // ============================================

  async getComparison(shopId: string) {
    const now = new Date();

    // Current month: first day of month to now
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentEnd = new Date(now);
    currentEnd.setHours(23, 59, 59, 999);

    // Previous month: first to last day of previous month
    const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    previousEnd.setHours(23, 59, 59, 999);

    const [currentAgg, previousAgg] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          shopId,
          status: 'COMPLETED',
          createdAt: { gte: currentStart, lte: currentEnd },
        },
        _sum: { totalPrice: true, totalCost: true },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: {
          shopId,
          status: 'COMPLETED',
          createdAt: { gte: previousStart, lte: previousEnd },
        },
        _sum: { totalPrice: true, totalCost: true },
        _count: true,
      }),
    ]);

    const current = {
      revenue: currentAgg._sum.totalPrice || 0,
      profit:
        (currentAgg._sum.totalPrice || 0) - (currentAgg._sum.totalCost || 0),
      transactions: currentAgg._count || 0,
    };

    const previous = {
      revenue: previousAgg._sum.totalPrice || 0,
      profit:
        (previousAgg._sum.totalPrice || 0) -
        (previousAgg._sum.totalCost || 0),
      transactions: previousAgg._count || 0,
    };

    const calcGrowth = (curr: number, prev: number): number => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100 * 10) / 10;
    };

    const growth = {
      revenue: calcGrowth(current.revenue, previous.revenue),
      profit: calcGrowth(current.profit, previous.profit),
      transactions: calcGrowth(current.transactions, previous.transactions),
    };

    return { current, previous, growth };
  }
}
