<template>
  <div class="space-y-5">
    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 flex-wrap">
      <input v-model="startDate" type="date" class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
      <input v-model="endDate" type="date" class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
      <button type="button" class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5" @click="fetchReport">
        <FilterIcon class="w-3.5 h-3.5" /> Terapkan
      </button>
      <div class="flex items-center gap-1.5">
        <button v-for="r in quickRanges" :key="r.label" type="button" class="h-7 px-2.5 text-[11px] font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800" @click="applyRange(r.days)">{{ r.label }}</button>
      </div>
      <!-- Export -->
      <div v-if="report" class="flex items-center gap-1.5 sm:ml-auto">
        <button type="button" class="h-8 px-3 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/40 flex items-center gap-1.5" @click="exportCSV">
          <DownloadIcon class="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
      <span class="ml-2 text-sm text-slate-500 dark:text-slate-400">Memuat laporan BRILink...</span>
    </div>

    <template v-else-if="report">
      <!-- KPI Summary -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
          <p class="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500">Total Transaksi</p>
          <p class="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">{{ report.summary.totalTransactions.toLocaleString('id-ID') }}</p>
        </div>
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
          <p class="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500">Volume</p>
          <p class="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">{{ formatRupiah(report.summary.volume) }}</p>
        </div>
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
          <p class="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500">Fee Earnings</p>
          <p class="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{{ formatRupiah(report.summary.feeEarnings) }}</p>
        </div>
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
          <p class="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500">Avg Fee/Trx</p>
          <p class="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">{{ formatRupiah(report.summary.avgFee) }}</p>
        </div>
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
          <p class="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500">Void</p>
          <p class="text-lg font-bold font-mono text-red-500 mt-1">{{ report.summary.voidedCount }}</p>
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Breakdown per Kategori</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Kategori</th>
                <th class="px-4 py-2.5 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Trx</th>
                <th class="px-4 py-2.5 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Volume</th>
                <th class="px-4 py-2.5 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Fee</th>
                <th class="px-4 py-2.5 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">%</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="cat in report.categoryBreakdown" :key="cat.category" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">{{ categoryLabel(cat.category) }}</td>
                <td class="px-4 py-2.5 text-right text-xs font-mono text-slate-600 dark:text-slate-400">{{ cat.count }}</td>
                <td class="px-4 py-2.5 text-right text-xs font-mono text-slate-900 dark:text-slate-100">{{ formatRupiah(cat.volume) }}</td>
                <td class="px-4 py-2.5 text-right text-xs font-mono text-emerald-600 dark:text-emerald-400">{{ formatRupiah(cat.fee) }}</td>
                <td class="px-4 py-2.5 text-right text-xs font-mono text-slate-500 dark:text-slate-400">{{ cat.percentVolume }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Daily Trend -->
      <div v-if="report.dailyTrend.length > 0" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Trend Harian</h3>
        </div>
        <div class="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table class="w-full">
            <thead class="border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
              <tr>
                <th class="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Tanggal</th>
                <th class="px-4 py-2.5 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Trx</th>
                <th class="px-4 py-2.5 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Volume</th>
                <th class="px-4 py-2.5 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Fee</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="day in report.dailyTrend" :key="day.date" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="px-4 py-2.5 text-xs font-mono text-slate-700 dark:text-slate-300">{{ day.date }}</td>
                <td class="px-4 py-2.5 text-right text-xs font-mono text-slate-600 dark:text-slate-400">{{ day.transactions }}</td>
                <td class="px-4 py-2.5 text-right text-xs font-mono text-slate-900 dark:text-slate-100">{{ formatRupiah(day.volume) }}</td>
                <td class="px-4 py-2.5 text-right text-xs font-mono text-emerald-600 dark:text-emerald-400">{{ formatRupiah(day.fee) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Two columns: Kasir Performance + Top Customers -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Kasir Performance -->
        <div v-if="report.cashierPerformance.length > 0" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Per Kasir</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th class="px-4 py-2 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Kasir</th>
                  <th class="px-4 py-2 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Trx</th>
                  <th class="px-4 py-2 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Volume</th>
                  <th class="px-4 py-2 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Fee</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr v-for="c in report.cashierPerformance" :key="c.cashierId" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td class="px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200">{{ c.cashierName }}</td>
                  <td class="px-4 py-2 text-right text-xs font-mono text-slate-600 dark:text-slate-400">{{ c.count }}</td>
                  <td class="px-4 py-2 text-right text-xs font-mono text-slate-900 dark:text-slate-100">{{ formatCompact(c.volume) }}</td>
                  <td class="px-4 py-2 text-right text-xs font-mono text-emerald-600 dark:text-emerald-400">{{ formatCompact(c.fee) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top Customers -->
        <div v-if="report.topCustomers.length > 0" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Top Pelanggan</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th class="px-4 py-2 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Nama</th>
                  <th class="px-4 py-2 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Trx</th>
                  <th class="px-4 py-2 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Volume</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr v-for="tc in report.topCustomers" :key="tc.customerName" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td class="px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200">{{ tc.customerName }}</td>
                  <td class="px-4 py-2 text-right text-xs font-mono text-slate-600 dark:text-slate-400">{{ tc.count }}</td>
                  <td class="px-4 py-2 text-right text-xs font-mono text-slate-900 dark:text-slate-100">{{ formatCompact(tc.volume) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <!-- Empty -->
    <div v-else-if="!loading" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
      <LandmarkIcon class="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
      <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada data</p>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Pilih rentang tanggal dan klik Terapkan.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Filter as FilterIcon, Loader2 as Loader2Icon, Download as DownloadIcon, Landmark as LandmarkIcon } from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import reportsService, { exportToCSV } from '@/shared/services/reports.service';
import { useAutoRefresh } from '@/shared/composables/useAutoRefresh';
import { useRealtimeRefresh } from '@/shared/composables/useRealtimeRefresh';

const authStore = useAuthStore();
const shopStore = useShopStore();
const loading = ref(false);

interface BrilinkReport {
  summary: { totalTransactions: number; volume: number; feeEarnings: number; avgFee: number; voidedCount: number };
  categoryBreakdown: Array<{ category: string; count: number; volume: number; fee: number; percentVolume: number }>;
  dailyTrend: Array<{ date: string; volume: number; fee: number; transactions: number }>;
  cashierPerformance: Array<{ cashierId: string; cashierName: string; count: number; volume: number; fee: number }>;
  topCustomers: Array<{ customerName: string; count: number; volume: number; fee: number }>;
}

const report = ref<BrilinkReport | null>(null);

// Date filter
const today = new Date().toISOString().slice(0, 10);
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const startDate = ref(thirtyDaysAgo);
const endDate = ref(today);

const quickRanges = [
  { label: 'Hari Ini', days: 0 },
  { label: '7 Hari', days: 7 },
  { label: '30 Hari', days: 30 },
  { label: 'Bulan Ini', days: -1 },
];

function applyRange(days: number) {
  const now = new Date();
  endDate.value = now.toISOString().slice(0, 10);
  if (days === -1) {
    // Bulan ini
    startDate.value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  } else if (days === 0) {
    startDate.value = endDate.value;
  } else {
    startDate.value = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }
  fetchReport();
}

function getShopId(): string | undefined {
  return shopStore.currentShopId || authStore.user?.shopId || undefined;
}

async function fetchReport() {
  const shopId = getShopId();
  if (!shopId) return;
  if (!report.value) loading.value = true;
  try {
    report.value = await reportsService.getBrilinkReport(shopId, startDate.value, endDate.value);
  } catch { /* keep existing */ }
  finally { loading.value = false; }
}

// Category label map
const CATEGORY_LABELS: Record<string, string> = {
  TRANSFER_BRI: 'Transfer BRI',
  TRANSFER_OTHER: 'Transfer Antar Bank',
  TARIK_TUNAI: 'Tarik Tunai',
  TOPUP_PULSA: 'Pulsa',
  TOPUP_DATA: 'Paket Data',
  TOPUP_EWALLET: 'E-Wallet',
  TOPUP_PLN: 'Token PLN',
};
function categoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] || cat;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  return formatRupiah(amount);
}

function exportCSV() {
  if (!report.value) return;
  const headers = ['Kategori', 'Transaksi', 'Volume', 'Fee', '% Volume'];
  const rows = report.value.categoryBreakdown.map(c => [
    categoryLabel(c.category), c.count, c.volume, c.fee, c.percentVolume + '%',
  ]);
  // Add daily trend
  const trendHeaders = ['Tanggal', 'Transaksi', 'Volume', 'Fee'];
  const trendRows = report.value.dailyTrend.map(d => [d.date, d.transactions, d.volume, d.fee]);

  // Export both sections
  exportToCSV(`laporan-brilink-${startDate.value}-${endDate.value}.csv`, headers, rows as any);
  if (trendRows.length > 0) {
    setTimeout(() => {
      exportToCSV(`trend-harian-brilink-${startDate.value}-${endDate.value}.csv`, trendHeaders, trendRows as any);
    }, 500);
  }
}

onMounted(fetchReport);
useAutoRefresh(fetchReport, 60_000);
useRealtimeRefresh(fetchReport);
</script>
