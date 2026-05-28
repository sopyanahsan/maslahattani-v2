<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-slate-950">Analytics</h1>
        <p class="text-xs text-slate-500">Dashboard analitik bisnis &amp; insight</p>
      </div>

      <!-- Period Selector -->
      <div class="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
        <button
          v-for="p in periods"
          :key="p.value"
          :class="[
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            selectedPeriod === p.value
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900',
          ]"
          @click="selectedPeriod = p.value"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center py-16 text-slate-500">
      <svg class="w-8 h-8 animate-spin mb-3 text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p class="text-sm">Memuat data analytics...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <p class="text-sm text-red-700 font-medium mb-2">Gagal memuat data</p>
      <p class="text-xs text-red-600 mb-3">{{ error }}</p>
      <button
        class="px-4 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
        @click="fetchAll"
      >
        Coba Lagi
      </button>
    </div>

    <!-- No Shop Selected -->
    <div v-else-if="!shopId" class="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
      <p class="text-sm text-amber-800 font-medium">Silakan pilih cabang terlebih dahulu</p>
      <p class="text-xs text-amber-600 mt-1">Analytics membutuhkan cabang aktif untuk menampilkan data.</p>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <div class="bg-white rounded-lg border border-slate-200 p-4">
          <p class="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Total Omzet</p>
          <p class="text-lg font-bold text-slate-900 mt-1">{{ formatRupiah(overview.totalRevenue) }}</p>
        </div>
        <div class="bg-white rounded-lg border border-slate-200 p-4">
          <p class="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Total Profit</p>
          <p class="text-lg font-bold text-emerald-700 mt-1">{{ formatRupiah(overview.totalProfit) }}</p>
        </div>
        <div class="bg-white rounded-lg border border-slate-200 p-4">
          <p class="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Jumlah Transaksi</p>
          <p class="text-lg font-bold text-slate-900 mt-1">{{ overview.totalTransactions }}</p>
        </div>
        <div class="bg-white rounded-lg border border-slate-200 p-4">
          <p class="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Rata-rata/Trx</p>
          <p class="text-lg font-bold text-slate-900 mt-1">{{ formatRupiah(overview.avgTransactionValue) }}</p>
        </div>
        <div class="bg-white rounded-lg border border-slate-200 p-4">
          <p class="text-[11px] font-medium text-slate-500 uppercase tracking-wide">BRILink Fee</p>
          <p class="text-lg font-bold text-blue-700 mt-1">{{ formatRupiah(overview.totalBrilinkFee) }}</p>
          <p class="text-[10px] text-slate-400 mt-0.5">{{ overview.totalBrilink }} trx</p>
        </div>
        <div class="bg-white rounded-lg border border-slate-200 p-4">
          <p class="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Hutang Aktif</p>
          <p class="text-lg font-bold text-amber-700 mt-1">{{ formatRupiah(overview.debtAmount) }}</p>
          <p class="text-[10px] text-slate-400 mt-0.5">{{ overview.activeDebts }} piutang</p>
        </div>
      </div>

      <!-- Revenue Chart & Comparison -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Revenue Chart -->
        <div class="lg:col-span-2 bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div class="px-4 sm:px-5 py-3 border-b border-slate-200">
            <h3 class="text-sm font-bold text-slate-950">Grafik Pendapatan</h3>
            <p class="text-[11px] text-slate-500">Revenue & profit per periode</p>
          </div>
          <div class="p-4 sm:p-5">
            <div v-if="revenueChart.labels.length === 0" class="py-8 text-center text-xs text-slate-400">
              Belum ada data transaksi
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="(label, idx) in revenueChart.labels"
                :key="label"
                class="flex items-center gap-3"
              >
                <span class="text-[10px] text-slate-500 w-20 shrink-0 text-right font-mono">
                  {{ formatChartLabel(label) }}
                </span>
                <div class="flex-1 flex flex-col gap-0.5">
                  <!-- Revenue bar -->
                  <div class="flex items-center gap-2">
                    <div
                      class="h-4 rounded-sm bg-blue-500 transition-all duration-300"
                      :style="{ width: getBarWidth(revenueChart.datasets.revenue[idx], maxRevenue) }"
                    />
                    <span class="text-[10px] text-slate-600 font-mono">
                      {{ formatCompact(revenueChart.datasets.revenue[idx]) }}
                    </span>
                  </div>
                  <!-- Profit bar -->
                  <div class="flex items-center gap-2">
                    <div
                      class="h-3 rounded-sm bg-emerald-400 transition-all duration-300"
                      :style="{ width: getBarWidth(revenueChart.datasets.profit[idx], maxRevenue) }"
                    />
                    <span class="text-[10px] text-emerald-700 font-mono">
                      {{ formatCompact(revenueChart.datasets.profit[idx]) }}
                    </span>
                  </div>
                </div>
                <span class="text-[10px] text-slate-400 w-8 text-right">
                  {{ revenueChart.datasets.transactions[idx] }}
                </span>
              </div>
              <!-- Legend -->
              <div class="flex items-center gap-4 pt-3 border-t border-slate-100">
                <span class="flex items-center gap-1.5 text-[10px] text-slate-600">
                  <span class="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Revenue
                </span>
                <span class="flex items-center gap-1.5 text-[10px] text-slate-600">
                  <span class="w-3 h-3 rounded-sm bg-emerald-400 inline-block" /> Profit
                </span>
                <span class="text-[10px] text-slate-400 ml-auto">angka kanan = jml trx</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Month Comparison -->
        <div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div class="px-4 sm:px-5 py-3 border-b border-slate-200">
            <h3 class="text-sm font-bold text-slate-950">Perbandingan Bulan</h3>
            <p class="text-[11px] text-slate-500">Bulan ini vs bulan lalu</p>
          </div>
          <div class="p-4 sm:p-5 space-y-4">
            <!-- Revenue Comparison -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-600">Omzet</span>
                <span :class="[
                  'flex items-center gap-0.5 text-xs font-semibold',
                  comparison.growth.revenue >= 0 ? 'text-emerald-700' : 'text-red-700'
                ]">
                  <span v-if="comparison.growth.revenue >= 0">&#9650;</span>
                  <span v-else>&#9660;</span>
                  {{ Math.abs(comparison.growth.revenue) }}%
                </span>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full bg-blue-500 rounded-full" :style="{ width: getComparisonWidth(comparison.current.revenue, comparison.previous.revenue) }" />
                </div>
              </div>
              <div class="flex justify-between text-[10px] text-slate-400">
                <span>Bulan ini: {{ formatCompact(comparison.current.revenue) }}</span>
                <span>Bulan lalu: {{ formatCompact(comparison.previous.revenue) }}</span>
              </div>
            </div>

            <!-- Profit Comparison -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-600">Profit</span>
                <span :class="[
                  'flex items-center gap-0.5 text-xs font-semibold',
                  comparison.growth.profit >= 0 ? 'text-emerald-700' : 'text-red-700'
                ]">
                  <span v-if="comparison.growth.profit >= 0">&#9650;</span>
                  <span v-else>&#9660;</span>
                  {{ Math.abs(comparison.growth.profit) }}%
                </span>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full bg-emerald-500 rounded-full" :style="{ width: getComparisonWidth(comparison.current.profit, comparison.previous.profit) }" />
                </div>
              </div>
              <div class="flex justify-between text-[10px] text-slate-400">
                <span>Bulan ini: {{ formatCompact(comparison.current.profit) }}</span>
                <span>Bulan lalu: {{ formatCompact(comparison.previous.profit) }}</span>
              </div>
            </div>

            <!-- Transactions Comparison -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-600">Transaksi</span>
                <span :class="[
                  'flex items-center gap-0.5 text-xs font-semibold',
                  comparison.growth.transactions >= 0 ? 'text-emerald-700' : 'text-red-700'
                ]">
                  <span v-if="comparison.growth.transactions >= 0">&#9650;</span>
                  <span v-else>&#9660;</span>
                  {{ Math.abs(comparison.growth.transactions) }}%
                </span>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full bg-indigo-500 rounded-full" :style="{ width: getComparisonWidth(comparison.current.transactions, comparison.previous.transactions) }" />
                </div>
              </div>
              <div class="flex justify-between text-[10px] text-slate-400">
                <span>Bulan ini: {{ comparison.current.transactions }}</span>
                <span>Bulan lalu: {{ comparison.previous.transactions }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Products & Payment Breakdown -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Top Products -->
        <div class="lg:col-span-2 bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div class="px-4 sm:px-5 py-3 border-b border-slate-200">
            <h3 class="text-sm font-bold text-slate-950">Produk Terlaris</h3>
            <p class="text-[11px] text-slate-500">Top 10 berdasarkan revenue</p>
          </div>
          <div v-if="topProducts.length === 0" class="p-8 text-center">
            <p class="text-xs text-slate-400">Belum ada data produk</p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[500px]">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wide w-8">#</th>
                  <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wide">Produk</th>
                  <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-700 uppercase tracking-wide">Qty</th>
                  <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-700 uppercase tracking-wide">Revenue</th>
                  <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-700 uppercase tracking-wide">Profit</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="(product, idx) in topProducts"
                  :key="product.productId"
                  class="hover:bg-slate-50 transition-colors"
                >
                  <td class="px-4 py-2.5 text-sm text-slate-500 font-mono">{{ idx + 1 }}</td>
                  <td class="px-4 py-2.5">
                    <p class="text-sm font-medium text-slate-900">{{ product.name }}</p>
                    <p class="text-[10px] text-slate-400 font-mono">{{ product.sku }}</p>
                  </td>
                  <td class="px-4 py-2.5 text-sm text-right text-slate-700 font-mono">{{ product.totalSold }}</td>
                  <td class="px-4 py-2.5 text-sm text-right text-slate-900 font-mono font-medium">{{ formatRupiah(product.totalRevenue) }}</td>
                  <td class="px-4 py-2.5 text-sm text-right text-emerald-700 font-mono">{{ formatRupiah(product.totalProfit) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Payment Breakdown -->
        <div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div class="px-4 sm:px-5 py-3 border-b border-slate-200">
            <h3 class="text-sm font-bold text-slate-950">Metode Pembayaran</h3>
            <p class="text-[11px] text-slate-500">Breakdown per metode</p>
          </div>
          <div class="p-4 sm:p-5 space-y-3">
            <div v-if="paymentBreakdown.total === 0" class="py-4 text-center text-xs text-slate-400">
              Belum ada data pembayaran
            </div>
            <template v-else>
              <div
                v-for="method in paymentMethods"
                :key="method.key"
                class="space-y-1"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-slate-700">{{ method.label }}</span>
                  <span class="text-xs text-slate-500 font-mono">
                    {{ formatRupiah(paymentBreakdown[method.key as keyof typeof paymentBreakdown] as number) }}
                  </span>
                </div>
                <div class="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    :class="['h-full rounded-full transition-all duration-300', method.color]"
                    :style="{ width: getPaymentPercent(method.key) }"
                  />
                </div>
                <p class="text-[10px] text-slate-400 text-right">
                  {{ getPaymentPercentLabel(method.key) }}
                </p>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Hourly Distribution -->
      <div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div class="px-4 sm:px-5 py-3 border-b border-slate-200">
          <h3 class="text-sm font-bold text-slate-950">Distribusi Jam Sibuk</h3>
          <p class="text-[11px] text-slate-500">Rata-rata transaksi per jam ({{ periodLabel }})</p>
        </div>
        <div class="p-4 sm:p-5">
          <div v-if="hourlyData.length === 0" class="py-8 text-center text-xs text-slate-400">
            Belum ada data
          </div>
          <div v-else class="flex items-end gap-1 h-32">
            <div
              v-for="hour in hourlyData"
              :key="hour.hour"
              class="flex-1 flex flex-col items-center gap-1 group relative"
            >
              <div
                :class="[
                  'w-full rounded-t-sm transition-all duration-200',
                  hour.avgTransactions === maxHourly ? 'bg-blue-500' : 'bg-blue-200 group-hover:bg-blue-300',
                ]"
                :style="{ height: getHourBarHeight(hour.avgTransactions) }"
                :title="`${hour.hour}:00 - ${hour.avgTransactions} trx/hari`"
              />
              <span
                v-if="hour.hour % 3 === 0"
                class="text-[9px] text-slate-400 font-mono"
              >
                {{ String(hour.hour).padStart(2, '0') }}
              </span>
              <span v-else class="text-[9px] text-transparent">.</span>
            </div>
          </div>
          <!-- Peak hour info -->
          <div v-if="peakHour !== null" class="mt-3 pt-3 border-t border-slate-100">
            <p class="text-[11px] text-slate-600">
              Jam tersibuk:
              <span class="font-semibold text-blue-700">{{ String(peakHour).padStart(2, '0') }}:00</span>
              (rata-rata {{ maxHourly }} transaksi/hari)
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useShopStore } from '@/shared/stores/shop.store';
import analyticsService, {
  type AnalyticsPeriod,
  type AnalyticsOverview,
  type RevenueChartData,
  type TopProduct,
  type PaymentBreakdown,
  type HourlyData,
  type ComparisonData,
} from '@/shared/services/analytics.service';

// ============================================
// State
// ============================================

const shopStore = useShopStore();
const shopId = computed(() => shopStore.currentShopId);

const periods: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'week', label: 'Minggu' },
  { value: 'month', label: 'Bulan' },
  { value: 'year', label: 'Tahun' },
];

