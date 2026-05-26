import api from './api';

// ============================================
// Types (match backend response shapes)
// ============================================

export interface SalesReportSummary {
  omzet: number;
  modal: number;
  profit: number;
  diskon: number;
  totalTransactions: number;
  totalVoided: number;
  marginPercent: number;
}

export interface MethodBreakdownItem {
  method: string;
  totalAmount: number;
  count: number;
}

export interface TopProductItem {
  productId: string;
  productName: string;
  sku: string;
  totalQty: number;
  totalRevenue: number;
}

export interface DailyTrendItem {
  date: string;
  omzet: number;
  profit: number;
  transactions: number;
}

export interface SalesReportResponse {
  summary: SalesReportSummary;
  methodBreakdown: MethodBreakdownItem[];
  topProducts: TopProductItem[];
  dailyTrend: DailyTrendItem[];
}

export interface DebtReportSummary {
  totalOutstanding: number;
  overdueCount: number;
  totalDebtors: number;
  totalDebts: number;
}

export interface RecentDebtPayment {
  id: string;
  customerName: string;
  amount: number;
  method: string;
  createdAt: string;
}

export interface DebtReportResponse {
  summary: DebtReportSummary;
  recentPayments: RecentDebtPayment[];
}

// ============================================
// Service functions
// ============================================

const reportsService = {
  async getSalesReport(
    shopId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<SalesReportResponse> {
    const { data } = await api.get<SalesReportResponse>('/reports/sales', {
      params: { shopId, startDate, endDate },
    });
    return data;
  },

  async getDebtReport(shopId: string): Promise<DebtReportResponse> {
    const { data } = await api.get<DebtReportResponse>('/reports/debts', {
      params: { shopId },
    });
    return data;
  },
};

export default reportsService;
