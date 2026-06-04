import api from './api';

// ============================================
// Types
// ============================================

export type OpnameStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface OpnameSessionDto {
  id: string;
  sessionNumber: string;
  passcode: string;
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
  participantCount?: number;
}

export interface OpnameParticipantDto {
  id: string;
  name: string;
  userId: string | null;
  deviceId: string | null;
  joinedAt: string;
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
  notes: string | null;
  countedById: string | null;
}

export interface OpnameSessionDetailDto extends Omit<OpnameSessionDto, 'itemCount'> {
  items: OpnameItemDto[];
  participants: OpnameParticipantDto[];
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

export interface CreateOpnameResponse {
  id: string;
  sessionNumber: string;
  passcode: string;
  status: OpnameStatus;
  totalProducts: number;
  startedAt: string;
  itemCount: number;
}

export interface UpdateOpnameItemPayload {
  actualQty: number;
  notes?: string;
  countedById?: string;
}

export interface JoinOpnamePayload {
  passcode: string;
  name: string;
  userId?: string;
  deviceId?: string;
}

export interface JoinOpnameResponse {
  participant: {
    id: string;
    name: string;
    joinedAt: string;
  };
  session: {
    id: string;
    sessionNumber: string;
    status: OpnameStatus;
    shopName: string;
    shopAddress: string;
    totalProducts: number;
    participantCount: number;
    startedAt: string | null;
  };
}

export interface PasscodeLookupResponse {
  id: string;
  sessionNumber: string;
  passcode: string;
  status: OpnameStatus;
  shopName: string;
  shopAddress: string;
  totalProducts: number;
  participantCount: number;
  startedAt: string | null;
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

  async createSession(payload: CreateOpnamePayload): Promise<CreateOpnameResponse> {
    const { data } = await api.post<CreateOpnameResponse>('/opname/sessions', payload);
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

  // ============================================
  // Passcode / Public endpoints (for webapp)
  // ============================================

  async lookupByPasscode(passcode: string): Promise<PasscodeLookupResponse> {
    const { data } = await api.get<PasscodeLookupResponse>(`/opname/join/${passcode}`);
    return data;
  },

  async joinSession(payload: JoinOpnamePayload): Promise<JoinOpnameResponse> {
    const { data } = await api.post<JoinOpnameResponse>('/opname/join', payload);
    return data;
  },
};

export default opnameService;
