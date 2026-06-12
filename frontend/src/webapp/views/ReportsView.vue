<template>
  <div class="report-page space-y-5 p-4 pb-24">
    <!-- Header -->
    <header class="flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <BarChart3Icon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 class="font-bold text-lg text-slate-950 dark:text-white">Laporan</h1>
          <p class="text-[10px] text-slate-500 dark:text-slate-400">Ringkasan performa bisnis</p>
        </div>
      </div>
      <span class="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-[10px] font-semibold">{{ period === '7d' ? '7 Hari' : '30 Hari' }}</span>
    </header>

    <!-- Type + Period Toggle -->
    <div class="space-y-2.5">
      <!-- Retail / BRILink switch -->
      <div class="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 shadow-inner">
        <button :class="['flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200', reportType === 'retail' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700']" @click="reportType = 'retail'; fetchAll()">Retail</button>
        <button :class="['flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200', reportType === 'brilink' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700']" @click="reportType = 'brilink'; fetchAll()">BRILink</button>
      </div>
      <!-- Period switch -->
      <div class="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
        <button :class="['flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-200', period === '7d' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400']" @click="period = '7d'; fetchAll()">7 Hari</button>
        <button :class="['flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-200', period === '30d' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400']" @click="period = '30d'; fetchAll()">30 Hari</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-16 gap-3">
      <div class="relative w-10 h-10">
        <div class="absolute inset-0 border-4 border-slate-100 dark:border-slate-700 rounded-full"></div>
        <div class="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p class="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Memuat laporan...</p>
    </div>

    <template v-else>
      <!-- ========== RETAIL REPORT ========== -->
      <template v-if="reportType === 'retail'">
        <!-- Summary Cards -->
        <div class="grid grid-cols-3 gap-3 stagger-in">
          <div class="stat-card bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div class="flex justify-between items-start mb-2.5">
              <span class="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <ShoppingCartIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </span>
            </div>
            <p class="text-xl font-bold font-mono text-slate-950 dark:text-white">{{ retailStats.totalTransaksi }}</p>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Transaksi</p>
          </div>
          <div class="stat-card bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div class="flex justify-between items-start mb-2.5">
              <span class="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <TrendingUpIcon class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </span>
            </div>
            <p class="text-base font-bold font-mono text-slate-950 dark:text-white">{{ formatRupiahShort(retailStats.omzet) }}</p>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Penjualan</p>
          </div>
          <div class="stat-card bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div class="flex justify-between items-start mb-2.5">
              <span class="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <DollarSignIcon class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </span>
            </div>
            <p class="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">{{ formatRupiahShort(retailStats.profit) }}</p>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Profit</p>
          </div>
        </div>

        <!-- Laba Rugi -->
        <div class="card-section bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm space-y-3">
          <h3 class="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
            <span class="p-1 bg-indigo-50 dark:bg-indigo-900/20 rounded"><DollarSignIcon class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /></span>
            Laba Rugi
          </h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-center">
              <span class="flex items-center gap-1.5 text-slate-700 dark:text-slate-300"><ArrowUpIcon class="w-3.5 h-3.5 text-emerald-500" /> Pendapatan Kotor</span>
              <span class="font-mono font-medium text-slate-900 dark:text-white">{{ formatRupiah(retailStats.omzet) }}</span>
            </div>
            <div class="border-t border-slate-100 dark:border-slate-700 pt-2">
              <div class="flex justify-between items-center">
                <span class="text-slate-700 dark:text-slate-300 font-medium">Penjualan Bersih</span>
                <span class="font-mono font-medium text-slate-900 dark:text-white">{{ formatRupiah(retailStats.omzet - retailStats.diskon) }}</span>
              </div>
              <div class="flex justify-between items-center mt-1">
                <span class="flex items-center gap-1.5 text-red-500 dark:text-red-400"><ArrowDownIcon class="w-3.5 h-3.5" /> HPP (Modal)</span>
                <span class="font-mono text-red-500 dark:text-red-400">-{{ formatRupiah(retailStats.modal) }}</span>
              </div>
            </div>
            <div class="border-t border-slate-100 dark:border-slate-700 pt-2">
              <div class="flex justify-between items-center">
                <span class="font-bold text-slate-950 dark:text-white">Laba Kotor</span>
                <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">{{ formatRupiah(retailStats.profit) }}</span>
              </div>
              <div class="flex justify-between items-center mt-0.5">
                <span class="text-[11px] text-slate-500 dark:text-slate-400">Margin Kotor</span>
                <span class="text-[11px] font-mono text-slate-500 dark:text-slate-400">{{ retailMargin }}%</span>
              </div>
            </div>
            <div class="border-t border-slate-100 dark:border-slate-700 pt-2">
              <div class="flex justify-between items-center">
                <span class="font-bold text-slate-950 dark:text-white">Laba Bersih</span>
                <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">{{ formatRupiah(retailStats.profit) }}</span>
              </div>
              <div class="flex justify-between items-center mt-0.5">
                <span class="text-[11px] text-slate-500 dark:text-slate-400">Margin Bersih</span>
                <span class="text-[11px] font-mono text-slate-500 dark:text-slate-400">{{ retailMargin }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tren Penjualan Chart -->
        <div class="card-section bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <h3 class="text-sm font-bold text-slate-950 dark:text-white mb-4">Tren Penjualan</h3>
          <div class="relative pt-12">
            <div ref="retailChartScroll" class="chart-scroll-wrap hide-scrollbar pb-1">
              <div class="flex items-end gap-1 h-36 relative chart-bars" :style="{ minWidth: retailChart.length > 10 ? (retailChart.length * 28) + 'px' : 'auto' }">
                <div v-for="(day, i) in retailChart" :key="i" class="chart-col flex-1 flex flex-col items-center justify-end h-full relative group" :style="{ minWidth: retailChart.length > 10 ? '24px' : 'auto' }">
                  <!-- Custom Tooltip -->
                  <div class="chart-tip">
                    <span class="font-semibold">{{ day.dateLabel }}</span>
                    <span class="text-blue-300">Omzet: {{ formatRupiah(day.value) }}</span>
                  </div>
                  <div class="chart-bar w-full rounded-t-sm transition-all duration-300 group-hover:brightness-125 cursor-pointer" :class="day.value > 0 ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-slate-200 dark:bg-slate-700'" :style="{ height: day.heightPercent + '%', minHeight: day.value > 0 ? '8px' : '4px', animationDelay: (i * 50) + 'ms' }"></div>
                  <span class="text-[7px] text-slate-400 dark:text-slate-500 mt-1.5 font-mono whitespace-nowrap">{{ day.shortLabel }}</span>
                </div>
              </div>
            </div>
          </div>
          <p v-if="period === '30d'" class="text-[9px] text-slate-400 dark:text-slate-500 mt-2 text-center">← Geser untuk lihat data sebelumnya →</p>
        </div>

        <!-- Produk Terlaris -->
        <div class="card-section bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <h3 class="text-sm font-bold text-slate-950 dark:text-white mb-3 flex items-center gap-2">
            <span class="p-1 bg-amber-50 dark:bg-amber-900/20 rounded"><PackageIcon class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /></span>
            Produk Terlaris
          </h3>
          <div v-if="topProducts.length === 0" class="text-center py-8">
            <span class="text-3xl opacity-40">📦</span>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-2">Belum ada data produk</p>
          </div>
          <div v-else class="space-y-2.5">
            <div v-for="(prod, idx) in topProducts" :key="prod.name" class="product-row flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div class="flex items-center gap-2.5">
                <span :class="['w-6 h-6 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0', idx === 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : idx < 3 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400']">{{ idx + 1 }}</span>
                <span class="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{{ prod.name }}</span>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold font-mono text-slate-950 dark:text-white">{{ formatRupiah(prod.totalRevenue) }}</p>
                <p class="text-[10px] text-slate-500 dark:text-slate-400">{{ prod.totalQty }} terjual</p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ========== BRILINK REPORT ========== -->
      <template v-if="reportType === 'brilink'">
        <!-- Summary Cards -->
        <div class="grid grid-cols-3 gap-3 stagger-in">
          <div class="stat-card bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div class="flex justify-between items-start mb-2.5">
              <span class="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <LandmarkIcon class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </span>
            </div>
            <p class="text-xl font-bold font-mono text-slate-950 dark:text-white">{{ brilinkStats.totalTrx }}</p>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Transaksi</p>
          </div>
          <div class="stat-card bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div class="flex justify-between items-start mb-2.5">
              <span class="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <BanknoteIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </span>
            </div>
            <p class="text-base font-bold font-mono text-slate-950 dark:text-white">{{ formatRupiahShort(brilinkStats.totalVolume) }}</p>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Volume</p>
          </div>
          <div class="stat-card bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div class="flex justify-between items-start mb-2.5">
              <span class="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <TrendingUpIcon class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </span>
            </div>
            <p class="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">{{ formatRupiahShort(brilinkStats.totalFee) }}</p>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Total Fee</p>
          </div>
        </div>

        <!-- Laba Rugi BRILink -->
        <div class="card-section bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm space-y-3">
          <h3 class="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
            <span class="p-1 bg-indigo-50 dark:bg-indigo-900/20 rounded"><DollarSignIcon class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /></span>
            Laba Rugi BRILink
          </h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-center">
              <span class="flex items-center gap-1.5 text-slate-700 dark:text-slate-300"><ArrowUpIcon class="w-3.5 h-3.5 text-emerald-500" /> Total Fee Pelanggan</span>
              <span class="font-mono font-medium text-slate-900 dark:text-white">{{ formatRupiah(brilinkStats.totalFee) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="flex items-center gap-1.5 text-red-500 dark:text-red-400"><ArrowDownIcon class="w-3.5 h-3.5" /> Biaya Sistem BRI</span>
              <span class="font-mono text-red-500 dark:text-red-400">-{{ formatRupiah(brilinkStats.systemCost) }}</span>
            </div>
            <div class="border-t border-slate-100 dark:border-slate-700 pt-2">
              <div class="flex justify-between items-center">
                <span class="font-bold text-slate-950 dark:text-white">Profit Bersih BRILink</span>
                <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">{{ formatRupiah(brilinkStats.netProfit) }}</span>
              </div>
              <div class="flex justify-between items-center mt-0.5">
                <span class="text-[11px] text-slate-500 dark:text-slate-400">Margin</span>
                <span class="text-[11px] font-mono text-slate-500 dark:text-slate-400">{{ brilinkMargin }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tren Volume BRILink Chart -->
        <div class="card-section bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <h3 class="text-sm font-bold text-slate-950 dark:text-white mb-4">Tren Volume BRILink</h3>
          <div class="relative pt-12">
            <div ref="brilinkChartScroll" class="chart-scroll-wrap hide-scrollbar pb-1">
              <div class="flex items-end gap-1 h-36 relative chart-bars" :style="{ minWidth: brilinkChart.length > 10 ? (brilinkChart.length * 28) + 'px' : 'auto' }">
                <div v-for="(day, i) in brilinkChart" :key="i" class="chart-col flex-1 flex flex-col items-center justify-end h-full relative group" :style="{ minWidth: brilinkChart.length > 10 ? '24px' : 'auto' }">
                  <!-- Custom Tooltip -->
                  <div class="chart-tip">
                    <span class="font-semibold">{{ day.dateLabel }}</span>
                    <span class="text-emerald-300">Omzet: {{ formatRupiah(day.value) }}</span>
                  </div>
                  <div class="chart-bar w-full rounded-t-sm transition-all duration-300 group-hover:brightness-125 cursor-pointer" :class="day.value > 0 ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : 'bg-slate-200 dark:bg-slate-700'" :style="{ height: day.heightPercent + '%', minHeight: day.value > 0 ? '8px' : '4px', animationDelay: (i * 50) + 'ms' }"></div>
                  <span class="text-[7px] text-slate-400 dark:text-slate-500 mt-1.5 font-mono whitespace-nowrap">{{ day.shortLabel }}</span>
                </div>
              </div>
            </div>
          </div>
          <p v-if="period === '30d'" class="text-[9px] text-slate-400 dark:text-slate-500 mt-2 text-center">← Geser untuk lihat data sebelumnya →</p>
        </div>

        <!-- Breakdown per Kategori BRILink -->
        <div class="card-section bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <h3 class="text-sm font-bold text-slate-950 dark:text-white mb-3 flex items-center gap-2">
            <span class="p-1 bg-purple-50 dark:bg-purple-900/20 rounded"><LandmarkIcon class="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /></span>
            Breakdown Kategori
          </h3>
          <div v-if="brilinkBreakdown.length === 0" class="text-center py-8">
            <span class="text-3xl opacity-40">📊</span>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-2">Belum ada data BRILink</p>
          </div>
          <div v-else class="space-y-2.5">
            <div v-for="cat in brilinkBreakdown" :key="cat.category" class="product-row flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-sm" :style="{ backgroundColor: cat.color }"></span>
                <span class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ cat.label }}</span>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold font-mono text-slate-950 dark:text-white">{{ cat.count }} trx</p>
                <p class="text-[10px] text-slate-500 dark:text-slate-400">Vol {{ formatRupiahShort(cat.volume) }} · Fee {{ formatRupiahShort(cat.fee) }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, nextTick } from 'vue';
import {
  BarChart3 as BarChart3Icon, Loader2 as Loader2Icon,
  ShoppingCart as ShoppingCartIcon, TrendingUp as TrendingUpIcon,
  DollarSign as DollarSignIcon, ArrowUp as ArrowUpIcon,
  ArrowDown as ArrowDownIcon, Package as PackageIcon,
  Landmark as LandmarkIcon, Banknote as BanknoteIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import api from '@/shared/services/api';

const authStore = useAuthStore();
const loading = ref(true);
const reportType = ref<'retail' | 'brilink'>('retail');
const period = ref<'7d' | '30d'>('7d');

// Retail data
const retailStats = ref({ omzet: 0, modal: 0, profit: 0, diskon: 0, totalTransaksi: 0, totalVoid: 0, totalHutang: 0, jumlahHutang: 0 });
const retailChart = ref<Array<{ dateLabel: string; shortLabel: string; value: number; heightPercent: number }>>([]);
const topProducts = ref<Array<{ name: string; totalQty: number; totalRevenue: number; profit: number }>>([]);

// BRILink data
const brilinkStats = ref({ totalTrx: 0, totalVolume: 0, totalFee: 0, systemCost: 0, netProfit: 0 });
const brilinkChart = ref<Array<{ dateLabel: string; shortLabel: string; value: number; heightPercent: number }>>([]);
const brilinkBreakdown = ref<Array<{ category: string; label: string; count: number; volume: number; fee: number; color: string }>>([]);

// Chart scroll refs (auto-scroll to end = today)
const retailChartScroll = ref<HTMLElement | null>(null);
const brilinkChartScroll = ref<HTMLElement | null>(null);

function scrollChartToEnd() {
  nextTick(() => {
    if (retailChartScroll.value) {
      retailChartScroll.value.scrollLeft = retailChartScroll.value.scrollWidth;
    }
    if (brilinkChartScroll.value) {
      brilinkChartScroll.value.scrollLeft = brilinkChartScroll.value.scrollWidth;
    }
  });
}

const retailMargin = computed(() => {
  if (retailStats.value.omzet === 0) return '0.0';
  return ((retailStats.value.profit / retailStats.value.omzet) * 100).toFixed(1);
});
const brilinkMargin = computed(() => {
  if (brilinkStats.value.totalFee === 0) return '0.0';
  return ((brilinkStats.value.netProfit / brilinkStats.value.totalFee) * 100).toFixed(1);
});

function formatRupiah(n: number): string { return 'Rp ' + n.toLocaleString('id-ID'); }
function formatRupiahShort(n: number): string {
  if (n >= 1000000) return 'Rp ' + (n / 1000000).toFixed(1) + 'jt';
  if (n >= 1000) return 'Rp ' + Math.round(n / 1000) + 'rb';
  return 'Rp ' + n.toLocaleString('id-ID');
}

function getDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (period.value === '7d' ? 6 : 29));
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}

function getDays(): number { return period.value === '7d' ? 7 : 30; }

// ===== RETAIL FETCH =====
async function fetchRetailStats() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  try {
    const { startDate, endDate } = getDateRange();
    const { data } = await api.get('/transactions/stats', { params: { shopId, startDate, endDate } });
    retailStats.value = data;
  } catch { /* silent */ }
}

