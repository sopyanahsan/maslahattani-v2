<template>
  <div class="space-y-5">
    <!-- ============================================ -->
    <!-- TOP BAR: Title + Period Selector + Refresh   -->
    <!-- ============================================ -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-slate-950 dark:text-slate-100">Dashboard BRILink</h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Monitoring layanan BRILink — transaksi, fee, saldo rekening.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <!-- Period selector -->
        <div class="flex gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          <button
            v-for="opt in periodOptions"
            :key="opt.value"
            type="button"
            :class="[
              'h-7 px-3 text-[11px] font-semibold rounded-md transition-colors',
              store.period === opt.value
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200',
            ]"
            @click="handlePeriodChange(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>

        <!-- Auto-refresh toggle -->
        <button
          type="button"
          :class="[
            'h-7 px-2.5 text-[11px] font-semibold rounded-md border transition-colors flex items-center gap-1',
            store.autoRefresh
              ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
          ]"
          :title="store.autoRefresh ? 'Auto-refresh aktif (30s)' : 'Auto-refresh nonaktif'"
          @click="store.toggleAutoRefresh()"
        >
          <RefreshCwIcon :class="['w-3 h-3', store.autoRefresh && 'animate-spin']" />
          {{ store.autoRefresh ? 'ON' : 'OFF' }}
        </button>

        <!-- Manual refresh -->
        <button
          type="button"
          class="h-7 px-2.5 text-[11px] font-semibold rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          :disabled="store.isAnyLoading"
          @click="store.fetchAll()"
        >
          Refresh
        </button>
      </div>
    </div>

    <!-- Last updated indicator -->
    <p
      v-if="store.lastUpdatedAt"
      class="text-[10px] text-slate-400 dark:text-slate-500"
    >
      Terakhir diperbarui {{ store.lastUpdatedSecondsAgo }}s yang lalu
    </p>

    <!-- ============================================ -->
    <!-- ROW 1: KPI Cards (4)                         -->
    <!-- ============================================ -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard
        label="Total Transaksi"
        :value="store.overview?.kpi.transactions.value ?? 0"
        :previous-value="store.overview?.kpi.transactions.previousValue"
        :change-percent="store.overview?.kpi.transactions.changePercent"
        :icon="HashIcon"
        tone="blue"
        format="number"
        :loading="store.loading.overview"
      />
      <KpiCard
        label="Volume Transaksi"
        :value="store.overview?.kpi.volume.value ?? 0"
        :previous-value="store.overview?.kpi.volume.previousValue"
        :change-percent="store.overview?.kpi.volume.changePercent"
        :icon="BanknoteIcon"
        tone="indigo"
        format="rupiah"
        :loading="store.loading.overview"
      />
      <KpiCard
        label="Fee Earnings"
        :value="store.overview?.kpi.feeEarnings.value ?? 0"
        :previous-value="store.overview?.kpi.feeEarnings.previousValue"
        :change-percent="store.overview?.kpi.feeEarnings.changePercent"
        :icon="TrendingUpIcon"
        tone="emerald"
        format="rupiah"
        :loading="store.loading.overview"
      />
      <KpiCard
        label="Avg Fee/Trx"
        :value="store.overview?.kpi.avgFee.value ?? 0"
        :previous-value="store.overview?.kpi.avgFee.previousValue"
        :change-percent="store.overview?.kpi.avgFee.changePercent"
        :icon="CalculatorIcon"
        tone="amber"
        format="rupiah"
        :loading="store.loading.overview"
      />
    </div>

    <!-- ============================================ -->
    <!-- ROW 2: Quick Actions (5 buttons)             -->
    <!-- ============================================ -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      <RouterLink
        v-for="action in quickActions"
        :key="action.label"
        :to="action.to"
        :class="[
          'group rounded-lg border px-3 py-2.5 transition-colors flex items-center gap-2',
          'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
          'hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/40 dark:hover:bg-blue-950/30',
        ]"
      >
        <div :class="['w-8 h-8 rounded-md flex items-center justify-center shrink-0', action.iconBg]">
          <component :is="action.icon" :class="['w-4 h-4', action.iconColor]" />
        </div>
        <div class="min-w-0">
          <p class="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{{ action.label }}</p>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate">{{ action.desc }}</p>
        </div>
      </RouterLink>
    </div>

    <!-- ============================================ -->
    <!-- ROW 3: Chart (2/3) + Accounts Panel (1/3)    -->
    <!-- ============================================ -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="lg:col-span-2">
        <BrilinkCategoryChart
          :chart-data="store.transactionsChart"
          :loading="store.loading.transactionsChart"
          :error="store.errors.transactionsChart"
        />
      </div>
      <div class="lg:col-span-1">
        <BrilinkAccountsPanel
          :accounts="store.accounts"
          :loading="store.loading.accounts"
          :error="store.errors.accounts"
        />
      </div>
    </div>

    <!-- ============================================ -->
    <!-- ROW 4: Breakdown + Recent Trx + Top Customer -->
    <!-- ============================================ -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <BrilinkCategoryBreakdown
        :breakdown="store.categoryBreakdown"
        :loading="store.loading.categoryBreakdown"
        :error="store.errors.categoryBreakdown"
      />
      <BrilinkRecentTransactions
        :transactions="store.recentTransactions"
        :loading="store.loading.recentTransactions"
        :error="store.errors.recentTransactions"
      />
      <BrilinkTopCustomers
        :customers="store.topCustomers"
        :loading="store.loading.topCustomers"
        :error="store.errors.topCustomers"
      />
    </div>

    <!-- ============================================ -->
    <!-- ROW 5: Alerts                                -->
    <!-- ============================================ -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <!-- All clear -->
      <AlertCard
        v-if="store.alerts?.allClear"
        severity="green"
        :all-clear="true"
        title="Semua Aman"
        description="Tidak ada alert aktif saat ini."
        class="md:col-span-3"
      />

      <template v-else-if="store.alerts">
        <!-- Low Balance -->
        <AlertCard
          severity="red"
          title="Saldo Rekening Rendah"
          :count="store.alerts.lowBalance.length"
          :description="
            store.alerts.lowBalance.length > 0
              ? store.alerts.lowBalance.map(a => a.label).join(', ')
              : 'Tidak ada rekening di bawah threshold'
          "
          action-label="Setor Saldo"
          :action-to="
            store.alerts.lowBalance.length > 0
              ? `/admin/kas-rekening-brilink?accountId=${store.alerts.lowBalance[0].accountId}`
              : '/admin/kas-rekening-brilink'
          "
          :all-clear="store.alerts.lowBalance.length === 0"
        />

        <!-- Failed Transactions -->
        <AlertCard
          severity="yellow"
          title="Transaksi Gagal Hari Ini"
          :count="store.alerts.failedTransactions.count"
          :description="`${store.alerts.failedTransactions.count} gagal (threshold: ${store.alerts.failedTransactions.threshold})`"
          action-label="Lihat Failed"
          action-to="/admin/brilink/transaksi?status=FAILED"
          :all-clear="!store.alerts.failedTransactions.isTriggered"
        />

        <!-- Categories without Fee -->
        <AlertCard
          severity="orange"
          title="Fee Rule Tidak Aktif"
          :count="store.alerts.categoriesWithoutFee.length"
          :description="
            store.alerts.categoriesWithoutFee.length > 0
              ? `${store.alerts.categoriesWithoutFee.length} kategori tanpa fee aktif`
              : 'Semua kategori punya fee rule'
          "
          action-label="Cek Fee"
          action-to="/admin/brilink/fee"
          :all-clear="store.alerts.categoriesWithoutFee.length === 0"
        />
      </template>

      <!-- Loading -->
      <div
        v-else-if="store.loading.alerts"
        class="md:col-span-3 h-20 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"
      />
    </div>

    <!-- ============================================ -->
    <!-- ROW 6: Comparison + Cashier Performance      -->
    <!-- ============================================ -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Today vs Previous (comparison) -->
      <div
        class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
      >
        <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h3 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Hari Ini vs Sebelumnya
          </h3>
        </div>
        <div v-if="store.loading.overview" class="p-5 space-y-3">
          <div v-for="i in 3" :key="i" class="h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div v-else-if="store.overview" class="p-5">
          <div class="grid grid-cols-3 gap-4">
            <div
              v-for="item in comparisonItems"
              :key="item.label"
              class="text-center"
            >
              <p class="text-[10px] text-slate-500 dark:text-slate-400 mb-1">{{ item.label }}</p>
              <p class="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                {{ item.current }}
              </p>
              <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Sblm: {{ item.previous }}
              </p>
              <span
                :class="[
                  'text-[10px] font-semibold',
                  item.change > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : item.change < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-slate-400',
                ]"
              >
                {{ item.change > 0 ? '▲' : item.change < 0 ? '▼' : '—' }}
                {{ Math.abs(item.change) }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cashier Performance -->
      <BrilinkCashierPerformance
        :cashiers="store.cashierPerformance"
        :loading="store.loading.cashierPerformance"
        :error="store.errors.cashierPerformance"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { RouterLink } from 'vue-router';
import {
  RefreshCw as RefreshCwIcon,
  Hash as HashIcon,
  Banknote as BanknoteIcon,
  TrendingUp as TrendingUpIcon,
  Calculator as CalculatorIcon,
  Landmark as LandmarkIcon,
  ScrollText as ScrollTextIcon,
  Settings as SettingsIcon,
  LayoutDashboard as DashboardIcon,
  Wallet as WalletIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useDashboardBrilinkStore } from '@/shared/stores/dashboard-brilink.store';
import type { DashboardPeriod } from '@/shared/services/dashboard-brilink.service';

import KpiCard from '@/admin/components/dashboard/KpiCard.vue';
import AlertCard from '@/admin/components/dashboard/AlertCard.vue';
import BrilinkCategoryChart from '@/admin/components/dashboard-brilink/BrilinkCategoryChart.vue';
import BrilinkAccountsPanel from '@/admin/components/dashboard-brilink/BrilinkAccountsPanel.vue';
import BrilinkCategoryBreakdown from '@/admin/components/dashboard-brilink/BrilinkCategoryBreakdown.vue';
import BrilinkRecentTransactions from '@/admin/components/dashboard-brilink/BrilinkRecentTransactions.vue';
import BrilinkTopCustomers from '@/admin/components/dashboard-brilink/BrilinkTopCustomers.vue';
import BrilinkCashierPerformance from '@/admin/components/dashboard-brilink/BrilinkCashierPerformance.vue';

const authStore = useAuthStore();
const store = useDashboardBrilinkStore();

const periodOptions: { value: DashboardPeriod; label: string }[] = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'week', label: '7 Hari' },
  { value: 'month', label: '30 Hari' },
];