const selectedPeriod = ref<AnalyticsPeriod>('month');
const loading = ref(false);
const error = ref<string | null>(null);

const overview = ref<AnalyticsOverview>({
  totalRevenue: 0,
  totalProfit: 0,
  totalTransactions: 0,
  avgTransactionValue: 0,
  totalBrilink: 0,
  totalBrilinkFee: 0,
  activeDebts: 0,
  debtAmount: 0,
});

const revenueChart = ref<RevenueChartData>({
  labels: [],
  datasets: { revenue: [], profit: [], transactions: [] },
});

const topProducts = ref<TopProduct[]>([]);

const paymentBreakdown = ref<PaymentBreakdown>({
  cash: 0,
  qris: 0,
  transfer: 0,
  hutang: 0,
  total: 0,
});

const hourlyData = ref<HourlyData[]>([]);

const comparison = ref<ComparisonData>({
  current: { revenue: 0, profit: 0, transactions: 0 },
  previous: { revenue: 0, profit: 0, transactions: 0 },
  growth: { revenue: 0, profit: 0, transactions: 0 },
});

// ============================================
// Computed
// ============================================

const maxRevenue = computed(() => {
  if (!revenueChart.value.datasets.revenue.length) return 1;
  return Math.max(...revenueChart.value.datasets.revenue, 1);
});

