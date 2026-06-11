import api from './api';

// ============================================
// Types
// ============================================

export interface BrilinkAccount {
  id: string;
  shopId: string;
  label: string;
  accountNumber: string;
  accountHolder: string | null;
  balance: number;
  lowBalanceThreshold: number;
  isDefault: boolean;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrilinkAccountPayload {
  shopId: string;
  label: string;
  accountNumber: string;
  accountHolder?: string;
  balance?: number;
  lowBalanceThreshold?: number;
  isDefault?: boolean;
  notes?: string;
}

export interface UpdateBrilinkAccountPayload {
  label?: string;
  accountNumber?: string;
  accountHolder?: string;
  balance?: number;
  lowBalanceThreshold?: number;
  isDefault?: boolean;
  isActive?: boolean;
  notes?: string;
}

export interface MutationActionPayload {
  amount: number;
  reference?: string;
  notes?: string;
}

export interface BrilinkMutationItem {
  id: string;
  accountId: string;
  type: 'SETOR' | 'TARIK' | 'TRX_DEBIT' | 'TRX_CREDIT' | 'ADJUSTMENT';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string | null;
  description: string;
  notes: string | null;
  createdById: string | null;
  createdBy: { username: string | null; email: string } | null;
  createdAt: string;
}

export interface MutationsResponse {
  data: BrilinkMutationItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Service
// ============================================

const brilinkAccountService = {
  async list(shopId: string): Promise<BrilinkAccount[]> {
    const { data } = await api.get<BrilinkAccount[]>('/brilink-accounts', {
      params: { shopId },
    });
    return data;
  },

  async getOne(id: string): Promise<BrilinkAccount> {
    const { data } = await api.get<BrilinkAccount>(`/brilink-accounts/${id}`);
    return data;
  },

  async create(payload: CreateBrilinkAccountPayload): Promise<BrilinkAccount> {
    const { data } = await api.post<BrilinkAccount>(
      '/brilink-accounts',
      payload,
    );
    return data;
  },

  async update(
    id: string,
    payload: UpdateBrilinkAccountPayload,
  ): Promise<BrilinkAccount> {
    const { data } = await api.patch<BrilinkAccount>(
      `/brilink-accounts/${id}`,
      payload,
    );
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/brilink-accounts/${id}`);
  },

  async setor(
    id: string,
    payload: MutationActionPayload,
  ): Promise<{ account: BrilinkAccount; mutation: BrilinkMutationItem }> {
    const { data } = await api.post<{
      account: BrilinkAccount;
      mutation: BrilinkMutationItem;
    }>(`/brilink-accounts/${id}/setor`, payload);
    return data;
  },

  async tarik(
    id: string,
    payload: MutationActionPayload,
  ): Promise<{ account: BrilinkAccount; mutation: BrilinkMutationItem }> {
    const { data } = await api.post<{
      account: BrilinkAccount;
      mutation: BrilinkMutationItem;
    }>(`/brilink-accounts/${id}/tarik`, payload);
    return data;
  },

  async getMutations(
    id: string,
    page = 1,
    limit = 20,
  ): Promise<MutationsResponse> {
    const { data } = await api.get<MutationsResponse>(
      `/brilink-accounts/${id}/mutations`,
      { params: { page, limit } },
    );
    return data;
  },

  async getAllMutations(params: {
    shopId: string;
    accountId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; meta: MutationsResponse['meta'] }> {
    const { data } = await api.get<{ data: any[]; meta: MutationsResponse['meta'] }>(
      '/brilink-accounts/mutations',
      { params },
    );
    return data;
  },

  async transferInternal(payload: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    notes?: string;
  }) {
    const { data } = await api.post('/brilink-accounts/transfer-internal', payload);
    return data;
  },
};

export default brilinkAccountService;
