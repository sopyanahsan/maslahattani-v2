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

export interface BrilinkReportSummary {
  totalTransactions: number;
  volume: number;
  feeEarnings: number;
  avgFee: number;
}

export interface BrilinkCategoryBreakdownItem {
  category: string;
  count: number;
  volume: number;
  fee: number;
}

export interface BrilinkReportResponse {
  summary: BrilinkReportSummary;
  categoryBreakdown: BrilinkCategoryBreakdownItem[];
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

  async getBrilinkReport(
    shopId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<BrilinkReportResponse> {
    const { data } = await api.get<BrilinkReportResponse>('/reports/brilink', {
      params: { shopId, startDate, endDate },
    });
    return data;
  },
};

// ============================================
// CSV Export Utility
// ============================================

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        const str = String(cell);
        // Escape commas and quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default reportsService;
