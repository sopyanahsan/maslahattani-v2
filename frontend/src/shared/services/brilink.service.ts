import api from './api';

// ============================================================
// Enums / Constants
// ============================================================

export const BRILINK_CATEGORIES = [
  'TRANSFER_BRI',
  'TRANSFER_OTHER',
  'TARIK_TUNAI',
  'TOPUP_PULSA',
  'TOPUP_DATA',
  'TOPUP_EWALLET',
  'TOPUP_PLN',
] as const;

export type BrilinkCategory = (typeof BRILINK_CATEGORIES)[number];

export const BRILINK_CATEGORY_LABELS: Record<BrilinkCategory, string> = {
  TRANSFER_BRI: 'Transfer BRI',
  TRANSFER_OTHER: 'Transfer Bank Lain',
  TARIK_TUNAI: 'Tarik Tunai',
  TOPUP_PULSA: 'Top Up Pulsa',
  TOPUP_DATA: 'Paket Data',
  TOPUP_EWALLET: 'E-Wallet',
  TOPUP_PLN: 'Token PLN',
};

export type BrilinkTransactionStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED';
export type BrilinkMutationType = 'CREDIT' | 'DEBIT';
export type BrilinkFeeType = 'FLAT' | 'PERCENT';

// ============================================================
// DTO Types — match backend response shapes
// ============================================================

