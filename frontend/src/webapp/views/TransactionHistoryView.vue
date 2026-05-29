<template>
  <div class="space-y-4 p-4">
    <!-- Header -->
    <header>
      <h1 class="text-lg font-bold text-slate-800 flex items-center gap-2">
        <ReceiptIcon class="w-5 h-5 text-blue-600" /> Riwayat Transaksi
      </h1>
    </header>

    <!-- Search -->
    <div class="relative">
      <SearchIcon class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input v-model="search" type="text" placeholder="Cari no. struk atau nama produk..." class="w-full bg-slate-100 rounded-lg py-2.5 pl-9 pr-3 text-sm border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" @input="debouncedFetch" />
    </div>

    <!-- Date Range -->
    <div class="flex items-center gap-2">
      <div class="flex-1 relative">
        <CalendarIcon class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input v-model="startDate" type="date" class="w-full h-9 pl-8 pr-2 text-xs border border-slate-200 rounded-lg focus:border-blue-500 outline-none" @change="fetchTransactions" />
      </div>
      <span class="text-slate-400 text-xs">—</span>
      <div class="flex-1 relative">
        <CalendarIcon class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input v-model="endDate" type="date" class="w-full h-9 pl-8 pr-2 text-xs border border-slate-200 rounded-lg focus:border-blue-500 outline-none" @change="fetchTransactions" />
      </div>
    </div>

    <!-- Filters Row -->
    <div class="flex flex-wrap gap-2">
      <!-- Status filter -->
      <div class="flex rounded-lg border border-slate-200 overflow-hidden">
        <button v-for="f in statusFilters" :key="f.value" :class="['px-3 py-1.5 text-[10px] font-semibold transition-colors', statusFilter === f.value ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50']" @click="statusFilter = f.value; fetchTransactions()">{{ f.label }}</button>
      </div>
      <!-- Kasir filter -->
      <select v-model="kasirFilter" class="h-8 px-2 text-[10px] border border-slate-200 rounded-lg bg-white focus:border-blue-500 outline-none" @change="fetchTransactions">
        <option value="">Semua Kasir</option>
        <option v-for="k in kasirList" :key="k.id" :value="k.id">{{ k.username || k.email }}</option>
      </select>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-2">
      <div class="bg-blue-50 rounded-lg p-3 text-center">
        <p class="text-xs text-blue-600 font-medium">Total Transaksi</p>
        <p class="text-lg font-bold text-slate-900">{{ meta.total }}</p>
      </div>
      <div class="bg-emerald-50 rounded-lg p-3 text-center">
        <p class="text-xs text-emerald-600 font-medium">Total Penjualan</p>
        <p class="text-lg font-bold text-slate-900 font-mono">{{ formatRupiahShort(totalOmzet) }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
    </div>

    <!-- Empty -->
    <div v-else-if="transactions.length === 0" class="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
      <ReceiptIcon class="w-8 h-8 text-slate-300 mx-auto mb-2" />
      <p class="text-sm text-slate-500">Tidak ada transaksi ditemukan</p>
    </div>

    <!-- Transaction List -->
    <div v-else class="space-y-2">
      <button v-for="trx in transactions" :key="trx.id" class="w-full text-left bg-white border border-slate-200 rounded-xl p-3 hover:border-blue-300 hover:shadow-sm transition-all" @click="openDetail(trx)">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 min-w-0">
            <div :class="['w-8 h-8 rounded-full flex items-center justify-center shrink-0', statusIconClass(trx.status)]">
              <ReceiptIcon class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-800 truncate">{{ trx.items?.map((i: any) => i.product?.name).join(', ') || trx.transactionNumber }}</p>
              <p class="text-[10px] text-slate-500 font-mono">{{ trx.transactionNumber }}</p>
            </div>
          </div>
          <div class="text-right shrink-0 ml-2">
            <p class="text-sm font-bold font-mono text-slate-900">{{ formatRupiah(trx.totalPrice) }}</p>
            <div class="flex items-center gap-1.5 justify-end mt-0.5">
              <span :class="['text-[9px] font-bold px-1.5 py-0.5 rounded', statusBadgeClass(trx.status)]">{{ statusLabel(trx.status) }}</span>
              <span class="text-[9px] text-slate-400">{{ formatTime(trx.createdAt) }}</span>
            </div>
          </div>
        </div>
      </button>
    </div>

    <!-- Pagination -->
    <div v-if="meta.totalPages > 1" class="flex items-center justify-center gap-2 pt-2">
      <button :disabled="meta.page <= 1" class="h-8 px-3 text-xs font-semibold border border-slate-200 rounded-lg disabled:opacity-40" @click="meta.page--; fetchTransactions()">Prev</button>
      <span class="text-xs text-slate-500">{{ meta.page }} / {{ meta.totalPages }}</span>
      <button :disabled="meta.page >= meta.totalPages" class="h-8 px-3 text-xs font-semibold border border-slate-200 rounded-lg disabled:opacity-40" @click="meta.page++; fetchTransactions()">Next</button>
    </div>

    <!-- ===== DETAIL MODAL ===== -->
    <Teleport to="body">
      <div v-if="showDetail && selectedTrx" class="fixed inset-0 z-50 flex items-center justify-center p-3">
        <div class="absolute inset-0 bg-black/50" @click="showDetail = false"></div>
        <div class="relative bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
          <!-- Header -->
          <div class="sticky top-0 bg-white border-b border-slate-100 px-5 py-3 flex items-center justify-between z-10">
            <h3 class="text-base font-bold text-slate-800">Detail Transaksi</h3>
            <button class="p-1 hover:bg-slate-100 rounded-lg" @click="showDetail = false"><XIcon class="w-5 h-5 text-slate-500" /></button>
          </div>

          <div class="p-5 space-y-4">
            <!-- Status + Meta -->
            <div class="bg-slate-50 rounded-xl p-4 space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-xs text-slate-500">Status</span>
                <span :class="['text-xs font-bold px-2 py-0.5 rounded', statusBadgeClass(selectedTrx.status)]">{{ statusLabel(selectedTrx.status) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-slate-500">No. Struk</span>
                <span class="text-xs font-mono font-semibold text-slate-800">{{ selectedTrx.transactionNumber }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-slate-500">Tanggal</span>
                <span class="text-xs text-slate-700">{{ formatDateTime(selectedTrx.createdAt) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-slate-500">Pembayaran</span>
                <span class="text-xs text-slate-700">{{ selectedTrx.payments?.[0]?.method || '-' }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-slate-500">Kasir</span>
                <span class="text-xs text-slate-700">{{ selectedTrx.user?.username || selectedTrx.user?.email || '-' }}</span>
              </div>
            </div>

            <!-- Items -->
            <div>
              <p class="text-xs font-bold text-slate-800 mb-2">Item</p>
              <div class="space-y-2">
                <div v-for="item in selectedTrx.items" :key="item.id" class="bg-white border border-slate-200 rounded-lg p-3">
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="text-sm font-semibold text-slate-800">{{ item.product?.name || 'Produk' }}</p>
                      <p class="text-[10px] text-slate-500">{{ item.quantity }} x {{ formatRupiah(item.unitPrice) }}</p>
                    </div>
                    <span class="text-sm font-mono font-bold text-slate-900">{{ formatRupiah(item.subtotal) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Totals -->
            <div class="border-t border-slate-200 pt-3 space-y-1.5">
              <div class="flex justify-between text-xs text-slate-600">
                <span>Subtotal</span>
                <span class="font-mono">{{ formatRupiah(selectedTrx.totalPrice + selectedTrx.totalDiscount) }}</span>
              </div>
              <div v-if="selectedTrx.totalDiscount > 0" class="flex justify-between text-xs text-red-500">
                <span>Diskon</span>
                <span class="font-mono">-{{ formatRupiah(selectedTrx.totalDiscount) }}</span>
              </div>
              <div class="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-100">
                <span>Total</span>
                <span class="font-mono">{{ formatRupiah(selectedTrx.totalPrice) }}</span>
              </div>
              <div v-if="selectedTrx.payments?.[0]" class="flex justify-between text-xs text-slate-600">
                <span>Bayar</span>
                <span class="font-mono">{{ formatRupiah(selectedTrx.payments[0].amount) }}</span>
              </div>
              <div v-if="selectedTrx.payments?.[0]?.amount > selectedTrx.totalPrice" class="flex justify-between text-xs text-emerald-600">
                <span>Kembali</span>
                <span class="font-mono">{{ formatRupiah(selectedTrx.payments[0].amount - selectedTrx.totalPrice) }}</span>
              </div>
              <div class="flex justify-between text-xs text-emerald-600 pt-1 border-t border-slate-100">
                <span>Profit</span>
                <span class="font-mono font-semibold">{{ formatRupiah(selectedTrx.totalPrice - selectedTrx.totalCost) }}</span>
              </div>
            </div>

            <!-- Void Button (only for COMPLETED) -->
            <div v-if="selectedTrx.status === 'COMPLETED'" class="pt-2 border-t border-slate-200">
              <button class="w-full h-10 border-2 border-red-200 text-red-600 font-semibold text-sm rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2" @click="handleVoid">
                <Trash2Icon class="w-4 h-4" /> Void Transaksi
              </button>
            </div>

            <!-- Void info -->
            <div v-if="selectedTrx.status === 'VOIDED'" class="bg-red-50 rounded-lg p-3">
              <p class="text-xs font-semibold text-red-700">Transaksi dibatalkan</p>
              <p v-if="selectedTrx.voidReason" class="text-[10px] text-red-600 mt-0.5">Alasan: {{ selectedTrx.voidReason }}</p>
              <p v-if="selectedTrx.voidedBy" class="text-[10px] text-red-500 mt-0.5">Oleh: {{ selectedTrx.voidedBy }}</p>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed } from 'vue';
import {
  Receipt as ReceiptIcon, Search as SearchIcon, Calendar as CalendarIcon,
  Loader2 as Loader2Icon, X as XIcon, ShoppingCart as ShoppingCartIcon,
  Trash2 as Trash2Icon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import api from '@/shared/services/api';

const authStore = useAuthStore();

// State
const loading = ref(false);
const transactions = ref<any[]>([]);
const search = ref('');
const startDate = ref(new Date().toISOString().slice(0, 10));
const endDate = ref(new Date().toISOString().slice(0, 10));
const statusFilter = ref('');
const kasirFilter = ref('');
const kasirList = ref<any[]>([]);
const meta = reactive({ total: 0, page: 1, totalPages: 1 });
const showDetail = ref(false);
const selectedTrx = ref<any>(null);

const statusFilters = [
  { value: '', label: 'Semua' },
  { value: 'PENDING', label: 'Open Bill' },
  { value: 'COMPLETED', label: 'Lunas' },
  { value: 'VOIDED', label: 'Void' },
];

const totalOmzet = computed(() => transactions.value.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + t.totalPrice, 0));

let searchTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedFetch() { if (searchTimer) clearTimeout(searchTimer); searchTimer = setTimeout(fetchTransactions, 400); }

function formatRupiah(n: number): string { return 'Rp ' + n.toLocaleString('id-ID'); }
function formatRupiahShort(n: number): string {
  if (n >= 1000000) return 'Rp ' + (n / 1000000).toFixed(1) + 'jt';
  if (n >= 1000) return 'Rp ' + Math.round(n / 1000) + 'rb';
  return formatRupiah(n);
}
function formatTime(iso: string): string { return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); }
function formatDateTime(iso: string): string { return new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }

function statusLabel(s: string): string {
  switch (s) { case 'COMPLETED': return 'Lunas'; case 'PENDING': return 'Open Bill'; case 'VOIDED': return 'Void'; case 'PROCESSING': return 'Proses'; default: return s; }
}
function statusBadgeClass(s: string): string {
  switch (s) { case 'COMPLETED': return 'bg-emerald-100 text-emerald-700'; case 'PENDING': return 'bg-amber-100 text-amber-700'; case 'VOIDED': return 'bg-red-100 text-red-700'; default: return 'bg-slate-100 text-slate-600'; }
}
function statusIconClass(s: string): string {
  switch (s) { case 'COMPLETED': return 'bg-emerald-50 text-emerald-600'; case 'PENDING': return 'bg-amber-50 text-amber-600'; case 'VOIDED': return 'bg-red-50 text-red-500'; default: return 'bg-slate-100 text-slate-500'; }
}

async function fetchTransactions() {
  const shopId = authStore.user?.shopId;
  if (!shopId) return;
  loading.value = true;
  try {
    const params: any = { shopId, startDate: startDate.value, endDate: endDate.value, page: meta.page, limit: 20 };
    if (search.value) params.search = search.value;
    if (statusFilter.value) params.status = statusFilter.value;
    if (kasirFilter.value) params.userId = kasirFilter.value;
    const { data } = await api.get('/transactions', { params });
    transactions.value = data.data || [];
    meta.total = data.meta?.total || 0;
    meta.totalPages = data.meta?.totalPages || 1;
  } catch { transactions.value = []; }
  finally { loading.value = false; }
}

async function fetchKasirList() {
  try {
    const { data } = await api.get('/admin/kasir', { params: { shopId: authStore.user?.shopId } });
    kasirList.value = data.data || [];
  } catch { kasirList.value = []; }
}

function openDetail(trx: any) {
  selectedTrx.value = trx;
  showDetail.value = true;
}

async function handleVoid() {
  if (!selectedTrx.value) return;
  const reason = prompt('Alasan void transaksi:');
  if (!reason) return;
  try {
    await api.post(`/transactions/${selectedTrx.value.id}/void`, { reason, otp: '000000' });
    selectedTrx.value.status = 'VOIDED';
    selectedTrx.value.voidReason = reason;
    await fetchTransactions();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Gagal void. Hubungi admin.');
  }
}

onMounted(() => {
  // Default: show today
  const today = new Date().toISOString().slice(0, 10);
  startDate.value = today;
  endDate.value = today;
  fetchTransactions();
  fetchKasirList();
});
</script>
