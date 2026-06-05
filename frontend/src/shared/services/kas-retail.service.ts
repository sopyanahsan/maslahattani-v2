import api from './api';

export interface CashBoxItem {
  id: string;
  shopId: string;
  categoryId: string | null;
  label: string;
  balance: number;
  code?: string;
  isDefault?: boolean;
  lastAudit: string | null;
  lastAuditBalance: number | null;
}

export interface CashBoxResponse {
  shopId: string;
  balance: number;
  lastAudit: string | null;
  lastAuditBalance: number | null;
  cashBoxes: CashBoxItem[];
}

export interface CashMutationPayload {
  shopId: string;
  type: 'CASH_IN' | 'CASH_OUT';
  amount: number;
  categoryId?: string;
  category?: string;
  notes?: string;
}

export interface PaymentHistoryItem {
  id: string;
  shopId: string;
  categoryId: string | null;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  category: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PaymentHistoryResponse {
  data: PaymentHistoryItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface KasSummaryResponse {
  cashBoxBalance: number;
  lastAudit: string | null;
  breakdown: {
    cash: number;
    qris: number;
    transfer: number;
    hutang: number;
    total: number;
  };
  totalTransactions: number;
}

const kasRetailService = {
  async getCashBox(shopId: string): Promise<CashBoxResponse> {
    const { data } = await api.get<CashBoxResponse>('/payments/cash-box', {
      params: { shopId },
    });
    return data;
  },

  async createMutation(payload: CashMutationPayload) {
    const { data } = await api.post('/payments/mutation', payload);
    return data;
  },

  async getHistory(params: {
    shopId: string;
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    cashBoxId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaymentHistoryResponse> {
    const { data } = await api.get<PaymentHistoryResponse>(
      '/payments/cash-mutations',
      { params },
    );
    return data;
  },

  async getSummary(
    shopId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<KasSummaryResponse> {
    const { data } = await api.get<KasSummaryResponse>('/payments/summary', {
      params: { shopId, startDate, endDate },
    });
    return data;
  },
};

export default kasRetailService;
