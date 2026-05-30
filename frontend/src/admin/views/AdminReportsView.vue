<template>
  <div class="space-y-5">
    <!-- Header -->
    <div>
      <h1 class="text-xl font-bold text-slate-950 dark:text-slate-100">Laporan</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        Laporan penjualan, BRILink, hutang — custom date range + export CSV.
      </p>
    </div>

    <!-- Date filter + Export buttons -->
    <div class="flex flex-col sm:flex-row gap-3 flex-wrap">
      <input v-model="startDate" type="date" class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
      <input v-model="endDate" type="date" class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
      <button type="button" class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5" @click="fetchAll">
        <FilterIcon class="w-3.5 h-3.5" /> Terapkan
      </button>
      <div class="flex items-center gap-1.5">
        <button v-for="r in quickRanges" :key="r.label" type="button" class="h-7 px-2.5 text-[11px] font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800" @click="applyRange(r.days)">{{ r.label }}</button>
      </div>
      <!-- Export PDF & Excel — dropdown pilih Retail / BRILink / Semua -->
      <div v-if="salesReport || brilinkReport" class="flex items-center gap-1.5 sm:ml-auto relative">
        <button
          type="button"
          :disabled="exporting"
          class="h-8 px-3 text-[11px] font-semibold border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 flex items-center gap-1.5"
          @click="showExportMenu = showExportMenu === 'pdf' ? '' : 'pdf'"
        >
          <FileTextIcon class="w-3.5 h-3.5" /> PDF ▾
        </button>
        <button
          type="button"
          :disabled="exporting"
          class="h-8 px-3 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/40 disabled:opacity-50 flex items-center gap-1.5"
          @click="showExportMenu = showExportMenu === 'excel' ? '' : 'excel'"
        >
          <TableIcon class="w-3.5 h-3.5" /> Excel ▾
        </button>

        <!-- Dropdown menu -->
        <div
          v-if="showExportMenu"
          class="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 overflow-hidden"
        >
          <button
            v-if="salesReport"
            type="button"
            class="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
            @click="handleExport(showExportMenu, 'retail')"
          >
            <ReceiptIcon class="w-3.5 h-3.5 text-blue-500" /> Laporan Retail
          </button>
          <button
            v-if="brilinkReport"
            type="button"
            class="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
            @click="handleExport(showExportMenu, 'brilink')"
          >
            <LandmarkIcon class="w-3.5 h-3.5 text-indigo-500" /> Laporan BRILink
          </button>
          <div class="border-t border-slate-100 dark:border-slate-800"></div>
          <button
            v-if="salesReport && brilinkReport"
            type="button"
            class="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
            @click="handleExport(showExportMenu, 'all')"
          >
            <DownloadIcon class="w-3.5 h-3.5 text-slate-500" /> Semua Laporan
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
      <span class="ml-2 text-sm text-slate-500 dark:text-slate-400">Memuat laporan...</span>
    </div>

    <template v-else>
      <!-- Sales Summary -->
      <div v-if="salesReport" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Ringkasan Penjualan</h3>
          <button type="button" class="h-7 px-2.5 text-[10px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" @click="exportSales">Export CSV</button>
        </div>
        <div class="p-5">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div class="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center"><p class="text-[10px] text-slate-500 dark:text-slate-400">Omzet</p><p class="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">{{ formatRupiah(salesReport.summary.omzet) }}</p></div>
            <div class="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center"><p class="text-[10px] text-slate-500 dark:text-slate-400">Profit</p><p class="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{{ formatRupiah(salesReport.summary.profit) }}</p></div>
            <div class="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center"><p class="text-[10px] text-slate-500 dark:text-slate-400">Transaksi</p><p class="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">{{ salesReport.summary.totalTransactions }}</p></div>
            <div class="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center"><p class="text-[10px] text-slate-500 dark:text-slate-400">Margin</p><p class="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">{{ salesReport.summary.marginPercent }}%</p></div>
          </div>
          <div v-if="salesReport.topProducts.length > 0" class="mt-4">
            <div class="flex items-center justify-between mb-2"><p class="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Top 10 Produk</p><button type="button" class="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline" @click="exportTopProducts">Export</button></div>
            <div class="overflow-x-auto"><table class="w-full"><thead class="border-b border-slate-200 dark:border-slate-800"><tr><th class="px-3 py-2 text-left text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Produk</th><th class="px-3 py-2 text-right text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Qty</th><th class="px-3 py-2 text-right text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Revenue</th></tr></thead><tbody class="divide-y divide-slate-100 dark:divide-slate-800"><tr v-for="p in salesReport.topProducts" :key="p.productId" class="hover:bg-slate-50 dark:hover:bg-slate-800/50"><td class="px-3 py-2 text-xs text-slate-800 dark:text-slate-200">{{ p.productName }}</td><td class="px-3 py-2 text-right text-xs font-mono text-slate-600 dark:text-slate-400">{{ p.totalQty }}</td><td class="px-3 py-2 text-right text-xs font-mono font-semibold text-slate-900 dark:text-slate-100">{{ formatRupiah(p.totalRevenue) }}</td></tr></tbody></table></div>
          </div>
          <div v-if="salesReport.dailyTrend.length > 0" class="mt-4">
            <div class="flex items-center justify-between mb-2"><p class="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Trend Harian</p><button type="button" class="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline" @click="exportDailyTrend">Export</button></div>
            <div class="overflow-x-auto"><table class="w-full"><thead class="border-b border-slate-200 dark:border-slate-800"><tr><th class="px-3 py-2 text-left text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Tanggal</th><th class="px-3 py-2 text-right text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Omzet</th><th class="px-3 py-2 text-right text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Profit</th><th class="px-3 py-2 text-center text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Trx</th></tr></thead><tbody class="divide-y divide-slate-100 dark:divide-slate-800"><tr v-for="day in salesReport.dailyTrend" :key="day.date" class="hover:bg-slate-50 dark:hover:bg-slate-800/50"><td class="px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300">{{ day.date }}</td><td class="px-3 py-2 text-right text-xs font-mono text-slate-900 dark:text-slate-100">{{ formatRupiah(day.omzet) }}</td><td class="px-3 py-2 text-right text-xs font-mono text-emerald-600 dark:text-emerald-400">{{ formatRupiah(day.profit) }}</td><td class="px-3 py-2 text-center text-xs font-mono text-slate-600 dark:text-slate-400">{{ day.transactions }}</td></tr></tbody></table></div>
          </div>
        </div>
      </div>

      <!-- BRILink Report -->
      <div v-if="brilinkReport" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Laporan BRILink</h3>
          <button type="button" class="h-7 px-2.5 text-[10px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" @click="exportBrilink">Export CSV</button>
        </div>
        <div class="p-5">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div class="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center"><p class="text-[10px] text-slate-500 dark:text-slate-400">Transaksi</p><p class="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">{{ brilinkReport.summary.totalTransactions }}</p></div>
            <div class="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center"><p class="text-[10px] text-slate-500 dark:text-slate-400">Volume</p><p class="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">{{ formatRupiah(brilinkReport.summary.volume) }}</p></div>
            <div class="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center"><p class="text-[10px] text-slate-500 dark:text-slate-400">Fee</p><p class="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{{ formatRupiah(brilinkReport.summary.feeEarnings) }}</p></div>
            <div class="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center"><p class="text-[10px] text-slate-500 dark:text-slate-400">Avg Fee</p><p class="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">{{ formatRupiah(brilinkReport.summary.avgFee) }}</p></div>
          </div>
          <div v-if="brilinkReport.categoryBreakdown.length > 0">
            <p class="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Per Kategori</p>
            <div class="overflow-x-auto"><table class="w-full"><thead class="border-b border-slate-200 dark:border-slate-800"><tr><th class="px-3 py-2 text-left text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Kategori</th><th class="px-3 py-2 text-right text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Trx</th><th class="px-3 py-2 text-right text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Volume</th><th class="px-3 py-2 text-right text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Fee</th></tr></thead><tbody class="divide-y divide-slate-100 dark:divide-slate-800"><tr v-for="cat in brilinkReport.categoryBreakdown" :key="cat.category" class="hover:bg-slate-50 dark:hover:bg-slate-800/50"><td class="px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200">{{ cat.category }}</td><td class="px-3 py-2 text-right text-xs font-mono text-slate-600 dark:text-slate-400">{{ cat.count }}</td><td class="px-3 py-2 text-right text-xs font-mono text-slate-900 dark:text-slate-100">{{ formatRupiah(cat.volume) }}</td><td class="px-3 py-2 text-right text-xs font-mono text-emerald-600 dark:text-emerald-400">{{ formatRupiah(cat.fee) }}</td></tr></tbody></table></div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Filter as FilterIcon, Loader2 as Loader2Icon, FileText as FileTextIcon, Table as TableIcon, Receipt as ReceiptIcon, Landmark as LandmarkIcon, Download as DownloadIcon } from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import reportsService, { exportToCSV, type SalesReportResponse, type DebtReportResponse, type BrilinkReportResponse } from '@/shared/services/reports.service';
