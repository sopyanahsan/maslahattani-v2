<template>
  <div class="space-y-5">
    <!-- Header -->
    <div>
      <h1 class="text-xl font-bold text-slate-950 dark:text-slate-100">Laporan BRILink</h1>
      <p class="text-xs text-slate-500 mt-0.5">Analisis volume, fee, kategori, dan performa kasir BRILink.</p>
    </div>

    <!-- Filter Bar -->
    <div class="flex flex-col sm:flex-row gap-3 flex-wrap items-start sm:items-center">
      <input v-model="startDate" type="date" class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-[#00A19B] outline-none" />
      <input v-model="endDate" type="date" class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-[#00A19B] outline-none" />
      <button type="button" class="h-9 px-4 bg-[#00A19B] text-white text-xs font-semibold rounded-lg hover:opacity-90 flex items-center gap-1.5" @click="fetchReport">Terapkan</button>
      <div class="flex items-center gap-1.5">
        <button v-for="r in quickRanges" :key="r.label" type="button" :class="['h-7 px-2.5 text-[11px] font-medium rounded-md transition-colors', activeRange === r.label ? 'bg-[#00A19B] text-white' : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50']" @click="applyRange(r.days, r.label)">{{ r.label }}</button>
      </div>
      <!-- Export -->
      <div v-if="report" class="flex items-center gap-1.5 sm:ml-auto">
        <button type="button" :disabled="exporting" class="h-8 px-3 text-[11px] font-semibold border border-red-200 text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 flex items-center gap-1.5" @click="handleExport('pdf')">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
          PDF
        </button>
        <button type="button" :disabled="exporting" class="h-8 px-3 text-[11px] font-semibold border border-emerald-200 text-emerald-600 bg-emerald-50 rounded-md hover:bg-emerald-100 disabled:opacity-50 flex items-center gap-1.5" @click="handleExport('excel')">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          Excel
        </button>
        <button type="button" class="h-8 px-3 text-[11px] font-semibold border border-slate-200 text-slate-600 rounded-md hover:bg-slate-100 flex items-center gap-1.5" @click="handleExportCSV">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          CSV
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="w-6 h-6 border-4 border-slate-200 border-t-[#00A19B] rounded-full animate-spin" />
      <span class="ml-3 text-sm text-slate-500">Memuat laporan BRILink...</span>
    </div>

    <template v-else-if="report">
      <!-- KPI Summary -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
          <p class="text-[10px] text-slate-500 uppercase">Total Transaksi</p>
          <p class="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">{{ (report.summary?.totalTransactions ?? 0).toLocaleString('id-ID') }}</p>
        </div>
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
          <p class="text-[10px] text-slate-500 uppercase">Volume</p>
          <p class="text-lg font-bold font-mono text-blue-600 mt-1">{{ formatRupiah(report.summary?.volume ?? 0) }}</p>
        </div>
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
          <p class="text-[10px] text-slate-500 uppercase">Fee Earnings</p>
          <p class="text-lg font-bold font-mono text-emerald-600 mt-1">{{ formatRupiah(report.summary?.feeEarnings ?? 0) }}</p>
        </div>
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
          <p class="text-[10px] text-slate-500 uppercase">Avg Fee/Trx</p>
          <p class="text-lg font-bold font-mono text-[#00A19B] mt-1">{{ formatRupiah(report.summary?.avgFee ?? 0) }}</p>
        </div>
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
          <p class="text-[10px] text-slate-500 uppercase">Void</p>
          <p class="text-lg font-bold font-mono text-red-500 mt-1">{{ report.summary?.voidedCount ?? 0 }}</p>
        </div>
      </div>

      <!-- Grafik Trend Volume + Fee -->
      <div v-if="report.dailyTrend.length > 0" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Grafik Trend Harian</h3>
          <div class="flex items-center gap-3">
            <span class="flex items-center gap-1.5 text-[10px] text-slate-500"><span class="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Volume</span>
            <span class="flex items-center gap-1.5 text-[10px] text-slate-500"><span class="w-3 h-3 rounded-full bg-emerald-400 inline-block" /> Fee</span>
          </div>
        </div>
        <div class="flex gap-2">
          <div class="flex flex-col justify-between h-48 text-right pr-1 shrink-0 w-12">
            <span class="text-[9px] font-mono text-slate-400">{{ formatCompact(volYMax) }}</span>
            <span class="text-[9px] font-mono text-slate-400">{{ formatCompact(Math.round(volYMax * 0.5)) }}</span>
            <span class="text-[9px] font-mono text-slate-400">0</span>
          </div>
          <div class="flex-1 relative h-48">
            <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div class="border-b border-dashed border-slate-100 dark:border-slate-800" />
              <div class="border-b border-dashed border-slate-100 dark:border-slate-800" />
              <div class="border-b border-slate-200 dark:border-slate-700" />
            </div>
            <svg class="absolute inset-0 w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid meet">
              <path :d="volAreaPath" fill="url(#brlVolGrad)" />
              <polyline :points="volLinePath" fill="none" stroke="#3B82F6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
              <polyline :points="feeLinePath" fill="none" stroke="#34D399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
              <circle v-for="(pt, i) in volCoords" :key="i" :cx="pt.x" :cy="pt.y" r="3" fill="#3B82F6" stroke="white" stroke-width="1.5" />
              <defs><linearGradient id="brlVolGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3B82F6" stop-opacity="0.2" /><stop offset="100%" stop-color="#3B82F6" stop-opacity="0.01" /></linearGradient></defs>
            </svg>
          </div>
        </div>
        <div class="flex mt-2 ml-14">
          <div v-for="(d, i) in report.dailyTrend" :key="i" class="flex-1 text-center">
            <span v-if="shouldShowLabel(i)" class="text-[8px] font-mono text-slate-400">{{ formatShortDate(d.date) }}</span>
          </div>
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Breakdown per Kategori</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="border-b border-slate-200 dark:border-slate-800"><tr><th class="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase">Kategori</th><th class="px-4 py-2.5 text-right text-[10px] font-bold text-slate-500 uppercase">Trx</th><th class="px-4 py-2.5 text-right text-[10px] font-bold text-slate-500 uppercase">Volume</th><th class="px-4 py-2.5 text-right text-[10px] font-bold text-slate-500 uppercase">Fee</th><th class="px-4 py-2.5 text-right text-[10px] font-bold text-slate-500 uppercase">%</th></tr></thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="cat in report.categoryBreakdown" :key="cat.category" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">{{ categoryLabel(cat.category) }}</td>
                <td class="px-4 py-2.5 text-right text-xs font-mono">{{ cat.count }}</td>
                <td class="px-4 py-2.5 text-right text-xs font-mono font-semibold text-slate-900 dark:text-slate-100">{{ formatRupiah(cat.volume) }}</td>
                <td class="px-4 py-2.5 text-right text-xs font-mono text-emerald-600">{{ formatRupiah(cat.fee) }}</td>
                <td class="px-4 py-2.5 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <div class="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div class="h-full bg-blue-500 rounded-full" :style="{ width: cat.percentVolume + '%' }"></div></div>
                    <span class="text-[10px] font-mono text-slate-500 w-8">{{ cat.percentVolume }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Daily Trend Table -->
      <div v-if="report.dailyTrend.length > 0" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Detail Harian</h3>
        </div>
        <div class="overflow-x-auto max-h-[350px] overflow-y-auto">
          <table class="w-full">
            <thead class="border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900"><tr><th class="px-4 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Tanggal</th><th class="px-4 py-2 text-center text-[10px] font-bold text-slate-500 uppercase">Trx</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Volume</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Fee</th></tr></thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800"><tr v-for="d in report.dailyTrend" :key="d.date" class="hover:bg-slate-50 dark:hover:bg-slate-800/50"><td class="px-4 py-2 text-xs font-mono">{{ d.date }}</td><td class="px-4 py-2 text-center text-xs font-mono">{{ d.transactions }}</td><td class="px-4 py-2 text-right text-xs font-mono font-semibold">{{ formatRupiah(d.volume) }}</td><td class="px-4 py-2 text-right text-xs font-mono text-emerald-600">{{ formatRupiah(d.fee) }}</td></tr></tbody>
          </table>
        </div>
      </div>

      <!-- Kasir + Top Customers -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div v-if="report.cashierPerformance.length > 0" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"><h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Performa Kasir</h3></div>
          <div class="overflow-x-auto"><table class="w-full"><thead class="border-b border-slate-200 dark:border-slate-800"><tr><th class="px-4 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Kasir</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Trx</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Volume</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Fee</th></tr></thead><tbody class="divide-y divide-slate-100 dark:divide-slate-800"><tr v-for="c in report.cashierPerformance" :key="c.cashierId"><td class="px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200">{{ c.cashierName }}</td><td class="px-4 py-2 text-right text-xs font-mono">{{ c.count }}</td><td class="px-4 py-2 text-right text-xs font-mono">{{ formatCompact(c.volume) }}</td><td class="px-4 py-2 text-right text-xs font-mono text-emerald-600">{{ formatCompact(c.fee) }}</td></tr></tbody></table></div>
        </div>
        <div v-if="report.topCustomers.length > 0" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"><h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Top Pelanggan BRILink</h3></div>
          <div class="overflow-x-auto"><table class="w-full"><thead class="border-b border-slate-200 dark:border-slate-800"><tr><th class="px-4 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">#</th><th class="px-4 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Nama</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Trx</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Volume</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Fee</th></tr></thead><tbody class="divide-y divide-slate-100 dark:divide-slate-800"><tr v-for="(tc, i) in report.topCustomers" :key="tc.customerName"><td class="px-4 py-2 text-xs text-slate-400 font-bold">{{ i + 1 }}</td><td class="px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200">{{ tc.customerName }}</td><td class="px-4 py-2 text-right text-xs font-mono">{{ tc.count }}</td><td class="px-4 py-2 text-right text-xs font-mono">{{ formatCompact(tc.volume) }}</td><td class="px-4 py-2 text-right text-xs font-mono text-emerald-600">{{ formatCompact(tc.fee) }}</td></tr></tbody></table></div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import reportsService, { exportToCSV, type BrilinkReportResponse } from '@/shared/services/reports.service';
import { exportBrilinkPDF, exportBrilinkExcel } from '@/shared/services/export.service';

const authStore = useAuthStore();
const shopStore = useShopStore();
const loading = ref(false);
const exporting = ref(false);
const activeRange = ref('30 Hari');
const report = ref<BrilinkReportResponse | null>(null);

const today = new Date().toISOString().slice(0, 10);
const thirtyAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const startDate = ref(thirtyAgo);
const endDate = ref(today);

const quickRanges = [
  { label: 'Hari Ini', days: 0 },
  { label: '7 Hari', days: 7 },
  { label: '30 Hari', days: 30 },
  { label: 'Bulan Ini', days: -1 },
];

function getShopId(): string | undefined { return shopStore.currentShopId || authStore.user?.shopId || undefined; }

function applyRange(days: number, label: string) {
  activeRange.value = label;
  const now = new Date();
  endDate.value = now.toISOString().slice(0, 10);
  if (days === 0) startDate.value = endDate.value;
  else if (days === -1) startDate.value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  else { const s = new Date(now); s.setDate(s.getDate() - days + 1); startDate.value = s.toISOString().slice(0, 10); }
  fetchReport();
}

async function fetchReport() {
  const shopId = getShopId(); if (!shopId) return;
  if (!report.value) loading.value = true;
  try { report.value = await reportsService.getBrilinkReport(shopId, startDate.value, endDate.value); }
  catch { /* keep existing */ }
  finally { loading.value = false; }
}

// ============================================
// CHART
// ============================================

const volYMax = computed(() => {
  if (!report.value) return 1000000;
  const max = Math.max(...report.value.dailyTrend.map(d => d.volume), 1);
  const h = max * 1.2;
  const mag = Math.pow(10, Math.floor(Math.log10(h)));
  return Math.ceil(h / mag) * mag;
});

const volCoords = computed(() => {
  if (!report.value) return [];
  const data = report.value.dailyTrend;
  const n = data.length; if (n === 0) return [];
  const w = 600, h = 200, px = 20, py = 15;
  return data.map((d, i) => ({
    x: px + (n === 1 ? (w - px * 2) / 2 : (i / (n - 1)) * (w - px * 2)),
    y: py + (h - py * 2) - (d.volume / volYMax.value) * (h - py * 2),
  }));
});

const feeCoords = computed(() => {
  if (!report.value) return [];
  const data = report.value.dailyTrend;
  const n = data.length; if (n === 0) return [];
  // Fee uses same Y-axis scale as volume (so it's proportional)
  const w = 600, h = 200, px = 20, py = 15;
  return data.map((d, i) => ({
    x: px + (n === 1 ? (w - px * 2) / 2 : (i / (n - 1)) * (w - px * 2)),
    y: py + (h - py * 2) - (d.fee / volYMax.value) * (h - py * 2),
  }));
});

const volLinePath = computed(() => volCoords.value.map(p => `${p.x},${p.y}`).join(' '));
const feeLinePath = computed(() => feeCoords.value.map(p => `${p.x},${p.y}`).join(' '));
const volAreaPath = computed(() => {
  const pts = volCoords.value; if (pts.length === 0) return '';
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  return `${line} L${pts[pts.length - 1].x},185 L${pts[0].x},185 Z`;
});

function shouldShowLabel(idx: number): boolean {
  const total = report.value?.dailyTrend.length || 0;
  if (total <= 10) return true;
  if (total <= 15) return idx % 2 === 0;
  return idx % 3 === 0;
}

// ============================================
// HELPERS
// ============================================

const CATEGORY_LABELS: Record<string, string> = {
  TRANSFER_BRI: 'Transfer BRI', TRANSFER_OTHER: 'Transfer Antar Bank',
  TARIK_TUNAI: 'Tarik Tunai', TOPUP_PULSA: 'Pulsa',
  TOPUP_DATA: 'Paket Data', TOPUP_EWALLET: 'E-Wallet', TOPUP_PLN: 'Token PLN',
};
function categoryLabel(cat: string): string { return CATEGORY_LABELS[cat] || cat; }

function formatRupiah(n: number): string { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n); }
function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}rb`;
  return String(n);
}
function formatShortDate(d: string): string { const p = d.split('-'); return `${parseInt(p[2])}/${parseInt(p[1])}`; }

// ============================================
// EXPORT
// ============================================

async function handleExport(format: 'pdf' | 'excel') {
  if (!report.value) return;
  exporting.value = true;
  try {
    const shopName = shopStore.currentShopName || 'Toko';
    if (format === 'pdf') await exportBrilinkPDF(report.value, startDate.value, endDate.value, shopName);
    else await exportBrilinkExcel(report.value, startDate.value, endDate.value, shopName);
  } catch (e) { console.error('Export error:', e); }
  finally { exporting.value = false; }
}

function handleExportCSV() {
  if (!report.value) return;
  const headers = ['Tanggal', 'Transaksi', 'Volume', 'Fee'];
  const rows = report.value.dailyTrend.map(d => [d.date, d.transactions, d.volume, d.fee]);
  exportToCSV(`laporan-brilink-${startDate.value}-${endDate.value}.csv`, headers, rows as any);
}

onMounted(() => { applyRange(30, '30 Hari'); });
</script>
