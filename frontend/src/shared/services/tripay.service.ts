import api from './api';

// ============================================
// Types
// ============================================

export type TripayMode = 'sandbox' | 'production';

export interface TripayConfig {
  apiKey: string;
  privateKey: string;
  merchantCode: string;
  mode: TripayMode;
  isActive: boolean;
  lastVerifiedAt: string | null;
}

export interface TripayConfigPayload {
  apiKey: string;
  privateKey: string;
  merchantCode: string;
  pin: string;
  mode?: TripayMode;
  isActive?: boolean;
}

export interface PpobCategory {
  code: string;
  label: string;
  icon: string;
  color: string;
}

export interface PpobProduct {
  code: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  fee: number;
  status: string;
}

export interface PpobTransaction {
  id: string;
  shopId: string;
  cashierId: string;
  refId: string;
  tripayRef: string | null;
  productCode: string;
  customerId: string;
  customerName: string | null;
  customerPhone: string | null;
  type: 'prepaid' | 'postpaid';
  amount: number;
  fee: number;
  total: number;
  status: 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  tripayStatus: string | null;
  serialNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PpobTransactionList {
  data: PpobTransaction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// Config API
// ============================================

export async function getTripayConfig(shopId: string): Promise<TripayConfig> {
  const { data } = await api.get('/tripay/config', { params: { shopId } });
  return data;
}

export async function saveTripayConfig(payload: TripayConfigPayload, shopId?: string) {
  const { data } = await api.patch('/tripay/config', payload, { params: { shopId } });
  return data;
}

export async function verifyTripayConfig(shopId?: string) {
  const { data } = await api.post('/tripay/config/verify', null, { params: { shopId } });
  return data;
}

// ============================================
// Balance API
// ============================================

export async function getTripayBalance(shopId: string) {
  const { data } = await api.get('/tripay/balance', { params: { shopId } });
  return data;
}

// ============================================
// Products API — Prabayar (Prepaid)
// ============================================

export async function getPpobCategories(): Promise<PpobCategory[]> {
  const { data } = await api.get('/tripay/products/categories');
  return data;
}

export async function getPrepaidCategories(shopId: string) {
  const { data } = await api.get('/tripay/prepaid/categories', { params: { shopId } });
  return data;
}

export async function getPrepaidOperators(shopId: string, categoryId?: string) {
  const { data } = await api.get('/tripay/prepaid/operators', {
    params: { shopId, category_id: categoryId },
  });
  return data;
}

export async function getPrepaidProducts(shopId: string, operatorId?: string) {
  const { data } = await api.get('/tripay/prepaid/products', {
    params: { shopId, operator_id: operatorId },
  });
  return data;
}

// ============================================
// Products API — Pascabayar (Postpaid)
// ============================================

export async function getPostpaidCategories(shopId: string) {
  const { data } = await api.get('/tripay/postpaid/categories', { params: { shopId } });
  return data;
}

export async function getPostpaidOperators(shopId: string, categoryId?: string) {
  const { data } = await api.get('/tripay/postpaid/operators', {
    params: { shopId, category_id: categoryId },
  });
  return data;
}

export async function getPostpaidProducts(shopId: string, operatorId?: string) {
  const { data } = await api.get('/tripay/postpaid/products', {
    params: { shopId, operator_id: operatorId },
  });
  return data;
}

/** @deprecated Use getPrepaidProducts or getPostpaidProducts instead */
export async function getPpobProducts(shopId: string, category?: string): Promise<PpobProduct[]> {
  const { data } = await api.get('/tripay/prepaid/products', {
    params: { shopId, operator_id: category },
  });
  return data;
}

// ============================================
// Inquiry API
// ============================================

export async function ppobInquiry(productCode: string, customerId: string, shopId?: string, phone?: string) {
  const { data } = await api.post('/tripay/inquiry', {
    productCode,
    customerId,
    shopId,
    phone,
  });
  return data;
}

// ============================================
// Transactions API
// ============================================

export async function createPpobTransaction(payload: {
  productCode: string;
  customerId: string;
  type: 'prepaid' | 'postpaid';
  customerName?: string;
  customerPhone?: string;
  amount?: number;
  noMeterPln?: string;
  orderId?: string;
}) {
  const { data } = await api.post('/tripay/transactions', payload);
  return data;
}

export async function listPpobTransactions(params: {
  shopId: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PpobTransactionList> {
  const { data } = await api.get('/tripay/transactions', { params });
  return data;
}

export async function checkPpobTransactionStatus(id: string, shopId: string) {
  const { data } = await api.get(`/tripay/transactions/${id}/status`, {
    params: { shopId },
  });
  return data;
}
