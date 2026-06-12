<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-xl font-bold text-slate-950 dark:text-slate-100">Transaksi PPOB</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        Riwayat transaksi PPOB — pulsa, token PLN, tagihan, e-money, dan lainnya.
      </p>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div class="flex items-center justify-between mb-1">
          <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <HashIcon class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span class="text-[10px] font-bold text-slate-400">HARI INI</span>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-slate-400">Total Transaksi</p>
        <p class="text-lg font-bold font-mono text-slate-950 dark:text-slate-100">{{ todayStats.count }}</p>
      </div>
      <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div class="flex items-center justify-between mb-1">
          <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <BanknoteIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span class="text-[10px] font-bold text-slate-400">VOLUME</span>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-slate-400">Total Volume</p>
        <p class="text-lg font-bold font-mono text-slate-950 dark:text-slate-100">{{ formatRupiah(todayStats.volume) }}</p>
      </div>
      <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div class="flex items-center justify-between mb-1">
          <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <TrendingUpIcon class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span class="text-[10px] font-bold text-slate-400">PROFIT</span>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-slate-400">Fee / Profit</p>
        <p class="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">{{ formatRupiah(todayStats.fee) }}</p>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="flex flex-col sm:flex-row gap-3 flex-wrap">
      <div class="relative">
        <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input v-model="filterSearch" type="text" placeholder="Cari produk / no pelanggan / ref..." class="h-9 pl-9 pr-3 w-56 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" @input="debouncedFetch" />
      </div>
      <select v-model="filterPeriod" class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg outline-none" @change="onPeriodChange">
        <option value="all">Semua Waktu</option>
        <option value="today">Hari Ini</option>
        <option value="7d">7 Hari</option>
        <option value="1m">1 Bulan</option>
        <option value="custom">Custom</option>
      </select>
      <template v-if="filterPeriod === 'custom'">
        <input v-model="filterStartDate" type="date" class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg outline-none" @change="fetchTransactions" />
        <input v-model="filterEndDate" type="date" class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg outline-none" @change="fetchTransactions" />
      </template>
      <select v-model="filterStatus" class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg outline-none" @change="fetchTransactions">
        <option value="">Semua Status</option>
        <option value="PROCESSING">Proses</option>
        <option value="SUCCESS">Sukses</option>
        <option value="FAILED">Gagal</option>
        <option value="REFUNDED">Refund</option>
      </select>
      <div class="flex-1"></div>
      <span v-if="meta" class="text-xs text-slate-500 dark:text-slate-400 self-center">{{ meta.total }} transaksi</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
      <span class="ml-2 text-sm text-slate-500">Memuat transaksi...</span>
    </div>

    <!-- Empty -->
    <div v-else-if="transactions.length === 0" class="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 text-center">
      <ReceiptTextIcon class="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
      <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada transaksi PPOB</p>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Transaksi PPOB dari kasir akan muncul di sini.</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[800px]">
          <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Waktu</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Ref ID</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Produk</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Pelanggan</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Tipe</th>
              <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Nominal</th>
              <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Fee</th>
              <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Total</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Status</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">SN</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="trx in transactions" :key="trx.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors" @click="openDetail(trx)">
              <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">{{ formatDateTime(trx.createdAt) }}</td>
              <td class="px-4 py-3 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">{{ trx.refId.slice(-12) }}</td>
              <td class="px-4 py-3 text-xs font-semibold text-slate-800 dark:text-slate-200">{{ trx.productCode }}</td>
              <td class="px-4 py-3">
                <p class="text-xs text-slate-800 dark:text-slate-200">{{ trx.customerName || '-' }}</p>
                <p class="text-[10px] text-slate-500 font-mono">{{ trx.customerId }}</p>
              </td>
              <td class="px-4 py-3"><span :class="['text-[10px] font-bold uppercase px-1.5 py-0.5 rounded', trx.type === 'prepaid' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300']">{{ trx.type === 'prepaid' ? 'Prabayar' : 'Pascabayar' }}</span></td>
              <td class="px-4 py-3 text-xs text-right font-mono text-slate-800 dark:text-slate-200">{{ formatRupiah(trx.amount) }}</td>
              <td class="px-4 py-3 text-xs text-right font-mono text-emerald-600 dark:text-emerald-400">{{ formatRupiah(trx.fee) }}</td>
              <td class="px-4 py-3 text-xs text-right font-mono font-bold text-slate-900 dark:text-slate-100">{{ formatRupiah(trx.total) }}</td>
              <td class="px-4 py-3 text-center"><span :class="['text-[10px] font-bold px-2 py-0.5 rounded-full', statusBadge(trx.status)]">{{ statusLabel(trx.status) }}</span></td>
              <td class="px-4 py-3 text-[10px] font-mono text-slate-500 dark:text-slate-400 text-center max-w-[100px] truncate">{{ trx.serialNumber || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <p class="text-xs text-slate-500 dark:text-slate-400">Hal. {{ meta.page }} / {{ meta.totalPages }}</p>
        <div class="flex gap-1">
          <button type="button" :disabled="meta.page <= 1" class="px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-md disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800" @click="goPage(meta.page - 1)">Prev</button>
          <button type="button" :disabled="meta.page >= meta.totalPages" class="px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-md disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800" @click="goPage(meta.page + 1)">Next</button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="detailTrx" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50" @click="detailTrx = null" />
          <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <button type="button" class="absolute top-4 right-4 p-1" @click="detailTrx = null"><XIcon class="w-4 h-4 text-slate-400" /></button>
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">Detail Transaksi PPOB</h3>
            <div class="space-y-2.5 text-sm">
              <div class="flex justify-between"><span class="text-slate-500">Ref ID</span><span class="font-mono text-xs text-slate-800 dark:text-slate-200">{{ detailTrx.refId }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Tripay Ref</span><span class="font-mono text-xs text-slate-700 dark:text-slate-300">{{ detailTrx.tripayRef || '-' }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Produk</span><span class="font-semibold text-slate-800 dark:text-slate-200">{{ detailTrx.productCode }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Tipe</span><span>{{ detailTrx.type === 'prepaid' ? 'Prabayar' : 'Pascabayar' }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">No Pelanggan</span><span class="font-mono">{{ detailTrx.customerId }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Nama</span><span>{{ detailTrx.customerName || '-' }}</span></div>
              <div class="border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between"><span class="text-slate-500">Nominal</span><span class="font-mono">{{ formatRupiah(detailTrx.amount) }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Fee</span><span class="font-mono text-emerald-600">{{ formatRupiah(detailTrx.fee) }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500 font-bold">Total</span><span class="font-mono font-bold">{{ formatRupiah(detailTrx.total) }}</span></div>
              <div class="border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between"><span class="text-slate-500">Status</span><span :class="['font-bold', statusTextColor(detailTrx.status)]">{{ statusLabel(detailTrx.status) }}</span></div>
              <div v-if="detailTrx.serialNumber" class="flex justify-between"><span class="text-slate-500">SN / Token</span><span class="font-mono text-xs select-all bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{{ detailTrx.serialNumber }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Waktu</span><span class="text-xs">{{ formatDateTime(detailTrx.createdAt) }}</span></div>
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
  return { SUCCESS: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300', FAILED: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300', REFUNDED: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300', PROCESSING: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' }[s] || 'bg-slate-100 text-slate-600';
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
