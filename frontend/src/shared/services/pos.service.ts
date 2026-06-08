import api from './api';
import type { ProductDto } from './products.service';

// ============================================
// Cart types (client-only state)
// ============================================

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  quantity: number;
  discount: number;
  subtotal: number;
  maxStock: number;
}

export type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER' | 'HUTANG';

// ============================================
// API request types (match backend DTO)
// ============================================

export interface CreateTransactionItem {
  productId: string;
  quantity: number;
  discount?: number;
}

export interface CreateTransactionPayload {
  items: CreateTransactionItem[];
  paymentMethod: PaymentMethod;
  amountPaid?: number;
  paymentReference?: string;
  customerName?: string;
  customerPhone?: string;
  createDebtForRemainder?: boolean;
  idempotencyKey?: string;
  clientCreatedAt?: string;
}

// ============================================
// API response types
// ============================================

export interface TransactionSummary {
  transactionNumber: string;
  totalPrice: number;
  totalCost: number;
  totalDiscount: number;
  profit: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
}

export interface CreateTransactionResponse {
  success: boolean;
  idempotent: boolean;
  transaction: any;
  summary: TransactionSummary;
}

export interface POSProductDto extends ProductDto {
  /** Total stock across all warehouses */
  totalStock: number;
}

// ============================================
// Service functions
// ============================================

const posService = {
  /**
   * Search products for POS (uses products list endpoint with search).
   * Returns products with stock info for the current shop.
   */
  async searchProducts(shopId: string, search?: string): Promise<POSProductDto[]> {
    const { data } = await api.get<{ data: ProductDto[]; meta: any }>('/products', {
      params: { shopId, search, limit: 50 },
    });

    return data.data.map((p) => ({
      ...p,
      totalStock: (p.stocks ?? []).reduce((sum, s) => sum + s.quantity, 0),
    }));
  },

  /**
   * Create a new transaction (checkout).
   */
  async createTransaction(payload: CreateTransactionPayload): Promise<CreateTransactionResponse> {
    const { data } = await api.post<CreateTransactionResponse>('/transactions', payload);
    return data;
  },

  /**
   * Get today's transactions for the current user.
   */
  async getTodayTransactions(shopId: string, userId?: string): Promise<any> {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await api.get('/transactions', {
      params: {
        shopId,
        userId,
        startDate: today,
        endDate: today,
        limit: 50,
      },
    });
    return data;
  },
};

export default posService;

// ============================================
// Cart helper functions (pure, no side effects)
// ============================================

export function createCartItem(product: POSProductDto, qty = 1): CartItem {
  return {
    productId: product.id,
    name: product.name,
    sku: product.sku,
    price: product.price,
    cost: product.cost,
    quantity: qty,
    discount: 0,
    subtotal: product.price * qty,
    maxStock: product.totalStock,
  };
}

export function recalcCartItem(item: CartItem): CartItem {
  return {
    ...item,
    subtotal: item.price * item.quantity - item.discount,
  };
}

export function calcCartTotals(items: CartItem[]) {
  const totalPrice = items.reduce((sum, i) => sum + i.subtotal, 0);
  const totalCost = items.reduce((sum, i) => sum + i.cost * i.quantity, 0);
  const totalDiscount = items.reduce((sum, i) => sum + i.discount, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  return { totalPrice, totalCost, totalDiscount, totalItems, profit: totalPrice - totalCost };
}
