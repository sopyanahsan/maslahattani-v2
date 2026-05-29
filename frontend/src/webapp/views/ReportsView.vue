<template>
  <div class="space-y-5 p-4">
    <!-- Header -->
    <header class="flex items-center gap-2">
      <BarChart3Icon class="w-5 h-5 text-blue-600" />
      <h1 class="font-bold text-lg text-slate-800">Laporan</h1>
    </header>

    <!-- Period Toggle -->
    <div class="flex rounded-xl bg-slate-100 p-1">
      <button :class="['flex-1 py-2 text-sm font-semibold rounded-lg transition-all', period === '7d' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500']" @click="period = '7d'; fetchAll()">7 Hari</button>
      <button :class="['flex-1 py-2 text-sm font-semibold rounded-lg transition-all', period === '30d' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500']" @click="period = '30d'; fetchAll()">30 Hari</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
    </div>

    <template v-else>
      <!-- Summary Cards (3 cols) -->
      <div class="grid grid-cols-3 gap-3">
        <div class="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <ShoppingCartIcon class="w-5 h-5 text-blue-600 mx-auto mb-2" />
          <p class="text-xl font-bold text-slate-900">{{ stats.totalTransaksi }}</p>
          <p class="text-[10px] text-slate-500">Transaksi</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <TrendingUpIcon class="w-5 h-5 text-emerald-500 mx-auto mb-2" />
          <p class="text-lg font-bold text-slate-900 font-mono">{{ formatRupiahShort(stats.omzet) }}</p>
          <p class="text-[10px] text-slate-500">Penjualan</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <TrendingUpIcon class="w-5 h-5 text-emerald-500 mx-auto mb-2" />
          <p class="text-lg font-bold text-slate-900 font-mono">{{ formatRupiahShort(stats.profit) }}</p>
          <p class="text-[10px] text-slate-500">Profit</p>
        </div>
      </div>

      <!-- Laba Rugi Section -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <DollarSignIcon class="w-4 h-4" /> Laba Rugi
        </h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between items-center">
            <span class="flex items-center gap-1.5 text-slate-700"><ArrowUpIcon class="w-3.5 h-3.5 text-emerald-500" /> Pendapatan Kotor</span>
            <span class="font-mono text-slate-900">{{ formatRupiah(stats.omzet) }}</span>
          </div>
          <div class="border-t border-slate-100 pt-2">
            <div class="flex justify-between items-center">
              <span class="text-slate-700 font-medium">Penjualan Bersih</span>
              <span class="font-mono text-slate-900">{{ formatRupiah(stats.omzet - stats.diskon) }}</span>
            </div>
            <div class="flex justify-between items-center mt-1">
              <span class="flex items-center gap-1.5 text-red-500"><ArrowDownIcon class="w-3.5 h-3.5" /> HPP (Modal)</span>
              <span class="font-mono text-red-500">-{{ formatRupiah(stats.modal) }}</span>
            </div>
          </div>
          <div class="border-t border-slate-100 pt-2">
            <div class="flex justify-between items-center">
              <span class="font-bold text-slate-900">Laba Kotor</span>
              <span class="font-mono font-bold text-emerald-600">{{ formatRupiah(stats.profit) }}</span>
            </div>
            <div class="flex justify-between items-center mt-0.5">
              <span class="text-xs text-slate-500">Margin Kotor</span>
              <span class="text-xs text-slate-500">{{ marginPercent }}%</span>
            </div>
          </div>
          <div class="border-t border-slate-100 pt-2">
            <div class="flex justify-between items-center">
              <span class="font-bold text-slate-900">Laba Bersih</span>
              <span class="font-mono font-bold text-emerald-600">{{ formatRupiah(stats.profit) }}</span>
            </div>
            <div class="flex justify-between items-center mt-0.5">
              <span class="text-xs text-slate-500">Margin Bersih</span>
              <span class="text-xs text-slate-500">{{ marginPercent }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tren Penjualan (Bar Chart with Hover) -->
      <div class="bg-white rounded-xl border border-slate-200 p-4">
        <h3 class="text-sm font-bold text-slate-800 mb-4">Tren Penjualan</h3>
        <div class="flex items-end gap-1 h-40 relative">
          <div v-for="(day, i) in chartData" :key="i" class="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer">
            <!-- Tooltip on hover -->
            <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <p class="font-bold text-slate-800">{{ day.dateLabel }}</p>
              <p class="text-blue-600">Penjualan: {{ formatRupiah(day.value) }}</p>
            </div>
            <!-- Bar -->
            <div class="w-full rounded-t transition-all group-hover:opacity-80" :class="day.value > 0 ? 'bg-blue-500' : 'bg-slate-200'" :style="{ height: day.heightPercent + '%', minHeight: day.value > 0 ? '8px' : '4px' }"></div>
            <!-- Date label -->
            <span class="text-[9px] text-slate-500 mt-1.5">{{ day.shortLabel }}</span>
          </div>
        </div>
      </div>

      <!-- Produk Terlaris -->
      <div class="bg-white rounded-xl border border-slate-200 p-4">
        <h3 class="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
          <PackageIcon class="w-4 h-4" /> Produk Terlaris
        </h3>
        <div v-if="topProducts.length === 0" class="text-center py-6 text-xs text-slate-400">
          Belum ada data produk
        </div>
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import {
  BarChart3 as BarChart3Icon, Loader2 as Loader2Icon,
  ShoppingCart as ShoppingCartIcon, TrendingUp as TrendingUpIcon,
  DollarSign as DollarSignIcon, ArrowUp as ArrowUpIcon,
  ArrowDown as ArrowDownIcon, Package as PackageIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import api from '@/shared/services/api';

const authStore = useAuthStore();
const loading = ref(true);
const period = ref<'7d' | '30d'>('7d');

const stats = ref({ omzet: 0, modal: 0, profit: 0, diskon: 0, totalTransaksi: 0, totalVoid: 0, totalHutang: 0, jumlahHutang: 0 });
const chartData = ref<Array<{ dateLabel: string; shortLabel: string; value: number; heightPercent: number }>>([]);
const topProducts = ref<Array<{ name: string; totalQty: number; totalRevenue: number; profit: number }>>([]);

const marginPercent = computed(() => {
  if (stats.value.omzet === 0) return '0.0';
  return ((stats.value.profit / stats.value.omzet) * 100).toFixed(1);
});

function formatRupiah(n: number): string { return 'Rp ' + n.toLocaleString('id-ID'); }
function formatRupiahShort(n: number): string {
  if (n >= 1000000) return 'Rp ' + (n / 1000000).toFixed(1) + 'jt';
  if (n >= 1000) return 'Rp ' + (n / 1000).toFixed(0) + 'rb';
  return 'Rp ' + n.toLocaleString('id-ID');
}

function getDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (period.value === '7d' ? 6 : 29));
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

async function fetchStats() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  try {
    const { startDate, endDate } = getDateRange();
    const { data } = await api.get('/transactions/stats', { params: { shopId, startDate, endDate } });
    stats.value = data;
  } catch { /* silent */ }
}

