<template>
  <div class="space-y-5">
    <div></div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 flex-wrap">
      <select v-model="filter.source" class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 outline-none" @change="resetAndFetch">
        <option value="">Semua Sumber</option>
        <option value="SALE">Penjualan</option>
        <option value="SALE_VOID">Void Penjualan</option>
        <option value="STOCK_IN">Restock Manual</option>
        <option value="PURCHASE_ORDER">PO Supplier</option>
        <option value="TRANSFER_IN">Transfer Masuk</option>
        <option value="TRANSFER_OUT">Transfer Keluar</option>
        <option value="OPNAME_SESSION">Opname Sesi</option>
        <option value="OPNAME_INLINE">Opname Cepat</option>
        <option value="BULK_UPLOAD">Import Excel</option>
        <option value="INITIAL">Stok Awal</option>
      </select>
      <select v-model="filter.type" class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 outline-none" @change="resetAndFetch">
        <option value="">Semua Tipe</option>
        <option value="IN">Masuk</option>
        <option value="OUT">Keluar</option>
        <option value="OPNAME">Opname</option>
        <option value="TRANSFER_IN">Transfer Masuk</option>
        <option value="TRANSFER_OUT">Transfer Keluar</option>
      </select>
      <input v-model="filter.startDate" type="date" class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 outline-none" @change="resetAndFetch" />
      <input v-model="filter.endDate" type="date" class="h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-blue-500 outline-none" @change="resetAndFetch" />
      <div class="flex-1"></div>
      <span v-if="meta" class="text-xs text-slate-500 dark:text-slate-400 self-center">{{ meta.total }} riwayat</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
    </div>

    <!-- Empty -->
    <div v-else-if="items.length === 0" class="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 text-center">
      <ClipboardListIcon class="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
      <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada riwayat stok</p>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Riwayat akan muncul setelah ada transaksi, restock, transfer, atau opname.</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[900px]">
          <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Waktu</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Produk</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Tipe</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Sumber</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Qty</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Oleh</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">Catatan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="h in items" :key="h.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">{{ formatDateTime(h.createdAt) }}</td>
              <td class="px-4 py-3">
                <p class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ h.stock?.product?.name || '—' }}</p>
                <p class="text-[10px] text-slate-400 font-mono">{{ h.stock?.product?.sku || '' }}</p>
              </td>
              <td class="px-4 py-3 text-center">
                <span :class="['inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase', typeBadge(h.type)]">{{ typeLabel(h.type) }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span :class="['inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold', sourceBadge(h.source)]">{{ sourceLabel(h.source) }}</span>
                  <span v-if="h.paymentMethod" :class="['inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase', pmBadge(h.paymentMethod)]">{{ pmLabel(h.paymentMethod) }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <span :class="['text-xs font-mono font-bold', h.quantityChange > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400']">
                  {{ h.quantityChange > 0 ? '+' : '' }}{{ h.quantityChange }}
                </span>
                <p class="text-[9px] text-slate-400 font-mono">{{ h.quantityBefore }}→{{ h.quantityAfter }}</p>
              </td>
              <td class="px-4 py-3">
                <div v-if="h.createdBy" class="flex items-center gap-1.5">
                  <div class="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <span class="text-[8px] font-bold text-slate-600 dark:text-slate-300">{{ (h.createdBy.username || h.createdBy.email || '?')[0].toUpperCase() }}</span>
                  </div>
                  <div>
                    <p class="text-[11px] font-medium text-slate-800 dark:text-slate-200">{{ h.createdBy.username || h.createdBy.email }}</p>
                    <p class="text-[9px] text-slate-400">{{ h.createdBy.role === 'ADMIN' || h.createdBy.role === 'SUPER_ADMIN' ? 'Admin' : 'Kasir' }}</p>
                  </div>
                </div>
                <span v-else class="text-[10px] text-slate-400">Sistem</span>
              </td>
              <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-[180px] truncate">{{ h.notes || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="meta && meta.totalPages > 1" class="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <p class="text-xs text-slate-500 dark:text-slate-400">Hal. {{ meta.page }} / {{ meta.totalPages }}</p>
        <div class="flex gap-1">
          <button :disabled="meta.page <= 1" class="h-7 px-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded disabled:opacity-40 text-slate-700 dark:text-slate-300" @click="fetchData(meta!.page - 1)">Prev</button>
          <button :disabled="meta.page >= meta.totalPages" class="h-7 px-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded disabled:opacity-40 text-slate-700 dark:text-slate-300" @click="fetchData(meta!.page + 1)">Next</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import { Loader2 as Loader2Icon, ClipboardList as ClipboardListIcon } from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import api from '@/shared/services/api';

const authStore = useAuthStore();

const items = ref<any[]>([]);
const meta = ref<{ total: number; page: number; limit: number; totalPages: number } | null>(null);
const loading = ref(false);
const filter = reactive({ source: '', type: '', startDate: '', endDate: '' });

function getShopId() { return authStore.user?.shopId || undefined; }

function formatDateTime(iso: string): string {
  const d = iso.endsWith('Z') || iso.includes('+') ? new Date(iso) : new Date(iso + 'Z');
  return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function typeLabel(t: string) {
  const m: Record<string, string> = { IN: 'Masuk', OUT: 'Keluar', OPNAME: 'Opname', TRANSFER_IN: 'Trx Masuk', TRANSFER_OUT: 'Trx Keluar', ADJUSTMENT: 'Adjust' };
  return m[t] || t;
}
function typeBadge(t: string) {
  const m: Record<string, string> = { IN: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300', OUT: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', OPNAME: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', TRANSFER_IN: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300', TRANSFER_OUT: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300', ADJUSTMENT: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' };
  return m[t] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
}

function sourceLabel(s?: string | null) {
  if (!s) return '—';
  const m: Record<string, string> = { INITIAL: 'Stok Awal', BULK_UPLOAD: 'Import Excel', SEED: 'Seed', STOCK_IN: 'Restock Manual', SALE: 'Penjualan', SALE_VOID: 'Void Penjualan', OPNAME_INLINE: 'Opname Cepat', OPNAME_SESSION: 'Sesi Opname', TRANSFER_OUT: 'Transfer Keluar', TRANSFER_IN: 'Transfer Masuk', PURCHASE_ORDER: 'PO Supplier', ADJUSTMENT: 'Penyesuaian' };
  return m[s] || s;
}
function sourceBadge(s?: string | null) {
  if (!s) return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
  const m: Record<string, string> = { INITIAL: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300', BULK_UPLOAD: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300', STOCK_IN: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300', SALE: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', SALE_VOID: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', OPNAME_INLINE: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300', OPNAME_SESSION: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300', TRANSFER_OUT: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300', TRANSFER_IN: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300', PURCHASE_ORDER: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300', ADJUSTMENT: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' };
  return m[s] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
}

function pmLabel(m?: string | null) {
  if (!m) return '';
  const map: Record<string, string> = { CASH: 'Tunai', QRIS: 'QRIS', TRANSFER: 'Transfer', HUTANG: 'Hutang' };
  return map[m] || m;
}
function pmBadge(m?: string | null) {
  if (!m) return '';
  const map: Record<string, string> = { CASH: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300', QRIS: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300', TRANSFER: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300', HUTANG: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' };
  return map[m] || '';
}

async function fetchData(page = 1) {
  const shopId = getShopId();
  if (!shopId) return;
  loading.value = true;
  try {
    const params: any = { shopId, page, limit: 30 };
    if (filter.source) params.source = filter.source;
    if (filter.type) params.type = filter.type;
    if (filter.startDate) params.startDate = filter.startDate;
    if (filter.endDate) params.endDate = filter.endDate;
    const { data } = await api.get('/stock/history', { params });
    items.value = data.data || [];
    meta.value = data.meta || null;
  } catch { items.value = []; }
  finally { loading.value = false; }
}

function resetAndFetch() { fetchData(1); }

onMounted(() => { fetchData(1); });
</script>
