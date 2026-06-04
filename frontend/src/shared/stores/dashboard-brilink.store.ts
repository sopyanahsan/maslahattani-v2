import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import dashboardBrilinkService, {
  type BrilinkAlertsResponse,
  type BrilinkAccountItem,
  type BrilinkOverviewResponse,
  type BrilinkRecentTransaction,
  type BrilinkTransactionsChartResponse,
  type CashierPerformanceItem,
  type CategoryBreakdownResponse,
  type DashboardPeriod,
  type TopCustomerItem,
} from '@/shared/services/dashboard-brilink.service';

/**
 * Section keys for independent fetch. Each section has its own loading + error state.
 */
export type BrilinkDashboardSection =
  | 'overview'
  | 'transactionsChart'
  | 'categoryBreakdown'
  | 'recentTransactions'
  | 'topCustomers'
  | 'accounts'
  | 'alerts'
  | 'cashierPerformance';

const ALL_SECTIONS: BrilinkDashboardSection[] = [
  'overview',
  'transactionsChart',
  'categoryBreakdown',
  'recentTransactions',
  'topCustomers',
  'accounts',
  'alerts',
  'cashierPerformance',
];

const DEFAULT_REFRESH_MS = 30_000;

export const useDashboardBrilinkStore = defineStore('dashboardBrilink', () => {
  // ============================================
  // Filter state
  // ============================================
  const period = ref<DashboardPeriod>('today');
  const shopId = ref<string | null>(null);

  // ============================================
  // Per-section state
  // ============================================
  const overview = ref<BrilinkOverviewResponse | null>(null);
  const transactionsChart = ref<BrilinkTransactionsChartResponse | null>(null);
  const categoryBreakdown = ref<CategoryBreakdownResponse | null>(null);
  const recentTransactions = ref<BrilinkRecentTransaction[]>([]);
  const topCustomers = ref<TopCustomerItem[]>([]);
  const accounts = ref<BrilinkAccountItem[]>([]);
  const alerts = ref<BrilinkAlertsResponse | null>(null);
  const cashierPerformance = ref<CashierPerformanceItem[]>([]);

  // Loading + error per section
  const loading = ref<Record<BrilinkDashboardSection, boolean>>({
    overview: false,
    transactionsChart: false,
    categoryBreakdown: false,
    recentTransactions: false,
    topCustomers: false,
    accounts: false,
    alerts: false,
    cashierPerformance: false,
  });
  const errors = ref<Record<BrilinkDashboardSection, string | null>>({
    overview: null,
    transactionsChart: null,
    categoryBreakdown: null,
    recentTransactions: null,
    topCustomers: null,
    accounts: null,
    alerts: null,
    cashierPerformance: null,
  });

  // ============================================
  // Refresh / lifecycle
  // ============================================
  const lastUpdatedAt = ref<Date | null>(null);
  const autoRefresh = ref(true);
  const refreshIntervalMs = ref(DEFAULT_REFRESH_MS);
  let refreshTimer: ReturnType<typeof setInterval> | null = null;

  const isAnyLoading = computed(() =>
    ALL_SECTIONS.some((s) => loading.value[s]),
  );

  const lastUpdatedSecondsAgo = ref(0);
  let tickTimer: ReturnType<typeof setInterval> | null = null;

  function setShopId(id: string | null) {
    shopId.value = id;
  }

  function setPeriod(p: DashboardPeriod) {
    period.value = p;
  }

  // ============================================
  // Section fetchers
  // ============================================

  async function fetchSection(section: BrilinkDashboardSection, isRefresh = false) {
    if (!shopId.value) return;
    // Only show loading skeleton on first load — skip during auto-refresh to prevent flicker
    if (!isRefresh) {
      loading.value[section] = true;
    }
    errors.value[section] = null;

    try {
      switch (section) {
        case 'overview':
          overview.value = await dashboardBrilinkService.getOverview(
            shopId.value,
            period.value,
          );
          break;
        case 'transactionsChart':
          transactionsChart.value =
            await dashboardBrilinkService.getTransactionsChart(
              shopId.value,
              period.value,
            );
          break;
        case 'categoryBreakdown':
          categoryBreakdown.value =
            await dashboardBrilinkService.getCategoryBreakdown(
              shopId.value,
              period.value,
            );
          break;
        case 'recentTransactions': {
          const res = await dashboardBrilinkService.getRecentTransactions(
            shopId.value,
            10,
          );
          recentTransactions.value = res.data;
          break;
        }
        case 'topCustomers': {
          const res = await dashboardBrilinkService.getTopCustomers(
            shopId.value,
            5,
          );
          topCustomers.value = res.data;
          break;
        }
        case 'accounts': {
          const res = await dashboardBrilinkService.getAccounts(shopId.value);
          accounts.value = res.data;
          break;
        }
        case 'alerts':
          alerts.value = await dashboardBrilinkService.getAlerts(shopId.value);
          break;
        case 'cashierPerformance': {
          const res = await dashboardBrilinkService.getCashierPerformance(
            shopId.value,
            5,
          );
          cashierPerformance.value = res.data;
          break;
        }
      }
      lastUpdatedAt.value = new Date();
      lastUpdatedSecondsAgo.value = 0;
    } catch (err: any) {
      errors.value[section] =
        err?.response?.data?.message ||
        err?.message ||
        'Gagal memuat data section ini.';
    } finally {
      loading.value[section] = false;
    }
  }

  /**
   * Fetch semua section parallel. isRefresh=true → no loading flicker.
   */
  async function fetchAll(isRefresh = false) {
    if (!shopId.value) return;
    await Promise.allSettled(ALL_SECTIONS.map((s) => fetchSection(s, isRefresh)));
  }

  // ============================================
  // Auto-refresh
  // ============================================

  function startAutoRefresh() {
    stopAutoRefresh();
    if (!autoRefresh.value) return;
    refreshTimer = setInterval(() => {
      if (autoRefresh.value && shopId.value) {
        fetchAll(true); // silent refresh — no skeleton flicker
      }
    }, refreshIntervalMs.value);
    if (!tickTimer) {
      tickTimer = setInterval(() => {
        if (lastUpdatedAt.value) {
          lastUpdatedSecondsAgo.value = Math.floor(
            (Date.now() - lastUpdatedAt.value.getTime()) / 1000,
          );
        }
      }, 1000);
    }
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  function teardown() {
    stopAutoRefresh();
    if (tickTimer) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
  }

  function toggleAutoRefresh() {
    autoRefresh.value = !autoRefresh.value;
    if (autoRefresh.value) startAutoRefresh();
    else stopAutoRefresh();
  }

  function reset() {
    teardown();
    overview.value = null;
    transactionsChart.value = null;
    categoryBreakdown.value = null;
    recentTransactions.value = [];
    topCustomers.value = [];
    accounts.value = [];
    alerts.value = null;
    cashierPerformance.value = [];
    lastUpdatedAt.value = null;
    lastUpdatedSecondsAgo.value = 0;
    for (const k of ALL_SECTIONS) {
      loading.value[k] = false;
      errors.value[k] = null;
    }
  }

  return {
    // state
    period,
    shopId,
    overview,
    transactionsChart,
    categoryBreakdown,
    recentTransactions,
    topCustomers,
    accounts,
    alerts,
    cashierPerformance,
    loading,
    errors,
    lastUpdatedAt,
    lastUpdatedSecondsAgo,
    autoRefresh,
    refreshIntervalMs,
    isAnyLoading,
    // actions
    setShopId,
    setPeriod,
    fetchSection,
    fetchAll,
    startAutoRefresh,
    stopAutoRefresh,
    toggleAutoRefresh,
    teardown,
    reset,
  };
});
