import { ref, onMounted, onUnmounted, watch } from 'vue';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/shared/stores/auth.store';

// ============================================
// EVENT TYPES (mirroring backend realtime.events.ts)
// ============================================

export const REALTIME_EVENTS = {
  BRILINK_TRANSACTION_CREATED: 'BRILINK_TRANSACTION_CREATED',
  ACCOUNT_BALANCE_CHANGED: 'ACCOUNT_BALANCE_CHANGED',
  CASH_FLOW_CREATED: 'CASH_FLOW_CREATED',
  CASH_BOX_UPDATED: 'CASH_BOX_UPDATED',
  DASHBOARD_REFRESH: 'DASHBOARD_REFRESH',
} as const;

export type RealtimeEventName = keyof typeof REALTIME_EVENTS;

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

// ============================================
// COMPOSABLE OPTIONS
// ============================================

type EventCallback<T = any> = (payload: T) => void;

export interface UseRealtimeOptions {
  /** Events yang ingin di-subscribe beserta callback-nya */
  events?: Partial<{
    onBrilinkTransactionCreated: EventCallback<BrilinkTransactionCreatedPayload>;
    onAccountBalanceChanged: EventCallback<AccountBalanceChangedPayload>;
    onCashFlowCreated: EventCallback<CashFlowCreatedPayload>;
    onCashBoxUpdated: EventCallback<CashBoxUpdatedPayload>;
    onDashboardRefresh: EventCallback<DashboardRefreshPayload>;
  }>;
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
}

// ============================================
// SINGLETON SOCKET INSTANCE
// ============================================

let socketInstance: Socket | null = null;
let refCount = 0;

function getSocket(): Socket {
  if (!socketInstance) {
    // VITE_API_BASE_URL biasanya http://localhost:3000/api — kita butuh root tanpa /api
    // Override: VITE_WS_URL jika WebSocket server beda host
    const wsUrl = import.meta.env.VITE_WS_URL;
    let baseUrl: string;
    if (wsUrl) {
      baseUrl = wsUrl;
    } else {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      baseUrl = apiUrl.replace(/\/api\/?$/, '');
    }
    socketInstance = io(`${baseUrl}/realtime`, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });
  }
  return socketInstance;
}

// ============================================
// COMPOSABLE
// ============================================

/**
 * useRealtimeUpdates — composable untuk menerima real-time updates via WebSocket.
 *
 * Features:
 * - Singleton socket (shared across components)
 * - Auto join/leave shop room berdasarkan auth store
 * - Reconnect otomatis
 * - Pause saat tab hidden, resume saat visible
 * - Clean disconnect saat semua subscriber unmount
 *
 * Contoh penggunaan:
 * ```ts
 * const { isConnected } = useRealtimeUpdates({
 *   events: {
 *     onBrilinkTransactionCreated(payload) {
 *       // Re-fetch data list
 *       fetchTransactions();
 *     },
 *     onAccountBalanceChanged(payload) {
 *       // Update saldo di UI
 *       accountBalance.value = payload.balanceAfter;
 *     },
 *     onDashboardRefresh() {
 *       // Refresh all dashboard data
 *       store.fetchAll();
 *     },
 *   },
 * });
 * ```
 */
export function useRealtimeUpdates(options: UseRealtimeOptions = {}) {
  const { events = {}, autoConnect = true } = options;

  const authStore = useAuthStore();
  const isConnected = ref(false);
  const lastEvent = ref<{ name: string; payload: any; timestamp: Date } | null>(null);

  const socket = getSocket();
  let currentShopId: string | null = null;
  let listeners: Array<{ event: string; handler: (...args: any[]) => void }> = [];

  // ---- Socket lifecycle ----

  function connect() {
    if (socket.connected) {
      isConnected.value = true;
      joinShop();
      return;
    }
    socket.connect();
  }

  function disconnect() {
    leaveShop();
    if (refCount <= 0 && socket.connected) {
      socket.disconnect();
    }
  }

  function joinShop() {
    const shopId = authStore.user?.shopId;
    const userId = authStore.user?.id;
    if (!shopId || !userId) return;

    if (currentShopId && currentShopId !== shopId) {
      socket.emit('leave_shop', { shopId: currentShopId });
    }

    socket.emit('join_shop', { shopId, userId });
    currentShopId = shopId;
  }

  function leaveShop() {
    if (currentShopId) {
      socket.emit('leave_shop', { shopId: currentShopId });
      currentShopId = null;
    }
  }

  // ---- Event registration ----

  function registerEvents() {
    const eventMap: Array<{ name: string; cb: EventCallback | undefined }> = [
      { name: REALTIME_EVENTS.BRILINK_TRANSACTION_CREATED, cb: events.onBrilinkTransactionCreated },
      { name: REALTIME_EVENTS.ACCOUNT_BALANCE_CHANGED, cb: events.onAccountBalanceChanged },
      { name: REALTIME_EVENTS.CASH_FLOW_CREATED, cb: events.onCashFlowCreated },
      { name: REALTIME_EVENTS.CASH_BOX_UPDATED, cb: events.onCashBoxUpdated },
      { name: REALTIME_EVENTS.DASHBOARD_REFRESH, cb: events.onDashboardRefresh },
    ];

    for (const { name, cb } of eventMap) {
      if (cb) {
        const handler = (payload: any) => {
          lastEvent.value = { name, payload, timestamp: new Date() };
          cb(payload);
        };
        socket.on(name, handler);
        listeners.push({ event: name, handler });
      }
    }
  }

  function unregisterEvents() {
    for (const { event, handler } of listeners) {
      socket.off(event, handler);
    }
    listeners = [];
  }

  // ---- Connection state handlers ----

  function onConnect() {
    isConnected.value = true;
    joinShop();
  }

  function onDisconnect() {
    isConnected.value = false;
    currentShopId = null;
  }

  // ---- Visibility API (pause/resume) ----

  function handleVisibility() {
    if (document.visibilityState === 'visible') {
      if (!socket.connected) {
        socket.connect();
      } else {
        joinShop();
      }
    }
    // Don't disconnect on hidden — socket.io reconnection handles it
  }

  // ---- Lifecycle ----

  onMounted(() => {
    refCount++;

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    registerEvents();

    if (autoConnect) {
      connect();
    }

    document.addEventListener('visibilitychange', handleVisibility);
  });

  onUnmounted(() => {
    refCount--;

    socket.off('connect', onConnect);
    socket.off('disconnect', onDisconnect);

    unregisterEvents();
    disconnect();

    document.removeEventListener('visibilitychange', handleVisibility);
  });

  // Watch for shopId changes (e.g. super-admin switches shop)
  watch(
    () => authStore.user?.shopId,
    (newShopId) => {
      if (newShopId && socket.connected) {
        joinShop();
      }
    },
  );

  return {
    isConnected,
    lastEvent,
    /** Manual connect (if autoConnect=false) */
    connect,
    /** Manual disconnect */
    disconnect,
  };
}
