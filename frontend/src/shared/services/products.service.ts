import api from './api';

// ============================================
// Types (match backend response shapes)
// ============================================

export interface ProductStock {
  quantity: number;
  warehouse: string;
}

export interface ProductDto {
  id: string;
  shopId: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  imageUrl?: string | null;
  unit?: string | null;
  description?: string | null;
  categoryId?: string | null;
  supplierId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  stocks?: ProductStock[];
}

export interface ProductDetailDto extends ProductDto {
  stocks: Array<{
    id: string;
    quantity: number;
    warehouse: string;
    stockHistories: StockHistoryEntry[];
  }>;
}

export interface StockHistoryEntry {
  id: string;
  type: string;
  quantityBefore: number;
  quantityAfter: number;
  quantityChange: number;
  reference?: string | null;
  notes?: string | null;
  createdAt: string;
}

// ============================================
// Request payloads
// ============================================

export interface CreateProductPayload {
  shopId: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  supplierId?: string;
  initialStock?: number;
  imageUrl?: string;
  categoryId?: string;
  unit?: string;
}

export interface UpdateProductPayload {
  name?: string;
  price?: number;
  cost?: number;
  supplierId?: string;
  imageUrl?: string;
  categoryId?: string;
  unit?: string;
  description?: string;
}

export interface QueryProductParams {
  shopId?: string;
  search?: string;
  categoryId?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

// ============================================
// Response shapes
// ============================================

export interface ProductListResponse {
  data: ProductDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateProductResponse {
  success: boolean;
  product: ProductDto;
}

export interface UpdateProductResponse {
  success: boolean;
  product: ProductDto;
}

export interface DeleteProductResponse {
  success: boolean;
  message: string;
}

// ============================================
// Service functions
// ============================================

const productsService = {
  async list(params?: QueryProductParams): Promise<ProductListResponse> {
    const { data } = await api.get<ProductListResponse>('/products', { params });
    return data;
  },

  async getDetail(id: string): Promise<ProductDetailDto> {
    const { data } = await api.get<ProductDetailDto>(`/products/${id}`);
    return data;
  },

  async create(payload: CreateProductPayload): Promise<CreateProductResponse> {
    const { data } = await api.post<CreateProductResponse>('/products', payload);
    return data;
  },

  async update(id: string, payload: UpdateProductPayload): Promise<UpdateProductResponse> {
    const { data } = await api.put<UpdateProductResponse>(`/products/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<DeleteProductResponse> {
    const { data } = await api.delete<DeleteProductResponse>(`/products/${id}`);
    return data;
  },
};

export default productsService;