import { exportSalesExcel, exportSalesPDF, exportBrilinkExcel, exportBrilinkPDF } from '@/shared/services/export.service';

const authStore = useAuthStore();
const shopStore = useShopStore();
const loading = ref(false);
const exporting = ref(false);
const showExportMenu = ref('');
const startDate = ref('');
const endDate = ref('');
const salesReport = ref<SalesReportResponse | null>(null);
const debtReport = ref<DebtReportResponse | null>(null);
const brilinkReport = ref<BrilinkReportResponse | null>(null);
const quickRanges = [{ label: 'Hari Ini', days: 0 }, { label: '7 Hari', days: 7 }, { label: '30 Hari', days: 30 }, { label: 'Bulan Ini', days: -1 }];

function getShopId(): string | undefined { return authStore.user?.shopId || undefined; }
function formatRupiah(n: number): string { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n); }

function applyRange(days: number) {
  const now = new Date();
  if (days === 0) { startDate.value = now.toISOString().slice(0, 10); endDate.value = now.toISOString().slice(0, 10); }
  else if (days === -1) { startDate.value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10); endDate.value = now.toISOString().slice(0, 10); }
  else { const s = new Date(now); s.setDate(s.getDate() - days + 1); startDate.value = s.toISOString().slice(0, 10); endDate.value = now.toISOString().slice(0, 10); }
  fetchAll();
}

