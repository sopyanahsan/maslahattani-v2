import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardPeriod } from '../dashboard/dto/query-dashboard.dto';

/** Asia/Jakarta = UTC+7 (no DST). */
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

function startOfJakartaDay(d: Date): Date {
  const jakarta = new Date(d.getTime() + JAKARTA_OFFSET_MS);
  jakarta.setUTCHours(0, 0, 0, 0);
  return new Date(jakarta.getTime() - JAKARTA_OFFSET_MS);
}

function endOfJakartaDay(d: Date): Date {
  const jakarta = new Date(d.getTime() + JAKARTA_OFFSET_MS);
  jakarta.setUTCHours(23, 59, 59, 999);
  return new Date(jakarta.getTime() - JAKARTA_OFFSET_MS);
}

export const DEFAULT_BRILINK_ALERT_CONFIG = {
  brilinkFailedTransactionThreshold: 5,
};

const BRILINK_CATEGORIES = [
  'TRANSFER_BRI',
  'TRANSFER_OTHER',
  'TARIK_TUNAI',
  'TOPUP_PULSA',
  'TOPUP_DATA',
  'TOPUP_EWALLET',
  'TOPUP_PLN',
] as const;

@Injectable()
export class DashboardBrilinkService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // PERIOD HELPERS (same pattern as retail)
  // ============================================

  getPeriodRange(period: DashboardPeriod): { start: Date; end: Date } {
    const now = new Date();
    const todayStart = startOfJakartaDay(now);
    const todayEnd = endOfJakartaDay(now);

    switch (period) {
      case DashboardPeriod.TODAY:
        return { start: todayStart, end: todayEnd };
      case DashboardPeriod.WEEK: {
        const start = new Date(todayStart);
        start.setUTCDate(start.getUTCDate() - 6);
        return { start, end: todayEnd };
      }
      case DashboardPeriod.MONTH: {
        const start = new Date(todayStart);
        start.setUTCDate(start.getUTCDate() - 29);
        return { start, end: todayEnd };
      }
      default:
        return { start: todayStart, end: todayEnd };
    }
  }

  getPreviousPeriodRange(period: DashboardPeriod): { start: Date; end: Date } {
    const now = new Date();
    const todayStart = startOfJakartaDay(now);

    switch (period) {
      case DashboardPeriod.TODAY: {
        const start = new Date(todayStart);
        start.setUTCDate(start.getUTCDate() - 1);
        const end = new Date(start);
        end.setUTCHours(23, 59, 59, 999);
        return { start, end };
      }
      case DashboardPeriod.WEEK: {
        const start = new Date(todayStart);
        start.setUTCDate(start.getUTCDate() - 13);
        const end = new Date(todayStart);
        end.setUTCDate(end.getUTCDate() - 7);
        end.setUTCHours(23, 59, 59, 999);
        return { start, end };
      }
      case DashboardPeriod.MONTH: {
        const start = new Date(todayStart);
        start.setUTCDate(start.getUTCDate() - 59);
        const end = new Date(todayStart);
        end.setUTCDate(end.getUTCDate() - 30);
        end.setUTCHours(23, 59, 59, 999);
        return { start, end };
      }
      default: {
        const start = new Date(todayStart);
        start.setUTCDate(start.getUTCDate() - 1);
        const end = new Date(start);
        end.setUTCHours(23, 59, 59, 999);
        return { start, end };
      }
    }
  }

  private calcChangePercent(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }

  // ============================================
  // 1. OVERVIEW — 4 KPIs
  // ============================================

  async getOverview(shopId: string, period: DashboardPeriod) {
    const current = this.getPeriodRange(period);
    const previous = this.getPreviousPeriodRange(period);

    const [currentAgg, previousAgg] = await Promise.all([
      this.prisma.brilinkTransaction.aggregate({
        where: {
          shopId,
          status: 'SUCCESS',
          createdAt: { gte: current.start, lte: current.end },
        },
        _sum: { amount: true, fee: true },
        _count: true,
      }),
      this.prisma.brilinkTransaction.aggregate({
        where: {
          shopId,
          status: 'SUCCESS',
          createdAt: { gte: previous.start, lte: previous.end },
        },
        _sum: { amount: true, fee: true },
        _count: true,
      }),
    ]);

    const curCount = currentAgg._count || 0;
    const curVolume = currentAgg._sum.amount || 0;
    const curFee = currentAgg._sum.fee || 0;
    const curAvgFee = curCount > 0 ? Math.round(curFee / curCount) : 0;

    const prevCount = previousAgg._count || 0;
    const prevVolume = previousAgg._sum.amount || 0;
    const prevFee = previousAgg._sum.fee || 0;
    const prevAvgFee = prevCount > 0 ? Math.round(prevFee / prevCount) : 0;

    return {
      kpi: {
        transactions: {
          value: curCount,
          previousValue: prevCount,
          changePercent: this.calcChangePercent(curCount, prevCount),
        },
        volume: {
          value: curVolume,
          previousValue: prevVolume,
          changePercent: this.calcChangePercent(curVolume, prevVolume),
        },
        feeEarnings: {
          value: curFee,
          previousValue: prevFee,
          changePercent: this.calcChangePercent(curFee, prevFee),
        },
        avgFee: {
          value: curAvgFee,
          previousValue: prevAvgFee,
          changePercent: this.calcChangePercent(curAvgFee, prevAvgFee),
        },
      },
    };
  }

  // ============================================
  // 2. TRANSACTIONS CHART — stacked per category
  // ============================================

  async getTransactionsChart(shopId: string, period: DashboardPeriod) {
    const { start, end } = this.getPeriodRange(period);

    if (period === DashboardPeriod.TODAY) {
      // 24 hourly buckets per category
      const results: Array<{
        hour: number;
        category: string;
        count: bigint | string;
      }> = await this.prisma.$queryRawUnsafe(
        `
        SELECT
          EXTRACT(HOUR FROM ("createdAt" + interval '7 hours'))::int as hour,
          "category",
          COUNT(*)::bigint as count
        FROM "brilink_transactions"
        WHERE "shopId" = $1
          AND "status" = 'SUCCESS'
          AND "createdAt" >= $2
          AND "createdAt" <= $3
        GROUP BY hour, "category"
        ORDER BY hour ASC
        `,
        shopId,
        start,
        end,
      );

      const labels: string[] = [];
      const datasets: Record<string, number[]> = {};
      for (const cat of BRILINK_CATEGORIES) {
        datasets[cat] = [];
      }

      // Build map
      const map = new Map<string, number>();
      for (const r of results) {
        map.set(`${r.hour}-${r.category}`, Number(r.count));
      }

      for (let h = 0; h < 24; h++) {
        labels.push(`${String(h).padStart(2, '0')}:00`);
        for (const cat of BRILINK_CATEGORIES) {
          datasets[cat].push(map.get(`${h}-${cat}`) ?? 0);
        }
      }

      return { labels, datasets };
    }

    // WEEK / MONTH — bucket per day
    const days = period === DashboardPeriod.WEEK ? 7 : 30;
    const results: Array<{
      day_label: string;
      category: string;
      count: bigint | string;
    }> = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        TO_CHAR(("createdAt" + interval '7 hours')::date, 'YYYY-MM-DD') as day_label,
        "category",
        COUNT(*)::bigint as count
      FROM "brilink_transactions"
      WHERE "shopId" = $1
        AND "status" = 'SUCCESS'
        AND "createdAt" >= $2
        AND "createdAt" <= $3
      GROUP BY day_label, "category"
      ORDER BY day_label ASC
      `,
      shopId,
      start,
      end,
    );

    const map = new Map<string, number>();
    for (const r of results) {
      map.set(`${r.day_label}-${r.category}`, Number(r.count));
    }

    const labels: string[] = [];
    const datasets: Record<string, number[]> = {};
    for (const cat of BRILINK_CATEGORIES) {
      datasets[cat] = [];
    }

    for (let i = 0; i < days; i++) {
      const day = new Date(start);
      day.setUTCDate(day.getUTCDate() + i);
      const j = new Date(day.getTime() + JAKARTA_OFFSET_MS);
      const label = j.toISOString().slice(0, 10);
      labels.push(label);
      for (const cat of BRILINK_CATEGORIES) {
        datasets[cat].push(map.get(`${label}-${cat}`) ?? 0);
      }
    }

    return { labels, datasets };
  }

  // ============================================
  // 3. CATEGORY BREAKDOWN
  // ============================================

  async getCategoryBreakdown(shopId: string, period: DashboardPeriod) {
    const { start, end } = this.getPeriodRange(period);

    const grouped = await this.prisma.brilinkTransaction.groupBy({
      by: ['category'],
      where: {
        shopId,
        status: 'SUCCESS',
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true, fee: true },
      _count: true,
    });

    const totalVolume = grouped.reduce(
      (sum, g) => sum + (g._sum.amount || 0),
      0,
    );
    const totalFee = grouped.reduce((sum, g) => sum + (g._sum.fee || 0), 0);

    const data = BRILINK_CATEGORIES.map((cat) => {
      const row = grouped.find((g) => g.category === cat);
      const volume = row?._sum.amount || 0;
      const fee = row?._sum.fee || 0;
      const count = row?._count || 0;
      return {
        category: cat,
        count,
        volume,
        feeEarnings: fee,
        volumePercent:
          totalVolume > 0
            ? Math.round((volume / totalVolume) * 100 * 10) / 10
            : 0,
        feePercent:
          totalFee > 0
            ? Math.round((fee / totalFee) * 100 * 10) / 10
            : 0,
      };
    });

    return { data, totalVolume, totalFee };
  }

  // ============================================
  // 4. RECENT TRANSACTIONS
  // ============================================

  async getRecentTransactions(shopId: string, limit: number) {
    const transactions = await this.prisma.brilinkTransaction.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        cashier: { select: { username: true, email: true } },
      },
    });

    return {
      data: transactions.map((t) => ({
        id: t.id,
        refNumber: t.refNumber,
        category: t.category,
        customerName: t.customerName,
        customerPhone: t.customerPhone,
        destination: t.destination,
        amount: t.amount,
        fee: t.fee,
        total: t.total,
        status: t.status,
        cashier: t.cashier.username || t.cashier.email || '-',
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }

  // ============================================
  // 5. TOP CUSTOMERS — fixed Today
  // ============================================

  async getTopCustomers(shopId: string, limit: number) {
    const todayStart = startOfJakartaDay(new Date());
    const todayEnd = endOfJakartaDay(new Date());

    const results: Array<{
      customer_key: string;
      customer_name: string;
      customer_phone: string | null;
      trx_count: bigint | string;
      total_volume: bigint | string;
      last_trx: Date;
    }> = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        LOWER("customerName") || COALESCE("customerPhone", '') as customer_key,
        MAX("customerName") as customer_name,
        MAX("customerPhone") as customer_phone,
        COUNT(*)::bigint as trx_count,
        COALESCE(SUM("amount"), 0)::bigint as total_volume,
        MAX("createdAt") as last_trx
      FROM "brilink_transactions"
      WHERE "shopId" = $1
        AND "status" = 'SUCCESS'
        AND "createdAt" >= $2
        AND "createdAt" <= $3
      GROUP BY LOWER("customerName") || COALESCE("customerPhone", '')
      ORDER BY trx_count DESC
      LIMIT $4
      `,
      shopId,
      todayStart,
      todayEnd,
      limit,
    );

    return {
      data: results.map((r) => ({
        customerName: r.customer_name,
        customerPhone: r.customer_phone,
        transactionCount: Number(r.trx_count),
        totalVolume: Number(r.total_volume),
        lastTransaction: r.last_trx
          ? new Date(r.last_trx).toISOString()
          : null,
      })),
    };
  }

  // ============================================
  // 6. ACCOUNTS — list rekening + isLowBalance
  // ============================================

  async getAccounts(shopId: string) {
    const accounts = await this.prisma.brilinkAccount.findMany({
      where: { shopId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    return {
      data: accounts.map((a) => ({
        id: a.id,
        label: a.label,
        accountNumber: a.accountNumber,
        accountHolder: a.accountHolder,
        balance: a.balance,
        lowBalanceThreshold: a.lowBalanceThreshold,
        isLowBalance: a.balance < a.lowBalanceThreshold,
        isDefault: a.isDefault,
      })),
    };
  }

  // ============================================
  // 7. ALERTS
  // ============================================

  async getAlerts(shopId: string) {
    const todayStart = startOfJakartaDay(new Date());
    const todayEnd = endOfJakartaDay(new Date());

    // Get threshold from shop settings
    const setting = await this.prisma.shopSetting.findUnique({
      where: { shopId },
      select: { alertConfig: true },
    });
    const alertConfig = (setting?.alertConfig as any) || {};
    const failedThreshold =
      alertConfig.brilinkFailedTransactionThreshold ??
      DEFAULT_BRILINK_ALERT_CONFIG.brilinkFailedTransactionThreshold;

    const [lowBalanceAccounts, failedCount, activeFeeCategories] =
      await Promise.all([
        // Low balance accounts
        this.prisma.brilinkAccount.findMany({
          where: { shopId, isActive: true },
          select: {
            id: true,
            label: true,
            balance: true,
            lowBalanceThreshold: true,
          },
        }),
        // Failed transactions today
        this.prisma.brilinkTransaction.count({
          where: {
            shopId,
            status: 'FAILED',
            createdAt: { gte: todayStart, lte: todayEnd },
          },
        }),
        // Categories with at least 1 active fee rule
        this.prisma.brilinkFee.groupBy({
          by: ['category'],
          where: { shopId, isActive: true },
        }),
      ]);

    // Low balance alerts (per account)
    const lowBalanceAlerts = lowBalanceAccounts
      .filter((a) => a.balance < a.lowBalanceThreshold)
      .map((a) => ({
        accountId: a.id,
        label: a.label,
        balance: a.balance,
        threshold: a.lowBalanceThreshold,
      }));

    // Categories without fee
    const feeCategories = new Set(activeFeeCategories.map((g) => g.category));
    const categoriesWithoutFee = BRILINK_CATEGORIES.filter(
      (cat) => !feeCategories.has(cat),
    );

    const allClear =
      lowBalanceAlerts.length === 0 &&
      failedCount < failedThreshold &&
      categoriesWithoutFee.length === 0;

    return {
      lowBalance: lowBalanceAlerts,
      failedTransactions: {
        count: failedCount,
        threshold: failedThreshold,
        isTriggered: failedCount >= failedThreshold,
      },
      categoriesWithoutFee,
      allClear,
    };
  }

  // ============================================
  // 8. CASHIER PERFORMANCE — fixed Today
  // ============================================

  async getCashierPerformance(shopId: string, limit: number) {
    const todayStart = startOfJakartaDay(new Date());
    const todayEnd = endOfJakartaDay(new Date());

    const results: Array<{
      userId: string;
      name: string | null;
      email: string | null;
      trx_count: bigint | string;
      total_fee: bigint | string;
      total_volume: bigint | string;
    }> = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        u."id" as "userId",
        u."username" as name,
        u."email",
        COUNT(bt."id")::bigint as trx_count,
        COALESCE(SUM(bt."fee"), 0)::bigint as total_fee,
        COALESCE(SUM(bt."amount"), 0)::bigint as total_volume
      FROM "users" u
      INNER JOIN "brilink_transactions" bt
        ON bt."cashierId" = u."id"
        AND bt."shopId" = $1
        AND bt."status" = 'SUCCESS'
        AND bt."createdAt" >= $2
        AND bt."createdAt" <= $3
      WHERE u."shopId" = $1
      GROUP BY u."id", u."username", u."email"
      ORDER BY trx_count DESC
      LIMIT $4
      `,
      shopId,
      todayStart,
      todayEnd,
      limit,
    );

    return {
      data: results.map((r) => ({
        userId: r.userId,
        name: r.name || r.email,
        transactionCount: Number(r.trx_count),
        totalFee: Number(r.total_fee),
        totalVolume: Number(r.total_volume),
      })),
    };
  }
}
