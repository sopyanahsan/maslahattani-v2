<template>
  <div class="space-y-5">
    <!-- Header -->
    <div>
      <h1 class="text-xl font-bold text-slate-950 dark:text-slate-100">Laporan Retail</h1>
      <p class="text-xs text-slate-500 mt-0.5">Analisis penjualan, laba rugi, produk, dan customer.</p>
    </div>

    <!-- Filter Bar -->
    <div class="flex flex-col sm:flex-row gap-3 flex-wrap items-start sm:items-center">
      <input v-model="startDate" type="date" class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-[#00A19B] outline-none" />
      <input v-model="endDate" type="date" class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-[#00A19B] outline-none" />
      <button type="button" class="h-9 px-4 bg-[#00A19B] text-white text-xs font-semibold rounded-lg hover:opacity-90 flex items-center gap-1.5" @click="fetchAll">
        Terapkan
      </button>
      <div class="flex items-center gap-1.5">
        <button v-for="r in quickRanges" :key="r.label" type="button" :class="['h-7 px-2.5 text-[11px] font-medium rounded-md transition-colors', activeRange === r.label ? 'bg-[#00A19B] text-white' : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800']" @click="applyRange(r.days, r.label)">{{ r.label }}</button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
      <button v-for="tab in tabs" :key="tab.key" type="button" :class="['h-8 px-4 text-xs font-semibold rounded-md transition-colors', activeTab === tab.key ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900']" @click="activeTab = tab.key">{{ tab.label }}</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="w-6 h-6 border-4 border-slate-200 dark:border-slate-700 border-t-[#00A19B] rounded-full animate-spin" />
      <span class="ml-3 text-sm text-slate-500">Memuat laporan...</span>
    </div>

    <template v-else>
      <!-- ============================================ -->
      <!-- TAB: Penjualan                               -->
      <!-- ============================================ -->
      <template v-if="activeTab === 'sales' && salesReport">
        <!-- KPI Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
            <p class="text-[10px] text-slate-500 uppercase">Omzet</p>
            <p class="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">{{ formatRupiah(salesReport.summary.omzet) }}</p>
          </div>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
            <p class="text-[10px] text-slate-500 uppercase">Laba Kotor</p>
            <p class="text-lg font-bold font-mono text-emerald-600 mt-1">{{ formatRupiah(salesReport.summary.profit) }}</p>
          </div>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
            <p class="text-[10px] text-slate-500 uppercase">Transaksi</p>
            <p class="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">{{ salesReport.summary.totalTransactions }}</p>
          </div>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
            <p class="text-[10px] text-slate-500 uppercase">Margin</p>
            <p class="text-lg font-bold font-mono text-[#00A19B] mt-1">{{ salesReport.summary.marginPercent }}%</p>
          </div>
        </div>

        <!-- Grafik Trend Penjualan -->
        <div v-if="salesReport.dailyTrend.length > 0" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Grafik Trend Penjualan</h3>
          <div class="flex gap-2">
            <div class="flex flex-col justify-between h-48 text-right pr-1 shrink-0 w-12">
              <span class="text-[9px] font-mono text-slate-400">{{ formatCompact(trendYMax) }}</span>
              <span class="text-[9px] font-mono text-slate-400">{{ formatCompact(Math.round(trendYMax * 0.5)) }}</span>
              <span class="text-[9px] font-mono text-slate-400">0</span>
            </div>
            <div class="flex-1 relative h-48">
              <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div class="border-b border-dashed border-slate-100 dark:border-slate-800" />
                <div class="border-b border-dashed border-slate-100 dark:border-slate-800" />
                <div class="border-b border-slate-200 dark:border-slate-700" />
              </div>
              <svg class="absolute inset-0 w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid meet">
                <path :d="trendAreaPath" fill="url(#trendGrad)" />
                <polyline :points="trendLinePath" fill="none" stroke="#00A19B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                <circle v-for="(pt, i) in trendCoords" :key="i" :cx="pt.x" :cy="pt.y" r="3.5" fill="#00A19B" stroke="white" stroke-width="1.5" />
                <defs><linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#00A19B" stop-opacity="0.25" /><stop offset="100%" stop-color="#00A19B" stop-opacity="0.02" /></linearGradient></defs>
              </svg>
            </div>
          </div>
          <div class="flex mt-2 ml-14">
            <div v-for="(d, i) in salesReport.dailyTrend" :key="i" class="flex-1 text-center">
              <span v-if="shouldShowTrendLabel(i)" class="text-[8px] font-mono text-slate-400">{{ formatShortDate(d.date) }}</span>
            </div>
          </div>
        </div>

        <!-- Method Breakdown -->
        <div v-if="salesReport.methodBreakdown.length > 0" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Breakdown Metode Bayar</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div v-for="m in salesReport.methodBreakdown" :key="m.method" class="border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-center">
              <span :class="['inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase mb-2', methodBadge(m.method)]">{{ m.method }}</span>
              <p class="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">{{ formatRupiah(m.totalAmount) }}</p>
              <p class="text-[10px] text-slate-400 mt-0.5">{{ m.count }} trx</p>
            </div>
          </div>
        </div>

        <!-- Daily Trend Table -->
        <div v-if="salesReport.dailyTrend.length > 0" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Trend Harian</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-slate-200 dark:border-slate-800"><tr><th class="px-4 py-2 text-left text-[10px] font-bold text-slate-600 uppercase">Tanggal</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Omzet</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Profit</th><th class="px-4 py-2 text-center text-[10px] font-bold text-slate-600 uppercase">Trx</th></tr></thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800"><tr v-for="d in salesReport.dailyTrend" :key="d.date" class="hover:bg-slate-50 dark:hover:bg-slate-800/50"><td class="px-4 py-2 text-xs font-mono">{{ d.date }}</td><td class="px-4 py-2 text-right text-xs font-mono">{{ formatRupiah(d.omzet) }}</td><td class="px-4 py-2 text-right text-xs font-mono text-emerald-600">{{ formatRupiah(d.profit) }}</td><td class="px-4 py-2 text-center text-xs font-mono">{{ d.transactions }}</td></tr></tbody>
            </table>
          </div>
        </div>
      </template>

      <!-- ============================================ -->
      <!-- TAB: Laba Rugi                               -->
      <!-- ============================================ -->
      <template v-if="activeTab === 'labarugi' && salesReport">
        <!-- P&L Statement -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 max-w-lg">
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Laporan Laba Rugi</h3>
          <div class="space-y-3">
            <div class="flex justify-between text-sm"><span class="text-slate-700 dark:text-slate-300">Pendapatan (Omzet)</span><span class="font-mono font-bold text-slate-900 dark:text-slate-100">{{ formatRupiah(salesReport.summary.omzet) }}</span></div>
            <div class="flex justify-between text-sm"><span class="text-slate-700 dark:text-slate-300">HPP (Harga Pokok Penjualan)</span><span class="font-mono text-red-500">- {{ formatRupiah(salesReport.summary.modal) }}</span></div>
            <div class="flex justify-between text-sm"><span class="text-slate-700 dark:text-slate-300">Diskon Diberikan</span><span class="font-mono text-amber-500">- {{ formatRupiah(salesReport.summary.diskon) }}</span></div>
            <div class="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between text-base"><span class="font-bold text-slate-900 dark:text-slate-100">Laba Kotor</span><span class="font-mono font-bold text-emerald-600">{{ formatRupiah(salesReport.summary.profit) }}</span></div>
            <div class="flex justify-between text-xs text-slate-400"><span>Margin Profit</span><span class="font-mono">{{ salesReport.summary.marginPercent }}%</span></div>
            <div class="flex justify-between text-xs text-slate-400"><span>Void</span><span class="font-mono">{{ salesReport.summary.totalVoided }} transaksi</span></div>
          </div>
        </div>

        <!-- Perbandingan Periode -->
        <div v-if="comparison" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Perbandingan Periode</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="text-center">
              <p class="text-[10px] text-slate-500 uppercase mb-1">Omzet</p>
              <p class="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">{{ formatRupiah(comparison.current.omzet) }}</p>
              <p class="text-[10px] text-slate-400">vs {{ formatRupiah(comparison.previous.omzet) }}</p>
              <span :class="['text-[11px] font-bold', comparison.change.omzet >= 0 ? 'text-emerald-600' : 'text-red-500']">{{ comparison.change.omzet >= 0 ? '+' : '' }}{{ comparison.change.omzet }}%</span>
            </div>
            <div class="text-center">
              <p class="text-[10px] text-slate-500 uppercase mb-1">Profit</p>
              <p class="text-sm font-bold font-mono text-emerald-600">{{ formatRupiah(comparison.current.profit) }}</p>
              <p class="text-[10px] text-slate-400">vs {{ formatRupiah(comparison.previous.profit) }}</p>
              <span :class="['text-[11px] font-bold', comparison.change.profit >= 0 ? 'text-emerald-600' : 'text-red-500']">{{ comparison.change.profit >= 0 ? '+' : '' }}{{ comparison.change.profit }}%</span>
            </div>
            <div class="text-center">
              <p class="text-[10px] text-slate-500 uppercase mb-1">Transaksi</p>
              <p class="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">{{ comparison.current.transactions }}</p>
              <p class="text-[10px] text-slate-400">vs {{ comparison.previous.transactions }}</p>
              <span :class="['text-[11px] font-bold', comparison.change.transactions >= 0 ? 'text-emerald-600' : 'text-red-500']">{{ comparison.change.transactions >= 0 ? '+' : '' }}{{ comparison.change.transactions }}%</span>
            </div>
          </div>
          <p class="text-[10px] text-slate-400 mt-3 text-center">{{ comparison.current.period }} vs {{ comparison.previous.period }}</p>
        </div>
      </template>

      <!-- ============================================ -->
      <!-- TAB: Produk                                  -->
      <!-- ============================================ -->
      <template v-if="activeTab === 'products' && productReport">
        <!-- Summary Cards -->
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
            <p class="text-[10px] text-slate-500 uppercase">Total Produk</p>
            <p class="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{{ productReport.totalProducts }}</p>
          </div>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
            <p class="text-[10px] text-slate-500 uppercase">Terjual</p>
            <p class="text-lg font-bold text-emerald-600 mt-1">{{ productReport.productsWithSales }}</p>
          </div>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
            <p class="text-[10px] text-slate-500 uppercase">Tidak Laku</p>
            <p class="text-lg font-bold text-red-500 mt-1">{{ productReport.productsWithoutSales }}</p>
          </div>
        </div>

        <!-- Top Selling -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-950/20"><h3 class="text-sm font-bold text-emerald-800 dark:text-emerald-300">Top 10 Produk Terlaris</h3></div>
          <div class="overflow-x-auto">
            <table class="w-full"><thead class="border-b border-slate-200 dark:border-slate-800"><tr><th class="px-4 py-2 text-left text-[10px] font-bold text-slate-600 uppercase">#</th><th class="px-4 py-2 text-left text-[10px] font-bold text-slate-600 uppercase">Produk</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Qty</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Revenue</th></tr></thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800"><tr v-for="(p, i) in productReport.topSelling" :key="p.productId"><td class="px-4 py-2 text-xs text-slate-400">{{ i + 1 }}</td><td class="px-4 py-2 text-xs font-medium text-slate-900 dark:text-slate-100">{{ p.name }} <span class="text-slate-400">({{ p.sku }})</span></td><td class="px-4 py-2 text-right text-xs font-mono">{{ p.qtySold }}</td><td class="px-4 py-2 text-right text-xs font-mono font-semibold">{{ formatRupiah(p.revenue) }}</td></tr></tbody>
            </table>
          </div>
        </div>

        <!-- Slow Moving -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-red-50 dark:bg-red-950/20"><h3 class="text-sm font-bold text-red-800 dark:text-red-300">Produk Slow Moving (Ga Laku)</h3></div>
          <div class="overflow-x-auto">
            <table class="w-full"><thead class="border-b border-slate-200 dark:border-slate-800"><tr><th class="px-4 py-2 text-left text-[10px] font-bold text-slate-600 uppercase">Produk</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Harga</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Terjual</th></tr></thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800"><tr v-for="p in productReport.slowMoving" :key="p.productId"><td class="px-4 py-2 text-xs font-medium text-slate-900 dark:text-slate-100">{{ p.name }}</td><td class="px-4 py-2 text-right text-xs font-mono">{{ formatRupiah(p.price || 0) }}</td><td class="px-4 py-2 text-right text-xs font-mono" :class="p.qtySold === 0 ? 'text-red-500 font-bold' : 'text-slate-600'">{{ p.qtySold }}</td></tr></tbody>
            </table>
          </div>
        </div>

        <!-- Highest Margin -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-blue-50 dark:bg-blue-950/20"><h3 class="text-sm font-bold text-blue-800 dark:text-blue-300">Produk Margin Tertinggi</h3></div>
          <div class="overflow-x-auto">
            <table class="w-full"><thead class="border-b border-slate-200 dark:border-slate-800"><tr><th class="px-4 py-2 text-left text-[10px] font-bold text-slate-600 uppercase">Produk</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Margin</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">%</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Total Profit</th></tr></thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800"><tr v-for="p in productReport.highestMargin" :key="p.productId"><td class="px-4 py-2 text-xs font-medium text-slate-900 dark:text-slate-100">{{ p.name }}</td><td class="px-4 py-2 text-right text-xs font-mono">{{ formatRupiah(p.margin || 0) }}</td><td class="px-4 py-2 text-right text-xs font-mono text-[#00A19B] font-bold">{{ p.marginPercent }}%</td><td class="px-4 py-2 text-right text-xs font-mono font-semibold text-emerald-600">{{ formatRupiah(p.totalProfit || 0) }}</td></tr></tbody>
            </table>
          </div>
        </div>
      </template>

      <!-- ============================================ -->
      <!-- TAB: Customer                                -->
      <!-- ============================================ -->
      <template v-if="activeTab === 'customers' && customerReport">
        <!-- Summary -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
            <p class="text-[10px] text-slate-500 uppercase">Total Customer</p>
            <p class="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{{ customerReport.summary.totalUniqueCustomers }}</p>
          </div>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
            <p class="text-[10px] text-slate-500 uppercase">Repeat</p>
            <p class="text-lg font-bold text-[#00A19B] mt-1">{{ customerReport.summary.repeatCustomers }}</p>
          </div>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
            <p class="text-[10px] text-slate-500 uppercase">New</p>
            <p class="text-lg font-bold text-blue-600 mt-1">{{ customerReport.summary.newCustomers }}</p>
          </div>
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
            <p class="text-[10px] text-slate-500 uppercase">Baru Daftar</p>
            <p class="text-lg font-bold text-amber-600 mt-1">{{ customerReport.summary.newlyRegistered }}</p>
          </div>
        </div>

        <!-- Top Spenders -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"><h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Customer Ranking (Top Spender)</h3></div>
          <div class="overflow-x-auto">
            <table class="w-full"><thead class="border-b border-slate-200 dark:border-slate-800"><tr><th class="px-4 py-2 text-left text-[10px] font-bold text-slate-600 uppercase">#</th><th class="px-4 py-2 text-left text-[10px] font-bold text-slate-600 uppercase">Nama</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Total Belanja</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Profit</th><th class="px-4 py-2 text-center text-[10px] font-bold text-slate-600 uppercase">Trx</th><th class="px-4 py-2 text-right text-[10px] font-bold text-slate-600 uppercase">Avg/Visit</th></tr></thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800"><tr v-for="(c, i) in customerReport.topSpenders" :key="c.customerId" class="hover:bg-slate-50 dark:hover:bg-slate-800/50"><td class="px-4 py-2.5 text-xs text-slate-400 font-bold">{{ i + 1 }}</td><td class="px-4 py-2.5"><p class="text-xs font-semibold text-slate-900 dark:text-slate-100">{{ c.name }}</p><p v-if="c.phone" class="text-[10px] text-slate-400">{{ c.phone }}</p></td><td class="px-4 py-2.5 text-right text-xs font-mono font-bold text-slate-900 dark:text-slate-100">{{ formatRupiah(c.totalSpent) }}</td><td class="px-4 py-2.5 text-right text-xs font-mono text-emerald-600">{{ formatRupiah(c.totalProfit) }}</td><td class="px-4 py-2.5 text-center text-xs font-mono">{{ c.transactionCount }}</td><td class="px-4 py-2.5 text-right text-xs font-mono text-slate-600">{{ formatRupiah(c.avgPerVisit) }}</td></tr></tbody>
            </table>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useAuthStore } from '@/shared/stores/auth.store';
import reportsService, { type SalesReportResponse, type ProductReportResponse, type CustomerReportResponse, type SalesComparisonResponse } from '@/shared/services/reports.service';

const authStore = useAuthStore();
const loading = ref(false);
const activeTab = ref<'sales' | 'labarugi' | 'products' | 'customers'>('sales');
const activeRange = ref('30 Hari');
const startDate = ref('');
const endDate = ref('');

const salesReport = ref<SalesReportResponse | null>(null);
const productReport = ref<ProductReportResponse | null>(null);
const customerReport = ref<CustomerReportResponse | null>(null);
const comparison = ref<SalesComparisonResponse | null>(null);

const tabs = [
  { key: 'sales', label: 'Penjualan' },
  { key: 'labarugi', label: 'Laba Rugi' },
  { key: 'products', label: 'Produk' },
  { key: 'customers', label: 'Customer' },
];

const quickRanges = [
  { label: 'Hari Ini', days: 0 },
  { label: '7 Hari', days: 7 },
  { label: '30 Hari', days: 30 },
  { label: 'Bulan Ini', days: -1 },
];

function getShopId(): string | undefined { return authStore.user?.shopId || undefined; }

function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}rb`;
  return String(amount);
}

function formatShortDate(d: string): string {
  const parts = d.split('-');
  return `${parseInt(parts[2])}/${parseInt(parts[1])}`;
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

function applyRange(days: number, label: string) {
  activeRange.value = label;
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
    const [sales, products, customers, comp] = await Promise.allSettled([
      reportsService.getSalesReport(shopId, startDate.value || undefined, endDate.value || undefined),
      reportsService.getProductReport(shopId, startDate.value || undefined, endDate.value || undefined),
      reportsService.getCustomerReport(shopId, startDate.value || undefined, endDate.value || undefined),
      startDate.value && endDate.value ? reportsService.getSalesComparison(shopId, startDate.value, endDate.value) : Promise.resolve(null),
    ]);
    salesReport.value = sales.status === 'fulfilled' ? sales.value : null;
    productReport.value = products.status === 'fulfilled' ? products.value : null;
    customerReport.value = customers.status === 'fulfilled' ? customers.value : null;
    comparison.value = comp.status === 'fulfilled' ? comp.value : null;
  } finally { loading.value = false; }
}

// ============================================
// Trend Chart (SVG line in Penjualan tab)
// ============================================

const trendYMax = computed(() => {
  if (!salesReport.value) return 100000;
  const max = Math.max(...salesReport.value.dailyTrend.map(d => d.omzet), 1);
  const h = max * 1.2;
  const mag = Math.pow(10, Math.floor(Math.log10(h)));
  return Math.ceil(h / mag) * mag;
});

const trendCoords = computed(() => {
  if (!salesReport.value) return [];
  const data = salesReport.value.dailyTrend;
  const n = data.length;
  if (n === 0) return [];
  const w = 600, h = 200, px = 20, py = 15;
  return data.map((d, i) => ({
    x: px + (n === 1 ? (w - px * 2) / 2 : (i / (n - 1)) * (w - px * 2)),
    y: py + (h - py * 2) - (d.omzet / trendYMax.value) * (h - py * 2),
  }));
});

const trendLinePath = computed(() => trendCoords.value.map(p => `${p.x},${p.y}`).join(' '));

const trendAreaPath = computed(() => {
  const pts = trendCoords.value;
  if (pts.length === 0) return '';
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  return `${line} L${pts[pts.length - 1].x},185 L${pts[0].x},185 Z`;
});

function shouldShowTrendLabel(idx: number): boolean {
  const total = salesReport.value?.dailyTrend.length || 0;
  if (total <= 10) return true;
  if (total <= 15) return idx % 2 === 0;
  return idx % 3 === 0;
}

onMounted(() => { applyRange(30, '30 Hari'); });
</script>
