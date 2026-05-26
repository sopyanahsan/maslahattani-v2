import api from './api';

// ============================================
// Types
// ============================================

export type AnalyticsPeriod = 'today' | 'week' | 'month' | 'year';

export interface AnalyticsOverview {
  totalRevenue: number;
  totalProfit: number;
  totalTransactions: number;
  avgTransactionValue: number;
  totalBrilink: number;
  totalBrilinkFee: number;
  activeDebts: number;
  debtAmount: number;
}

export interface RevenueChartData {
  labels: string[];
  datasets: {
    revenue: number[];
    profit: number[];
    transactions: number[];
  };
}

export interface TopProduct {
  productId: string;
  name: string;
  sku: string;
  totalSold: number;
  totalRevenue: number;
  totalProfit: number;
}

export interface PaymentBreakdown {
  cash: number;
  qris: number;
  transfer: number;
  hutang: number;
  total: number;
}

export interface HourlyData {
  hour: number;
  avgTransactions: number;
}

export interface ComparisonPeriod {
  revenue: number;
  profit: number;
  transactions: number;
}

export interface ComparisonData {
  current: ComparisonPeriod;
  previous: ComparisonPeriod;
  growth: {
    revenue: number;
    profit: number;
    transactions: number;
  };
}

// ============================================
// Service
// ============================================

const analyticsService = {
  /**
   * Get overview KPIs for a shop within a period
   */
  async getOverview(shopId: string, period: AnalyticsPeriod): Promise<AnalyticsOverview> {
    const { data } = await api.get<AnalyticsOverview>('/analytics/overview', {
      params: { shopId, period },
    });
    return data;
  },

  /**
   * Get revenue chart data grouped by day/month
   */
  async getRevenueChart(shopId: string, period: AnalyticsPeriod): Promise<RevenueChartData> {
    const { data } = await api.get<RevenueChartData>('/analytics/revenue-chart', {
      params: { shopId, period },
    });
    return data;
  },

  /**
   * Get top products ranked by revenue
   */
  async getTopProducts(
    shopId: string,
    period: AnalyticsPeriod,
    limit: number = 10,
  ): Promise<TopProduct[]> {
    const { data } = await api.get<TopProduct[]>('/analytics/top-products', {
      params: { shopId, period, limit },
    });
    return data;
  },

  /**
   * Get payment method breakdown
   */
  async getPaymentBreakdown(
    shopId: string,
    period: AnalyticsPeriod,
  ): Promise<PaymentBreakdown> {
    const { data } = await api.get<PaymentBreakdown>('/analytics/payment-breakdown', {
      params: { shopId, period },
    });
    return data;
  },

  /**
   * Get hourly transaction distribution (avg per hour)
   */
  async getHourlyDistribution(
    shopId: string,
    period: AnalyticsPeriod,
  ): Promise<HourlyData[]> {
    const { data } = await api.get<HourlyData[]>('/analytics/hourly-distribution', {
      params: { shopId, period },
    });
    return data;
  },

  /**
   * Get month-over-month comparison with growth percentages
   */
  async getComparison(shopId: string): Promise<ComparisonData> {
    const { data } = await api.get<ComparisonData>('/analytics/comparison', {
      params: { shopId },
    });
    return data;
  },
};

export default analyticsService;
