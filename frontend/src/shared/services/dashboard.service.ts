import api from './api';

// ============================================
// Types
// ============================================

export type DashboardPeriod = 'today' | 'week' | 'month';

export interface KpiMetric {
  value: number;
  previousValue: number;
  changePercent: number;
}

export interface OverviewResponse {
  kpi: {
    revenue: KpiMetric;
    transactions: KpiMetric;
    profit: KpiMetric;
    aov: KpiMetric;
  };
}

export interface SalesChartResponse {
  labels: string[];
  revenue: number[];
  profit: number[];
}

export interface ActiveShift {
  id: string;
  cashierName: string;
  startTime: string;
  durationMinutes: number;
  isOverThreshold: boolean;
}

export interface LastOnlineCashier {
  userId: string;
  name: string;
  lastActiveAt: string | null;
}

export interface LastTransactionInfo {
  id: string;
  type: 'RETAIL' | 'BRILINK';
  transactionNumber: string;
  amount: number;
  createdAt: string;
}

export interface OperationsResponse {
  activeShifts: ActiveShift[];
  shiftStats: { open: number; closed: number; finalized: number };
  lastOnlineCashiers: LastOnlineCashier[];
  lastTransaction: LastTransactionInfo | null;
}

export interface TopProduct {
  productId: string;
  name: string;
  qty: number;
  revenue: number;
}

export interface RecentActivity {
  type: string;
  category:
    | 'RETAIL'
    | 'RETAIL_VOIDED'
    | 'BRILINK'
    | 'INVENTORY'
    | 'FINANCE';
  icon: string;
  title: string;
  description: string;
  timestamp: string;
}

export interface PaymentBreakdownItem {
  amount: number;
  count: number;
  percent: number;
}

export interface PaymentBreakdownResponse {
  cash: PaymentBreakdownItem;
  qris: PaymentBreakdownItem;
  transfer: PaymentBreakdownItem;
  hutang: PaymentBreakdownItem;
}

export interface AlertConfig {
  lowStockThreshold: number;
  shiftDurationWarningHours: number;
  overdueDebtDaysBeforeNotice: number;
}

export interface AlertsResponse {
  config: AlertConfig;
  overdueDebts: {
    count: number;
    totalAmount: number;
    topItems: Array<{
      id: string;
      customerName: string;
      amount: number;
      daysOverdue: number;
    }>;
  };
  lowStock: {
    count: number;
    topItems: Array<{
      productId: string;
      name: string;
      sku: string;
      quantity: number;
      threshold: number;
    }>;
  };
  longRunningShifts: {
    count: number;
    shifts: Array<{
      id: string;
      cashier: string;
      hours: number;
      thresholdHours: number;
    }>;
  };
  allClear: boolean;
}

export interface CashierLeaderboardItem {
  userId: string;
  name: string;
  transactionCount: number;
  revenue: number;
}

// ============================================
// Service
// ============================================

const dashboardService = {
  async getOverview(
    shopId: string,
    period: DashboardPeriod,
  ): Promise<OverviewResponse> {
    const { data } = await api.get<OverviewResponse>(
      '/dashboard/retail/overview',
      { params: { shopId, period } },
    );
    return data;
  },

  async getSalesChart(
    shopId: string,
    period: DashboardPeriod,
  ): Promise<SalesChartResponse> {
    const { data } = await api.get<SalesChartResponse>(
      '/dashboard/retail/sales-chart',
      { params: { shopId, period } },
    );
    return data;
  },

  async getOperations(shopId: string): Promise<OperationsResponse> {
    const { data } = await api.get<OperationsResponse>(
      '/dashboard/retail/operations',
      { params: { shopId } },
    );
    return data;
  },

  async getTopProducts(
    shopId: string,
    period: DashboardPeriod,
    limit = 5,
  ): Promise<{ data: TopProduct[] }> {
    const { data } = await api.get<{ data: TopProduct[] }>(
      '/dashboard/retail/top-products',
      { params: { shopId, period, limit } },
    );
    return data;
  },

  async getRecentActivity(
    shopId: string,
    limit = 10,
  ): Promise<{ data: RecentActivity[] }> {
    const { data } = await api.get<{ data: RecentActivity[] }>(
      '/dashboard/retail/recent-activity',
      { params: { shopId, limit } },
    );
    return data;
  },

  async getPaymentBreakdown(
    shopId: string,
    period: DashboardPeriod,
  ): Promise<PaymentBreakdownResponse> {
    const { data } = await api.get<PaymentBreakdownResponse>(
      '/dashboard/retail/payment-breakdown',
      { params: { shopId, period } },
    );
    return data;
  },

  async getAlerts(shopId: string): Promise<AlertsResponse> {
    const { data } = await api.get<AlertsResponse>(
      '/dashboard/retail/alerts',
      { params: { shopId } },
    );
    return data;
  },

  async getCashierLeaderboard(
    shopId: string,
    period: DashboardPeriod,
    limit = 5,
  ): Promise<{ data: CashierLeaderboardItem[] }> {
    const { data } = await api.get<{ data: CashierLeaderboardItem[] }>(
      '/dashboard/retail/cashier-leaderboard',
      { params: { shopId, period, limit } },
    );
    return data;
  },

  // ============================================
  // Alert config (settings tab)
  // ============================================

  async getAlertConfig(shopId: string): Promise<AlertConfig> {
    const { data } = await api.get<AlertConfig>('/settings/alerts', {
      params: { shopId },
    });
    return data;
  },

  async updateAlertConfig(
    shopId: string,
    payload: Partial<AlertConfig>,
  ): Promise<AlertConfig> {
    const { data } = await api.patch<AlertConfig>(
      '/settings/alerts',
      payload,
      { params: { shopId } },
    );
    return data;
  },
};

export default dashboardService;
