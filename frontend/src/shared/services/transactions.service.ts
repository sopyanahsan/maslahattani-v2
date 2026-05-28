import api from './api';

// ============================================
// Types (match backend response shapes)
// ============================================

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'VOIDED' | 'PROCESSING';
export type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER' | 'HUTANG';

export interface TransactionPaymentDto {
  id: string;
  method: PaymentMethod;
  amount: number;
  status: string;
  reference?: string | null;
  createdAt: string;
}

export interface TransactionItemDto {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  product: { name: string; sku: string; price?: number };
}

export interface TransactionUserDto {
  id: string;
  email: string;
  username?: string | null;
}

export interface TransactionDto {
  id: string;
  shopId: string;
  userId: string;
  transactionNumber: string;
  totalPrice: number;
  totalCost: number;
  totalDiscount: number;
  status: TransactionStatus;
  idempotencyKey?: string | null;
  clientCreatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string | null;
  voidedBy?: string | null;
  voidReason?: string | null;
  items: TransactionItemDto[];
  payments: TransactionPaymentDto[];
  user?: TransactionUserDto;
}

// ============================================
// Request payloads
// ============================================

export interface QueryTransactionParams {
  shopId?: string;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
  userId?: string;
  search?: string;
  paymentMethod?: PaymentMethod;
  page?: number;
  limit?: number;
}

export interface VoidTransactionPayload {
  otp: string;
  reason: string;
}

// ============================================
// Response shapes
// ============================================

export interface TransactionListResponse {
  data: TransactionDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TransactionStatsResponse {
  omzet: number;
  modal: number;
  profit: number;
  diskon: number;
  totalTransaksi: number;
  totalVoid: number;
  totalHutang: number;
  jumlahHutang: number;
}

export interface VoidTransactionResponse {
  success: boolean;
  message: string;
  transaction: TransactionDto;
}

// ============================================
// Service functions
// ============================================

const transactionsService = {
  async list(params?: QueryTransactionParams): Promise<TransactionListResponse> {
    const { data } = await api.get<TransactionListResponse>('/transactions', { params });
    return data;
  },

  async getDetail(id: string): Promise<TransactionDto> {
    const { data } = await api.get<TransactionDto>(`/transactions/${id}`);
    return data;
  },

  async getStats(
    shopId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<TransactionStatsResponse> {
    const { data } = await api.get<TransactionStatsResponse>('/transactions/stats', {
      params: { shopId, startDate, endDate },
    });
    return data;
  },

  async voidTransaction(
    id: string,
    payload: VoidTransactionPayload,
  ): Promise<VoidTransactionResponse> {
    const { data } = await api.post<VoidTransactionResponse>(
      `/transactions/${id}/void`,
      payload,
    );
    return data;
  },
};

export default transactionsService;
