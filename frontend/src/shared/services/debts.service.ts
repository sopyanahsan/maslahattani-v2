import api from './api';

// ============================================
// Types (match backend response shapes)
// ============================================

export type DebtStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER' | 'HUTANG';

export interface DebtPaymentDto {
  id: string;
  debtId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface ManualDebtItem {
  name: string;
  qty: number;
  price: number;
}

export interface DebtTransactionInfo {
  transactionNumber: string;
  totalPrice?: number;
  items?: Array<{
    product: { name: string; sku?: string };
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

export interface DebtDto {
  id: string;
  shopId: string;
  transactionId?: string | null;
  productId?: string | null;
  manualItems?: ManualDebtItem[] | null;
  customerName: string;
  customerPhone?: string | null;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paidAmount: number;
  status: DebtStatus;
  dueDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  product?: { name: string; sku: string; price?: number } | null;
  transaction?: DebtTransactionInfo | null;
  debtPayments?: DebtPaymentDto[];
}

// ============================================
// Request payloads
// ============================================

export interface CreateDebtPayload {
  shopId: string;
  customerName: string;
  customerPhone?: string;
  // Mode 1: Manual items (multi-item)
  manualItems?: ManualDebtItem[];
  // Mode 2: Single product (legacy)
  productId?: string;
  quantity?: number;
  // Mode 3: From POS transaction
  transactionId?: string;
  totalAmount?: number;
  // Common
  downPayment?: number;
  dueDate?: string;
  notes?: string;
}

export interface PayDebtPayload {
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface QueryDebtParams {
  shopId?: string;
  status?: DebtStatus;
  customerName?: string;
  sortBy?: 'newest' | 'due_date' | 'remaining_desc';
  dueDateFrom?: string;
  dueDateTo?: string;
  page?: number;
  limit?: number;
}

// ============================================
// Response shapes
// ============================================

export interface DebtListResponse {
  data: DebtDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    totalDebtors: number;
    totalOutstanding: number;
    overdue: number;
  };
}

export interface CreateDebtResponse {
  success: boolean;
  message: string;
  debt: DebtDto;
  summary: {
    totalAmount: number;
    downPayment: number;
    remaining: number;
  };
}

export interface PayDebtResponse {
  success: boolean;
  message: string;
  debt: DebtDto;
  summary: {
    totalAmount: number;
    paidAmount: number;
    remaining: number;
    isFullyPaid: boolean;
  };
}

// ============================================
// Service functions
// ============================================

const debtsService = {
  async list(params?: QueryDebtParams): Promise<DebtListResponse> {
    const { data } = await api.get<DebtListResponse>('/debts', { params });
    return data;
  },

  async getDetail(id: string): Promise<DebtDto> {
    const { data } = await api.get<DebtDto>(`/debts/${id}`);
    return data;
  },

  async create(payload: CreateDebtPayload): Promise<CreateDebtResponse> {
    const { data } = await api.post<CreateDebtResponse>('/debts', payload);
    return data;
  },

  async pay(debtId: string, payload: PayDebtPayload): Promise<PayDebtResponse> {
    const { data } = await api.put<PayDebtResponse>(
      `/debts/${debtId}/payment`,
      payload,
    );
    return data;
  },

  async update(debtId: string, payload: { dueDate?: string; notes?: string; customerName?: string; customerPhone?: string }) {
    const { data } = await api.patch(`/debts/${debtId}`, payload);
    return data;
  },

  async findByCustomer(
    customerName: string,
    shopId: string,
  ): Promise<{ data: DebtDto[]; summary: any }> {
    const { data } = await api.get(`/debts/by-customer/${encodeURIComponent(customerName)}`, {
      params: { shopId },
    });
    return data;
  },
};

export default debtsService;