async function fetchRetailChart() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  try {
    const days = getDays();
    const { startDate, endDate } = getDateRange();
    const { data } = await api.get('/transactions', { params: { shopId, startDate, endDate, limit: 1000 } });
    const trxList = (data.data || []).filter((t: any) => t.status === 'COMPLETED');
    const dailyMap: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
      dailyMap[d.toISOString().slice(0, 10)] = 0;
    }
    for (const trx of trxList) {
      const k = trx.createdAt.slice(0, 10);
      if (dailyMap[k] !== undefined) dailyMap[k] += trx.totalPrice;
    }
    const vals = Object.values(dailyMap);
    const mx = Math.max(...vals, 1);
    retailChart.value = Object.entries(dailyMap).map(([date, value]) => {
      const d = new Date(date);
      return { dateLabel: d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }), shortLabel: d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }), value, heightPercent: Math.max((value / mx) * 100, 0) };
    });
  } catch { retailChart.value = []; }
}

async function fetchTopProducts() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  try {
    const { startDate, endDate } = getDateRange();
    const { data } = await api.get('/transactions', { params: { shopId, startDate, endDate, limit: 1000 } });
    const trxList = (data.data || []).filter((t: any) => t.status === 'COMPLETED');
    const pm: Record<string, { name: string; totalQty: number; totalRevenue: number; totalCost: number }> = {};
    for (const trx of trxList) {
      for (const item of (trx.items || [])) {
        const name = item.product?.name || 'Produk';
        if (!pm[name]) pm[name] = { name, totalQty: 0, totalRevenue: 0, totalCost: 0 };
        pm[name].totalQty += item.quantity;
        pm[name].totalRevenue += item.subtotal;
        pm[name].totalCost += (item.unitPrice ? item.unitPrice * item.quantity - item.subtotal : 0);
      }
    }
    topProducts.value = Object.values(pm).map(p => ({ ...p, profit: p.totalRevenue - p.totalCost })).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
  } catch { topProducts.value = []; }
}

