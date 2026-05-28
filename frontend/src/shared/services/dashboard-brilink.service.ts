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

export interface BrilinkOverviewResponse {
  kpi: {
    transactions: KpiMetric;
    volume: KpiMetric;
    feeEarnings: KpiMetric;
    avgFee: KpiMetric;
  };
}

export interface BrilinkTransactionsChartResponse {
  labels: string[];
  datasets: Record<string, number[]>;
}

export interface CategoryBreakdownItem {
  category: string;
  count: number;
  volume: number;
  feeEarnings: number;
  volumePercent: number;
  feePercent: number;
}

export interface CategoryBreakdownResponse {
  data: CategoryBreakdownItem[];
  totalVolume: number;
  totalFee: number;
}

export interface BrilinkRecentTransaction {
  id: string;
  refNumber: string;
  category: string;
  customerName: string;
  customerPhone: string | null;
  destination: string;
  amount: number;
  fee: number;
  total: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  cashier: string;
  createdAt: string;
}

export interface TopCustomerItem {
  customerName: string;
  customerPhone: string | null;
  transactionCount: number;
  totalVolume: number;
  lastTransaction: string | null;
}

export interface BrilinkAccountItem {
  id: string;
  label: string;
  accountNumber: string;
  accountHolder: string | null;
  balance: number;
  lowBalanceThreshold: number;
  isLowBalance: boolean;
  isDefault: boolean;
}

export interface BrilinkAlertsResponse {
  lowBalance: Array<{
    accountId: string;
    label: string;
    balance: number;
    threshold: number;
  }>;
  failedTransactions: {
    count: number;
    threshold: number;
    isTriggered: boolean;
  };
  categoriesWithoutFee: string[];
  allClear: boolean;
}

export interface CashierPerformanceItem {
  userId: string;
  name: string;
  transactionCount: number;
  totalFee: number;
  totalVolume: number;
}

// ============================================
// Service
// ============================================

const dashboardBrilinkService = {
  async getOverview(
    shopId: string,
    period: DashboardPeriod,
  ): Promise<BrilinkOverviewResponse> {
    const { data } = await api.get<BrilinkOverviewResponse>(
      '/dashboard/brilink/overview',
      { params: { shopId, period } },
    );
    return data;
  },

  async getTransactionsChart(
    shopId: string,
    period: DashboardPeriod,
  ): Promise<BrilinkTransactionsChartResponse> {
    const { data } = await api.get<BrilinkTransactionsChartResponse>(
      '/dashboard/brilink/transactions-chart',
      { params: { shopId, period } },
    );
    return data;
  },

  async getCategoryBreakdown(
    shopId: string,
    period: DashboardPeriod,
  ): Promise<CategoryBreakdownResponse> {
    const { data } = await api.get<CategoryBreakdownResponse>(
      '/dashboard/brilink/category-breakdown',
      { params: { shopId, period } },
    );
    return data;
  },

  async getRecentTransactions(
    shopId: string,
    limit = 10,
  ): Promise<{ data: BrilinkRecentTransaction[] }> {
    const { data } = await api.get<{ data: BrilinkRecentTransaction[] }>(
      '/dashboard/brilink/recent-transactions',
      { params: { shopId, limit } },
    );
    return data;
  },

  async getTopCustomers(
    shopId: string,
    limit = 5,
  ): Promise<{ data: TopCustomerItem[] }> {
    const { data } = await api.get<{ data: TopCustomerItem[] }>(
      '/dashboard/brilink/top-customers',
      { params: { shopId, limit } },
    );
    return data;
  },

  async getAccounts(shopId: string): Promise<{ data: BrilinkAccountItem[] }> {
    const { data } = await api.get<{ data: BrilinkAccountItem[] }>(
      '/dashboard/brilink/accounts',
      { params: { shopId } },
    );
    return data;
  },

  async getAlerts(shopId: string): Promise<BrilinkAlertsResponse> {
    const { data } = await api.get<BrilinkAlertsResponse>(
      '/dashboard/brilink/alerts',
      { params: { shopId } },
    );
    return data;
  },

  async getCashierPerformance(
    shopId: string,
    limit = 5,
  ): Promise<{ data: CashierPerformanceItem[] }> {
    const { data } = await api.get<{ data: CashierPerformanceItem[] }>(
      '/dashboard/brilink/cashier-performance',
      { params: { shopId, limit } },
    );
    return data;
  },
};

export default dashboardBrilinkService;
