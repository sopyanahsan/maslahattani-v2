import api from './api';

// ============================================
// Types
// ============================================

export interface CashBoxItem {
  id: string;
  shopId: string;
  categoryId: string | null;
  label: string;
  balance: number;
  lastAudit: string | null;
  lastAuditBalance: number | null;
  updatedAt: string;
}

export interface CreateCashBoxPayload {
  shopId: string;
  label: string;
  balance?: number;
}

export interface UpdateCashBoxPayload {
  label?: string;
  balance?: number;
}

// ============================================
// Service
// ============================================

const cashBoxService = {
  async list(shopId: string): Promise<CashBoxItem[]> {
    const { data } = await api.get<CashBoxItem[]>('/cash-boxes', {
      params: { shopId },
    });
    return data;
  },

  async getOne(id: string): Promise<CashBoxItem> {
    const { data } = await api.get<CashBoxItem>(`/cash-boxes/${id}`);
    return data;
  },

  async create(payload: CreateCashBoxPayload): Promise<CashBoxItem> {
    const { data } = await api.post<CashBoxItem>('/cash-boxes', payload);
    return data;
  },

  async update(id: string, payload: UpdateCashBoxPayload): Promise<CashBoxItem> {
    const { data } = await api.patch<CashBoxItem>(`/cash-boxes/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.delete<{ success: boolean; message: string }>(
      `/cash-boxes/${id}`,
    );
    return data;
  },
};

export default cashBoxService;
