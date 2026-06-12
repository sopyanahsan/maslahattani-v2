<template>
  <div class="font-hanken overflow-x-hidden w-full min-h-screen bg-slate-50 dark:bg-slate-950">
    <header class="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-14 flex items-center gap-3">
      <RouterLink to="/ppob/menu" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeftIcon class="w-5 h-5 text-slate-700 dark:text-slate-300" /></RouterLink>
      <div><h1 class="text-sm font-bold text-slate-900 dark:text-slate-100">Riwayat PPOB</h1><p class="text-[10px] text-slate-500 dark:text-slate-400">Semua transaksi pembayaran online</p></div>
    </header>

    <!-- Filters -->
    <div class="px-4 py-3 flex gap-2 overflow-x-auto hide-scrollbar">
      <button v-for="f in filters" :key="f.value" type="button" :class="['shrink-0 px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-colors', activeFilter === f.value ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400']" @click="activeFilter = f.value">{{ f.label }}</button>
    </div>

    <!-- List -->
    <div class="px-4 pb-24">
      <div v-if="loading" class="space-y-2 mt-2"><div v-for="i in 6" :key="i" class="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" /></div>
      <div v-else-if="transactions.length === 0" class="text-center py-16">
        <div class="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3"><ReceiptTextIcon class="w-7 h-7 text-slate-300 dark:text-slate-600" /></div>
        <p class="text-sm font-semibold text-slate-600 dark:text-slate-400">Belum ada transaksi</p>
      </div>
      <div v-else class="space-y-2 mt-2">
        <div v-for="trx in transactions" :key="trx.id" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3" @click="detailTrx = trx">
          <div :class="['w-9 h-9 rounded-full flex items-center justify-center shrink-0', statusBg(trx.status)]"><component :is="statusIcon(trx.status)" :class="['w-4 h-4', statusColor(trx.status)]" /></div>
          <div class="flex-1 min-w-0"><p class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{{ trx.productCode }}</p><p class="text-[10px] text-slate-500 dark:text-slate-400">{{ trx.customerId }} · {{ formatDate(trx.createdAt) }}</p></div>
          <div class="text-right shrink-0"><p class="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">{{ formatRupiah(trx.total) }}</p><span :class="['text-[8px] font-bold px-1.5 py-0.5 rounded-full', statusBadge(trx.status)]">{{ trx.status }}</span></div>
        </div>
      </div>
      <div v-if="meta.totalPages > 1" class="flex items-center justify-center gap-2 mt-4">
        <button type="button" :disabled="meta.page <= 1" class="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50" @click="loadTransactions(meta.page-1)">Prev</button>
        <span class="text-xs text-slate-500">{{ meta.page }} / {{ meta.totalPages }}</span>
        <button type="button" :disabled="meta.page >= meta.totalPages" class="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50" @click="loadTransactions(meta.page+1)">Next</button>
      </div>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="detailTrx" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50" @click="detailTrx = null" />
          <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <button type="button" class="absolute top-3 right-3 p-1" @click="detailTrx = null"><XIcon class="w-4 h-4 text-slate-400" /></button>
            <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Detail Transaksi</h3>
            <div class="space-y-2 text-xs">
              <div class="flex justify-between"><span class="text-slate-500">Produk</span><span class="font-semibold text-slate-800 dark:text-slate-200">{{ detailTrx.productCode }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">No. Pelanggan</span><span class="font-mono">{{ detailTrx.customerId }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Nama</span><span>{{ detailTrx.customerName || '-' }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Nominal</span><span class="font-mono">{{ formatRupiah(detailTrx.amount) }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Fee</span><span class="font-mono text-emerald-600">{{ formatRupiah(detailTrx.fee) }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Total</span><span class="font-bold font-mono">{{ formatRupiah(detailTrx.total) }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Status</span><span :class="['font-bold', statusColor(detailTrx.status)]">{{ detailTrx.status }}</span></div>
              <div v-if="detailTrx.serialNumber" class="flex justify-between"><span class="text-slate-500">SN</span><span class="font-mono select-all">{{ detailTrx.serialNumber }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Ref</span><span class="font-mono text-[10px] text-slate-600">{{ detailTrx.refId }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Waktu</span><span>{{ formatDate(detailTrx.createdAt) }}</span></div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { ChevronLeft as ChevronLeftIcon, ReceiptText as ReceiptTextIcon, X as XIcon, Check as CheckIcon, Clock as ClockIcon, RotateCcw as RotateCcwIcon } from 'lucide-vue-next';
import { useShopStore } from '@/shared/stores/shop.store';
import { listPpobTransactions, type PpobTransaction } from '@/shared/services/tripay.service';

const shopStore = useShopStore();
const shopId = computed(() => shopStore.currentShopId || '');
const filters = [{ value: '', label: 'Semua' },{ value: 'PROCESSING', label: 'Proses' },{ value: 'SUCCESS', label: 'Sukses' },{ value: 'FAILED', label: 'Gagal' }];
const activeFilter = ref('');
const loading = ref(false);
const transactions = ref<PpobTransaction[]>([]);
const meta = ref({ total: 0, page: 1, limit: 20, totalPages: 0 });
const detailTrx = ref<PpobTransaction | null>(null);

async function loadTransactions(page = 1) {
  if (!shopId.value) return; loading.value = true;
  try { const r = await listPpobTransactions({ shopId: shopId.value, status: activeFilter.value || undefined, page, limit: 20 }); transactions.value = r.data; meta.value = r.meta; } catch { transactions.value = []; } finally { loading.value = false; }
}
watch(activeFilter, () => loadTransactions(1));
function formatRupiah(n: number) { return 'Rp ' + n.toLocaleString('id-ID'); }
function formatDate(d: string) { return new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }); }
function statusBg(s: string) { return s === 'SUCCESS' ? 'bg-emerald-100 dark:bg-emerald-900/30' : s === 'FAILED' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'; }
function statusColor(s: string) { return s === 'SUCCESS' ? 'text-emerald-600 dark:text-emerald-400' : s === 'FAILED' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'; }
function statusIcon(s: string) { return s === 'SUCCESS' ? CheckIcon : s === 'FAILED' ? XIcon : ClockIcon; }
function statusBadge(s: string) { return s === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : s === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'; }
onMounted(() => { loadTransactions(1); });
</script>
<style scoped>.fade-enter-active,.fade-leave-active{transition:opacity .2s}.fade-enter-from,.fade-leave-to{opacity:0}</style>
