import api from './api';

// ============================================
// Types
// ============================================

export interface BrilinkCashBox {
  id: string;
  shopId: string;
  balance: number;
  lowBalanceThreshold: number;
  lastAudit: string | null;
  lastAuditBalance: number | null;
  notes: string | null;
  isLowBalance: boolean;
  recentMutations: BrilinkCashMutation[];
  createdAt: string;
  updatedAt: string;
}

export interface BrilinkCashMutation {
  id: string;
  cashBoxId: string;
  type: 'TRX_IN' | 'TRX_OUT' | 'SETOR' | 'TARIK' | 'ADJUSTMENT' | 'VOID_REVERSE';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string | null;
  description: string;
  notes: string | null;
  createdById: string | null;
  createdAt: string;
}

export interface CashMutationsResponse {
  data: BrilinkCashMutation[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReconcilePayload {
  target: 'ACCOUNT' | 'CASHBOX';
  targetId: string;
  realBalance: number;
  notes?: string;
}

export interface ReconcileResponse {
  id: string;
  target: string;
  targetLabel: string;
  balanceApp: number;
  balanceReal: number;
  adjustment: number;
  status: 'MATCHED' | 'ADJUSTED';
  mutation: { type: string; amount: number; balanceAfter: number } | null;
}

export interface ReconciliationRecord {
  id: string;
  shopId: string;
  target: string;
  targetId: string;
  targetLabel: string;
  balanceApp: number;
  balanceReal: number;
  adjustment: number;
  status: string;
  notes: string | null;
  createdById: string;
  createdAt: string;
}

export interface ReconciliationHistoryResponse {
  data: ReconciliationRecord[];
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

const brilinkCashboxService = {
  /**
   * Get kas tunai BRILink (auto-creates if not exists)
   */
  async getCashBox(shopId: string): Promise<BrilinkCashBox> {
    const { data } = await api.get<BrilinkCashBox>('/brilink/cashbox', {
      params: { shopId },
    });
    return data;
  },

  /**
   * Tambah modal kas tunai
   */
  async setor(shopId: string, payload: { amount: number; notes?: string }) {
    const { data } = await api.post('/brilink/cashbox/setor', payload, {
      params: { shopId },
    });
    return data;
  },

  /**
   * Ambil tunai dari kas
   */
  async tarik(shopId: string, payload: { amount: number; notes?: string }) {
    const { data } = await api.post('/brilink/cashbox/tarik', payload, {
      params: { shopId },
    });
    return data;
  },

  /**
   * List mutasi kas tunai (paginated)
   */
  async getMutations(params: {
    shopId: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<CashMutationsResponse> {
    const { data } = await api.get<CashMutationsResponse>('/brilink/cashbox/mutations', {
      params,
    });
    return data;
  },

  /**
   * Update settings (threshold, notes)
   */
  async updateSettings(shopId: string, payload: { lowBalanceThreshold?: number; notes?: string }) {
    const { data } = await api.patch('/brilink/cashbox/settings', payload, {
      params: { shopId },
    });
    return data;
  },

  // ============================================
  // RECONCILIATION
  // ============================================

  /**
   * Reconcile saldo (account or cashbox)
   */
  async reconcile(shopId: string, payload: ReconcilePayload): Promise<ReconcileResponse> {
    const { data } = await api.post<ReconcileResponse>('/brilink/reconciliation', payload, {
      params: { shopId },
    });
    return data;
  },

  /**
   * Get reconciliation history
   */
  async getReconciliationHistory(params: {
    shopId: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<ReconciliationHistoryResponse> {
    const { data } = await api.get<ReconciliationHistoryResponse>(
      '/brilink/reconciliation/history',
      { params },
    );
    return data;
  },
};

export default brilinkCashboxService;