// ===== BRILINK FETCH =====
async function fetchBrilinkStats() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  try {
    const { startDate, endDate } = getDateRange();
    const res = await api.get('/brilink/transactions', { params: { shopId, startDate, endDate, limit: 1000 } }).catch(() => ({ data: { data: [] } }));
    const trxList = res.data?.data || [];
    const totalTrx = trxList.length;
    const totalVolume = trxList.reduce((s: number, t: any) => s + (t.amount || 0), 0);
    const totalFee = trxList.reduce((s: number, t: any) => s + (t.fee || 0), 0);
    const systemCost = Math.round(totalFee * 0.35);
    const netProfit = totalFee - systemCost;
    brilinkStats.value = { totalTrx, totalVolume, totalFee, systemCost, netProfit };
  } catch {
    brilinkStats.value = { totalTrx: 0, totalVolume: 0, totalFee: 0, systemCost: 0, netProfit: 0 };
  }
}

async function fetchBrilinkChart() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  try {
    const days = getDays();
    const { startDate, endDate } = getDateRange();
    const res = await api.get('/brilink/transactions', { params: { shopId, startDate, endDate, limit: 1000 } }).catch(() => ({ data: { data: [] } }));
    const trxList = res.data?.data || [];
    const dailyMap: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
      dailyMap[d.toISOString().slice(0, 10)] = 0;
    }
    for (const trx of trxList) {
      const k = (trx.createdAt || '').slice(0, 10);
      if (dailyMap[k] !== undefined) dailyMap[k] += (trx.amount || 0);
    }
    const vals = Object.values(dailyMap);
    const mx = Math.max(...vals, 1);
    brilinkChart.value = Object.entries(dailyMap).map(([date, value]) => {
      const d = new Date(date);
      return { dateLabel: d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }), shortLabel: d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }), value, heightPercent: Math.max((value / mx) * 100, 0) };
    });
  } catch { brilinkChart.value = []; }
}

