<template>
  <div class="space-y-5 -mx-4 -mt-4">
    <!-- Header -->
    <header class="px-4 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-white">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
          <UserIcon class="w-6 h-6 text-slate-500" />
        </div>
        <div>
          <h1 class="font-semibold text-base leading-tight">{{ userName }}</h1>
          <p class="text-xs text-slate-500">Maslahat Tani</p>
        </div>
      </div>
      <button class="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors" @click="refresh">
        <RefreshCwIcon class="w-5 h-5" />
      </button>
    </header>

    <!-- Shift Indicator -->
    <div class="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 text-sm bg-slate-50/50">
      <span :class="['w-2.5 h-2.5 rounded-full', hasOpenShift ? 'bg-emerald-500' : 'bg-red-500']"></span>
      <span v-if="hasOpenShift" class="text-slate-600 font-medium text-xs">
        Shift aktif &middot; {{ shiftDurationLabel }}
      </span>
      <span v-else class="text-slate-600 font-medium text-xs flex items-center gap-1">
        Shift belum dibuka
        <RouterLink to="/retail/shift" class="text-blue-600 hover:underline font-semibold ml-1">Buka Shift</RouterLink>
      </span>
    </div>

    <!-- Revenue Cards -->
    <div class="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 px-4 py-1">
      <div class="min-w-[260px] snap-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-4 text-white shadow-md">
        <div class="flex items-center gap-2 mb-4 opacity-90">
          <ShoppingCartIcon class="w-5 h-5" />
          <span class="text-sm font-medium">Penjualan Retail</span>
        </div>
        <h2 class="text-2xl font-bold mb-1">{{ formatRupiah(retailOmzet) }}</h2>
        <p class="text-xs opacity-80">Total omzet hari ini</p>
      </div>
      <div class="min-w-[260px] snap-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 p-4 text-white shadow-md">
        <div class="flex items-center gap-2 mb-4 opacity-90">
          <LandmarkIcon class="w-5 h-5" />
          <span class="text-sm font-medium">Transaksi BRILink</span>
        </div>
        <h2 class="text-2xl font-bold mb-1">{{ formatRupiah(brilinkVolume) }}</h2>
        <p class="text-xs opacity-80">Total volume hari ini</p>
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
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import {
  User as UserIcon, RefreshCw as RefreshCwIcon, ShoppingCart as ShoppingCartIcon,
  Landmark as LandmarkIcon, Banknote as BanknoteIcon, ArrowLeftRight as ArrowLeftRightIcon,
  Smartphone as SmartphoneIcon, History as HistoryIcon, BarChart3 as BarChart3Icon,
  Receipt as ReceiptIcon,
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
    const today = new Date().toISOString().slice(0, 10);
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

onMounted(async () => {
  try { await shiftStore.fetchCurrentShift(); } catch { /* */ }
  await refresh();
});
</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