export interface BrilinkTransactionDto {
  id: string;
  shopId: string;
  accountId: string | null;
  refNumber: string;
  category: BrilinkCategory;
  customerName: string;
  destination: string;
  amount: number;
  fee: number;
  total: number;
  status: BrilinkTransactionStatus;
  notes: string | null;
  processedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrilinkAccountDto {
  id: string;
  shopId: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  balance: number;
  isActive: boolean;
  isPrimary: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrilinkMutationDto {
  id: string;
  accountId: string;
  shopId: string;
  type: BrilinkMutationType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  reference: string | null;
  createdAt: string;
}

export interface BrilinkFeeDto {
  id: string;
  shopId: string;
  category: BrilinkCategory;
  label: string;
  minAmount: number;
  maxAmount: number;
  feeType: BrilinkFeeType;
  feeAmount: number;
  feePercent: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Dashboard Types
// ============================================================

export interface BrilinkKpiItem {
  value: number;
  delta: string;
  deltaPositive: boolean;
  label: string;
}

export interface BrilinkBalanceKpi {
  value: number;
  label: string;
  accountNumber: string | null;
}

export interface BrilinkCategoryBreakdown {
  category: BrilinkCategory;
  volume: number;
  fee: number;
  count: number;
}

export interface BrilinkDailyTrendItem {
  date: string;
  volume: number;
  fee: number;
  count: number;
}

export interface BrilinkDashboardResponse {
  kpi: {
    volume: BrilinkKpiItem;
    fee: BrilinkKpiItem;
    count: BrilinkKpiItem;
    balance: BrilinkBalanceKpi;
  };
  categoryBreakdown: BrilinkCategoryBreakdown[];
  dailyTrend: BrilinkDailyTrendItem[];
  recentTransactions: BrilinkTransactionDto[];
  primaryAccount: BrilinkAccountDto | null;
  period: string;
}

// ============================================================
// Stats Types
// ============================================================

export interface BrilinkStats {
  totalVolume: number;
  totalFee: number;
  totalTransactions: number;
  byCategory: BrilinkCategoryBreakdown[];
}

// ============================================================
// List Response
// ============================================================

export interface BrilinkListResponse {
  data: BrilinkTransactionDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BrilinkMutationListResponse {
  data: BrilinkMutationDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================================
// Payload Types
// ============================================================

export interface CreateBrilinkTransactionPayload {
  shopId: string;
  accountId?: string;
  category: BrilinkCategory;
  customerName: string;
  destination: string;
  amount: number;
  fee?: number;
  notes?: string;
  processedBy?: string;
}

export interface CreateBrilinkAccountPayload {
  shopId: string;
  accountNumber: string;
  accountName: string;
  bankName?: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface UpdateBrilinkAccountPayload {
  accountName?: string;
  bankName?: string;
  isActive?: boolean;
  isPrimary?: boolean;
  notes?: string;
}

export interface CreateBrilinkFeePayload {
  shopId: string;
  category: BrilinkCategory;
  label: string;
  minAmount?: number;
  maxAmount?: number;
  feeType: BrilinkFeeType;
  feeAmount?: number;
  feePercent?: number;
}

export interface UpdateBrilinkFeePayload {
  label?: string;
  minAmount?: number;
  maxAmount?: number;
  feeType?: BrilinkFeeType;
  feeAmount?: number;
  feePercent?: number;
  isActive?: boolean;
}

export interface ListTransactionsParams {
  shopId?: string;
  category?: BrilinkCategory;
  status?: BrilinkTransactionStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================
// Service
// ============================================================

const brilinkService = {
  // ----------------------------------------------------------
  // Dashboard
  // ----------------------------------------------------------

  async getDashboard(shopId: string, period: string = 'month'): Promise<BrilinkDashboardResponse> {
    const { data } = await api.get<BrilinkDashboardResponse>('/brilink/dashboard', {
      params: { shopId, period },
    });
    return data;
  },

  // ----------------------------------------------------------
  // Transactions
  // ----------------------------------------------------------

  async listTransactions(params: ListTransactionsParams): Promise<BrilinkListResponse> {
    const { data } = await api.get<BrilinkListResponse>('/brilink/transactions', {
      params,
    });
    return data;
  },

  async createTransaction(payload: CreateBrilinkTransactionPayload): Promise<BrilinkTransactionDto> {
    const { data } = await api.post<BrilinkTransactionDto>('/brilink/transactions', payload);
    return data;
  },

  async getStats(shopId: string): Promise<BrilinkStats> {
    const { data } = await api.get<BrilinkStats>('/brilink/stats', {
      params: { shopId },
    });
    return data;
  },

  async calculateFee(
    shopId: string,
    category: BrilinkCategory,
    amount: number,
  ): Promise<{ fee: number; feeRule: BrilinkFeeDto | null }> {
    const { data } = await api.get('/brilink/fee/calculate', {
      params: { shopId, category, amount },
    });
    return data;
  },

  // ----------------------------------------------------------
  // Accounts
  // ----------------------------------------------------------

  async listAccounts(shopId: string): Promise<BrilinkAccountDto[]> {
    const { data } = await api.get<BrilinkAccountDto[]>('/brilink/accounts', {
      params: { shopId },
    });
    return data;
  },

  async createAccount(payload: CreateBrilinkAccountPayload): Promise<BrilinkAccountDto> {
    const { data } = await api.post<BrilinkAccountDto>('/brilink/accounts', payload);
    return data;
  },

  async updateAccount(id: string, payload: UpdateBrilinkAccountPayload): Promise<BrilinkAccountDto> {
    const { data } = await api.put<BrilinkAccountDto>(`/brilink/accounts/${id}`, payload);
    return data;
  },

  async deleteAccount(id: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/brilink/accounts/${id}`);
    return data;
  },

  async listMutations(
    accountId: string,
    page = 1,
    limit = 20,
  ): Promise<BrilinkMutationListResponse> {
    const { data } = await api.get<BrilinkMutationListResponse>(
      `/brilink/accounts/${accountId}/mutations`,
      { params: { page, limit } },
    );
    return data;
  },

  // ----------------------------------------------------------
  // Fees
  // ----------------------------------------------------------

  async listFees(shopId: string): Promise<BrilinkFeeDto[]> {
    const { data } = await api.get<BrilinkFeeDto[]>('/brilink/fees', {
      params: { shopId },
    });
    return data;
  },

  async createFee(payload: CreateBrilinkFeePayload): Promise<BrilinkFeeDto> {
    const { data } = await api.post<BrilinkFeeDto>('/brilink/fees', payload);
    return data;
  },

  async updateFee(id: string, payload: UpdateBrilinkFeePayload): Promise<BrilinkFeeDto> {
    const { data } = await api.put<BrilinkFeeDto>(`/brilink/fees/${id}`, payload);
    return data;
  },

  async deleteFee(id: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/brilink/fees/${id}`);
    return data;
  },
};

export default brilinkService;