async function fetchBrilinkBreakdown() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  try {
    const { startDate, endDate } = getDateRange();
    const res = await api.get('/brilink/transactions', { params: { shopId, startDate, endDate, limit: 1000 } }).catch(() => ({ data: { data: [] } }));
    const trxList = res.data?.data || [];
    const catMap: Record<string, { count: number; volume: number; fee: number }> = {};
    for (const trx of trxList) {
      const cat = trx.category || 'LAINNYA';
      if (!catMap[cat]) catMap[cat] = { count: 0, volume: 0, fee: 0 };
      catMap[cat].count++;
      catMap[cat].volume += trx.amount || 0;
      catMap[cat].fee += trx.fee || 0;
    }
    const labels: Record<string, string> = { TRANSFER_BRI: 'Transfer BRI', TRANSFER_OTHER: 'Transfer Bank Lain', TARIK_TUNAI: 'Tarik Tunai', TOPUP_PULSA: 'Top Up Pulsa', TOPUP_DATA: 'Top Up Data', TOPUP_EWALLET: 'Top Up E-Wallet', TOPUP_PLN: 'Token PLN', LAINNYA: 'Lainnya' };
    const colors: Record<string, string> = { TRANSFER_BRI: '#2563eb', TRANSFER_OTHER: '#7c3aed', TARIK_TUNAI: '#059669', TOPUP_PULSA: '#d97706', TOPUP_DATA: '#0ea5e9', TOPUP_EWALLET: '#8b5cf6', TOPUP_PLN: '#dc2626', LAINNYA: '#64748b' };
    brilinkBreakdown.value = Object.entries(catMap).map(([category, d]) => ({
      category, label: labels[category] || category, count: d.count, volume: d.volume, fee: d.fee, color: colors[category] || '#64748b',
    })).sort((a, b) => b.count - a.count);
  } catch { brilinkBreakdown.value = []; }
}

