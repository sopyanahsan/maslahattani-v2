import api from './api';

export interface CashBoxResponse {
  shopId: string;
  balance: number;
  lastAudit: string | null;
  lastAuditBalance: number | null;
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
  method: string;
  amount: number;
  status: string;
  reference: string | null;
  createdAt: string;
  transaction: { transactionNumber: string; status: string } | null;
}

export interface PaymentHistoryResponse {
  data: PaymentHistoryItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
  summary: Array<{ method: string; totalAmount: number; count: number }>;
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
    page?: number;
    limit?: number;
  }): Promise<PaymentHistoryResponse> {
    const { data } = await api.get<PaymentHistoryResponse>(
      '/payments/history',
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
