<template>
  <div class="space-y-5">
    <div class="relative overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 text-white shadow-lg">
      <div class="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
      <h1 class="relative text-lg font-bold">Transaksi PPOB</h1>
      <p class="relative text-xs text-indigo-100 mt-0.5">
        Riwayat transaksi PPOB — pulsa, token PLN, tagihan, e-money, dan lainnya.
      </p>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between mb-1">
          <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <HashIcon class="w-4 h-4 text-indigo-600" />
          </div>
          <span class="text-[10px] font-bold text-slate-400">HARI INI</span>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-[#869392]">Total Transaksi</p>
        <p class="text-lg font-bold font-mono text-slate-950 dark:text-[#e3e2e2] dark:text-[#e3e2e2]">{{ todayStats.count }}</p>
      </div>
      <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between mb-1">
          <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <BanknoteIcon class="w-4 h-4 text-blue-600" />
          </div>
          <span class="text-[10px] font-bold text-slate-400">VOLUME</span>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-[#869392]">Total Volume</p>
        <p class="text-lg font-bold font-mono text-slate-950 dark:text-[#e3e2e2] dark:text-[#e3e2e2]">{{ formatRupiah(todayStats.volume) }}</p>
      </div>
      <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between mb-1">
          <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <TrendingUpIcon class="w-4 h-4 text-emerald-600" />
          </div>
          <span class="text-[10px] font-bold text-slate-400">PROFIT</span>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-[#869392]">Fee / Profit</p>
        <p class="text-lg font-bold font-mono text-emerald-600">{{ formatRupiah(todayStats.fee) }}</p>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="flex flex-col sm:flex-row gap-3 flex-wrap">
      <div class="relative">
        <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input v-model="filterSearch" type="text" placeholder="Cari produk / no pelanggan / ref..." class="h-9 pl-9 pr-3 w-56 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" @input="debouncedFetch" />
      </div>
      <select v-model="filterPeriod" class="h-9 px-3 text-sm border border-slate-200 rounded-lg outline-none" @change="onPeriodChange">
        <option value="all">Semua Waktu</option>
        <option value="today">Hari Ini</option>
        <option value="7d">7 Hari</option>
        <option value="1m">1 Bulan</option>
        <option value="custom">Custom</option>
      </select>
      <template v-if="filterPeriod === 'custom'">
        <input v-model="filterStartDate" type="date" class="h-9 px-3 text-sm border border-slate-200 rounded-lg outline-none" @change="fetchTransactions" />
        <input v-model="filterEndDate" type="date" class="h-9 px-3 text-sm border border-slate-200 rounded-lg outline-none" @change="fetchTransactions" />
      </template>
      <select v-model="filterStatus" class="h-9 px-3 text-sm border border-slate-200 rounded-lg outline-none" @change="fetchTransactions">
        <option value="">Semua Status</option>
        <option value="PROCESSING">Proses</option>
        <option value="SUCCESS">Sukses</option>
        <option value="FAILED">Gagal</option>
        <option value="REFUNDED">Refund</option>
      </select>
      <div class="flex-1"></div>
      <span v-if="meta" class="text-xs text-slate-500 self-center">{{ meta.total }} transaksi</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400 dark:text-[#869392]" />
      <span class="ml-2 text-sm text-slate-500 dark:text-[#869392]">Memuat transaksi...</span>
    </div>

    <!-- Empty -->
    <div v-else-if="transactions.length === 0" class="bg-white dark:bg-[#1e2020] border border-dashed border-slate-200 rounded-lg p-10 text-center">
      <ReceiptTextIcon class="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p class="text-sm font-semibold text-slate-700">Belum ada transaksi PPOB</p>
      <p class="text-xs text-slate-500 dark:text-[#869392] mt-1">Transaksi PPOB dari kasir akan muncul di sini.</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[800px]">
          <thead class="bg-slate-50 dark:bg-[#292a2a] border-b border-slate-200 dark:border-[#3d4948]">
            <tr>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">Waktu</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">Ref ID</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">Produk</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">Pelanggan</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">Tipe</th>
              <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">Nominal</th>
              <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">Fee</th>
              <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">Total</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">Status</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">SN</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="trx in transactions" :key="trx.id" class="hover:bg-slate-50/30 cursor-pointer transition-colors" @click="openDetail(trx)">
              <td class="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{{ formatDateTime(trx.createdAt) }}</td>
              <td class="px-4 py-3 text-xs font-mono text-slate-700 whitespace-nowrap">{{ trx.refId.slice(-12) }}</td>
              <td class="px-4 py-3 text-xs font-semibold text-slate-800">{{ trx.productCode }}</td>
              <td class="px-4 py-3">
                <p class="text-xs text-slate-800">{{ trx.customerName || '-' }}</p>
                <p class="text-[10px] text-slate-500 font-mono">{{ trx.customerId }}</p>
              </td>
              <td class="px-4 py-3"><span :class="['text-[10px] font-bold uppercase px-1.5 py-0.5 rounded', trx.type === 'prepaid' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700']">{{ trx.type === 'prepaid' ? 'Prabayar' : 'Pascabayar' }}</span></td>
              <td class="px-4 py-3 text-xs text-right font-mono text-slate-800">{{ formatRupiah(trx.amount) }}</td>
              <td class="px-4 py-3 text-xs text-right font-mono text-emerald-600">{{ formatRupiah(trx.fee) }}</td>
              <td class="px-4 py-3 text-xs text-right font-mono font-bold text-slate-900 dark:text-[#e3e2e2]">{{ formatRupiah(trx.total) }}</td>
              <td class="px-4 py-3 text-center"><span :class="['text-[10px] font-bold px-2 py-0.5 rounded-full', statusBadge(trx.status)]">{{ statusLabel(trx.status) }}</span></td>
              <td class="px-4 py-3 text-[10px] font-mono text-slate-500 text-center max-w-[100px] truncate">{{ trx.serialNumber || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
        <p class="text-xs text-slate-500 dark:text-[#869392]">Hal. {{ meta.page }} / {{ meta.totalPages }}</p>
        <div class="flex gap-1">
          <button type="button" :disabled="meta.page <= 1" class="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-50" @click="goPage(meta.page - 1)">Prev</button>
          <button type="button" :disabled="meta.page >= meta.totalPages" class="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-50" @click="goPage(meta.page + 1)">Next</button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="detailTrx" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm" @click="detailTrx = null" />
          <div class="relative bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
            <button type="button" class="absolute top-4 right-4 p-1" @click="detailTrx = null"><XIcon class="w-4 h-4 text-slate-400" /></button>
            <h3 class="text-base font-bold text-slate-900 mb-4">Detail Transaksi PPOB</h3>
            <div class="space-y-2.5 text-sm">
              <div class="flex justify-between"><span class="text-slate-500 dark:text-[#869392]">Ref ID</span><span class="font-mono text-xs text-slate-800">{{ detailTrx.refId }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500 dark:text-[#869392]">Tripay Ref</span><span class="font-mono text-xs text-slate-700">{{ detailTrx.tripayRef || '-' }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500 dark:text-[#869392]">Produk</span><span class="font-semibold text-slate-800">{{ detailTrx.productCode }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500 dark:text-[#869392]">Tipe</span><span>{{ detailTrx.type === 'prepaid' ? 'Prabayar' : 'Pascabayar' }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500 dark:text-[#869392]">No Pelanggan</span><span class="font-mono">{{ detailTrx.customerId }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500 dark:text-[#869392]">Nama</span><span>{{ detailTrx.customerName || '-' }}</span></div>
              <div class="border-t border-slate-200 pt-2 flex justify-between"><span class="text-slate-500 dark:text-[#869392]">Nominal</span><span class="font-mono">{{ formatRupiah(detailTrx.amount) }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500 dark:text-[#869392]">Fee</span><span class="font-mono text-emerald-600">{{ formatRupiah(detailTrx.fee) }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500 font-bold">Total</span><span class="font-mono font-bold">{{ formatRupiah(detailTrx.total) }}</span></div>
              <div class="border-t border-slate-200 pt-2 flex justify-between"><span class="text-slate-500 dark:text-[#869392]">Status</span><span :class="['font-bold', statusTextColor(detailTrx.status)]">{{ statusLabel(detailTrx.status) }}</span></div>
              <div v-if="detailTrx.serialNumber" class="flex justify-between"><span class="text-slate-500 dark:text-[#869392]">SN / Token</span><span class="font-mono text-xs select-all bg-slate-100 px-2 py-1 rounded">{{ detailTrx.serialNumber }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500 dark:text-[#869392]">Waktu</span><span class="text-xs">{{ formatDateTime(detailTrx.createdAt) }}</span></div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, inject } from 'vue';
import {
  Search as SearchIcon, Loader2 as Loader2Icon, ReceiptText as ReceiptTextIcon,
  X as XIcon, Hash as HashIcon, Banknote as BanknoteIcon, TrendingUp as TrendingUpIcon,
} from 'lucide-vue-next';
import { useShopStore } from '@/shared/stores/shop.store';
import { listPpobTransactions, type PpobTransaction } from '@/shared/services/tripay.service';

const shopStore = useShopStore();
const shopId = computed(() => shopStore.currentShopId || '');

// Real-time auto-refresh
const realtimeSignal = inject<{ value: number }>('realtimeSignal');

const loading = ref(false);
const transactions = ref<PpobTransaction[]>([]);
const meta = ref({ total: 0, page: 1, limit: 20, totalPages: 0 });
const detailTrx = ref<PpobTransaction | null>(null);

// Filters
const filterSearch = ref('');
const filterPeriod = ref('today');
const filterStartDate = ref('');
const filterEndDate = ref('');
const filterStatus = ref('');

// KPI
const todayStats = ref({ count: 0, volume: 0, fee: 0 });

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedFetch() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchTransactions(), 400);
}

function onPeriodChange() {
  if (filterPeriod.value !== 'custom') {
    filterStartDate.value = '';
    filterEndDate.value = '';
  }
  fetchTransactions();
}

function getDateRange(): { startDate?: string; endDate?: string } {
  const today = new Date().toISOString().slice(0, 10);
  switch (filterPeriod.value) {
    case 'today': return { startDate: today, endDate: today };
    case '7d': {
      const d = new Date(); d.setDate(d.getDate() - 7);
      return { startDate: d.toISOString().slice(0, 10), endDate: today };
    }
    case '1m': {
      const d = new Date(); d.setMonth(d.getMonth() - 1);
      return { startDate: d.toISOString().slice(0, 10), endDate: today };
    }
    case 'custom':
      return { startDate: filterStartDate.value || undefined, endDate: filterEndDate.value || undefined };
    default: return {};
  }
}

async function fetchTransactions(page = 1) {
  if (!shopId.value) return;
  loading.value = true;
  const range = getDateRange();
  try {
    const result = await listPpobTransactions({
      shopId: shopId.value,
      status: filterStatus.value || undefined,
      search: filterSearch.value || undefined,
      startDate: range.startDate,
      endDate: range.endDate,
      page,
      limit: 20,
    });
    transactions.value = result.data;
    meta.value = result.meta;

    // Calculate today KPI from data (or from meta if today filter)
    if (filterPeriod.value === 'today') {
      todayStats.value = {
        count: result.meta.total,
        volume: result.data.reduce((s, t) => s + t.amount, 0),
        fee: result.data.reduce((s, t) => s + t.fee, 0),
      };
    }
  } catch {
    transactions.value = [];
  } finally {
    loading.value = false;
  }
}

function goPage(page: number) { fetchTransactions(page); }
function openDetail(trx: PpobTransaction) { detailTrx.value = trx; }

// Helpers
function formatRupiah(n: number) { return 'Rp ' + n.toLocaleString('id-ID'); }
function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function statusLabel(s: string) { return { SUCCESS: 'Sukses', FAILED: 'Gagal', PROCESSING: 'Proses', REFUNDED: 'Refund' }[s] || s; }
function statusBadge(s: string) {
  return { SUCCESS: 'bg-emerald-100 text-emerald-700', FAILED: 'bg-red-100 text-red-700', REFUNDED: 'bg-amber-100 text-amber-700', PROCESSING: 'bg-blue-100 text-blue-700' }[s] || 'bg-slate-100 text-slate-600';
}
function statusTextColor(s: string) {
  return { SUCCESS: 'text-emerald-600', FAILED: 'text-red-600', REFUNDED: 'text-amber-600', PROCESSING: 'text-blue-600' }[s] || '';
}

// Watch realtime signal for auto-refresh
if (realtimeSignal) {
  const { watch } = await import('vue');
  watch(realtimeSignal, () => { fetchTransactions(meta.value.page); });
}

onMounted(() => { fetchTransactions(); });
</script>

<style scoped>
.fade-enter-active,.fade-leave-active { transition: opacity .2s; }
.fade-enter-from,.fade-leave-to { opacity: 0; }
</style>


<style scoped>
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
.space-y-5 > * {
  animation: fadeSlideUp 0.45s ease-out both;
}
.space-y-5 > *:nth-child(1) { animation-delay: 0ms; }
.space-y-5 > *:nth-child(2) { animation-delay: 70ms; }
.space-y-5 > *:nth-child(3) { animation-delay: 140ms; }
.space-y-5 > *:nth-child(4) { animation-delay: 210ms; }
.space-y-5 > *:nth-child(5) { animation-delay: 280ms; }

/* KPI card bounce */
@keyframes popIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
.grid > div[class*="rounded-lg"] {
  animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.grid > div:nth-child(1) { animation-delay: 150ms; }
.grid > div:nth-child(2) { animation-delay: 230ms; }
.grid > div:nth-child(3) { animation-delay: 310ms; }

/* gradient header shimmer */
@keyframes headerShimmer {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
div[class*="bg-gradient-to-r"][class*="from-indigo"] {
  background-size: 200% 200%;
  animation: headerShimmer 6s ease infinite;
}

/* table row hover glow */
table tbody tr {
  transition: all 0.15s ease;
}
table tbody tr:hover {
  box-shadow: inset 3px 0 0 #6366F1;
}

/* modal entrance */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
div[class*="rounded-lg"][class*="shadow-xl"] {
  animation: scaleIn 0.25s ease-out;
}

/* status badge pop */
@keyframes badgePop {
  0% { transform: scale(0.7); opacity: 0; }
  70% { transform: scale(1.08); }
  100% { transform: scale(1); opacity: 1; }
}
span[class*="rounded-full"][class*="font-medium"] {
  animation: badgePop 0.3s ease-out both;
}
</style>
