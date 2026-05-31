<template>
  <div class="space-y-5">
    <!-- ============================================ -->
    <!-- STICKY TOP BAR                                -->
    <!-- ============================================ -->
    <div
      class="sticky top-0 lg:top-16 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <!-- Period selector -->
      <div
        class="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 self-start"
      >
        <button
          v-for="p in periods"
          :key="p.value"
          type="button"
          :class="[
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            store.period === p.value
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100',
          ]"
          @click="setPeriod(p.value)"
        >
          {{ p.label }}
        </button>
      </div>

      <!-- Last updated indicator -->
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-[11px] text-slate-500 dark:text-slate-400">
          {{ lastUpdatedLabel }}
        </span>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- NO SHOP STATE                                 -->
    <!-- ============================================ -->
    <div
      v-if="!shopId"
      class="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-6 text-center"
    >
      <p class="text-sm font-semibold text-amber-800 dark:text-amber-200">
        Silakan pilih cabang terlebih dahulu
      </p>
      <p class="text-xs text-amber-700 dark:text-amber-300 mt-1">
        Dashboard butuh konteks cabang aktif untuk memuat data.
      </p>
    </div>

    <template v-else>
      <!-- ============================================ -->
      <!-- ROW 1: KPI CARDS                              -->
      <!-- ============================================ -->
      <SectionWrapper :error="store.errors.overview" @retry="store.fetchSection('overview')">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            label="Omzet"
            :value="store.overview?.kpi.revenue.value ?? 0"
            :previous-value="store.overview?.kpi.revenue.previousValue"
            :change-percent="store.overview?.kpi.revenue.changePercent"
            :icon="WalletIcon"
            tone="blue"
            format="rupiah"
            :loading="store.loading.overview"
          />
          <KpiCard
            label="Transaksi"
            :value="store.overview?.kpi.transactions.value ?? 0"
            :previous-value="store.overview?.kpi.transactions.previousValue"
            :change-percent="store.overview?.kpi.transactions.changePercent"
            :icon="ReceiptIcon"
            tone="indigo"
            format="number"
            :loading="store.loading.overview"
          />
          <KpiCard
            label="Profit"
            :value="store.overview?.kpi.profit.value ?? 0"
            :previous-value="store.overview?.kpi.profit.previousValue"
            :change-percent="store.overview?.kpi.profit.changePercent"
            :icon="TrendingUpIcon"
            tone="emerald"
            format="rupiah"
            :loading="store.loading.overview"
          />
          <KpiCard
            label="AOV (rata-rata/trx)"
            :value="store.overview?.kpi.aov.value ?? 0"
            :previous-value="store.overview?.kpi.aov.previousValue"
            :change-percent="store.overview?.kpi.aov.changePercent"
            :icon="CalculatorIcon"
            tone="amber"
            format="rupiah"
            :loading="store.loading.overview"
          />
        </div>
      </SectionWrapper>

      <!-- ============================================ -->
      <!-- ROW 2: QUICK ACTIONS                          -->
      <!-- ============================================ -->
      <QuickActions />

      <!-- ============================================ -->
      <!-- ROW 3: SALES CHART + CATEGORY CHART          -->
      <!-- ============================================ -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="lg:col-span-2">
          <SectionWrapper
            :error="store.errors.salesChart"
            @retry="store.fetchSection('salesChart')"
          >
            <SalesChart
              :labels="store.salesChart?.labels ?? []"
              :revenue="store.salesChart?.revenue ?? []"
              :profit="store.salesChart?.profit ?? []"
              :period="store.period"
              :loading="store.loading.salesChart"
            />
          </SectionWrapper>
        </div>
        <CategorySalesChart
          :categories="categorySalesData"
          :loading="store.loading.topProducts"
        />
      </div>

      <!-- ============================================ -->
      <!-- ROW 4: ALERTS                                 -->
      <!-- ============================================ -->
      <SectionWrapper :error="store.errors.alerts" @retry="store.fetchSection('alerts')">
        <div v-if="store.alerts?.allClear" class="grid grid-cols-1">
          <AlertCard
            severity="green"
            :all-clear="true"
            title="Semua aman ✓"
            description="Tidak ada hutang jatuh tempo, stok menipis, atau shift terlalu lama."
          />
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Hutang Jatuh Tempo -->
          <AlertCard
            severity="red"
            title="Hutang Jatuh Tempo"
            :count="store.alerts?.overdueDebts.count ?? 0"
            :description="
              store.alerts?.overdueDebts.count
                ? `Total ${formatRupiah(store.alerts.overdueDebts.totalAmount)} dari ${store.alerts.overdueDebts.count} hutang.`
                : 'Tidak ada hutang jatuh tempo.'
            "
            action-label="Lihat Hutang"
            action-to="/admin/debts"
          >
            <ul
              v-if="store.alerts?.overdueDebts.topItems?.length"
              class="text-[11px] space-y-1 mt-1"
            >
              <li
                v-for="d in store.alerts.overdueDebts.topItems.slice(0, 3)"
                :key="d.id"
                class="flex items-center justify-between text-red-700 dark:text-red-300"
              >
                <span class="truncate">{{ d.customerName }}</span>
                <span class="font-mono shrink-0 ml-2">
                  {{ d.daysOverdue > 0 ? `${d.daysOverdue}h lewat` : 'jatuh tempo' }}
                </span>
              </li>
            </ul>
          </AlertCard>

          <!-- Stok Menipis -->
          <AlertCard
            severity="yellow"
            title="Stok Menipis"
            :count="store.alerts?.lowStock.count ?? 0"
            :description="
              store.alerts?.lowStock.count
                ? `${store.alerts.lowStock.count} produk di bawah threshold ${store.alerts.config.lowStockThreshold} unit.`
                : 'Semua stok di atas threshold.'
            "
            action-label="Kelola Stok"
            action-to="/admin/products"
          >
            <ul
              v-if="store.alerts?.lowStock.topItems?.length"
              class="text-[11px] space-y-1 mt-1"
            >
              <li
                v-for="p in store.alerts.lowStock.topItems.slice(0, 3)"
                :key="p.productId"
                class="flex items-center justify-between text-yellow-800 dark:text-yellow-300"
              >
                <span class="truncate">{{ p.name }}</span>
                <span class="font-mono shrink-0 ml-2">{{ p.quantity }} / {{ p.threshold }}</span>
              </li>
            </ul>
          </AlertCard>

          <!-- Shift terlalu lama -->
          <AlertCard
            severity="orange"
            title="Shift Lama Tidak Tutup"
            :count="store.alerts?.longRunningShifts.count ?? 0"
            :description="
              store.alerts?.longRunningShifts.count
                ? `${store.alerts.longRunningShifts.count} shift sudah lebih dari ${store.alerts.config.shiftDurationWarningHours} jam.`
                : 'Semua shift dalam batas wajar.'
            "
            action-label="Cek Shift"
            action-to="/admin/shifts"
          >
            <ul
              v-if="store.alerts?.longRunningShifts.shifts?.length"
              class="text-[11px] space-y-1 mt-1"
            >
              <li
                v-for="s in store.alerts.longRunningShifts.shifts.slice(0, 3)"
                :key="s.id"
                class="flex items-center justify-between text-orange-800 dark:text-orange-300"
              >
                <span class="truncate">{{ s.cashier }}</span>
                <span class="font-mono shrink-0 ml-2">{{ s.hours }} jam</span>
              </li>
            </ul>
          </AlertCard>
        </div>
      </SectionWrapper>

    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch, h, type FunctionalComponent } from 'vue';