const maxHourly = computed(() => {
  if (!hourlyData.value.length) return 1;
  return Math.max(...hourlyData.value.map((h) => h.avgTransactions), 1);
});

const peakHour = computed(() => {
  if (!hourlyData.value.length) return null;
  const max = maxHourly.value;
  const peak = hourlyData.value.find((h) => h.avgTransactions === max);
  return peak ? peak.hour : null;
});

const periodLabel = computed(() => {
  const found = periods.find((p) => p.value === selectedPeriod.value);
  return found ? found.label : '';
});

const paymentMethods = [
  { key: 'cash', label: 'Tunai (Cash)', color: 'bg-emerald-500' },
  { key: 'qris', label: 'QRIS', color: 'bg-blue-500' },
  { key: 'transfer', label: 'Transfer', color: 'bg-indigo-500' },
  { key: 'hutang', label: 'Hutang', color: 'bg-amber-500' },
];

// ============================================
// Methods
// ============================================

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}rb`;
  return String(amount);
}

function formatChartLabel(label: string): string {
  // YYYY-MM-DD → DD/MM or YYYY-MM → MMM
  if (label.length === 10) {
    const parts = label.split('-');
    return `${parts[2]}/${parts[1]}`;
  }
  if (label.length === 7) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthIdx = parseInt(label.split('-')[1], 10) - 1;
    return months[monthIdx] || label;
  }
  return label;
}

function getBarWidth(value: number, max: number): string {
  if (max === 0) return '0%';
  const pct = Math.max(1, (value / max) * 100);
  return `${pct}%`;
}

function getHourBarHeight(value: number): string {
  if (maxHourly.value === 0) return '2px';
  const pct = Math.max(2, (value / maxHourly.value) * 100);
  return `${pct}%`;
}

function getComparisonWidth(current: number, previous: number): string {
  const max = Math.max(current, previous, 1);
  const pct = (current / max) * 100;
  return `${Math.min(100, Math.max(5, pct))}%`;
}

function getPaymentPercent(key: string): string {
  const value = (paymentBreakdown.value as Record<string, number>)[key] || 0;
  const total = paymentBreakdown.value.total || 1;
  return `${Math.round((value / total) * 100)}%`;
}

function getPaymentPercentLabel(key: string): string {
  const value = (paymentBreakdown.value as Record<string, number>)[key] || 0;
  const total = paymentBreakdown.value.total || 1;
  return `${Math.round((value / total) * 100)}%`;
}

// ============================================
// Data Fetching
// ============================================

async function fetchAll() {
  if (!shopId.value) return;

  loading.value = true;
  error.value = null;

  try {
    const [
      overviewData,
      chartData,
      productsData,
      paymentData,
      hourlyResult,
      comparisonData,
    ] = await Promise.all([
      analyticsService.getOverview(shopId.value, selectedPeriod.value),
      analyticsService.getRevenueChart(shopId.value, selectedPeriod.value),
      analyticsService.getTopProducts(shopId.value, selectedPeriod.value, 10),
      analyticsService.getPaymentBreakdown(shopId.value, selectedPeriod.value),
      analyticsService.getHourlyDistribution(shopId.value, selectedPeriod.value),
      analyticsService.getComparison(shopId.value),
    ]);

    overview.value = overviewData;
    revenueChart.value = chartData;
    topProducts.value = productsData;
    paymentBreakdown.value = paymentData;
    hourlyData.value = hourlyResult;
    comparison.value = comparisonData;
  } catch (err: any) {
    error.value = err?.response?.data?.message || err?.message || 'Terjadi kesalahan';
  } finally {
    loading.value = false;
  }
}

// ============================================
// Watchers
// ============================================

watch([selectedPeriod, shopId], () => {
  fetchAll();
});

onMounted(() => {
  fetchAll();
});
</script>