// 5 Quick Actions (REPORTING ONLY — no "Buat Transaksi")
const quickActions = [
  {
    label: 'Mutasi & Rekening',
    desc: 'Saldo BRI agen',
    to: '/admin/kas-rekening-brilink',
    icon: LandmarkIcon,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    label: 'List Transaksi',
    desc: 'Riwayat BRILink',
    to: '/admin/brilink/transaksi',
    icon: ScrollTextIcon,
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    label: 'Pengaturan Fee',
    desc: 'Atur fee kategori',
    to: '/admin/brilink/fee',
    icon: SettingsIcon,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    label: 'Dashboard Retail',
    desc: 'Monitoring retail',
    to: '/admin/dashboard',
    icon: DashboardIcon,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    label: 'Mutasi Retail',
    desc: 'Kas retail',
    to: '/admin/kas-retail',
    icon: WalletIcon,
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
];

// Comparison section data
const comparisonItems = computed(() => {
  const kpi = store.overview?.kpi;
  if (!kpi) return [];
  return [
    {
      label: 'Total Trx',
      current: kpi.transactions.value.toLocaleString('id-ID'),
      previous: kpi.transactions.previousValue.toLocaleString('id-ID'),
      change: kpi.transactions.changePercent,
    },
    {
      label: 'Volume',
      current: formatCompact(kpi.volume.value),
      previous: formatCompact(kpi.volume.previousValue),
      change: kpi.volume.changePercent,
    },
    {
      label: 'Fee Earnings',
      current: formatCompact(kpi.feeEarnings.value),
      previous: formatCompact(kpi.feeEarnings.previousValue),
      change: kpi.feeEarnings.changePercent,
    },
  ];
});

function formatCompact(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  return `Rp ${amount}`;
}

function handlePeriodChange(p: DashboardPeriod) {
  store.setPeriod(p);
  store.fetchAll();
}

// Watch shop changes
watch(
  () => authStore.user?.shopId,
  (newShopId) => {
    if (newShopId) {
      store.setShopId(newShopId);
      store.fetchAll();
    }
  },
);

onMounted(() => {
  const shopId = authStore.user?.shopId;
  if (shopId) {
    store.setShopId(shopId);
    store.fetchAll();
    store.startAutoRefresh();
  }
});

onUnmounted(() => {
  store.teardown();
});
</script>
