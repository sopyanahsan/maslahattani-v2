import api from './api';

// ============================================
// Types
// ============================================

export type BrilinkCategory =
  | 'TRANSFER_BRI'
  | 'TRANSFER_OTHER'
  | 'TARIK_TUNAI'
  | 'TOPUP_PULSA'
  | 'TOPUP_DATA'
  | 'TOPUP_EWALLET'
  | 'TOPUP_PLN';

export const BRILINK_CATEGORIES: BrilinkCategory[] = [
  'TRANSFER_BRI',
  'TRANSFER_OTHER',
  'TARIK_TUNAI',
  'TOPUP_PULSA',
  'TOPUP_DATA',
  'TOPUP_EWALLET',
  'TOPUP_PLN',
];

export const BRILINK_CATEGORY_LABELS: Record<BrilinkCategory, string> = {
  TRANSFER_BRI: 'Transfer BRI',
  TRANSFER_OTHER: 'Transfer Antar Bank',
  TARIK_TUNAI: 'Tarik Tunai',
  TOPUP_PULSA: 'Pulsa',
  TOPUP_DATA: 'Paket Data',
  TOPUP_EWALLET: 'E-Wallet',
  TOPUP_PLN: 'Token PLN',
};

export interface BrilinkTransactionDto {
  id: string;
  refNumber: string;
  category: BrilinkCategory;
  customerName: string;
  customerPhone?: string;
  destination: string;
  amount: number;
  fee: number;
  total: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'VOIDED';
  flowDirection?: 'DEBIT' | 'CREDIT' | null;
  accountImpact?: number;
  cashImpact?: number;
  shopId: string;
  cashierId: string;
  cashierName?: string;
  accountId?: string | null;
  accountLabel?: string | null;
  accountNumber?: string | null;
  feeMethod?: 'DALAM' | 'LUAR' | 'POTONG' | null;
  voidedAt?: string | null;
  voidReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrilinkListResponse {
  data: BrilinkTransactionDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BrilinkFeeDto {
  id: string;
  shopId: string;
  category: BrilinkCategory;
  label: string;
  minAmount: number;
  maxAmount: number;
  systemFee: number; // biaya sistem/bank (potongan EDC, bukan profit)
  feeType: 'FLAT' | 'PERCENT';
  feeAmount: number; // admin fee flat (rupiah) — profit agen
  feePercent: number; // admin fee percent — profit agen
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrilinkStats {
  totalTransactions: number;
  totalAmount: number;
  totalFee: number;
  byCategory: {
    category: BrilinkCategory;
    count: number;
    amount: number;
    fee: number;
  }[];
  todayTransactions: number;
  todayAmount: number;
  todayFee: number;
}

export type BrilinkStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'VOIDED';

export const BRILINK_STATUS_LABELS: Record<BrilinkStatus, string> = {
  SUCCESS: 'Sukses',
  FAILED: 'Gagal',
  PENDING: 'Pending',
  VOIDED: 'Void',
};

export interface BrilinkKpiResponse {
  transactions: { current: number; target: number; percent: number };
  volume: { current: number; target: number; percent: number };
  fee: { current: number; target: number; percent: number };
  achievement: number;
}

export type BrilinkChartPeriod = 'today' | '7d' | '1m' | '3m' | 'custom';
export type BrilinkChartType = 'transactions' | 'profit';

export interface BrilinkTransactionsChartData {
  labels: string[];
  datasets: Record<string, number[]>;
  bucketType: string;
}

export interface BrilinkProfitChartData {
  labels: string[];
  data: number[];
  bucketType: string;
}

export interface VoidTransactionResponse {
  transaction: {
    id: string;
    refNumber: string;
    status: string;
    voidedAt: string;
    voidReason: string;
  };
  reversals: {
    accountMutation: { type: string; amount: number; balanceAfter: number } | null;
    cashMutation: { type: string; amount: number; balanceAfter: number } | null;
  };
}

export interface CreateBrilinkTransactionPayload {
  category: BrilinkCategory;
  customerName: string;
  customerPhone?: string;
  destination: string;
  amount: number;
  accountId: string;
  idempotencyKey?: string;
  clientCreatedAt?: string;
}

export interface BrilinkTransactionAccountInfo {
  id: string;
  label: string;
  balance: number;
  lowBalanceThreshold: number;
  isLowBalance: boolean;
}

export interface CreateBrilinkTransactionResult {
  id: string;
  deduplicated?: boolean;
  summary: {
    refNumber: string;
    category: BrilinkCategory;
    customerName: string;
    destination: string;
    amount: number;
    fee: number;
    total: number;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    flowDirection?: string;
  };
  account: BrilinkTransactionAccountInfo | null;
  impact?: {
    account: { id: string; label: string; impact: number; balanceAfter: number };
    cashBox: { impact: number; balanceAfter: number };
  };
}

export interface CreateBrilinkFeePayload {
  shopId: string;
  category: BrilinkCategory;
  label: string;
  minAmount: number;
  maxAmount: number;
  systemFee?: number;
  feeType: 'FLAT' | 'PERCENT';
  feeAmount: number;
  feePercent: number;
  isActive?: boolean;
}

export interface UpdateBrilinkFeePayload {
  category?: BrilinkCategory;
  label?: string;
  minAmount?: number;
  maxAmount?: number;
  systemFee?: number;
  feeType?: 'FLAT' | 'PERCENT';
  feeAmount?: number;
  feePercent?: number;
  isActive?: boolean;
}

// ============================================
// Service
// ============================================

interface ListTransactionsParams {
  shopId?: string;
  category?: BrilinkCategory;
  status?: BrilinkStatus;
  cashierId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

const brilinkService = {
  /**
   * List BRILink transactions with optional filters
   */
  async listTransactions(params: ListTransactionsParams): Promise<BrilinkListResponse> {
    const { data } = await api.get<BrilinkListResponse>('/brilink/transactions', { params });
    return data;
  },

  /**
   * KPI cards: today's count/volume/fee vs target
   */
  async getKpi(shopId: string): Promise<BrilinkKpiResponse> {
    const { data } = await api.get<BrilinkKpiResponse>('/brilink/transactions/kpi', {
      params: { shopId },
    });
    return data;
  },

  /**
   * Chart data: transactions (stacked per category) or profit (line)
   */
  async getChart(params: {
    shopId: string;
    period: BrilinkChartPeriod;
    type: BrilinkChartType;
    startDate?: string;
    endDate?: string;
  }): Promise<BrilinkTransactionsChartData | BrilinkProfitChartData> {
    const { data } = await api.get('/brilink/transactions/chart', { params });
    return data;
  },

  /**
   * Create a new BRILink transaction
   */
  async createTransaction(
    payload: CreateBrilinkTransactionPayload,
  ): Promise<CreateBrilinkTransactionResult> {
    const { data } = await api.post<CreateBrilinkTransactionResult>(
      '/brilink/transactions',
      payload,
    );
    return data;
  },

  /**
   * Void a transaction (reverse rekening + kas tunai)
   */
  async voidTransaction(id: string, reason: string): Promise<VoidTransactionResponse> {
    const { data } = await api.post<VoidTransactionResponse>(
      `/brilink/transactions/${id}/void`,
      { reason },
    );
    return data;
  },

  /**
   * Get BRILink stats for a shop
   */
  async getStats(shopId: string): Promise<BrilinkStats> {
    const { data } = await api.get<BrilinkStats>(`/brilink/stats`, { params: { shopId } });
    return data;
  },

  /**
   * List fee rules for a shop
   */
  async listFees(shopId: string): Promise<BrilinkFeeDto[]> {
    const { data } = await api.get<BrilinkFeeDto[]>('/brilink/fees', { params: { shopId } });
    return data;
  },

  /**
   * Create a new fee rule
   */
  async createFee(payload: CreateBrilinkFeePayload): Promise<BrilinkFeeDto> {
    const { data } = await api.post<BrilinkFeeDto>('/brilink/fees', payload);
    return data;
  },

  /**
   * Update a fee rule
   */
  async updateFee(id: string, payload: UpdateBrilinkFeePayload): Promise<BrilinkFeeDto> {
    const { data } = await api.patch<BrilinkFeeDto>(`/brilink/fees/${id}`, payload);
    return data;
  },

  /**
   * Delete a fee rule
   */
  async deleteFee(id: string): Promise<void> {
    await api.delete(`/brilink/fees/${id}`);
  },
};

export default brilinkService;
