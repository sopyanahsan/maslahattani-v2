<template>
  <div class="space-y-5 p-4">
    <!-- Greeting -->
    <header>
      <p class="text-xs text-slate-500">{{ currentDateLabel }}</p>
      <h1 class="font-bold text-xl text-slate-900 mt-0.5">{{ userName }}</h1>
    </header>

    <!-- Revenue Cards (3 cols) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <!-- Penjualan Hari Ini -->
      <div class="rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-4 text-white shadow-md">
        <p class="text-xs font-medium opacity-80 mb-1">Penjualan Hari Ini</p>
        <h2 class="text-2xl font-bold font-mono">{{ formatRupiah(retailOmzet) }}</h2>
        <p class="text-[11px] opacity-70 mt-1">{{ stats.retail }} transaksi</p>
      </div>
      <!-- Profit Hari Ini -->
      <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
        <div class="flex items-center gap-1.5 mb-1">
          <TrendingUpIcon class="w-3.5 h-3.5 text-emerald-500" />
          <p class="text-xs font-medium text-emerald-600">Profit Hari Ini</p>
        </div>
        <h2 class="text-2xl font-bold font-mono text-slate-900">{{ formatRupiah(profit) }}</h2>
      </div>
      <!-- Pengeluaran Hari Ini -->
      <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
        <div class="flex items-center gap-1.5 mb-1">
          <WalletIcon class="w-3.5 h-3.5 text-amber-500" />
          <p class="text-xs font-medium text-amber-600">Pengeluaran Hari Ini</p>
        </div>
        <h2 class="text-2xl font-bold font-mono text-slate-900">{{ formatRupiah(expenses) }}</h2>
        <p class="text-[11px] text-slate-400 mt-1">{{ expenseCount }} catatan</p>
      </div>
    </div>

    <!-- Quick Actions -->
    <div>
      <h3 class="text-sm font-bold text-slate-800 mb-3">Akses Cepat</h3>
      <div class="grid grid-cols-3 gap-3">
        <RouterLink to="/retail/pos" class="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm gap-2.5">
          <div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><ShoppingCartIcon class="w-6 h-6" /></div>
          <span class="text-xs font-medium text-slate-700">Kasir</span>
        </RouterLink>
        <RouterLink to="/brilink/menu" class="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm gap-2.5">
          <div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><LandmarkIcon class="w-6 h-6" /></div>
          <span class="text-xs font-medium text-slate-700">BRILink</span>
        </RouterLink>
        <RouterLink to="/reports" class="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm gap-2.5">
          <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"><BarChart3Icon class="w-6 h-6" /></div>
          <span class="text-xs font-medium text-slate-700">Laporan</span>
        </RouterLink>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold text-slate-800">Transaksi Terakhir</h3>
        <RouterLink to="/retail/history" class="text-xs font-semibold text-blue-600 hover:underline">Lihat Semua &gt;</RouterLink>
      </div>
      <div v-if="recentTransactions.length === 0" class="flex flex-col items-center justify-center py-10 px-4 bg-slate-50 rounded-xl border border-slate-200 border-dashed text-center">
        <ReceiptIcon class="w-10 h-10 mb-3 text-slate-300" />
        <p class="text-sm font-medium text-slate-600">Belum ada transaksi</p>
        <p class="text-xs text-slate-400 mt-1">Transaksi hari ini akan muncul di sini.</p>
      </div>
      <ul v-else class="space-y-2">
        <li v-for="(trx, index) in recentTransactions" :key="index" class="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-white shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ReceiptIcon class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-800 truncate">{{ trx.itemNames }}</p>
              <p class="text-xs font-bold text-blue-600">{{ formatRupiah(trx.amount) }}</p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <p class="text-[11px] text-slate-500">{{ trx.timestamp }}</p>
            <p class="text-[10px] text-slate-400">{{ trx.method }}</p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import {
  ShoppingCart as ShoppingCartIcon, Landmark as LandmarkIcon,
  BarChart3 as BarChart3Icon, Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon, Wallet as WalletIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShiftStore } from '@/shared/stores/shift.store';
import posService from '@/shared/services/pos.service';

const authStore = useAuthStore();
const shiftStore = useShiftStore();

const userName = computed(() => authStore.user?.username || authStore.user?.email?.split('@')[0] || 'Kasir');

// Date label (e.g., "Jumat, 29 Mei 2026")
const currentDateLabel = computed(() => {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
});

const retailOmzet = ref(0);
const profit = ref(0);
const expenses = ref(0);
const expenseCount = ref(0);
const stats = ref({ total: 0, retail: 0, brilink: 0 });
const recentTransactions = ref<Array<{ itemNames: string; timestamp: string; amount: number; method: string }>>([]);

function formatRupiah(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}

async function refresh() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  try {
    const res = await posService.getTodayTransactions(shopId, authStore.user?.id);
    const data = res.data ?? [];
    const completed = data.filter((t: any) => t.status === 'COMPLETED');
    retailOmzet.value = completed.reduce((sum: number, t: any) => sum + t.totalPrice, 0);
    profit.value = completed.reduce((sum: number, t: any) => sum + (t.totalPrice - t.totalCost), 0);
    stats.value.retail = completed.length;
    stats.value.total = completed.length;
    recentTransactions.value = completed.slice(0, 5).map((t: any) => ({
      itemNames: t.items?.map((i: any) => i.product?.name || i.productId).join(', ') || `#${t.transactionNumber}`,
      timestamp: new Date(t.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      amount: t.totalPrice,
      method: t.payments?.[0]?.method === 'CASH' ? 'Tunai' : t.payments?.[0]?.method === 'QRIS' ? 'QRIS' : t.payments?.[0]?.method || 'Tunai',
    }));
  } catch { /* silent */ }
}

let refreshInterval: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  try { await shiftStore.fetchCurrentShift(); } catch { /* */ }
  await refresh();
  refreshInterval = setInterval(refresh, 30000);
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>
