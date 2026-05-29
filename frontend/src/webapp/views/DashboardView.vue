<template>
  <div class="space-y-5 p-4">
    <!-- Top Bar: Greeting + Shift Button -->
    <header class="px-4 pt-4 pb-3 bg-white border-b border-slate-100">
      <div class="flex items-center justify-between mb-2">
        <div>
          <p class="text-xs text-slate-500">Halo,</p>
          <h1 class="font-bold text-lg text-slate-800 leading-tight">{{ userName }}</h1>
        </div>
        <!-- Shift Button (top bar) -->
        <RouterLink
          v-if="!hasOpenShift"
          to="/retail/shift"
          class="h-8 px-3 bg-blue-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 hover:bg-blue-700 transition-colors"
        >
          <PlayIcon class="w-3.5 h-3.5" />
          Buka Shift
        </RouterLink>
        <div v-else class="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="text-[11px] font-semibold text-emerald-700">{{ shiftDurationLabel }}</span>
        </div>
      </div>
      <!-- Realtime date/time -->
      <p class="text-xs text-slate-500">{{ currentDateTime }}</p>
    </header>

    <!-- Revenue Cards (centered, 2 columns) -->
    <div class="px-4">
      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-4 text-white shadow-md">
          <div class="flex items-center gap-2 mb-3 opacity-90">
            <ShoppingCartIcon class="w-4 h-4" />
            <span class="text-xs font-medium">Penjualan Retail</span>
          </div>
          <h2 class="text-xl font-bold mb-0.5">{{ formatRupiah(retailOmzet) }}</h2>
          <p class="text-[10px] opacity-80">Total omzet hari ini</p>
        </div>
        <div class="rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 p-4 text-white shadow-md">
          <div class="flex items-center gap-2 mb-3 opacity-90">
            <LandmarkIcon class="w-4 h-4" />
            <span class="text-xs font-medium">Transaksi BRILink</span>
          </div>
          <h2 class="text-xl font-bold mb-0.5">{{ formatRupiah(brilinkVolume) }}</h2>
          <p class="text-[10px] opacity-80">Total volume hari ini</p>
        </div>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="px-4">
      <div class="grid grid-cols-3 bg-white rounded-xl border border-slate-200 py-3 shadow-sm">
        <div class="text-center border-r border-slate-100 px-2">
          <p class="text-[11px] text-slate-500 mb-1 font-medium uppercase tracking-wide">Total Trx</p>
          <p class="font-bold text-slate-800">{{ stats.total }}</p>
        </div>
        <div class="text-center border-r border-slate-100 px-2">
          <p class="text-[11px] text-slate-500 mb-1 font-medium uppercase tracking-wide">Retail</p>
          <p class="font-bold text-slate-800">{{ stats.retail }}</p>
        </div>
        <div class="text-center px-2">
          <p class="text-[11px] text-slate-500 mb-1 font-medium uppercase tracking-wide">BRILink</p>
          <p class="font-bold text-slate-800">{{ stats.brilink }}</p>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="px-4">
      <h3 class="text-sm font-bold text-slate-800 mb-3">Aksi Cepat</h3>
      <div class="grid grid-cols-3 gap-3">
        <RouterLink to="/retail/pos" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><ShoppingCartIcon class="w-5 h-5" /></div>
          <span class="text-[11px] font-medium text-slate-600 text-center">Buka Kasir</span>
        </RouterLink>
        <RouterLink to="/brilink/transaction" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><BanknoteIcon class="w-5 h-5" /></div>
          <span class="text-[11px] font-medium text-slate-600 text-center">Tarik Tunai</span>
        </RouterLink>
        <RouterLink to="/brilink/transaction" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><ArrowLeftRightIcon class="w-5 h-5" /></div>
          <span class="text-[11px] font-medium text-slate-600 text-center">Transfer Dana</span>
        </RouterLink>
        <RouterLink to="/brilink/transaction" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><SmartphoneIcon class="w-5 h-5" /></div>
          <span class="text-[11px] font-medium text-slate-600 text-center">Top Up</span>
        </RouterLink>
        <RouterLink to="/retail/history" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"><HistoryIcon class="w-5 h-5" /></div>
          <span class="text-[11px] font-medium text-slate-600 text-center">Riwayat</span>
        </RouterLink>
        <button class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"><BarChart3Icon class="w-5 h-5" /></div>
          <span class="text-[11px] font-medium text-slate-600 text-center">Analisis</span>
        </button>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="px-4">
      <h3 class="text-sm font-bold text-slate-800 mb-3">Transaksi Terakhir</h3>
      <div v-if="recentTransactions.length === 0" class="flex flex-col items-center justify-center py-10 px-4 bg-slate-50 rounded-xl border border-slate-200 border-dashed text-center">
        <ReceiptIcon class="w-10 h-10 mb-3 text-slate-300" />
        <p class="text-sm font-medium text-slate-600">Belum ada transaksi</p>
        <p class="text-xs text-slate-400 mt-1">Transaksi hari ini akan muncul di sini.</p>
      </div>
      <ul v-else class="space-y-3">
        <li v-for="(trx, index) in recentTransactions" :key="index" class="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-white shadow-sm">
          <div class="flex items-center gap-3">
            <div :class="['w-10 h-10 rounded-full flex items-center justify-center', trx.type === 'retail' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600']">
              <ShoppingCartIcon v-if="trx.type === 'retail'" class="w-5 h-5" />
              <LandmarkIcon v-else class="w-5 h-5" />
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-800">{{ trx.title }}</p>
              <p class="text-xs text-slate-500">{{ trx.timestamp }}</p>
            </div>
          </div>
          <span class="text-sm font-bold text-slate-800">{{ formatRupiah(trx.amount) }}</span>
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
  Banknote as BanknoteIcon, ArrowLeftRight as ArrowLeftRightIcon,
  Smartphone as SmartphoneIcon, History as HistoryIcon, BarChart3 as BarChart3Icon,
  Receipt as ReceiptIcon, Play as PlayIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShiftStore } from '@/shared/stores/shift.store';
import posService from '@/shared/services/pos.service';

const authStore = useAuthStore();
const shiftStore = useShiftStore();

const userName = computed(() => authStore.user?.username || authStore.user?.email?.split('@')[0] || 'Kasir');
const hasOpenShift = computed(() => shiftStore.hasOpenShift);
const shiftDurationLabel = computed(() => {
  const m = shiftStore.shiftDurationMinutes;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}j ${min}m` : `${min}m`;
});

// Realtime clock
const currentDateTime = ref('');
let clockInterval: ReturnType<typeof setInterval> | null = null;

function updateClock() {
  currentDateTime.value = new Date().toLocaleString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

const retailOmzet = ref(0);
const brilinkVolume = ref(0);
const stats = ref({ total: 0, retail: 0, brilink: 0 });
const recentTransactions = ref<Array<{ type: string; title: string; timestamp: string; amount: number }>>([]);

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
    stats.value.retail = completed.length;
    stats.value.total = completed.length;
    recentTransactions.value = completed.slice(0, 5).map((t: any) => ({
      type: 'retail',
      title: `#${t.transactionNumber}`,
      timestamp: new Date(t.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      amount: t.totalPrice,
    }));
  } catch { /* silent */ }
}

let refreshInterval: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
  try { await shiftStore.fetchCurrentShift(); } catch { /* */ }
  await refresh();
  refreshInterval = setInterval(refresh, 30000);
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
  if (clockInterval) clearInterval(clockInterval);
});
</script>
