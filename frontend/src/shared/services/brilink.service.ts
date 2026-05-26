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
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  shopId: string;
  cashierId: string;
  cashierName?: string;
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
  feeType: 'FLAT' | 'PERCENT';
  feeAmount: number;
  feePercent: number;
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

export interface CreateBrilinkTransactionPayload {
  category: BrilinkCategory;
  customerName: string;
  customerPhone?: string;
  destination: string;
  amount: number;
}

export interface CreateBrilinkFeePayload {
  shopId: string;
  category: BrilinkCategory;
  label: string;
  minAmount: number;
  maxAmount: number;
  feeType: 'FLAT' | 'PERCENT';
  feeAmount: number;
  feePercent: number;
}

export interface UpdateBrilinkFeePayload {
  label?: string;
  minAmount?: number;
  maxAmount?: number;
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
   * Create a new BRILink transaction
   */
  async createTransaction(payload: CreateBrilinkTransactionPayload) {
    const { data } = await api.post('/brilink/transactions', payload);
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