async function fetchAll() {
  const shopId = getShopId(); if (!shopId) return;
  loading.value = true;
  try {
    const [sales, debts, brilink] = await Promise.allSettled([
      reportsService.getSalesReport(shopId, startDate.value || undefined, endDate.value || undefined),
      reportsService.getDebtReport(shopId),
      reportsService.getBrilinkReport(shopId, startDate.value || undefined, endDate.value || undefined),
    ]);
    salesReport.value = sales.status === 'fulfilled' ? sales.value : null;
    debtReport.value = debts.status === 'fulfilled' ? debts.value : null;
    brilinkReport.value = brilink.status === 'fulfilled' ? brilink.value : null;
  } finally { loading.value = false; }
}

function exportSales() { if (!salesReport.value) return; const s = salesReport.value.summary; exportToCSV(`laporan-penjualan-${startDate.value || 'all'}-${endDate.value || 'all'}.csv`, ['Metrik', 'Nilai'], [['Omzet', s.omzet], ['Modal', s.modal], ['Profit', s.profit], ['Diskon', s.diskon], ['Transaksi', s.totalTransactions], ['Void', s.totalVoided], ['Margin %', s.marginPercent]]); }
function exportTopProducts() { if (!salesReport.value) return; exportToCSV(`top-produk-${startDate.value || 'all'}-${endDate.value || 'all'}.csv`, ['Produk', 'SKU', 'Qty', 'Revenue'], salesReport.value.topProducts.map(p => [p.productName, p.sku, p.totalQty, p.totalRevenue])); }
function exportDailyTrend() { if (!salesReport.value) return; exportToCSV(`trend-harian-${startDate.value || 'all'}-${endDate.value || 'all'}.csv`, ['Tanggal', 'Omzet', 'Profit', 'Transaksi'], salesReport.value.dailyTrend.map(d => [d.date, d.omzet, d.profit, d.transactions])); }
function exportBrilink() { if (!brilinkReport.value) return; exportToCSV(`laporan-brilink-${startDate.value || 'all'}-${endDate.value || 'all'}.csv`, ['Kategori', 'Transaksi', 'Volume', 'Fee'], brilinkReport.value.categoryBreakdown.map(c => [c.category, c.count, c.volume, c.fee])); }

async function handleExport(format: string, scope: 'retail' | 'brilink' | 'all') {
  exporting.value = true;
  showExportMenu.value = '';
  try {
    const shopName = shopStore.currentShopName || 'Toko';
    if (format === 'pdf') {
      if ((scope === 'retail' || scope === 'all') && salesReport.value) {
        await exportSalesPDF(salesReport.value, startDate.value, endDate.value, shopName);
      }
      if ((scope === 'brilink' || scope === 'all') && brilinkReport.value) {
        await exportBrilinkPDF(brilinkReport.value, startDate.value, endDate.value, shopName);
      }
    } else {
      if ((scope === 'retail' || scope === 'all') && salesReport.value) {
        await exportSalesExcel(salesReport.value, startDate.value, endDate.value, shopName);
      }
      if ((scope === 'brilink' || scope === 'all') && brilinkReport.value) {
        await exportBrilinkExcel(brilinkReport.value, startDate.value, endDate.value, shopName);
      }
    }
  } finally { exporting.value = false; }
}

onMounted(() => { applyRange(30); });
</script>
