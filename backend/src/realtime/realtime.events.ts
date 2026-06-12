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

  // Retail Transactions
  TRANSACTION_CREATED: 'TRANSACTION_CREATED',
  TRANSACTION_VOIDED: 'TRANSACTION_VOIDED',

  // Shifts
  SHIFT_OPENED: 'SHIFT_OPENED',
  SHIFT_CLOSED: 'SHIFT_CLOSED',

  // Stock & Products
  STOCK_UPDATED: 'STOCK_UPDATED',
  PRODUCT_UPDATED: 'PRODUCT_UPDATED',

  // Debts & Payments
  DEBT_CREATED: 'DEBT_CREATED',
  DEBT_PAID: 'DEBT_PAID',

  // Suppliers & Transfers
  PURCHASE_ORDER_CREATED: 'PURCHASE_ORDER_CREATED',
  STOCK_TRANSFER_CREATED: 'STOCK_TRANSFER_CREATED',

  // Opname
  OPNAME_STARTED: 'OPNAME_STARTED',
  OPNAME_FINALIZED: 'OPNAME_FINALIZED',

  // PPOB
  PPOB_TRANSACTION_UPDATED: 'PPOB_TRANSACTION_UPDATED',

  // Generic — catch-all signal for any data change
  DATA_CHANGED: 'DATA_CHANGED',

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

/** Generic payload untuk DATA_CHANGED — dipakai semua module */
export interface DataChangedPayload {
  /** Module yang berubah: 'transactions', 'shifts', 'stock', 'products', 'debts', 'payments', etc */
  module: string;
  /** Action type: 'created', 'updated', 'deleted' */
  action: 'created' | 'updated' | 'deleted';
  /** Optional entity ID */
  entityId?: string;
  /** Timestamp */
  timestamp: string;
}
