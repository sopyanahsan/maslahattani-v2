import api from './api';

// ============================================
// Types (match backend response shapes)
// ============================================

export type CashMutationType = 'CASH_IN' | 'CASH_OUT';

export interface PaymentHistoryDto {
  id: string;
  shopId: string;
  transactionId: string;
  method: 'CASH' | 'QRIS' | 'TRANSFER' | 'HUTANG';
  amount: number;
  status: string;
  reference?: string | null;
  createdAt: string;
  transaction?: { transactionNumber: string; status: string };
}

export interface CashBoxDto {
  shopId: string;
  balance: number;
  lastAudit?: string | null;
  lastAuditBalance?: number | null;
}

export interface KasSummary {
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

export interface PaymentMethodSummary {
  method: string;
  totalAmount: number;
  count: number;
}

// ============================================
// Request payloads
// ============================================

export interface CashMutationPayload {
  shopId: string;
  type: CashMutationType;
  amount: number;
  category: string;
  notes?: string;
}

export interface AuditCashPayload {
  shopId: string;
  actualBalance: number;
  notes?: string;
}

export interface QueryPaymentHistoryParams {
  shopId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ============================================
// Response shapes
// ============================================

export interface CashMutationResponse {
  success: boolean;
  message: string;
  mutation: {
    type: string;
    amount: number;
    category: string;
    notes?: string;
    balanceBefore: number;
    balanceAfter: number;
  };
}

export interface AuditCashResponse {
  success: boolean;
  message: string;
  audit: {
    systemBalance: number;
    actualBalance: number;
    variance: number;
    status: 'MATCH' | 'SURPLUS' | 'SELISIH';
    auditedAt: string;
    notes?: string;
  };
}

export interface PaymentHistoryResponse {
  data: PaymentHistoryDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: PaymentMethodSummary[];
}

// ============================================
// Service functions
// ============================================

const paymentsService = {
  async getCashBox(shopId: string): Promise<CashBoxDto> {
    const { data } = await api.get<CashBoxDto>('/payments/cash-box', {
      params: { shopId },
    });
    return data;
  },

  async createMutation(payload: CashMutationPayload): Promise<CashMutationResponse> {
    const { data } = await api.post<CashMutationResponse>('/payments/mutation', payload);
    return data;
  },

  async auditCash(payload: AuditCashPayload): Promise<AuditCashResponse> {
    const { data } = await api.post<AuditCashResponse>('/payments/audit', payload);
    return data;
  },

  async getHistory(params?: QueryPaymentHistoryParams): Promise<PaymentHistoryResponse> {
    const { data } = await api.get<PaymentHistoryResponse>('/payments/history', { params });
    return data;
  },

  async getSummary(
    shopId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<KasSummary> {
    const { data } = await api.get<KasSummary>('/payments/summary', {
      params: { shopId, startDate, endDate },
    });
    return data;
  },
};

export default paymentsService;
