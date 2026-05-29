<template>
  <div class="space-y-5 p-4">
    <!-- Greeting -->
    <header>
      <p class="text-xs text-slate-500">{{ currentDateLabel }}</p>
      <h1 class="font-bold text-xl text-slate-900 mt-0.5">{{ userName }}</h1>
    </header>

    <!-- Row 1: Penjualan Retail + BRILink (2 cols) -->
    <div class="grid grid-cols-2 gap-3">
      <div class="rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-4 text-white shadow-md">
        <p class="text-[11px] font-medium opacity-80 mb-1">Penjualan Retail</p>
        <h2 class="text-xl font-bold font-mono">{{ formatRupiah(retailOmzet) }}</h2>
        <p class="text-[10px] opacity-70 mt-1">{{ stats.retail }} transaksi</p>
      </div>
      <div class="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-4 text-white shadow-md">
        <p class="text-[11px] font-medium opacity-80 mb-1">Penjualan BRILink</p>
        <h2 class="text-xl font-bold font-mono">{{ formatRupiah(brilinkOmzet) }}</h2>
        <p class="text-[10px] opacity-70 mt-1">{{ stats.brilink }} transaksi</p>
      </div>
    </div>

    <!-- Row 2: Total Trx, Profit Retail, Profit BRILink (3 cols) -->
    <div class="grid grid-cols-3 gap-3">
      <div class="rounded-xl bg-white border border-slate-200 p-3 shadow-sm">
        <p class="text-[10px] font-medium text-slate-500 mb-0.5">Total Trx</p>
        <p class="text-lg font-bold font-mono text-slate-900">{{ stats.total }}</p>
        <p class="text-[9px] text-slate-400">Retail + BRILink</p>
      </div>
      <div class="rounded-xl bg-white border border-slate-200 p-3 shadow-sm">
        <div class="flex items-center gap-1 mb-0.5">
          <TrendingUpIcon class="w-3 h-3 text-emerald-500" />
          <p class="text-[10px] font-medium text-emerald-600">Profit Retail</p>
        </div>
        <p class="text-lg font-bold font-mono text-slate-900">{{ formatRupiah(profitRetail) }}</p>
      </div>
      <div class="rounded-xl bg-white border border-slate-200 p-3 shadow-sm">
        <div class="flex items-center gap-1 mb-0.5">
          <TrendingUpIcon class="w-3 h-3 text-emerald-500" />
          <p class="text-[10px] font-medium text-emerald-600">Profit BRILink</p>
        </div>
        <p class="text-lg font-bold font-mono text-slate-900">{{ formatRupiah(profitBrilink) }}</p>
      </div>
    </div>

    <!-- Row 3: Pengeluaran Hari Ini (1 card full width) -->
    <div class="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-1.5 mb-1">
            <WalletIcon class="w-3.5 h-3.5 text-amber-500" />
            <p class="text-xs font-medium text-amber-600">Pengeluaran Hari Ini</p>
          </div>
          <p class="text-2xl font-bold font-mono text-slate-900">{{ formatRupiah(expenses) }}</p>
          <p class="text-[10px] text-slate-400 mt-0.5">{{ expenseCount }} catatan</p>
        </div>
      </div>
      <!-- Buttons: Cash In, Transfer, Cash Out -->
      <div class="grid grid-cols-3 gap-2 mt-3">
        <button class="h-9 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition-colors">
          <ArrowDownIcon class="w-3.5 h-3.5" /> Cash In
        </button>
        <button class="h-9 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-colors">
          <ArrowLeftRightIcon class="w-3.5 h-3.5" /> Transfer
        </button>
        <button class="h-9 rounded-lg border border-red-200 bg-red-50 text-red-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:bg-red-100 transition-colors">
          <ArrowUpIcon class="w-3.5 h-3.5" /> Cash Out
        </button>
      </div>
    </div>

    <!-- Akses Cepat (6 items, 3 cols) -->
    <div>
      <h3 class="text-sm font-bold text-slate-800 mb-3">Akses Cepat</h3>
      <div class="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <RouterLink to="/retail/pos" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><ShoppingCartIcon class="w-5 h-5" /></div>
          <span class="text-[10px] font-medium text-slate-700 text-center">Kasir</span>
        </RouterLink>
        <RouterLink to="/brilink/transaction" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><BanknoteIcon class="w-5 h-5" /></div>
          <span class="text-[10px] font-medium text-slate-700 text-center">Tarik Tunai</span>
        </RouterLink>
        <RouterLink to="/brilink/transaction" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><ArrowLeftRightIcon class="w-5 h-5" /></div>
          <span class="text-[10px] font-medium text-slate-700 text-center">Transfer</span>
        </RouterLink>
        <RouterLink to="/brilink/transaction" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><SmartphoneIcon class="w-5 h-5" /></div>
          <span class="text-[10px] font-medium text-slate-700 text-center">Top Up</span>
        </RouterLink>
        <RouterLink to="/reports" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"><BarChart3Icon class="w-5 h-5" /></div>
          <span class="text-[10px] font-medium text-slate-700 text-center">Laporan</span>
        </RouterLink>
        <RouterLink to="/retail/history" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"><HistoryIcon class="w-5 h-5" /></div>
          <span class="text-[10px] font-medium text-slate-700 text-center">Riwayat</span>
        </RouterLink>
      </div>
    </div>

    <!-- Transaksi Terakhir (with Retail/BRILink toggle) -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold text-slate-800">Transaksi Terakhir</h3>
        <RouterLink to="/retail/history" class="text-xs font-semibold text-blue-600 hover:underline">Lihat Semua &gt;</RouterLink>
      </div>
      <!-- Tab toggle -->
      <div class="flex rounded-lg border border-slate-200 overflow-hidden mb-3 w-fit">
        <button :class="['px-4 py-1.5 text-xs font-semibold transition-colors', trxTab === 'retail' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50']" @click="trxTab = 'retail'">Retail</button>
        <button :class="['px-4 py-1.5 text-xs font-semibold transition-colors', trxTab === 'brilink' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50']" @click="trxTab = 'brilink'">BRILink</button>
      </div>
      <!-- List -->
      <div v-if="visibleTransactions.length === 0" class="flex flex-col items-center justify-center py-8 px-4 bg-slate-50 rounded-xl border border-slate-200 border-dashed text-center">
        <ReceiptIcon class="w-8 h-8 mb-2 text-slate-300" />
        <p class="text-sm text-slate-500">Belum ada transaksi {{ trxTab === 'retail' ? 'retail' : 'BRILink' }}</p>
      </div>
      <ul v-else class="space-y-2">
        <li v-for="(trx, index) in visibleTransactions" :key="index" class="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-white shadow-sm">
          <div class="flex items-center gap-3">
            <div :class="['w-9 h-9 rounded-full flex items-center justify-center shrink-0', trxTab === 'retail' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600']">
              <ReceiptIcon class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-800 truncate">{{ trx.itemNames }}</p>
              <p class="text-xs font-bold" :class="trxTab === 'retail' ? 'text-blue-600' : 'text-emerald-600'">{{ formatRupiah(trx.amount) }}</p>
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
  Banknote as BanknoteIcon, ArrowLeftRight as ArrowLeftRightIcon,
  Smartphone as SmartphoneIcon, History as HistoryIcon,
  ArrowDown as ArrowDownIcon, ArrowUp as ArrowUpIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShiftStore } from '@/shared/stores/shift.store';
import posService from '@/shared/services/pos.service';

const authStore = useAuthStore();
const shiftStore = useShiftStore();

const userName = computed(() => authStore.user?.username || 'Kasir');
const currentDateLabel = computed(() =>
  new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
);

// Data
const retailOmzet = ref(0);
const brilinkOmzet = ref(0);
const profitRetail = ref(0);
const profitBrilink = ref(0);
const expenses = ref(0);
const expenseCount = ref(0);
const stats = ref({ total: 0, retail: 0, brilink: 0 });

// Transactions
const trxTab = ref<'retail' | 'brilink'>('retail');
const retailTransactions = ref<any[]>([]);
const brilinkTransactions = ref<any[]>([]);

const visibleTransactions = computed(() =>
  trxTab.value === 'retail' ? retailTransactions.value : brilinkTransactions.value
);

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
    profitRetail.value = completed.reduce((sum: number, t: any) => sum + (t.totalPrice - t.totalCost), 0);
    stats.value.retail = completed.length;
    stats.value.total = completed.length + stats.value.brilink;
    retailTransactions.value = completed.slice(0, 5).map((t: any) => ({
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
