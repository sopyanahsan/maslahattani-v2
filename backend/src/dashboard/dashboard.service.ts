import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardPeriod } from './dto/query-dashboard.dto';

/**
 * Default threshold buat alert dashboard. Dipakai sebagai fallback kalau
 * `ShopSetting.alertConfig` belum di-set.
 */
export const DEFAULT_ALERT_CONFIG = {
  lowStockThreshold: 5,
  shiftDurationWarningHours: 8,
  overdueDebtDaysBeforeNotice: 0,
};

export interface AlertConfig {
  lowStockThreshold: number;
  shiftDurationWarningHours: number;
  overdueDebtDaysBeforeNotice: number;
}

/** Asia/Jakarta = UTC+7 (no DST). */
const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Wall-clock helpers (Asia/Jakarta) — kembalikan Date instance UTC. */
function startOfJakartaDay(d: Date): Date {
  // Geser ke "Jakarta time", set jam 00:00, geser balik ke UTC.
  const jakarta = new Date(d.getTime() + JAKARTA_OFFSET_MS);
  jakarta.setUTCHours(0, 0, 0, 0);
  return new Date(jakarta.getTime() - JAKARTA_OFFSET_MS);
}

function endOfJakartaDay(d: Date): Date {
  const jakarta = new Date(d.getTime() + JAKARTA_OFFSET_MS);
  jakarta.setUTCHours(23, 59, 59, 999);
  return new Date(jakarta.getTime() - JAKARTA_OFFSET_MS);
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // PERIOD HELPERS
  // ============================================

  /**
   * Range periode "current" untuk dashboard.
   * - today : awal hari ini s/d sekarang (Asia/Jakarta)
   * - week  : 7 hari termasuk hari ini (start = -6 hari, jam 00:00)
   * - month : 30 hari termasuk hari ini (start = -29 hari, jam 00:00)
   */
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

  /**
   * Range periode "previous" untuk perhitungan compare.
   * - today : kemarin penuh (00:00 - 23:59)
   * - week  : 7 hari sebelumnya (start = -13 hari, end = -7 hari)
   * - month : 30 hari sebelumnya (start = -59 hari, end = -30 hari)
   */
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

  /** % change dengan handling pembagian nol (return 0/100 sesuai konvensi). */
  private calcChangePercent(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }

  // ============================================
  // 1. OVERVIEW (KPI cards)
  // ============================================

  async getOverview(shopId: string, period: DashboardPeriod) {
    const current = this.getPeriodRange(period);
    const previous = this.getPreviousPeriodRange(period);

    const [currentAgg, previousAgg] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          shopId,
          status: 'COMPLETED',
          createdAt: { gte: current.start, lte: current.end },
        },
        _sum: { totalPrice: true, totalCost: true },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: {
          shopId,
          status: 'COMPLETED',
          createdAt: { gte: previous.start, lte: previous.end },
        },
        _sum: { totalPrice: true, totalCost: true },
        _count: true,
      }),
    ]);

    const currentRevenue = currentAgg._sum.totalPrice || 0;
    const currentCost = currentAgg._sum.totalCost || 0;
    const currentProfit = currentRevenue - currentCost;
    const currentTransactions = currentAgg._count || 0;
    const currentAov =
      currentTransactions > 0
        ? Math.round(currentRevenue / currentTransactions)
        : 0;

    const previousRevenue = previousAgg._sum.totalPrice || 0;
    const previousCost = previousAgg._sum.totalCost || 0;
    const previousProfit = previousRevenue - previousCost;
    const previousTransactions = previousAgg._count || 0;
    const previousAov =
      previousTransactions > 0
        ? Math.round(previousRevenue / previousTransactions)
        : 0;

    return {
      kpi: {
        revenue: {
          value: currentRevenue,
          previousValue: previousRevenue,
          changePercent: this.calcChangePercent(currentRevenue, previousRevenue),
        },
        transactions: {
          value: currentTransactions,
          previousValue: previousTransactions,
          changePercent: this.calcChangePercent(
            currentTransactions,
            previousTransactions,
          ),
        },
        profit: {
          value: currentProfit,
          previousValue: previousProfit,
          changePercent: this.calcChangePercent(currentProfit, previousProfit),
        },
        aov: {
          value: currentAov,
          previousValue: previousAov,
          changePercent: this.calcChangePercent(currentAov, previousAov),
        },
      },
    };
  }

  // ============================================
  // 2. SALES CHART
  // ============================================

  async getSalesChart(shopId: string, period: DashboardPeriod) {
    const { start, end } = this.getPeriodRange(period);

    if (period === DashboardPeriod.TODAY) {
      // 24 buckets per jam
      const results: Array<{
        hour: number;
        revenue: bigint | string;
        profit: bigint | string;
      }> = await this.prisma.$queryRawUnsafe(
        `
        SELECT
          EXTRACT(HOUR FROM ("createdAt" AT TIME ZONE 'Asia/Jakarta'))::int as hour,
          COALESCE(SUM("totalPrice"), 0) as revenue,
          COALESCE(SUM("totalPrice") - SUM("totalCost"), 0) as profit
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

      const labels: string[] = [];
      const revenue: number[] = [];
      const profit: number[] = [];
      const map = new Map<number, { revenue: number; profit: number }>();
      for (const r of results) {
        map.set(Number(r.hour), {
          revenue: Number(r.revenue),
          profit: Number(r.profit),
        });
      }
      for (let h = 0; h < 24; h++) {
        labels.push(`${String(h).padStart(2, '0')}:00`);
        const bucket = map.get(h);
        revenue.push(bucket?.revenue ?? 0);
        profit.push(bucket?.profit ?? 0);
      }
      return { labels, revenue, profit };
    }

    // WEEK / MONTH → bucket per hari (7 atau 30)
    const days = period === DashboardPeriod.WEEK ? 7 : 30;
    const results: Array<{
      day_label: string;
      revenue: bigint | string;
      profit: bigint | string;
    }> = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        TO_CHAR(("createdAt" AT TIME ZONE 'Asia/Jakarta')::date, 'YYYY-MM-DD') as day_label,
        COALESCE(SUM("totalPrice"), 0) as revenue,
        COALESCE(SUM("totalPrice") - SUM("totalCost"), 0) as profit
      FROM "transactions"
      WHERE "shopId" = $1
        AND "status" = 'COMPLETED'
        AND "createdAt" >= $2
        AND "createdAt" <= $3
      GROUP BY day_label
      ORDER BY day_label ASC
      `,
      shopId,
      start,
      end,
    );

    const map = new Map<string, { revenue: number; profit: number }>();
    for (const r of results) {
      map.set(r.day_label, {
        revenue: Number(r.revenue),
        profit: Number(r.profit),
      });
    }

    const labels: string[] = [];
    const revenueArr: number[] = [];
    const profitArr: number[] = [];

    // Build N hari window dari `start` (jangan trust isi DB; isi 0 untuk hari kosong)
    for (let i = 0; i < days; i++) {
      const day = new Date(start);
      day.setUTCDate(day.getUTCDate() + i);
      // YYYY-MM-DD di Asia/Jakarta
      const j = new Date(day.getTime() + JAKARTA_OFFSET_MS);
      const label = j.toISOString().slice(0, 10);
      labels.push(label);
      const bucket = map.get(label);
      revenueArr.push(bucket?.revenue ?? 0);
      profitArr.push(bucket?.profit ?? 0);
    }

    return { labels, revenue: revenueArr, profit: profitArr };
  }

  // ============================================
  // 3. OPERATIONS PANEL
  // ============================================

  async getOperations(shopId: string) {
    const todayStart = startOfJakartaDay(new Date());
    const todayEnd = endOfJakartaDay(new Date());
    const config = await this.getAlertConfig(shopId);
    const thresholdMs = config.shiftDurationWarningHours * 60 * 60 * 1000;
    const now = Date.now();

    const [activeShifts, shiftStats, lastOnlineUsers, lastRetailTrx, lastBrilinkTrx] =
      await Promise.all([
        // Active shifts (status OPEN)
        this.prisma.shift.findMany({
          where: { shopId, status: 'OPEN' },
          include: {
            user: { select: { id: true, username: true, email: true } },
          },
          orderBy: { startTime: 'asc' },
        }),
        // Stats hari ini per status (open/closed/finalized)
        this.prisma.shift.groupBy({
          by: ['status'],
          where: {
            shopId,
            startTime: { gte: todayStart, lte: todayEnd },
          },
          _count: true,
        }),
        // Top 3 kasir last login (per shop)
        this.prisma.user.findMany({
          where: {
            shopId,
            role: { in: ['KASIR', 'CASHIER_SUPERVISOR'] },
            lastLogin: { not: null },
          },
          select: {
            id: true,
            username: true,
            email: true,
            lastLogin: true,
          },
          orderBy: { lastLogin: 'desc' },
          take: 3,
        }),
        // Last retail transaction (any status)
        this.prisma.transaction.findFirst({
          where: { shopId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            transactionNumber: true,
            totalPrice: true,
            createdAt: true,
          },
        }),
        // Last BRILink transaction
        this.prisma.brilinkTransaction.findFirst({
          where: { shopId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            refNumber: true,
            total: true,
            createdAt: true,
          },
        }),
      ]);

    // Pick whichever transaction is most recent
    let lastTransaction: any = null;
    const retailTime = lastRetailTrx?.createdAt?.getTime() ?? 0;
    const brilinkTime = lastBrilinkTrx?.createdAt?.getTime() ?? 0;
    if (retailTime || brilinkTime) {
      if (retailTime >= brilinkTime && lastRetailTrx) {
        lastTransaction = {
          id: lastRetailTrx.id,
          type: 'RETAIL',
          transactionNumber: lastRetailTrx.transactionNumber,
          amount: lastRetailTrx.totalPrice,
          createdAt: lastRetailTrx.createdAt.toISOString(),
        };
      } else if (lastBrilinkTrx) {
        lastTransaction = {
          id: lastBrilinkTrx.id,
          type: 'BRILINK',
          transactionNumber: lastBrilinkTrx.refNumber,
          amount: lastBrilinkTrx.total,
          createdAt: lastBrilinkTrx.createdAt.toISOString(),
        };
      }
    }

    const stats = { open: 0, closed: 0, finalized: 0 };
    for (const row of shiftStats) {
      const key = row.status.toLowerCase() as 'open' | 'closed' | 'finalized';
      stats[key] = row._count;
    }

    return {
      activeShifts: activeShifts.map((s) => {
        const durationMinutes = Math.floor(
          (now - s.startTime.getTime()) / 60_000,
        );
        const isOverThreshold = now - s.startTime.getTime() > thresholdMs;
        return {
          id: s.id,
          cashierName: s.user.username || s.user.email || '-',
          startTime: s.startTime.toISOString(),
          durationMinutes,
          isOverThreshold,
        };
      }),
      shiftStats: stats,
      lastOnlineCashiers: lastOnlineUsers.map((u) => ({
        userId: u.id,
        name: u.username || u.email || '-',
        lastActiveAt: u.lastLogin?.toISOString() ?? null,
      })),
      lastTransaction,
    };
  }

  // ============================================
  // 4. TOP PRODUCTS
  // ============================================

  async getTopProducts(
    shopId: string,
    period: DashboardPeriod,
    limit: number,
  ) {
    const { start, end } = this.getPeriodRange(period);

    const results: Array<{
      productId: string;
      name: string;
      qty: bigint | string;
      revenue: bigint | string;
    }> = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        p."id" as "productId",
        p."name",
        COALESCE(SUM(ti."quantity"), 0)::bigint as qty,
        COALESCE(SUM(ti."subtotal"), 0)::bigint as revenue
      FROM "transaction_items" ti
      JOIN "transactions" t ON ti."transactionId" = t."id"
      JOIN "products" p ON ti."productId" = p."id"
      WHERE t."shopId" = $1
        AND t."status" = 'COMPLETED'
        AND t."createdAt" >= $2
        AND t."createdAt" <= $3
      GROUP BY p."id", p."name"
      ORDER BY revenue DESC
      LIMIT $4
      `,
      shopId,
      start,
      end,
      limit,
    );

    return {
      data: results.map((r) => ({
        productId: r.productId,
        name: r.name,
        qty: Number(r.qty),
        revenue: Number(r.revenue),
      })),
    };
  }

  // ============================================
  // 5. RECENT ACTIVITY (merged feed)
  // ============================================

  async getRecentActivity(shopId: string, limit: number) {
    return { data: await this.mergeRecentActivities(shopId, limit) };
  }

  /**
   * Merge events dari berbagai source (transaksi retail, brilink, stock,
   * transfer, opname), urut by timestamp DESC, ambil top N.
   *
   * Setiap source di-fetch dengan limit `limit` (over-fetch) supaya setelah
   * merge & sort kita masih punya cukup item buat `slice(0, limit)`.
   */
  async mergeRecentActivities(shopId: string, limit: number) {
    const oversampleLimit = Math.max(limit, 10);

    const [
      retailTrx,
      brilinkTrx,
      stockHistories,
      stockTransfersIn,
      opnameSessions,
    ] = await Promise.all([
      // Retail transactions (COMPLETED + VOIDED)
      this.prisma.transaction.findMany({
        where: {
          shopId,
          status: { in: ['COMPLETED', 'VOIDED'] },
        },
        include: {
          user: { select: { username: true, email: true } },
          payments: { select: { method: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: oversampleLimit,
      }),
      // BRILink transactions (SUCCESS)
      this.prisma.brilinkTransaction.findMany({
        where: { shopId, status: 'SUCCESS' },
        include: {
          cashier: { select: { username: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: oversampleLimit,
      }),
      // Stock histories (IN, OUT, OPNAME, ADJUSTMENT) — filter by shop via stock relation
      this.prisma.stockHistory.findMany({
        where: {
          stock: { shopId },
          type: { in: ['IN', 'OUT', 'OPNAME', 'ADJUSTMENT'] },
        },
        include: {
          stock: {
            select: {
              product: { select: { name: true, sku: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: oversampleLimit,
      }),
      // Stock transfers received (incoming to this shop)
      this.prisma.stockTransfer.findMany({
        where: { toShopId: shopId, status: 'RECEIVED' },
        include: {
          fromShop: { select: { name: true } },
          items: { select: { quantity: true } },
        },
        orderBy: { receivedAt: 'desc' },
        take: oversampleLimit,
      }),
      // Opname sessions (COMPLETED)
      this.prisma.opnameSession.findMany({
        where: { shopId, status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        take: oversampleLimit,
      }),
    ]);

    type Activity = {
      type: string;
      category: string;
      icon: string;
      title: string;
      description: string;
      timestamp: string;
    };

    const events: Activity[] = [];

    // Retail transactions
    for (const t of retailTrx) {
      const cashier = t.user.username || t.user.email || '-';
      const methods = [...new Set(t.payments.map((p) => p.method))].join(', ');
      if (t.status === 'VOIDED') {
        events.push({
          type: 'TRANSACTION_VOIDED',
          category: 'RETAIL_VOIDED',
          icon: 'x-circle',
          title: 'Transaksi Dibatalkan',
          description: `${t.transactionNumber} • ${formatRupiah(t.totalPrice)} • by ${t.voidedBy ?? 'Admin'}`,
          timestamp: (t.voidedAt ?? t.updatedAt).toISOString(),
        });
      } else {
        events.push({
          type: 'RETAIL_TRANSACTION',
          category: 'RETAIL',
          icon: 'receipt',
          title: `Transaksi #${t.transactionNumber}`,
          description: `${formatRupiah(t.totalPrice)} • ${methods || 'Cash'} • ${cashier}`,
          timestamp: t.createdAt.toISOString(),
        });
      }
    }

    // BRILink transactions
    for (const b of brilinkTrx) {
      events.push({
        type: 'BRILINK_TRANSACTION',
        category: 'BRILINK',
        icon: 'landmark',
        title: brilinkCategoryTitle(b.category),
        description: `${formatRupiah(b.amount)} • fee ${formatRupiah(b.fee)} • #${b.refNumber}`,
        timestamp: b.createdAt.toISOString(),
      });
    }

    // Stock histories
    for (const h of stockHistories) {
      const productName = h.stock?.product?.name ?? 'Produk';
      const change = Math.abs(h.quantityChange);
      switch (h.type) {
        case 'IN':
          events.push({
            type: 'STOCK_IN',
            category: 'INVENTORY',
            icon: 'package',
            title: 'Restok Masuk',
            description: `${change} unit ${productName}${h.reference ? ` • ref ${h.reference}` : ''}`,
            timestamp: h.createdAt.toISOString(),
          });
          break;
        case 'OUT':
          events.push({
            type: 'STOCK_OUT',
            category: 'INVENTORY',
            icon: 'package-minus',
            title: 'Stok Keluar',
            description: `${change} unit ${productName}${h.notes ? ` • ${h.notes}` : ''}`,
            timestamp: h.createdAt.toISOString(),
          });
          break;
        case 'OPNAME':
          events.push({
            type: 'STOCK_OPNAME',
            category: 'INVENTORY',
            icon: 'clipboard-check',
            title: 'Penyesuaian Opname',
            description: `${productName} • ${h.quantityChange >= 0 ? '+' : ''}${h.quantityChange} unit`,
            timestamp: h.createdAt.toISOString(),
          });
          break;
        case 'ADJUSTMENT':
          events.push({
            type: 'STOCK_ADJUSTMENT',
            category: 'INVENTORY',
            icon: 'edit',
            title: 'Penyesuaian Stok',
            description: `${productName} • ${h.quantityChange >= 0 ? '+' : ''}${h.quantityChange} unit`,
            timestamp: h.createdAt.toISOString(),
          });
          break;
      }
    }

    // Stock transfers received
    for (const tr of stockTransfersIn) {
      const totalQty = tr.items.reduce((sum, it) => sum + it.quantity, 0);
      events.push({
        type: 'STOCK_TRANSFER',
        category: 'INVENTORY',
        icon: 'arrow-right-left',
        title: 'Transfer Stok Diterima',
        description: `${totalQty} unit dari ${tr.fromShop.name}`,
        timestamp: (tr.receivedAt ?? tr.updatedAt).toISOString(),
      });
    }

    // Opname sessions completed
    for (const o of opnameSessions) {
      events.push({
        type: 'OPNAME_COMPLETED',
        category: 'INVENTORY',
        icon: 'check',
        title: 'Opname Selesai',
        description: `${o.sessionNumber} • ${o.totalSurplus} surplus, ${o.totalDeficit} kurang`,
        timestamp: (o.completedAt ?? o.updatedAt).toISOString(),
      });
    }

    // Sort DESC by timestamp & ambil top N
    events.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
    return events.slice(0, limit);
  }

  // ============================================
  // 6. PAYMENT BREAKDOWN
  // ============================================

  async getPaymentBreakdown(shopId: string, period: DashboardPeriod) {
    const { start, end } = this.getPeriodRange(period);

    const grouped = await this.prisma.payment.groupBy({
      by: ['method'],
      where: {
        shopId,
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
      _count: true,
    });

    const breakdown: Record<
      string,
      { amount: number; count: number; percent: number }
    > = {
      cash: { amount: 0, count: 0, percent: 0 },
      qris: { amount: 0, count: 0, percent: 0 },
      transfer: { amount: 0, count: 0, percent: 0 },
      hutang: { amount: 0, count: 0, percent: 0 },
    };

    for (const row of grouped) {
      const key = row.method.toLowerCase();
      if (key in breakdown) {
        breakdown[key].amount = row._sum.amount || 0;
        breakdown[key].count = row._count;
      }
    }

    const total = Object.values(breakdown).reduce(
      (sum, b) => sum + b.amount,
      0,
    );
    if (total > 0) {
      for (const k of Object.keys(breakdown)) {
        breakdown[k].percent = Math.round(
          (breakdown[k].amount / total) * 100 * 10,
        ) / 10;
      }
    }

    return breakdown;
  }

  // ============================================
  // 7. ALERTS
  // ============================================

  async getAlertConfig(shopId: string): Promise<AlertConfig> {
    const setting = await this.prisma.shopSetting.findUnique({
      where: { shopId },
      select: { alertConfig: true },
    });

    if (!setting?.alertConfig) return { ...DEFAULT_ALERT_CONFIG };

    const stored = setting.alertConfig as Partial<AlertConfig> | null;
    return {
      lowStockThreshold:
        stored?.lowStockThreshold ?? DEFAULT_ALERT_CONFIG.lowStockThreshold,
      shiftDurationWarningHours:
        stored?.shiftDurationWarningHours ??
        DEFAULT_ALERT_CONFIG.shiftDurationWarningHours,
      overdueDebtDaysBeforeNotice:
        stored?.overdueDebtDaysBeforeNotice ??
        DEFAULT_ALERT_CONFIG.overdueDebtDaysBeforeNotice,
    };
  }

  async updateAlertConfig(shopId: string, partial: Partial<AlertConfig>) {
    const current = await this.getAlertConfig(shopId);
    const next: AlertConfig = {
      lowStockThreshold:
        partial.lowStockThreshold ?? current.lowStockThreshold,
      shiftDurationWarningHours:
        partial.shiftDurationWarningHours ?? current.shiftDurationWarningHours,
      overdueDebtDaysBeforeNotice:
        partial.overdueDebtDaysBeforeNotice ??
        current.overdueDebtDaysBeforeNotice,
    };

    await this.prisma.shopSetting.upsert({
      where: { shopId },
      update: { alertConfig: next as any },
      create: {
        shopId,
        language: 'id',
        alertConfig: next as any,
      },
    });

    return next;
  }

  async getAlerts(shopId: string) {
    const config = await this.getAlertConfig(shopId);
    const now = new Date();

    // Cutoff buat hutang: dueDate <= today + overdueDebtDaysBeforeNotice
    const debtCutoff = new Date(now);
    debtCutoff.setUTCDate(
      debtCutoff.getUTCDate() + config.overdueDebtDaysBeforeNotice,
    );
    debtCutoff.setUTCHours(23, 59, 59, 999);

    // Cutoff buat shift over-threshold
    const shiftCutoff = new Date(
      now.getTime() - config.shiftDurationWarningHours * 60 * 60 * 1000,
    );

    const [overdueDebts, lowStockItems, longShifts] = await Promise.all([
      this.prisma.debt.findMany({
        where: {
          shopId,
          status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
          dueDate: { not: null, lte: debtCutoff },
        },
        select: {
          id: true,
          customerName: true,
          totalAmount: true,
          paidAmount: true,
          dueDate: true,
        },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.stock.findMany({
        where: {
          shopId,
          quantity: { lte: config.lowStockThreshold },
          product: { deletedAt: null },
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
        orderBy: { quantity: 'asc' },
      }),
      this.prisma.shift.findMany({
        where: {
          shopId,
          status: 'OPEN',
          startTime: { lte: shiftCutoff },
        },
        include: {
          user: { select: { username: true, email: true } },
        },
        orderBy: { startTime: 'asc' },
      }),
    ]);

    const debtTotal = overdueDebts.reduce(
      (sum, d) => sum + (d.totalAmount - d.paidAmount),
      0,
    );

    const debtItems = overdueDebts.slice(0, 5).map((d) => {
      const remainingAmount = d.totalAmount - d.paidAmount;
      const daysOverdue = d.dueDate
        ? Math.max(
            0,
            Math.floor(
              (now.getTime() - d.dueDate.getTime()) / (1000 * 60 * 60 * 24),
            ),
          )
        : 0;
      return {
        id: d.id,
        customerName: d.customerName,
        amount: remainingAmount,
        daysOverdue,
      };
    });

    const stockItems = lowStockItems.slice(0, 5).map((s) => ({
      productId: s.product.id,
      name: s.product.name,
      sku: s.product.sku,
      quantity: s.quantity,
      threshold: config.lowStockThreshold,
    }));

    const shiftItems = longShifts.map((s) => {
      const hours =
        Math.round(
          ((now.getTime() - s.startTime.getTime()) / (1000 * 60 * 60)) * 10,
        ) / 10;
      return {
        id: s.id,
        cashier: s.user.username || s.user.email || '-',
        hours,
        thresholdHours: config.shiftDurationWarningHours,
      };
    });

    const allClear =
      overdueDebts.length === 0 &&
      lowStockItems.length === 0 &&
      longShifts.length === 0;

    return {
      config,
      overdueDebts: {
        count: overdueDebts.length,
        totalAmount: debtTotal,
        topItems: debtItems,
      },
      lowStock: {
        count: lowStockItems.length,
        topItems: stockItems,
      },
      longRunningShifts: {
        count: longShifts.length,
        shifts: shiftItems,
      },
      allClear,
    };
  }

  // ============================================
  // 8. CASHIER LEADERBOARD
  // ============================================

  async getCashierLeaderboard(
    shopId: string,
    period: DashboardPeriod,
    limit: number,
  ) {
    const { start, end } = this.getPeriodRange(period);

    const results: Array<{
      userId: string;
      name: string | null;
      email: string | null;
      transactionCount: bigint | string;
      revenue: bigint | string;
    }> = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        u."id" as "userId",
        u."username" as name,
        u."email",
        COUNT(t."id")::bigint as "transactionCount",
        COALESCE(SUM(t."totalPrice"), 0)::bigint as revenue
      FROM "users" u
      LEFT JOIN "transactions" t
        ON t."userId" = u."id"
        AND t."shopId" = $1
        AND t."status" = 'COMPLETED'
        AND t."createdAt" >= $2
        AND t."createdAt" <= $3
      WHERE u."shopId" = $1
        AND u."role" IN ('KASIR', 'CASHIER_SUPERVISOR', 'ADMIN')
      GROUP BY u."id", u."username", u."email"
      HAVING COUNT(t."id") > 0
      ORDER BY revenue DESC
      LIMIT $4
      `,
      shopId,
      start,
      end,
      limit,
    );

    return {
      data: results.map((r) => ({
        userId: r.userId,
        name: r.name || r.email,
        transactionCount: Number(r.transactionCount),
        revenue: Number(r.revenue),
      })),
    };
  }
}

// ============================================
// MODULE-SCOPED HELPERS
// ============================================

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function brilinkCategoryTitle(category: string): string {
  switch (category) {
    case 'TRANSFER_BRI':
      return 'Transfer BRI';
    case 'TRANSFER_OTHER':
      return 'Transfer Antar Bank';
    case 'TARIK_TUNAI':
      return 'Tarik Tunai';
    case 'TOPUP_PULSA':
      return 'Top-up Pulsa';
    case 'TOPUP_DATA':
      return 'Top-up Paket Data';
    case 'TOPUP_EWALLET':
      return 'Top-up E-Wallet';
    case 'TOPUP_PLN':
      return 'Top-up Token PLN';
    default:
      return 'Transaksi BRILink';
  }
}
