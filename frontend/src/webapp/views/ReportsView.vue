<template>
  <div class="space-y-5 p-4">
    <!-- Header -->
    <header class="flex items-center gap-2">
      <BarChart3Icon class="w-5 h-5 text-blue-600" />
      <h1 class="font-bold text-lg text-slate-800">Laporan</h1>
    </header>

    <!-- Type + Period Toggle -->
    <div class="space-y-2">
      <!-- Retail / BRILink switch -->
      <div class="flex rounded-xl bg-slate-100 p-1">
        <button :class="['flex-1 py-2 text-sm font-semibold rounded-lg transition-all', reportType === 'retail' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500']" @click="reportType = 'retail'; fetchAll()">Retail</button>
        <button :class="['flex-1 py-2 text-sm font-semibold rounded-lg transition-all', reportType === 'brilink' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500']" @click="reportType = 'brilink'; fetchAll()">BRILink</button>
      </div>
      <!-- Period switch -->
      <div class="flex rounded-xl bg-slate-100 p-1">
        <button :class="['flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all', period === '7d' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500']" @click="period = '7d'; fetchAll()">7 Hari</button>
        <button :class="['flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all', period === '30d' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500']" @click="period = '30d'; fetchAll()">30 Hari</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
    </div>

    <template v-else>
      <!-- ========== RETAIL REPORT ========== -->
      <template v-if="reportType === 'retail'">
        <!-- Summary Cards -->
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <ShoppingCartIcon class="w-5 h-5 text-blue-600 mx-auto mb-2" />
            <p class="text-xl font-bold text-slate-900">{{ retailStats.totalTransaksi }}</p>
            <p class="text-[10px] text-slate-500">Transaksi</p>
          </div>
          <div class="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <TrendingUpIcon class="w-5 h-5 text-emerald-500 mx-auto mb-2" />
            <p class="text-lg font-bold text-slate-900 font-mono">{{ formatRupiahShort(retailStats.omzet) }}</p>
            <p class="text-[10px] text-slate-500">Penjualan</p>
          </div>
          <div class="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <TrendingUpIcon class="w-5 h-5 text-emerald-500 mx-auto mb-2" />
            <p class="text-lg font-bold text-slate-900 font-mono">{{ formatRupiahShort(retailStats.profit) }}</p>
            <p class="text-[10px] text-slate-500">Profit</p>
          </div>
        </div>

        <!-- Laba Rugi -->
        <div class="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <DollarSignIcon class="w-4 h-4" /> Laba Rugi
          </h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-center">
              <span class="flex items-center gap-1.5 text-slate-700"><ArrowUpIcon class="w-3.5 h-3.5 text-emerald-500" /> Pendapatan Kotor</span>
              <span class="font-mono text-slate-900">{{ formatRupiah(retailStats.omzet) }}</span>
            </div>
            <div class="border-t border-slate-100 pt-2">
              <div class="flex justify-between items-center">
                <span class="text-slate-700 font-medium">Penjualan Bersih</span>
                <span class="font-mono text-slate-900">{{ formatRupiah(retailStats.omzet - retailStats.diskon) }}</span>
              </div>
              <div class="flex justify-between items-center mt-1">
                <span class="flex items-center gap-1.5 text-red-500"><ArrowDownIcon class="w-3.5 h-3.5" /> HPP (Modal)</span>
                <span class="font-mono text-red-500">-{{ formatRupiah(retailStats.modal) }}</span>
              </div>
            </div>
            <div class="border-t border-slate-100 pt-2">
              <div class="flex justify-between items-center">
                <span class="font-bold text-slate-900">Laba Kotor</span>
                <span class="font-mono font-bold text-emerald-600">{{ formatRupiah(retailStats.profit) }}</span>
              </div>
              <div class="flex justify-between items-center mt-0.5">
                <span class="text-xs text-slate-500">Margin Kotor</span>
                <span class="text-xs text-slate-500">{{ retailMargin }}%</span>
              </div>
            </div>
            <div class="border-t border-slate-100 pt-2">
              <div class="flex justify-between items-center">
                <span class="font-bold text-slate-900">Laba Bersih</span>
                <span class="font-mono font-bold text-emerald-600">{{ formatRupiah(retailStats.profit) }}</span>
              </div>
              <div class="flex justify-between items-center mt-0.5">
                <span class="text-xs text-slate-500">Margin Bersih</span>
                <span class="text-xs text-slate-500">{{ retailMargin }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tren Penjualan Chart -->
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <h3 class="text-sm font-bold text-slate-800 mb-4">Tren Penjualan</h3>
          <div class="flex items-end gap-1 h-40 relative">
            <div v-for="(day, i) in retailChart" :key="i" class="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer">
              <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <p class="font-bold text-slate-800">{{ day.dateLabel }}</p>
                <p class="text-blue-600">Penjualan: {{ formatRupiah(day.value) }}</p>
              </div>
              <div class="w-full rounded-t transition-all group-hover:opacity-80" :class="day.value > 0 ? 'bg-blue-500' : 'bg-slate-200'" :style="{ height: day.heightPercent + '%', minHeight: day.value > 0 ? '8px' : '4px' }"></div>
              <span class="text-[9px] text-slate-500 mt-1.5">{{ day.shortLabel }}</span>
            </div>
          </div>
        </div>

        <!-- Produk Terlaris -->
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <h3 class="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
            <PackageIcon class="w-4 h-4" /> Produk Terlaris
          </h3>
          <div v-if="topProducts.length === 0" class="text-center py-6 text-xs text-slate-400">Belum ada data produk</div>
          <div v-else class="space-y-3">
            <div v-for="(prod, idx) in topProducts" :key="prod.name" class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span :class="['w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center', idx < 3 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600']">{{ idx + 1 }}</span>
                <span class="text-sm font-medium text-slate-800">{{ prod.name }}</span>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold font-mono text-slate-900">{{ formatRupiah(prod.totalRevenue) }}</p>
                <p class="text-[10px] text-slate-500">{{ prod.totalQty }} terjual · laba {{ formatRupiah(prod.profit) }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ========== BRILINK REPORT ========== -->
      <template v-if="reportType === 'brilink'">
        <!-- Summary Cards -->
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <LandmarkIcon class="w-5 h-5 text-emerald-600 mx-auto mb-2" />
            <p class="text-xl font-bold text-slate-900">{{ brilinkStats.totalTrx }}</p>
            <p class="text-[10px] text-slate-500">Transaksi</p>
          </div>
          <div class="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <BanknoteIcon class="w-5 h-5 text-emerald-500 mx-auto mb-2" />
            <p class="text-lg font-bold text-slate-900 font-mono">{{ formatRupiahShort(brilinkStats.totalVolume) }}</p>
            <p class="text-[10px] text-slate-500">Volume</p>
          </div>
          <div class="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <TrendingUpIcon class="w-5 h-5 text-emerald-500 mx-auto mb-2" />
            <p class="text-lg font-bold text-slate-900 font-mono">{{ formatRupiahShort(brilinkStats.totalFee) }}</p>
            <p class="text-[10px] text-slate-500">Total Fee</p>
          </div>
        </div>

        <!-- Laba Rugi BRILink -->
        <div class="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <DollarSignIcon class="w-4 h-4" /> Laba Rugi BRILink
          </h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-center">
              <span class="flex items-center gap-1.5 text-slate-700"><ArrowUpIcon class="w-3.5 h-3.5 text-emerald-500" /> Total Fee Pelanggan</span>
              <span class="font-mono text-slate-900">{{ formatRupiah(brilinkStats.totalFee) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="flex items-center gap-1.5 text-red-500"><ArrowDownIcon class="w-3.5 h-3.5" /> Biaya Sistem BRI</span>
              <span class="font-mono text-red-500">-{{ formatRupiah(brilinkStats.systemCost) }}</span>
            </div>
            <div class="border-t border-slate-100 pt-2">
              <div class="flex justify-between items-center">
                <span class="font-bold text-slate-900">Profit Bersih BRILink</span>
                <span class="font-mono font-bold text-emerald-600">{{ formatRupiah(brilinkStats.netProfit) }}</span>
              </div>
              <div class="flex justify-between items-center mt-0.5">
                <span class="text-xs text-slate-500">Margin</span>
                <span class="text-xs text-slate-500">{{ brilinkMargin }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tren Volume BRILink Chart -->
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <h3 class="text-sm font-bold text-slate-800 mb-4">Tren Volume BRILink</h3>
          <div class="flex items-end gap-1 h-40 relative">
            <div v-for="(day, i) in brilinkChart" :key="i" class="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer">
              <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <p class="font-bold text-slate-800">{{ day.dateLabel }}</p>
                <p class="text-emerald-600">Volume: {{ formatRupiah(day.value) }}</p>
              </div>
              <div class="w-full rounded-t transition-all group-hover:opacity-80" :class="day.value > 0 ? 'bg-emerald-500' : 'bg-slate-200'" :style="{ height: day.heightPercent + '%', minHeight: day.value > 0 ? '8px' : '4px' }"></div>
              <span class="text-[9px] text-slate-500 mt-1.5">{{ day.shortLabel }}</span>
            </div>
          </div>
        </div>

        <!-- Breakdown per Kategori BRILink -->
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <h3 class="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
            <LandmarkIcon class="w-4 h-4" /> Breakdown Kategori
          </h3>
          <div v-if="brilinkBreakdown.length === 0" class="text-center py-6 text-xs text-slate-400">Belum ada data BRILink</div>
          <div v-else class="space-y-3">
            <div v-for="cat in brilinkBreakdown" :key="cat.category" class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: cat.color }"></span>
                <span class="text-sm font-medium text-slate-800">{{ cat.label }}</span>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold font-mono text-slate-900">{{ cat.count }} trx</p>
                <p class="text-[10px] text-slate-500">Vol {{ formatRupiahShort(cat.volume) }} · Fee {{ formatRupiahShort(cat.fee) }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
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
    const { data } = await api.get('/transactions', { params: { shopId, startDate, endDate, limit: 1 } });
    // Use brilink transactions endpoint if available, otherwise calculate from brilink_transactions table
    const res = await api.get('/brilink/transactions', { params: { shopId, startDate, endDate, limit: 1000 } }).catch(() => ({ data: { data: [] } }));
    const trxList = res.data?.data || [];
    const totalTrx = trxList.length;
    const totalVolume = trxList.reduce((s: number, t: any) => s + (t.amount || 0), 0);
    const totalFee = trxList.reduce((s: number, t: any) => s + (t.fee || 0), 0);
    // Estimate system cost as ~35% of fee (configurable in admin later)
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
}

onMounted(fetchAll);
</script>
