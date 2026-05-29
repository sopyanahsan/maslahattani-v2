<template>
  <div class="space-y-5 p-4">
    <header>
      <h1 class="font-bold text-lg text-slate-800">Laporan</h1>
      <p class="text-xs text-slate-500 mt-0.5">Ringkasan penjualan & performa hari ini</p>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
    </div>

    <template v-else>
      <!-- Today Summary Card -->
      <div class="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-5 text-white shadow-md">
        <p class="text-xs font-medium opacity-80 mb-1">Penjualan Hari Ini</p>
        <h2 class="text-2xl font-bold font-mono">{{ formatRupiah(statsData.omzet) }}</h2>
        <p class="text-[11px] opacity-70 mt-1">{{ statsData.totalTransaksi }} transaksi</p>
      </div>

      <!-- Stats Grid (2x2) -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <p class="text-[10px] text-slate-500 font-medium uppercase mb-1">Profit</p>
          <p class="text-lg font-bold font-mono text-emerald-600">{{ formatRupiah(statsData.profit) }}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <p class="text-[10px] text-slate-500 font-medium uppercase mb-1">Hutang Baru</p>
          <p class="text-lg font-bold font-mono text-amber-600">{{ formatRupiah(statsData.totalHutang) }}</p>
          <p class="text-[10px] text-slate-400">{{ statsData.jumlahHutang }} transaksi</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <p class="text-[10px] text-slate-500 font-medium uppercase mb-1">Total Diskon</p>
          <p class="text-lg font-bold font-mono text-slate-700">{{ formatRupiah(statsData.diskon) }}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <p class="text-[10px] text-slate-500 font-medium uppercase mb-1">Void</p>
          <p class="text-lg font-bold font-mono text-red-500">{{ statsData.totalVoid }}</p>
        </div>
      </div>

      <!-- Payment Method Breakdown -->
      <div>
        <h3 class="text-sm font-bold text-slate-800 mb-3">Breakdown Metode Bayar</h3>
        <div class="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <div v-for="pm in paymentBreakdown" :key="pm.method" class="flex items-center gap-3">
            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-slate-700">{{ pm.label }}</span>
                <span class="text-xs font-mono text-slate-600">{{ pm.count }} trx · {{ pm.percent }}%</span>
              </div>
              <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all" :style="{ width: pm.percent + '%', backgroundColor: pm.color }"></div>
              </div>
            </div>
          </div>
          <div v-if="paymentBreakdown.length === 0" class="text-center py-4 text-xs text-slate-400">
            Belum ada data transaksi
          </div>
        </div>
      </div>

      <!-- Top Products -->
      <div>
        <h3 class="text-sm font-bold text-slate-800 mb-3">Produk Terlaris</h3>
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div v-if="topProducts.length === 0" class="p-6 text-center">
            <TrendingUpIcon class="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p class="text-xs text-slate-400">Belum ada data</p>
          </div>
          <div v-else class="divide-y divide-slate-100">
            <div v-for="(prod, idx) in topProducts" :key="prod.name" class="flex items-center justify-between px-4 py-3">
              <div class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold flex items-center justify-center">{{ idx + 1 }}</span>
                <div>
                  <p class="text-sm font-medium text-slate-800">{{ prod.name }}</p>
                  <p class="text-[10px] text-slate-500">{{ prod.totalQty }}x terjual</p>
                </div>
              </div>
              <span class="text-xs font-mono font-bold text-slate-700">{{ formatRupiah(prod.totalRevenue) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 7-Day Chart Placeholder -->
      <div>
        <h3 class="text-sm font-bold text-slate-800 mb-3">Grafik 7 Hari</h3>
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <div class="flex items-end gap-1 h-32">
            <div v-for="(day, i) in weeklyData" :key="i" class="flex-1 flex flex-col items-center gap-1">
              <div class="w-full bg-blue-500 rounded-t transition-all" :style="{ height: day.heightPercent + '%', minHeight: '4px' }"></div>
              <span class="text-[9px] text-slate-500">{{ day.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Loader2 as Loader2Icon, TrendingUp as TrendingUpIcon } from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import api from '@/shared/services/api';

const authStore = useAuthStore();
const loading = ref(true);

const statsData = ref({
  omzet: 0, modal: 0, profit: 0, diskon: 0,
  totalTransaksi: 0, totalVoid: 0, totalHutang: 0, jumlahHutang: 0,
});

const paymentBreakdown = ref<Array<{ method: string; label: string; count: number; percent: number; color: string }>>([]);
const topProducts = ref<Array<{ name: string; totalQty: number; totalRevenue: number }>>([]);
const weeklyData = ref<Array<{ label: string; value: number; heightPercent: number }>>([]);

function formatRupiah(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}

async function fetchStats() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;

  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await api.get('/transactions/stats', {
      params: { shopId, startDate: today, endDate: today },
    });
    statsData.value = data;
  } catch { /* silent */ }
}

async function fetchPaymentBreakdown() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;

  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await api.get('/transactions', {
      params: { shopId, startDate: today, endDate: today, limit: 200 },
    });
    const trxList = data.data || [];
    const methodCounts: Record<string, number> = {};
    for (const trx of trxList) {
      if (trx.status !== 'COMPLETED') continue;
      const m = trx.payments?.[0]?.method || 'CASH';
      methodCounts[m] = (methodCounts[m] || 0) + 1;
    }
    const total = Object.values(methodCounts).reduce((s, c) => s + c, 0) || 1;
    const colors: Record<string, string> = { CASH: '#2563eb', QRIS: '#7c3aed', TRANSFER: '#0ea5e9', HUTANG: '#d97706' };
    const labels: Record<string, string> = { CASH: 'Tunai', QRIS: 'QRIS', TRANSFER: 'Transfer', HUTANG: 'Hutang' };
    paymentBreakdown.value = Object.entries(methodCounts).map(([method, count]) => ({
      method, label: labels[method] || method, count,
      percent: Math.round((count / total) * 100),
      color: colors[method] || '#64748b',
    }));
  } catch { /* silent */ }
}

async function fetchTopProducts() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;

  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await api.get('/transactions', {
      params: { shopId, startDate: today, endDate: today, limit: 200 },
    });
    const trxList = data.data || [];
    const productMap: Record<string, { name: string; totalQty: number; totalRevenue: number }> = {};
    for (const trx of trxList) {
      if (trx.status !== 'COMPLETED') continue;
      for (const item of (trx.items || [])) {
        const name = item.product?.name || item.productId;
        if (!productMap[name]) productMap[name] = { name, totalQty: 0, totalRevenue: 0 };
        productMap[name].totalQty += item.quantity;
        productMap[name].totalRevenue += item.subtotal;
      }
    }
    topProducts.value = Object.values(productMap)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5);
  } catch { /* silent */ }
}

function generateWeeklyPlaceholder() {
  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const today = new Date().getDay(); // 0=Sun
  weeklyData.value = days.map((label, i) => {
    const value = i <= (today === 0 ? 6 : today - 1) ? Math.floor(Math.random() * 80) + 20 : 0;
    return { label, value, heightPercent: value };
  });
}

onMounted(async () => {
  loading.value = true;
  await Promise.all([fetchStats(), fetchPaymentBreakdown(), fetchTopProducts()]);
  generateWeeklyPlaceholder();
  loading.value = false;
});
</script>
