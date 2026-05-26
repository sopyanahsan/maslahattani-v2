<template>
  <div class="space-y-5">
    <!-- Header -->
    <div>
      <h1 class="text-xl font-bold text-slate-950">Laporan</h1>
      <p class="text-xs text-slate-500 mt-0.5">
        Laporan penjualan, laba kotor, breakdown metode bayar, dan produk terlaris.
      </p>
    </div>

    <!-- Date filter -->
    <div class="flex flex-col sm:flex-row gap-3">
      <input
        v-model="startDate"
        type="date"
        class="h-9 px-3 text-sm border border-slate-300 rounded-lg
               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
      />
      <input
        v-model="endDate"
        type="date"
        class="h-9 px-3 text-sm border border-slate-300 rounded-lg
               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
      />
      <button
        type="button"
        class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg
               hover:bg-blue-700 transition-colors flex items-center gap-1.5"
        @click="fetchAll"
      >
        <FilterIcon class="w-3.5 h-3.5" />
        Terapkan
      </button>

      <!-- Quick ranges -->
      <div class="flex items-center gap-1.5">
        <button
          v-for="range in quickRanges"
          :key="range.label"
          type="button"
          class="h-7 px-2.5 text-[11px] font-medium border border-slate-200 rounded-md
                 hover:bg-slate-50 transition-colors"
          @click="applyRange(range.days)"
        >
          {{ range.label }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
      <span class="ml-2 text-sm text-slate-500">Memuat laporan...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
      <AlertCircleIcon class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>

    <template v-else-if="salesReport">
      <!-- ============================================ -->
      <!-- SUMMARY CARDS                               -->
      <!-- ============================================ -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="bg-white border border-slate-200 rounded-lg p-4">
          <p class="text-[11px] text-slate-500">Omzet</p>
          <p class="text-lg font-bold font-mono text-slate-950 mt-1">{{ formatRupiah(salesReport.summary.omzet) }}</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-lg p-4">
          <p class="text-[11px] text-slate-500">Laba Kotor</p>
          <p class="text-lg font-bold font-mono text-emerald-600 mt-1">{{ formatRupiah(salesReport.summary.profit) }}</p>
          <p class="text-[10px] text-slate-400 mt-0.5">Margin {{ salesReport.summary.marginPercent }}%</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-lg p-4">
          <p class="text-[11px] text-slate-500">Total Transaksi</p>
          <p class="text-lg font-bold font-mono text-slate-950 mt-1">{{ salesReport.summary.totalTransactions }}</p>
          <p class="text-[10px] text-slate-400 mt-0.5">Void: {{ salesReport.summary.totalVoided }}</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-lg p-4">
          <p class="text-[11px] text-slate-500">Total Diskon</p>
          <p class="text-lg font-bold font-mono text-amber-600 mt-1">{{ formatRupiah(salesReport.summary.diskon) }}</p>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- 2-COLUMN: Method Breakdown + Top Products   -->
      <!-- ============================================ -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <!-- Method breakdown -->
        <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 bg-slate-50">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCardIcon class="w-4 h-4 text-blue-600" />
              Breakdown Metode Bayar
            </h3>
          </div>
          <div class="p-5">
            <div v-if="salesReport.methodBreakdown.length === 0" class="text-center py-4">
              <p class="text-xs text-slate-500">Belum ada data.</p>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="mb in salesReport.methodBreakdown"
                :key="mb.method"
                class="flex items-center justify-between"
              >
                <div class="flex items-center gap-2.5">
                  <span :class="['inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase', methodBadge(mb.method)]">
                    {{ mb.method }}
                  </span>
                  <span class="text-xs text-slate-500">{{ mb.count }} trx</span>
                </div>
                <span class="text-sm font-mono font-semibold text-slate-900">{{ formatRupiah(mb.totalAmount) }}</span>
              </div>

              <!-- Total bar -->
              <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span class="text-xs font-bold text-slate-700">Total</span>
                <span class="text-sm font-mono font-bold text-slate-950">
                  {{ formatRupiah(salesReport.methodBreakdown.reduce((s, m) => s + m.totalAmount, 0)) }}
                </span>
              </div>

              <!-- Visual bars -->
              <div class="space-y-1.5 pt-2">
                <div
                  v-for="mb in salesReport.methodBreakdown"
                  :key="'bar-' + mb.method"
                  class="flex items-center gap-2"
                >
                  <span class="w-14 text-[10px] font-mono text-slate-500 text-right shrink-0">{{ mb.method }}</span>
                  <div class="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      :class="['h-full rounded-full', methodBarColor(mb.method)]"
                      :style="{ width: getMethodPercent(mb.totalAmount) + '%' }"
                    />
                  </div>
                  <span class="w-10 text-[10px] font-mono text-slate-500 text-right shrink-0">
                    {{ getMethodPercent(mb.totalAmount) }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Products -->
        <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 bg-slate-50">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrophyIcon class="w-4 h-4 text-amber-500" />
              Produk Terlaris (Top 10)
            </h3>
          </div>
          <div class="p-5">
            <div v-if="salesReport.topProducts.length === 0" class="text-center py-4">
              <p class="text-xs text-slate-500">Belum ada data.</p>
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-slate-100">
                    <th class="text-left text-[10px] font-bold text-slate-500 uppercase pb-2">#</th>
                    <th class="text-left text-[10px] font-bold text-slate-500 uppercase pb-2">Produk</th>
                    <th class="text-right text-[10px] font-bold text-slate-500 uppercase pb-2">Qty</th>
                    <th class="text-right text-[10px] font-bold text-slate-500 uppercase pb-2">Revenue</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  <tr v-for="(tp, idx) in salesReport.topProducts" :key="tp.productId">
                    <td class="py-2 text-xs text-slate-400 font-mono">{{ idx + 1 }}</td>
                    <td class="py-2">
                      <p class="text-xs font-medium text-slate-900">{{ tp.productName }}</p>
                      <p class="text-[10px] text-slate-500 font-mono">{{ tp.sku }}</p>
                    </td>
                    <td class="py-2 text-right text-xs font-mono text-slate-700">{{ tp.totalQty }}</td>
                    <td class="py-2 text-right text-xs font-mono font-semibold text-slate-900">{{ formatRupiah(tp.totalRevenue) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- DAILY TREND TABLE                           -->
      <!-- ============================================ -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUpIcon class="w-4 h-4 text-emerald-600" />
            Trend Harian
          </h3>
        </div>
        <div class="p-5">
          <div v-if="salesReport.dailyTrend.length === 0" class="text-center py-4">
            <p class="text-xs text-slate-500">Belum ada data transaksi di range ini.</p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[500px]">
              <thead class="border-b border-slate-200">
                <tr>
                  <th class="px-3 py-2 text-left text-[10px] font-bold text-slate-600 uppercase">Tanggal</th>
                  <th class="px-3 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Omzet</th>
                  <th class="px-3 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Profit</th>
                  <th class="px-3 py-2 text-center text-[10px] font-bold text-slate-600 uppercase">Trx</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="day in salesReport.dailyTrend" :key="day.date" class="hover:bg-slate-50">
                  <td class="px-3 py-2 text-xs font-mono text-slate-700">{{ formatDateLabel(day.date) }}</td>
                  <td class="px-3 py-2 text-right text-xs font-mono font-semibold text-slate-900">{{ formatRupiah(day.omzet) }}</td>
                  <td class="px-3 py-2 text-right text-xs font-mono text-emerald-600">{{ formatRupiah(day.profit) }}</td>
                  <td class="px-3 py-2 text-center text-xs font-mono text-slate-600">{{ day.transactions }}</td>
                </tr>
              </tbody>
              <tfoot class="border-t border-slate-200 bg-slate-50">
                <tr>
                  <td class="px-3 py-2 text-xs font-bold text-slate-700">Total</td>
                  <td class="px-3 py-2 text-right text-xs font-mono font-bold text-slate-900">{{ formatRupiah(salesReport.summary.omzet) }}</td>
                  <td class="px-3 py-2 text-right text-xs font-mono font-bold text-emerald-600">{{ formatRupiah(salesReport.summary.profit) }}</td>
                  <td class="px-3 py-2 text-center text-xs font-mono font-bold text-slate-700">{{ salesReport.summary.totalTransactions }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- DEBT REPORT SECTION                         -->
      <!-- ============================================ -->
      <div v-if="debtReport" class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <HandCoinsIcon class="w-4 h-4 text-amber-600" />
            Ringkasan Hutang
          </h3>
        </div>
        <div class="p-5 space-y-4">
          <!-- Debt summary cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="bg-slate-50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-slate-500">Piutang Aktif</p>
              <p class="text-sm font-bold font-mono text-red-600 mt-1">{{ formatRupiah(debtReport.summary.totalOutstanding) }}</p>
            </div>
            <div class="bg-slate-50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-slate-500">Overdue</p>
              <p class="text-sm font-bold font-mono text-amber-600 mt-1">{{ debtReport.summary.overdueCount }}</p>
            </div>
            <div class="bg-slate-50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-slate-500">Debitur</p>
              <p class="text-sm font-bold font-mono text-slate-900 mt-1">{{ debtReport.summary.totalDebtors }}</p>
            </div>
            <div class="bg-slate-50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-slate-500">Total Hutang</p>
              <p class="text-sm font-bold font-mono text-slate-900 mt-1">{{ debtReport.summary.totalDebts }}</p>
            </div>
          </div>

          <!-- Recent payments -->
          <div v-if="debtReport.recentPayments.length > 0">
            <p class="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-2">Pembayaran Hutang Terbaru</p>
            <div class="space-y-1.5">
              <div
                v-for="rp in debtReport.recentPayments"
                :key="rp.id"
                class="flex items-center justify-between bg-slate-50 rounded-md px-3 py-2"
              >
                <div>
                  <p class="text-xs font-medium text-slate-900">{{ rp.customerName }}</p>
                  <p class="text-[10px] text-slate-500 font-mono">{{ formatDateTime(rp.createdAt) }}</p>
                </div>
                <div class="text-right">
                  <p class="text-xs font-mono font-semibold text-emerald-600">+{{ formatRupiah(rp.amount) }}</p>
                  <span :class="['text-[9px] font-bold uppercase px-1.5 py-0.5 rounded', methodBadge(rp.method)]">{{ rp.method }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  Filter as FilterIcon, CreditCard as CreditCardIcon,
  Trophy as TrophyIcon, TrendingUp as TrendingUpIcon,
  HandCoins as HandCoinsIcon, Loader2 as Loader2Icon,
  AlertCircle as AlertCircleIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import reportsService, {
  type SalesReportResponse,
  type DebtReportResponse,
} from '@/shared/services/reports.service';

const authStore = useAuthStore();

// ============================================
// State
// ============================================
const salesReport = ref<SalesReportResponse | null>(null);
const debtReport = ref<DebtReportResponse | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// Default range: current month
const now = new Date();
const startDate = ref(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10));
const endDate = ref(now.toISOString().slice(0, 10));

const quickRanges = [
  { label: 'Hari Ini', days: 0 },
  { label: '7 Hari', days: 7 },
  { label: '30 Hari', days: 30 },
  { label: 'Bulan Ini', days: -1 },
];

// ============================================
// Methods
// ============================================

function getShopId(): string | undefined {
  return authStore.user?.shopId || undefined;
}

async function fetchAll() {
  const shopId = getShopId();
  if (!shopId) { error.value = 'Tidak ada cabang aktif.'; return; }

  loading.value = true;
  error.value = null;
  try {
    const [sales, debt] = await Promise.all([
      reportsService.getSalesReport(shopId, startDate.value, endDate.value),
      reportsService.getDebtReport(shopId),
    ]);
    salesReport.value = sales;
    debtReport.value = debt;
  } catch (err: any) {
    error.value = err.response?.data?.message ?? err.message ?? 'Gagal memuat laporan.';
  } finally {
    loading.value = false;
  }
}

function applyRange(days: number) {
  const today = new Date();
  if (days === -1) {
    // Current month
    startDate.value = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    endDate.value = today.toISOString().slice(0, 10);
  } else if (days === 0) {
    startDate.value = today.toISOString().slice(0, 10);
    endDate.value = today.toISOString().slice(0, 10);
  } else {
    const from = new Date(today);
    from.setDate(from.getDate() - days);
    startDate.value = from.toISOString().slice(0, 10);
    endDate.value = today.toISOString().slice(0, 10);
  }
  fetchAll();
}

function getMethodPercent(amount: number): number {
  if (!salesReport.value) return 0;
  const total = salesReport.value.methodBreakdown.reduce((s, m) => s + m.totalAmount, 0);
  if (total === 0) return 0;
  return Math.round((amount / total) * 100);
}

// ============================================
// Helpers
// ============================================

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function formatDateLabel(date: string): string {
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function methodBadge(method: string): string {
  switch (method) {
    case 'CASH': return 'bg-emerald-100 text-emerald-700';
    case 'QRIS': return 'bg-blue-100 text-blue-700';
    case 'TRANSFER': return 'bg-indigo-100 text-indigo-700';
    case 'HUTANG': return 'bg-amber-100 text-amber-700';
    default: return 'bg-slate-100 text-slate-700';
  }
}

function methodBarColor(method: string): string {
  switch (method) {
    case 'CASH': return 'bg-emerald-500';
    case 'QRIS': return 'bg-blue-500';
    case 'TRANSFER': return 'bg-indigo-500';
    case 'HUTANG': return 'bg-amber-500';
    default: return 'bg-slate-400';
  }
}

// ============================================
// Lifecycle
// ============================================
onMounted(fetchAll);
</script>
