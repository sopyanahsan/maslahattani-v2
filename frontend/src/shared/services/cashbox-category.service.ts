import api from './api';

// ============================================
// Types
// ============================================

export interface CashBoxCategoryDto {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCashBoxCategoryPayload {
  code: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export type UpdateCashBoxCategoryPayload = Partial<
  Omit<CreateCashBoxCategoryPayload, 'code'>
>;

export interface ListCashBoxCategoriesResponse {
  data: CashBoxCategoryDto[];
  total: number;
}

// ============================================
// Service
// ============================================

const cashBoxCategoryService = {
  async list(includeInactive = false): Promise<ListCashBoxCategoriesResponse> {
    const { data } = await api.get<ListCashBoxCategoriesResponse>(
      '/cashbox-categories',
      { params: includeInactive ? { includeInactive: true } : undefined },
    );
    return data;
  },

  async getOne(id: string): Promise<{ category: CashBoxCategoryDto }> {
    const { data } = await api.get<{ category: CashBoxCategoryDto }>(
      `/cashbox-categories/${id}`,
    );
    return data;
  },

  async create(payload: CreateCashBoxCategoryPayload) {
    const { data } = await api.post<{
      category: CashBoxCategoryDto;
      message: string;
    }>('/cashbox-categories', payload);
    return data;
  },

  async update(id: string, payload: UpdateCashBoxCategoryPayload) {
    const { data } = await api.put<{
      category: CashBoxCategoryDto;
      message: string;
    }>(`/cashbox-categories/${id}`, payload);
    return data;
  },

  async remove(id: string) {
    const { data } = await api.delete<{
      category?: CashBoxCategoryDto;
      message: string;
    }>(`/cashbox-categories/${id}`);
    return data;
  },
};

export default cashBoxCategoryService;
