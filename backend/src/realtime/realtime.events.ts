/**
 * Konstanta event names untuk WebSocket real-time.
 * Gunakan ini di backend (emit) dan frontend (listen) supaya konsisten.
 */
export const REALTIME_EVENTS = {
  // BRILink
  BRILINK_TRANSACTION_CREATED: 'BRILINK_TRANSACTION_CREATED',
  ACCOUNT_BALANCE_CHANGED: 'ACCOUNT_BALANCE_CHANGED',

  // Kas & Cash Flow
  CASH_FLOW_CREATED: 'CASH_FLOW_CREATED',
  CASH_BOX_UPDATED: 'CASH_BOX_UPDATED',

  // Dashboard
  DASHBOARD_REFRESH: 'DASHBOARD_REFRESH',
} as const;

export type RealtimeEventName = keyof typeof REALTIME_EVENTS;

// ============================================
// EVENT PAYLOAD TYPES
// ============================================

export interface BrilinkTransactionCreatedPayload {
  id: string;
  refNumber: string;
  category: string;
  customerName: string;
  amount: number;
  fee: number;
  total: number;
  status: string;
  cashierName: string;
  createdAt: string;
}

export interface AccountBalanceChangedPayload {
  accountId: string;
  label: string;
  balanceBefore: number;
  balanceAfter: number;
  changeAmount: number;
  changeType: 'DEBIT' | 'CREDIT';
  reason: string;
}

export interface CashFlowCreatedPayload {
  id: string;
  type: 'CASH_IN' | 'CASH_OUT';
  amount: number;
  categoryName: string;
  description: string;
  createdAt: string;
}

export interface CashBoxUpdatedPayload {
  cashBoxId: string;
  label: string;
  balanceBefore: number;
  balanceAfter: number;
}

export interface DashboardRefreshPayload {
  source: string;
  timestamp: string;
}
