import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import dashboardService, {
  type AlertsResponse,
  type CashierLeaderboardItem,
  type DashboardPeriod,
  type OperationsResponse,
  type OverviewResponse,
  type PaymentBreakdownResponse,
  type RecentActivity,
  type SalesChartResponse,
  type TopProduct,
} from '@/shared/services/dashboard.service';

/**
 * Section keys yang bisa di-fetch independent. Tiap section punya state sendiri
 * (loading + error) supaya satu section gagal tidak crash semua.
 */
export type DashboardSection =
  | 'overview'
  | 'salesChart'
  | 'operations'
  | 'topProducts'
  | 'recentActivity'
  | 'paymentBreakdown'
  | 'alerts'
  | 'cashierLeaderboard';

const ALL_SECTIONS: DashboardSection[] = [
  'overview',
  'salesChart',
  'operations',
  'topProducts',
  'recentActivity',
  'paymentBreakdown',
  'alerts',
  'cashierLeaderboard',
];

const DEFAULT_REFRESH_MS = 30_000;

export const useDashboardRetailStore = defineStore('dashboardRetail', () => {
  // ============================================
  // Filter state
  // ============================================
  const period = ref<DashboardPeriod>('today');
  const shopId = ref<string | null>(null);

  // ============================================
  // Per-section state
  // ============================================
  const overview = ref<OverviewResponse | null>(null);
  const salesChart = ref<SalesChartResponse | null>(null);
  const operations = ref<OperationsResponse | null>(null);
  const topProducts = ref<TopProduct[]>([]);
  const recentActivity = ref<RecentActivity[]>([]);
  const paymentBreakdown = ref<PaymentBreakdownResponse | null>(null);
  const alerts = ref<AlertsResponse | null>(null);
  const cashierLeaderboard = ref<CashierLeaderboardItem[]>([]);

  // Loading + error per section (kunci = nama section)
  const loading = ref<Record<DashboardSection, boolean>>({
    overview: false,
    salesChart: false,
    operations: false,
    topProducts: false,
    recentActivity: false,
    paymentBreakdown: false,
    alerts: false,
    cashierLeaderboard: false,
  });
  const errors = ref<Record<DashboardSection, string | null>>({
    overview: null,
    salesChart: null,
    operations: null,
    topProducts: null,
    recentActivity: null,
    paymentBreakdown: null,
    alerts: null,
    cashierLeaderboard: null,
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

  async function fetchSection(section: DashboardSection) {
    if (!shopId.value) return;
    loading.value[section] = true;
    errors.value[section] = null;

    try {
      switch (section) {
        case 'overview':
          overview.value = await dashboardService.getOverview(
            shopId.value,
            period.value,
          );
          break;
        case 'salesChart':
          salesChart.value = await dashboardService.getSalesChart(
            shopId.value,
            period.value,
          );
          break;
        case 'operations':
          operations.value = await dashboardService.getOperations(
            shopId.value,
          );
          break;
        case 'topProducts': {
          const res = await dashboardService.getTopProducts(
            shopId.value,
            period.value,
            5,
          );
          topProducts.value = res.data;
          break;
        }
        case 'recentActivity': {
          const res = await dashboardService.getRecentActivity(
            shopId.value,
            10,
          );
          recentActivity.value = res.data;
          break;
        }
        case 'paymentBreakdown':
          paymentBreakdown.value = await dashboardService.getPaymentBreakdown(
            shopId.value,
            period.value,
          );
          break;
        case 'alerts':
          alerts.value = await dashboardService.getAlerts(shopId.value);
          break;
        case 'cashierLeaderboard': {
          const res = await dashboardService.getCashierLeaderboard(
            shopId.value,
            period.value,
            5,
          );
          cashierLeaderboard.value = res.data;
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
   * Fetch semua section parallel. 1 section gagal tidak menggagalkan yang lain
   * karena pakai `Promise.allSettled`.
   */
  async function fetchAll() {
    if (!shopId.value) return;
    await Promise.allSettled(ALL_SECTIONS.map((s) => fetchSection(s)));
  }

  // ============================================
  // Auto-refresh
  // ============================================

  function startAutoRefresh() {
    stopAutoRefresh();
    if (!autoRefresh.value) return;
    refreshTimer = setInterval(() => {
      if (autoRefresh.value && shopId.value) {
        fetchAll();
      }
    }, refreshIntervalMs.value);
    // tick "X seconds ago" indicator
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
    salesChart.value = null;
    operations.value = null;
    topProducts.value = [];
    recentActivity.value = [];
    paymentBreakdown.value = null;
    alerts.value = null;
    cashierLeaderboard.value = [];
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
    salesChart,
    operations,
    topProducts,
    recentActivity,
    paymentBreakdown,
    alerts,
    cashierLeaderboard,
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
