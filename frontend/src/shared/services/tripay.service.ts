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

export async function saveTripayConfig(payload: TripayConfigPayload) {
  const { data } = await api.patch('/tripay/config', payload);
  return data;
}

export async function verifyTripayConfig() {
  const { data } = await api.post('/tripay/config/verify');
  return data;
}

// ============================================
// Products API
// ============================================

export async function getPpobCategories(): Promise<PpobCategory[]> {
  const { data } = await api.get('/tripay/products/categories');
  return data;
}

export async function getPpobProducts(shopId: string, category?: string): Promise<PpobProduct[]> {
  const { data } = await api.get('/tripay/products', {
    params: { shopId, category },
  });
  return data;
}

// ============================================
// Inquiry API
// ============================================

export async function ppobInquiry(productCode: string, customerId: string, shopId?: string) {
  const { data } = await api.post('/tripay/inquiry', {
    productCode,
    customerId,
    shopId,
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