async function fetchChart() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  try {
    const days = period.value === '7d' ? 7 : 30;
    const { startDate, endDate } = getDateRange();
    const { data } = await api.get('/transactions', { params: { shopId, startDate, endDate, limit: 500 } });
    const trxList = (data.data || []).filter((t: any) => t.status === 'COMPLETED');

    // Group by date
    const dailyMap: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      dailyMap[d.toISOString().slice(0, 10)] = 0;
    }
    for (const trx of trxList) {
      const dateKey = trx.createdAt.slice(0, 10);
      if (dailyMap[dateKey] !== undefined) dailyMap[dateKey] += trx.totalPrice;
    }

    const values = Object.values(dailyMap);
    const maxVal = Math.max(...values, 1);

    chartData.value = Object.entries(dailyMap).map(([date, value]) => {
      const d = new Date(date);
      return {
        dateLabel: d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }),
        shortLabel: d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }),
        value,
        heightPercent: Math.max((value / maxVal) * 100, 0),
      };
    });
  } catch { chartData.value = []; }
}

async function fetchTopProducts() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  try {
    const { startDate, endDate } = getDateRange();
    const { data } = await api.get('/transactions', { params: { shopId, startDate, endDate, limit: 500 } });
    const trxList = (data.data || []).filter((t: any) => t.status === 'COMPLETED');

    const productMap: Record<string, { name: string; totalQty: number; totalRevenue: number; totalCost: number }> = {};
    for (const trx of trxList) {
      for (const item of (trx.items || [])) {
        const name = item.product?.name || item.productId;
        if (!productMap[name]) productMap[name] = { name, totalQty: 0, totalRevenue: 0, totalCost: 0 };
        productMap[name].totalQty += item.quantity;
        productMap[name].totalRevenue += item.subtotal;
        productMap[name].totalCost += (item.unitPrice - (item.subtotal / item.quantity)) * item.quantity; // approximate
      }
    }

    topProducts.value = Object.values(productMap)
      .map(p => ({ ...p, profit: p.totalRevenue - p.totalCost }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);
  } catch { topProducts.value = []; }
}

async function fetchAll() {
  loading.value = true;
  await Promise.all([fetchStats(), fetchChart(), fetchTopProducts()]);
  loading.value = false;
}

onMounted(fetchAll);
</script>
