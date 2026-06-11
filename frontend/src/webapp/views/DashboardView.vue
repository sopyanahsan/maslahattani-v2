<template>
  <div class="space-y-5 p-4 font-hanken">
    <!-- Greeting -->
    <header class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-xs text-slate-500 dark:text-[#bcc9c7]">{{ currentDateLabel }}</p>
        <h1 class="font-bold text-xl text-slate-900 dark:text-[#e3e2e2] mt-0.5 truncate">{{ userName }}</h1>
      </div>
      <!-- Theme toggle (light / dark) -->
      <button
        type="button"
        class="w-10 h-10 rounded-full border border-slate-200 dark:border-[#3d4948] bg-white dark:bg-[#1e2020] text-slate-600 dark:text-[#5fd9d2] flex items-center justify-center hover:bg-slate-50 dark:hover:bg-[#292a2a] active:scale-95 transition-all shrink-0"
        :aria-label="resolved === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'"
        @click="toggleSimple"
      >
        <Transition name="theme-icon" mode="out-in">
          <SunIcon v-if="resolved === 'dark'" key="sun" class="w-5 h-5" />
          <MoonIcon v-else key="moon" class="w-5 h-5" />
        </Transition>
      </button>
    </header>

    <!-- Row 1: Penjualan Retail + BRILink (2 cols or 1 col) -->
    <div :class="settingsStore.isBrilinkEnabled ? 'grid grid-cols-2 gap-3' : ''">
      <div class="rounded-xl bg-gradient-to-br from-[#00A19B] to-[#00756f] p-4 text-white shadow-md dark:shadow-[0_0_20px_rgba(0,161,155,0.25)]">
        <p class="text-[11px] font-medium opacity-80 mb-1">Penjualan Retail</p>
        <h2 class="text-xl font-bold font-mono">{{ formatRupiah(retailOmzet) }}</h2>
        <p class="text-[10px] opacity-70 mt-1">{{ stats.retail }} transaksi</p>
      </div>
      <div v-if="settingsStore.isBrilinkEnabled" class="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-4 text-white shadow-md dark:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
        <p class="text-[11px] font-medium opacity-80 mb-1">Penjualan BRILink</p>
        <h2 class="text-xl font-bold font-mono">{{ formatRupiah(brilinkOmzet) }}</h2>
        <p class="text-[10px] opacity-70 mt-1">{{ stats.brilink }} transaksi</p>
      </div>
    </div>

    <!-- Row 2: Total Trx, Profit Retail, Profit BRILink (conditional) -->
    <div :class="settingsStore.isBrilinkEnabled ? 'grid grid-cols-3 gap-3' : 'grid grid-cols-2 gap-3'">
      <div class="rounded-xl bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] p-3 shadow-sm">
        <p class="text-[10px] font-medium text-slate-500 dark:text-[#bcc9c7] mb-0.5">Total Trx</p>
        <p class="text-lg font-bold font-mono text-slate-900 dark:text-[#e3e2e2]">{{ stats.total }}</p>
        <p class="text-[9px] text-slate-400 dark:text-[#869392]">{{ settingsStore.isBrilinkEnabled ? 'Retail + BRILink' : 'Retail' }}</p>
      </div>
      <div class="rounded-xl bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] p-3 shadow-sm">
        <div class="flex items-center gap-1 mb-0.5">
          <TrendingUpIcon class="w-3 h-3 text-emerald-500" />
          <p class="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Profit Retail</p>
        </div>
        <p class="text-lg font-bold font-mono text-slate-900 dark:text-[#e3e2e2]">{{ formatRupiah(profitRetail) }}</p>
      </div>
      <div v-if="settingsStore.isBrilinkEnabled" class="rounded-xl bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] p-3 shadow-sm">
        <div class="flex items-center gap-1 mb-0.5">
          <TrendingUpIcon class="w-3 h-3 text-emerald-500" />
          <p class="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Profit BRILink</p>
        </div>
        <p class="text-lg font-bold font-mono text-slate-900 dark:text-[#e3e2e2]">{{ formatRupiah(profitBrilink) }}</p>
      </div>
    </div>

    <!-- Row 3: Pengeluaran Hari Ini (1 card full width) -->
    <div class="rounded-xl bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-1.5 mb-1">
            <WalletIcon class="w-3.5 h-3.5 text-amber-500" />
            <p class="text-xs font-medium text-amber-600 dark:text-amber-400">Pengeluaran Hari Ini</p>
          </div>
          <p class="text-2xl font-bold font-mono text-slate-900 dark:text-[#e3e2e2]">{{ formatRupiah(expenses) }}</p>
          <p class="text-[10px] text-slate-400 dark:text-[#869392] mt-0.5">{{ expenseCount }} catatan</p>
        </div>
      </div>
      <!-- Buttons: Cash In, Transfer, Cash Out -->
      <div class="grid grid-cols-3 gap-2 mt-3">
        <button class="h-9 rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
          <ArrowDownIcon class="w-3.5 h-3.5" /> Cash In
        </button>
        <button class="h-9 rounded-lg border border-[#00A19B]/30 bg-[#00A19B]/10 text-[#00756f] dark:text-[#5fd9d2] text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#00A19B]/20 transition-colors">
          <ArrowLeftRightIcon class="w-3.5 h-3.5" /> Transfer
        </button>
        <button class="h-9 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
          <ArrowUpIcon class="w-3.5 h-3.5" /> Cash Out
        </button>
      </div>
    </div>

    <!-- Akses Cepat (conditional BRILink items) -->
    <div>
      <h3 class="text-sm font-bold text-slate-800 dark:text-[#e3e2e2] mb-3">Akses Cepat</h3>
      <div :class="settingsStore.isBrilinkEnabled ? 'grid grid-cols-3 sm:grid-cols-6 gap-3' : 'grid grid-cols-3 gap-3'">
        <RouterLink to="/retail/pos" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-[#3d4948] bg-white dark:bg-[#1e2020] hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-[#00A19B]/10 text-[#00A19B] dark:text-[#5fd9d2] flex items-center justify-center"><ShoppingCartIcon class="w-5 h-5" /></div>
          <span class="text-[10px] font-medium text-slate-700 dark:text-[#bcc9c7] text-center">Kasir</span>
        </RouterLink>
        <RouterLink v-if="settingsStore.isBrilinkEnabled" to="/brilink/transaction" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-[#3d4948] bg-white dark:bg-[#1e2020] hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><BanknoteIcon class="w-5 h-5" /></div>
          <span class="text-[10px] font-medium text-slate-700 dark:text-[#bcc9c7] text-center">Tarik Tunai</span>
        </RouterLink>
        <RouterLink v-if="settingsStore.isBrilinkEnabled" to="/brilink/transaction" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-[#3d4948] bg-white dark:bg-[#1e2020] hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><ArrowLeftRightIcon class="w-5 h-5" /></div>
          <span class="text-[10px] font-medium text-slate-700 dark:text-[#bcc9c7] text-center">Transfer</span>
        </RouterLink>
        <RouterLink v-if="settingsStore.isBrilinkEnabled" to="/brilink/transaction" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-[#3d4948] bg-white dark:bg-[#1e2020] hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><SmartphoneIcon class="w-5 h-5" /></div>
          <span class="text-[10px] font-medium text-slate-700 dark:text-[#bcc9c7] text-center">Top Up</span>
        </RouterLink>
        <RouterLink to="/reports" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-[#3d4948] bg-white dark:bg-[#1e2020] hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#292a2a] text-slate-600 dark:text-[#bcc9c7] flex items-center justify-center"><BarChart3Icon class="w-5 h-5" /></div>
          <span class="text-[10px] font-medium text-slate-700 dark:text-[#bcc9c7] text-center">Laporan</span>
        </RouterLink>
        <RouterLink to="/retail/history" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-[#3d4948] bg-white dark:bg-[#1e2020] hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#292a2a] text-slate-600 dark:text-[#bcc9c7] flex items-center justify-center"><HistoryIcon class="w-5 h-5" /></div>
          <span class="text-[10px] font-medium text-slate-700 dark:text-[#bcc9c7] text-center">Riwayat</span>
        </RouterLink>
        <RouterLink to="/opname" class="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-[#3d4948] bg-white dark:bg-[#1e2020] hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors shadow-sm gap-2">
          <div class="w-10 h-10 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center"><ClipboardCheckIcon class="w-5 h-5" /></div>
          <span class="text-[10px] font-medium text-slate-700 dark:text-[#bcc9c7] text-center">Stok Opname</span>
        </RouterLink>
      </div>
    </div>

    <!-- Transaksi Terakhir (with Retail/BRILink toggle) -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold text-slate-800 dark:text-[#e3e2e2]">Transaksi Terakhir</h3>
        <RouterLink to="/retail/history" class="text-xs font-semibold text-[#00A19B] dark:text-[#5fd9d2] hover:underline">Lihat Semua &gt;</RouterLink>
      </div>
      <!-- Tab toggle (only if BRILink enabled) -->
      <div v-if="settingsStore.isBrilinkEnabled" class="flex rounded-lg border border-slate-200 dark:border-[#3d4948] overflow-hidden mb-3 w-fit">
        <button :class="['px-4 py-1.5 text-xs font-semibold transition-colors', trxTab === 'retail' ? 'bg-[#00A19B] text-white' : 'bg-white dark:bg-[#1e2020] text-slate-500 dark:text-[#bcc9c7] hover:bg-slate-50 dark:hover:bg-[#292a2a]']" @click="trxTab = 'retail'">Retail</button>
        <button :class="['px-4 py-1.5 text-xs font-semibold transition-colors', trxTab === 'brilink' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-[#1e2020] text-slate-500 dark:text-[#bcc9c7] hover:bg-slate-50 dark:hover:bg-[#292a2a]']" @click="trxTab = 'brilink'">BRILink</button>
      </div>
      <!-- List -->
      <div v-if="visibleTransactions.length === 0" class="flex flex-col items-center justify-center py-8 px-4 bg-slate-50 dark:bg-[#1a1c1c] rounded-xl border border-slate-200 dark:border-[#3d4948] border-dashed text-center">
        <ReceiptIcon class="w-8 h-8 mb-2 text-slate-300 dark:text-[#869392]" />
        <p class="text-sm text-slate-500 dark:text-[#bcc9c7]">Belum ada transaksi {{ trxTab === 'retail' ? 'retail' : 'BRILink' }}</p>
      </div>
      <ul v-else class="space-y-2">
        <li v-for="(trx, index) in visibleTransactions" :key="index" class="flex items-center justify-between p-3 border border-slate-100 dark:border-[#3d4948] rounded-xl bg-white dark:bg-[#1e2020] shadow-sm">
          <div class="flex items-center gap-3">
            <div :class="['w-9 h-9 rounded-full flex items-center justify-center shrink-0', trxTab === 'retail' ? 'bg-[#00A19B]/10 text-[#00A19B] dark:text-[#5fd9d2]' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400']">
              <ReceiptIcon class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-800 dark:text-[#e3e2e2] truncate">{{ trx.itemNames }}</p>
              <p class="text-xs font-bold" :class="trxTab === 'retail' ? 'text-[#00A19B] dark:text-[#5fd9d2]' : 'text-emerald-600 dark:text-emerald-400'">{{ formatRupiah(trx.amount) }}</p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <p class="text-[11px] text-slate-500 dark:text-[#bcc9c7]">{{ trx.timestamp }}</p>
            <p class="text-[10px] text-slate-400 dark:text-[#869392]">{{ trx.method }}</p>
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
  ClipboardCheck as ClipboardCheckIcon,
  Sun as SunIcon, Moon as MoonIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShiftStore } from '@/shared/stores/shift.store';
import { useSettingsStore } from '@/shared/stores/settings.store';
import { useTheme } from '@/shared/composables/useTheme';
import posService from '@/shared/services/pos.service';

const authStore = useAuthStore();
const shiftStore = useShiftStore();
const settingsStore = useSettingsStore();
const { resolved, toggleSimple } = useTheme();

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
      timestamp: new Date(t.createdAt).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }),
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

<style scoped>
/* Smooth swap between sun/moon theme icons */
.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.6);
}
.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.6);
}

@media (prefers-reduced-motion: reduce) {
  .theme-icon-enter-active,
  .theme-icon-leave-active {
    transition-duration: 0.01ms !important;
  }
}
</style>
