import api from './api';

// ============================================
// Types
// ============================================

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface KasirDto {
  id: string;
  email: string;
  username?: string | null;
  role: string;
  status: UserStatus;
  shopId?: string | null;
  lastLogin?: string | null;
  createdAt: string;
}

// ============================================
// Request payloads
// ============================================

export interface CreateKasirPayload {
  email: string;
  shopId?: string;
  role?: string;
}

export interface UpdateKasirPayload {
  status?: UserStatus;
  shopId?: string;
}

// ============================================
// Response shapes
// ============================================

export interface KasirListResponse {
  data: KasirDto[];
  total: number;
}

export interface CreateKasirResponse {
  kasir: KasirDto;
  tempPassword: string;
  message: string;
}

export interface UpdateKasirResponse {
  kasir: KasirDto;
}

export interface ResetPasswordResponse {
  tempPassword: string;
  message: string;
}

export interface SuggestUsernameResponse {
  suggestions: string[];
}

// ============================================
// Service functions
// ============================================

const kasirService = {
  async list(shopId?: string): Promise<KasirListResponse> {
    const { data } = await api.get<KasirListResponse>('/admin/kasir', {
      params: shopId ? { shopId } : undefined,
    });
    return data;
  },

  async create(payload: CreateKasirPayload): Promise<CreateKasirResponse> {
    const { data } = await api.post<CreateKasirResponse>('/admin/kasir', payload);
    return data;
  },

  async update(id: string, payload: UpdateKasirPayload): Promise<UpdateKasirResponse> {
    const { data } = await api.put<UpdateKasirResponse>(`/admin/kasir/${id}`, payload);
    return data;
  },

  async resetPassword(id: string): Promise<ResetPasswordResponse> {
    const { data } = await api.post<ResetPasswordResponse>(`/admin/kasir/${id}/reset-password`);
    return data;
  },

  async suggestUsername(email: string): Promise<SuggestUsernameResponse> {
    const { data } = await api.get<SuggestUsernameResponse>('/admin/kasir/suggest-username', {
      params: { email },
    });
    return data;
  },
};

export default kasirService;
