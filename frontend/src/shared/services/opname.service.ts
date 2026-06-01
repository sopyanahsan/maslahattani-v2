import api from './api';

// ============================================
// Types
// ============================================

export type OpnameStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface OpnameSessionDto {
  id: string;
  sessionNumber: string;
  status: OpnameStatus;
  notes: string | null;
  conductorId: string;
  conductorName: string;
  shopId: string;
  totalProducts: number;
  totalMatched: number;
  totalSurplus: number;
  totalDeficit: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  itemCount: number;
}

export interface OpnameItemDto {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  productPrice: number;
  systemQty: number;
  actualQty: number | null;
  variance: number | null;
  reason: string | null;
  notes: string | null;
}

export interface OpnameSessionDetailDto extends Omit<OpnameSessionDto, 'itemCount'> {
  items: OpnameItemDto[];
}

export interface OpnameListResponse {
  data: OpnameSessionDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateOpnamePayload {
  shopId: string;
  notes?: string;
}

export interface UpdateOpnameItemPayload {
  actualQty: number;
  reason?: string;
  notes?: string;
}

// ============================================
// Service
// ============================================

interface ListSessionsParams {
  shopId?: string;
  status?: OpnameStatus;
  page?: number;
  limit?: number;
}

const opnameService = {
  async listSessions(params: ListSessionsParams): Promise<OpnameListResponse> {
    const { data } = await api.get<OpnameListResponse>('/opname/sessions', { params });
    return data;
  },

  async getSession(id: string): Promise<OpnameSessionDetailDto> {
    const { data } = await api.get<OpnameSessionDetailDto>(`/opname/sessions/${id}`);
    return data;
  },

  async createSession(payload: CreateOpnamePayload) {
    const { data } = await api.post('/opname/sessions', payload);
    return data;
  },

  async completeSession(id: string, applyAdjustments: boolean = false) {
    const { data } = await api.post(`/opname/sessions/${id}/complete`, { applyAdjustments });
    return data;
  },

  async cancelSession(id: string) {
    const { data } = await api.post(`/opname/sessions/${id}/cancel`);
    return data;
  },

  async updateItem(itemId: string, payload: UpdateOpnameItemPayload) {
    const { data } = await api.patch(`/opname/items/${itemId}`, payload);
    return data;
  },
};

export default opnameService;