import { useRouter } from 'vue-router';
import {
  Wallet as WalletIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Calculator as CalculatorIcon,
  AlertTriangle as AlertTriangleIcon,
} from 'lucide-vue-next';
import { useShopStore } from '@/shared/stores/shop.store';
import { useDashboardRetailStore } from '@/shared/stores/dashboard-retail.store';
import KpiCard from '@/admin/components/dashboard/KpiCard.vue';
import QuickActions from '@/admin/components/dashboard/QuickActions.vue';
import SalesChart from '@/admin/components/dashboard/SalesChart.vue';
import OperationsPanel from '@/admin/components/dashboard/OperationsPanel.vue';
import TopProductsTable from '@/admin/components/dashboard/TopProductsTable.vue';
import RecentActivityFeed from '@/admin/components/dashboard/RecentActivityFeed.vue';
import PaymentBreakdown from '@/admin/components/dashboard/PaymentBreakdown.vue';
import AlertCard from '@/admin/components/dashboard/AlertCard.vue';
import CashierLeaderboard from '@/admin/components/dashboard/CashierLeaderboard.vue';
import CategorySalesChart from '@/admin/components/dashboard/CategorySalesChart.vue';
import type { DashboardPeriod } from '@/shared/services/dashboard.service';

const router = useRouter();
const shopStore = useShopStore();
const store = useDashboardRetailStore();

const shopId = computed(() => shopStore.currentShopId);

// =====================================================
// Period selector
// =====================================================

const periods: Array<{ value: DashboardPeriod; label: string }> = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'week', label: '7 Hari' },
  { value: 'month', label: '30 Hari' },
];

function setPeriod(p: DashboardPeriod) {
  if (store.period === p) return;
  store.setPeriod(p);
  store.fetchAll();
}

const comparisonTitle = computed(() => {
  if (store.period === 'today') return 'Hari Ini vs Kemarin';
  if (store.period === 'week') return '7 Hari Ini vs 7 Hari Sebelumnya';
  return '30 Hari Ini vs 30 Hari Sebelumnya';
});

/**
 * Category sales data — derived from topProducts (which already has product info).
 * Groups revenue by product category.
 */
