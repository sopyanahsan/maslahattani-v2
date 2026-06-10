import api from './api';

// ============================================
// Types
// ============================================

export interface OperatorDetectResponse {
  operator: string | null;
  prefix: string;
  phone: string;
}

export interface OperatorPrefixItem {
  id: string;
  prefix: string;
  operator: string;
  type: string;
}

export interface BrilinkProductItem {
  id: string;
  shopId: string;
  category: string;
  operator: string | null;
  provider: string | null;
  name: string;
  nominal: number | null;
  buyPrice: number;
  sellPrice: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface BankItem {
  id: string;
  code: string;
  name: string;
  shortName: string;
  isActive: boolean;
}

export interface EwalletProviderItem {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  isActive: boolean;
}

export interface CreateProductPayload {
  shopId: string;
  category: string;
  operator?: string;
  provider?: string;
  name: string;
  nominal?: number;
  buyPrice: number;
  sellPrice: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateProductPayload {
  name?: string;
  nominal?: number;
  buyPrice?: number;
  sellPrice?: number;
  isActive?: boolean;
  sortOrder?: number;
}

// ============================================
// Service
// ============================================

const brilinkProductsService = {
  // --- Operator Detection ---
  async detectOperator(phone: string): Promise<OperatorDetectResponse> {
    const { data } = await api.get<OperatorDetectResponse>('/brilink/operators/detect', {
      params: { phone },
    });
    return data;
  },

  async getAllPrefixes(): Promise<OperatorPrefixItem[]> {
    const { data } = await api.get<OperatorPrefixItem[]>('/brilink/operators');
    return data;
  },

  // --- Products CRUD ---
  async listProducts(params: {
    shopId: string;
    category?: string;
    operator?: string;
    provider?: string;
    isActive?: boolean;
  }): Promise<{ data: BrilinkProductItem[]; total: number }> {
    const { data } = await api.get('/brilink/products', { params });
    return data;
  },

  async createProduct(payload: CreateProductPayload): Promise<BrilinkProductItem> {
    const { data } = await api.post<BrilinkProductItem>('/brilink/products', payload);
    return data;
  },

  async updateProduct(id: string, payload: UpdateProductPayload): Promise<BrilinkProductItem> {
    const { data } = await api.patch<BrilinkProductItem>(`/brilink/products/${id}`, payload);
    return data;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/brilink/products/${id}`);
  },

  async seedProducts(shopId: string, template: string): Promise<{ created: number; template: string }> {
    const { data } = await api.post('/brilink/products/seed', { shopId, template });
    return data;
  },

  // --- Banks ---
  async listBanks(search?: string, isActive?: boolean): Promise<BankItem[]> {
    const params: any = {};
    if (search) params.search = search;
    if (isActive !== undefined) params.isActive = String(isActive);
    const { data } = await api.get<BankItem[]>('/brilink/banks', { params });
    return data;
  },

  async toggleBank(id: string, isActive: boolean): Promise<BankItem> {
    const { data } = await api.patch<BankItem>(`/brilink/banks/${id}/toggle`, { isActive });
    return data;
  },

  // --- E-Wallet Providers ---
  async listEwalletProviders(): Promise<EwalletProviderItem[]> {
    const { data } = await api.get<EwalletProviderItem[]>('/brilink/ewallet-providers');
    return data;
  },

  async toggleEwalletProvider(id: string, isActive: boolean): Promise<EwalletProviderItem> {
    const { data } = await api.patch<EwalletProviderItem>(
      `/brilink/ewallet-providers/${id}/toggle`,
      { isActive },
    );
    return data;
  },
};

export default brilinkProductsService;