// ===== FETCH ALL =====
async function fetchAll() {
  loading.value = true;
  if (reportType.value === 'retail') {
    await Promise.all([fetchRetailStats(), fetchRetailChart(), fetchTopProducts()]);
  } else {
    await Promise.all([fetchBrilinkStats(), fetchBrilinkChart(), fetchBrilinkBreakdown()]);
  }
  loading.value = false;
  scrollChartToEnd();
}

onMounted(fetchAll);
</script>

<style scoped>
/* === Page fade-in === */
.report-page {
  animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* === Stat cards stagger entrance === */
.stagger-in > .stat-card {
  animation: scaleIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) backwards;
}
.stagger-in > .stat-card:nth-child(1) { animation-delay: 0ms; }
.stagger-in > .stat-card:nth-child(2) { animation-delay: 80ms; }
.stagger-in > .stat-card:nth-child(3) { animation-delay: 160ms; }

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}

/* === Card sections slide-in === */
.card-section {
  animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
  animation-delay: 200ms;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

/* === Chart tooltip (custom CSS, no native title) === */
.chart-col .chart-tip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) scale(0.9);
  background: #0f172a;
  border-radius: 8px;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 10px;
  line-height: 1.3;
  white-space: nowrap;
  color: white;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 50;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  margin-bottom: 6px;
}
.chart-col .chart-tip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #0f172a;
}
.chart-col:hover .chart-tip {
  opacity: 1;
  transform: translateX(-50%) scale(1);
}

/* Chart scroll: clip only X axis, allow Y overflow for tooltips */
.chart-scroll-wrap {
  overflow-x: auto;
  overflow-y: visible;
}

/* === Chart bar grow animation === */
.chart-bars .chart-bar {
  animation: growUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) backwards;
}

@keyframes growUp {
  from { transform: scaleY(0); transform-origin: bottom; }
  to { transform: scaleY(1); transform-origin: bottom; }
}

/* === Chart tooltip arrow & glow === */
.chart-tooltip {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* === Product row hover effect === */
.product-row {
  transition: all 0.2s ease;
}
.product-row:hover {
  transform: translateX(2px);
}

/* === Stat card hover glow === */
.stat-card {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* === Smooth number transitions (visual polish) === */
.font-mono {
  font-variant-numeric: tabular-nums;
}

/* === Hide scrollbar but keep scroll functional === */
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