const categorySalesData = computed(() => {
  if (!store.topProducts || store.topProducts.length === 0) return [];
  // Group by category (topProducts may have category field)
  const catMap = new Map<string, number>();
  for (const p of store.topProducts) {
    const catName = (p as any).category || 'Lainnya';
    catMap.set(catName, (catMap.get(catName) || 0) + ((p as any).totalRevenue || (p as any).revenue || 0));
  }
  return Array.from(catMap.entries()).map(([name, revenue]) => ({ name, revenue }));
});

// =====================================================
// Last updated label
// =====================================================

const lastUpdatedLabel = computed(() => {
  if (!store.lastUpdatedAt) return store.isAnyLoading ? 'Memuat...' : 'Belum dimuat';
  const s = store.lastUpdatedSecondsAgo;
  if (s < 5) return 'Update barusan';
  if (s < 60) return `Update ${s} detik lalu`;
  return `Update ${Math.floor(s / 60)} menit lalu`;
});

function onSelectProduct(productId: string) {
  router.push({ path: '/admin/products', query: { id: productId } });
}

function formatRupiah(v: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v || 0);
}

// =====================================================
// Lifecycle
// =====================================================

onMounted(async () => {
  store.setShopId(shopId.value);
  if (shopId.value) {
    await store.fetchAll();
    store.startAutoRefresh();
  }
});

watch(shopId, async (newId) => {
  store.setShopId(newId);
  if (newId) {
    await store.fetchAll();
    store.startAutoRefresh();
  } else {
    store.stopAutoRefresh();
  }
});

onBeforeUnmount(() => {
  store.teardown();
});

// =====================================================
// Inline component: SectionWrapper (error boundary per section)
// =====================================================

const SectionWrapper: FunctionalComponent<
  { error: string | null },
  { retry: () => void }
> = (props, { slots, emit }) => {
  if (props.error) {
    return h(
      'div',
      {
        class:
          'rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 flex items-start gap-3',
      },
      [
        h(AlertTriangleIcon, {
          class: 'w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5',
        }),
        h('div', { class: 'flex-1 min-w-0' }, [
          h(
            'p',
            { class: 'text-sm font-semibold text-red-800 dark:text-red-200' },
            'Section gagal dimuat',
          ),
          h(
            'p',
            { class: 'text-[11px] text-red-700 dark:text-red-300 mt-0.5 break-words' },
            props.error,
          ),
          h(
            'button',
            {
              type: 'button',
              class:
                'mt-2 text-[11px] font-semibold text-red-700 dark:text-red-300 hover:underline',
              onClick: () => emit('retry'),
            },
            'Coba lagi →',
          ),
        ]),
      ],
    );
  }
  return slots.default ? h('div', null, slots.default()) : null;
};
SectionWrapper.props = ['error'];
SectionWrapper.emits = ['retry'];

// =====================================================
// Inline component: ComparisonRow
// =====================================================

const ComparisonRow: FunctionalComponent<{
  label: string;
  current: number;
  previous: number;
  changePercent: number;
  color: string;
  format: 'rupiah' | 'number';
  loading?: boolean;
}> = (props) => {
  const fmt = (v: number) =>
    props.format === 'rupiah'
      ? new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(v || 0)
      : new Intl.NumberFormat('id-ID').format(v || 0);

  const positive = props.changePercent >= 0;
  const pct = `${positive ? '+' : ''}${props.changePercent}%`;
  const max = Math.max(props.current, props.previous, 1);
  const widthCurrent = `${Math.min(100, Math.max(2, (props.current / max) * 100))}%`;
  const widthPrevious = `${Math.min(100, Math.max(2, (props.previous / max) * 100))}%`;

  if (props.loading) {
    return h('div', { class: 'h-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse' });
  }

  return h('div', { class: 'space-y-1' }, [
    h('div', { class: 'flex items-center justify-between' }, [
      h(
        'span',
        { class: 'text-xs font-semibold text-slate-700 dark:text-slate-300' },
        props.label,
      ),
      h(
        'span',
        {
          class: [
            'text-xs font-bold',
            positive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400',
          ],
        },
        pct,
      ),
    ]),
    h('div', { class: 'space-y-1' }, [
      h(
        'div',
        {
          class:
            'h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex items-center',
        },
        [
          h('div', {
            class: ['h-full rounded-full', props.color],
            style: { width: widthCurrent },
          }),
        ],
      ),
      h(
        'div',
        {
          class:
            'h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex items-center',
        },
        [
          h('div', {
            class: 'h-full rounded-full bg-slate-300 dark:bg-slate-600',
            style: { width: widthPrevious },
          }),
        ],
      ),
    ]),
    h(
      'div',
      {
        class:
          'flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono',
      },
      [h('span', null, `Sekarang: ${fmt(props.current)}`), h('span', null, `Sebelumnya: ${fmt(props.previous)}`)],
    ),
  ]);
};
ComparisonRow.props = [
  'label',
  'current',
  'previous',
  'changePercent',
  'color',
  'format',
  'loading',
];
</script>
