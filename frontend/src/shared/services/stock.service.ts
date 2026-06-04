import api from './api';

// ============================================
// Types (match backend response shapes)
// ============================================

export interface StockItemDto {
  id: string;
  shopId: string;
  productId: string;
  quantity: number;
  warehouse?: string | null;
  product: {
    id: string;
    name: string;
    sku: string;
    price: number;
    cost: number;
    deletedAt?: string | null;
  };
}

export interface StockSummary {
  totalProducts: number;
  outOfStock: number;
  lowStock: number;
  totalStockValue: number;
}

export interface StockHistoryDto {
  id: string;
  stockId: string;
  type: 'IN' | 'OUT' | 'OPNAME' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'ADJUSTMENT';
  source?: 'INITIAL' | 'BULK_UPLOAD' | 'SEED' | 'STOCK_IN' | 'SALE' | 'SALE_VOID' | 'OPNAME_INLINE' | 'OPNAME_SESSION' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'PURCHASE_ORDER' | 'ADJUSTMENT' | null;
  paymentMethod?: 'CASH' | 'QRIS' | 'TRANSFER' | 'HUTANG' | null;
  quantityBefore: number;
  quantityAfter: number;
  quantityChange: number;
  reference?: string | null;
  notes?: string | null;
  createdAt: string;
  stock: {
    product: { name: string; sku: string };
  };
}

// ============================================
// Request payloads
// ============================================

export interface StockInPayload {
  shopId: string;
  productId: string;
  quantity: number;
  notes?: string;
}

export interface OpnameItem {
  productId: string;
  actualQuantity: number;
  notes?: string;
}

export interface StockOpnamePayload {
  shopId: string;
  items: OpnameItem[];
  notes?: string;
}

export interface QueryStockHistoryParams {
  shopId?: string;
  productId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ============================================
// Response shapes
// ============================================

export interface StockListResponse {
  data: StockItemDto[];
  summary: StockSummary;
}

export interface StockInResponse {
  success: boolean;
  message: string;
  stock: {
    productId: string;
    quantityBefore: number;
    quantityAfter: number;
    added: number;
  };
}

export interface OpnameResult {
  productId: string;
  productName: string;
  systemQty: number;
  actualQty: number;
  difference: number;
  status: 'MATCH' | 'SURPLUS' | 'SELISIH';
}

export interface StockOpnameResponse {
  success: boolean;
  message: string;
  results: OpnameResult[];
  summary: {
    totalProducts: number;
    matched: number;
    surplus: number;
    selisih: number;
    totalDifference: number;
  };
}

export interface StockHistoryResponse {
  data: StockHistoryDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// Service functions
// ============================================

const stockService = {
  async list(shopId: string): Promise<StockListResponse> {
    const { data } = await api.get<StockListResponse>('/stock', {
      params: { shopId },
    });
    return data;
  },

  async stockIn(payload: StockInPayload): Promise<StockInResponse> {
    const { data } = await api.post<StockInResponse>('/stock/in', payload);
    return data;
  },

  async opname(payload: StockOpnamePayload): Promise<StockOpnameResponse> {
    const { data } = await api.post<StockOpnameResponse>('/stock/opname', payload);
    return data;
  },

  async getHistory(params?: QueryStockHistoryParams): Promise<StockHistoryResponse> {
    const { data } = await api.get<StockHistoryResponse>('/stock/history', { params });
    return data;
  },
};

export default stockService;
