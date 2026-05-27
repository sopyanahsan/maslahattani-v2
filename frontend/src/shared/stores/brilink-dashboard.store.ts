import { defineStore } from 'pinia';
import { ref } from 'vue';
import brilinkService, {
  type BrilinkDashboardResponse,
  type BrilinkTransactionDto,
  type BrilinkAccountDto,
  type BrilinkStats,
  type BrilinkListResponse,
  type ListTransactionsParams,
} from '@/shared/services/brilink.service';

/**
 * BrilinkDashboardStore — state management untuk semua data BRILink di UI.
 *
 * Digunakan oleh:
 *   - DashboardView.vue   : section BRILink (KPI, recent trx, daily trend)
 *   - AdminBrilinkView.vue: tabs mutasi, statistik, fee
 *
 * Pattern:
 *   - Per-section loading & error state (error boundary per section)
 *   - Promise.allSettled fetch agar satu section gagal tidak block lainnya
 *   - 30s auto-refresh interval (bisa dimatikan manual)
 */
export const useBrilinkDashboardStore = defineStore('brilinkDashboard', () => {
  // ============================================================
  // State — Dashboard Summary
  // ============================================================
  const dashboard = ref<BrilinkDashboardResponse | null>(null);
  const dashboardLoading = ref(false);
  const dashboardError = ref<string | null>(null);
  const activePeriod = ref<string>('month');

  // ============================================================
  // State — Transactions list (AdminBrilinkView tab Mutasi)
  // ============================================================
  const transactions = ref<BrilinkTransactionDto[]>([]);
  const transactionsMeta = ref<BrilinkListResponse['meta'] | null>(null);
  const transactionsLoading = ref(false);
  const transactionsError = ref<string | null>(null);

  // ============================================================
  // State — Stats (AdminBrilinkView tab Statistik)
  // ============================================================
  const stats = ref<BrilinkStats | null>(null);
  const statsLoading = ref(false);
  const statsError = ref<string | null>(null);

  // ============================================================
  // State — Accounts
  // ============================================================
  const accounts = ref<BrilinkAccountDto[]>([]);
  const accountsLoading = ref(false);
  const accountsError = ref<string | null>(null);

  // ============================================================
  // Auto-refresh
  // ============================================================
  let refreshTimer: ReturnType<typeof setInterval> | null = null;

  function startAutoRefresh(shopId: string, intervalMs = 30_000) {
    stopAutoRefresh();
    refreshTimer = setInterval(() => {
      fetchDashboard(shopId, activePeriod.value);
    }, intervalMs);
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  // ============================================================
  // Actions — Dashboard
  // ============================================================

  async function fetchDashboard(shopId: string, period: string = 'month') {
    if (!shopId) return;
    activePeriod.value = period;
    dashboardLoading.value = true;
    dashboardError.value = null;
    try {
      dashboard.value = await brilinkService.getDashboard(shopId, period);
    } catch (err: any) {
      dashboardError.value =
        err.response?.data?.message ?? err.message ?? 'Gagal memuat dashboard BRILink.';
    } finally {
      dashboardLoading.value = false;
    }
  }

  function setPeriod(shopId: string, period: string) {
    if (period === activePeriod.value) return;
    fetchDashboard(shopId, period);
  }

  // ============================================================
  // Actions — Transactions
  // ============================================================

  async function fetchTransactions(params: ListTransactionsParams) {
    transactionsLoading.value = true;
    transactionsError.value = null;
    try {
      const res = await brilinkService.listTransactions(params);
      transactions.value = res.data;
      transactionsMeta.value = res.meta;
    } catch (err: any) {
      transactionsError.value =
        err.response?.data?.message ?? err.message ?? 'Gagal memuat transaksi.';
    } finally {
      transactionsLoading.value = false;
    }
  }

  // ============================================================
  // Actions — Stats
  // ============================================================

  async function fetchStats(shopId: string) {
    if (!shopId) return;
    statsLoading.value = true;
    statsError.value = null;
    try {
      stats.value = await brilinkService.getStats(shopId);
    } catch (err: any) {
      statsError.value =
        err.response?.data?.message ?? err.message ?? 'Gagal memuat statistik.';
      stats.value = null;
    } finally {
      statsLoading.value = false;
    }
  }

  // ============================================================
  // Actions — Accounts
  // ============================================================

  async function fetchAccounts(shopId: string) {
    if (!shopId) return;
    accountsLoading.value = true;
    accountsError.value = null;
    try {
      accounts.value = await brilinkService.listAccounts(shopId);
    } catch (err: any) {
      accountsError.value =
        err.response?.data?.message ?? err.message ?? 'Gagal memuat rekening.';
    } finally {
      accountsLoading.value = false;
    }
  }

  // ============================================================
  // Init — fetch semua data sekaligus (Promise.allSettled)
  // ============================================================

  async function initDashboard(shopId: string) {
    if (!shopId) return;
    await Promise.allSettled([
      fetchDashboard(shopId, activePeriod.value),
      fetchAccounts(shopId),
    ]);
  }

  // ============================================================
  // Reset
  // ============================================================

  function clear() {
    stopAutoRefresh();
    dashboard.value = null;
    dashboardError.value = null;
    transactions.value = [];
    transactionsMeta.value = null;
    transactionsError.value = null;
    stats.value = null;
    statsError.value = null;
    accounts.value = [];
    accountsError.value = null;
    activePeriod.value = 'month';
  }

  return {
    // State
    dashboard,
    dashboardLoading,
    dashboardError,
    activePeriod,
    transactions,
    transactionsMeta,
    transactionsLoading,
    transactionsError,
    stats,
    statsLoading,
    statsError,
    accounts,
    accountsLoading,
    accountsError,
    // Actions
    fetchDashboard,
    setPeriod,
    fetchTransactions,
    fetchStats,
    fetchAccounts,
    initDashboard,
    startAutoRefresh,
    stopAutoRefresh,
    clear,
  };
});
