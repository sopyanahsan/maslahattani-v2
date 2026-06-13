<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="relative overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white shadow-lg">
      <div class="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white dark:bg-[#1e2020]/10" />
      <div class="absolute -left-4 -bottom-4 w-20 h-20 rounded-full bg-white dark:bg-[#1e2020]/5" />
      <h1 class="relative text-lg font-bold">Riwayat Stok</h1>
      <p class="relative text-xs text-indigo-100 mt-0.5">Riwayat lengkap keluar masuk barang — siapa, dari mana, metode bayar.</p>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 flex-wrap">
      <select v-model="filter.source" class="h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg focus:border-blue-600 outline-none" @change="resetAndFetch">
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
      <select v-model="filter.type" class="h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg focus:border-blue-600 outline-none" @change="resetAndFetch">
        <option value="">Semua Tipe</option>
        <option value="IN">Masuk</option>
        <option value="OUT">Keluar</option>
        <option value="OPNAME">Opname</option>
        <option value="TRANSFER_IN">Transfer Masuk</option>
        <option value="TRANSFER_OUT">Transfer Keluar</option>
      </select>
      <input v-model="filter.startDate" type="date" class="h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg focus:border-blue-600 outline-none" @change="resetAndFetch" />
      <input v-model="filter.endDate" type="date" class="h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg focus:border-blue-600 outline-none" @change="resetAndFetch" />
      <div class="flex-1"></div>
      <span v-if="meta" class="text-xs text-slate-500 dark:text-[#869392] self-center">{{ meta.total }} riwayat</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400 dark:text-[#869392]" />
    </div>

    <!-- Empty -->
    <div v-else-if="items.length === 0" class="bg-white dark:bg-[#1e2020] border border-dashed border-slate-200 rounded-lg p-10 text-center">
      <ClipboardListIcon class="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p class="text-sm font-semibold text-slate-700 dark:text-[#bcc9c7]">Belum ada riwayat stok</p>
      <p class="text-xs text-slate-500 dark:text-[#869392] mt-1">Riwayat akan muncul setelah ada transaksi, restock, transfer, atau opname.</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[900px]">
          <thead class="bg-slate-50 dark:bg-[#292a2a] border-b border-slate-200 dark:border-[#3d4948]">
            <tr>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-900 dark:text-[#bcc9c7] uppercase">Waktu</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-900 dark:text-[#bcc9c7] uppercase">Produk</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-900 dark:text-[#bcc9c7] uppercase">Tipe</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-900 dark:text-[#bcc9c7] uppercase">Sumber</th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-900 dark:text-[#bcc9c7] uppercase">Qty</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-900 dark:text-[#bcc9c7] uppercase">Oleh</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-900 dark:text-[#bcc9c7] uppercase">Catatan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="h in items" :key="h.id" class="hover:bg-slate-50 dark:bg-[#1a1c1c]/50 transition-colors">
              <td class="px-4 py-3 text-xs text-slate-900 dark:text-[#e3e2e2] font-mono whitespace-nowrap">{{ formatDateTime(h.createdAt) }}</td>
              <td class="px-4 py-3">
                <p class="text-sm font-medium text-slate-900 dark:text-[#e3e2e2]">{{ h.stock?.product?.name || '—' }}</p>
                <p class="text-[10px] text-slate-400 dark:text-[#869392] font-mono">{{ h.stock?.product?.sku || '' }}</p>
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
                <span :class="['text-xs font-mono font-bold', h.quantityChange > 0 ? 'text-emerald-600' : 'text-red-600']">
                  {{ h.quantityChange > 0 ? '+' : '' }}{{ h.quantityChange }}
                </span>
                <p class="text-[9px] text-slate-400 dark:text-[#869392] font-mono">{{ h.quantityBefore }}→{{ h.quantityAfter }}</p>
              </td>
              <td class="px-4 py-3">
                <div v-if="h.createdBy" class="flex items-center gap-1.5">
                  <div class="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <span class="text-[8px] font-bold text-slate-900 dark:text-[#e3e2e2]">{{ (h.createdBy.username || h.createdBy.email || '?')[0].toUpperCase() }}</span>
                  </div>
                  <div>
                    <p class="text-[11px] font-medium text-slate-800 dark:text-[#bcc9c7]">{{ h.createdBy.username || h.createdBy.email }}</p>
                    <p class="text-[9px] text-slate-400 dark:text-[#869392]">{{ h.createdBy.role === 'ADMIN' || h.createdBy.role === 'SUPER_ADMIN' ? 'Admin' : 'Kasir' }}</p>
                  </div>
                </div>
                <span v-else class="text-[10px] text-slate-400 dark:text-[#869392]">Sistem</span>
              </td>
              <td class="px-4 py-3 text-xs text-slate-900 dark:text-[#e3e2e2] max-w-[180px] truncate">{{ h.notes || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="meta && meta.totalPages > 1" class="px-4 py-3 border-t border-slate-200 dark:border-[#3d4948] flex items-center justify-between">
        <p class="text-xs text-slate-500 dark:text-[#869392]">Hal. {{ meta.page }} / {{ meta.totalPages }}</p>
        <div class="flex gap-1">
          <button :disabled="meta.page <= 1" class="h-7 px-2.5 text-xs border border-slate-200 rounded disabled:opacity-40 text-slate-700 dark:text-[#bcc9c7]" @click="fetchData(meta!.page - 1)">Prev</button>
          <button :disabled="meta.page >= meta.totalPages" class="h-7 px-2.5 text-xs border border-slate-200 rounded disabled:opacity-40 text-slate-700 dark:text-[#bcc9c7]" @click="fetchData(meta!.page + 1)">Next</button>
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
  const m: Record<string, string> = { IN: 'bg-emerald-100 text-emerald-700', OUT: 'bg-red-100 text-red-700', OPNAME: 'bg-blue-100 text-blue-700', TRANSFER_IN: 'bg-indigo-100 text-indigo-700', TRANSFER_OUT: 'bg-purple-100 text-purple-700', ADJUSTMENT: 'bg-amber-100 text-amber-700' };
  return m[t] || 'bg-slate-100 text-slate-900 dark:text-[#e3e2e2]';
}

function sourceLabel(s?: string | null) {
  if (!s) return '—';
  const m: Record<string, string> = { INITIAL: 'Stok Awal', BULK_UPLOAD: 'Import Excel', SEED: 'Seed', STOCK_IN: 'Restock Manual', SALE: 'Penjualan', SALE_VOID: 'Void Penjualan', OPNAME_INLINE: 'Opname Cepat', OPNAME_SESSION: 'Sesi Opname', TRANSFER_OUT: 'Transfer Keluar', TRANSFER_IN: 'Transfer Masuk', PURCHASE_ORDER: 'PO Supplier', ADJUSTMENT: 'Penyesuaian' };
  return m[s] || s;
}
function sourceBadge(s?: string | null) {
  if (!s) return 'bg-slate-100 text-slate-900 dark:text-[#e3e2e2]';
  const m: Record<string, string> = { INITIAL: 'bg-slate-100 text-slate-700 dark:text-[#bcc9c7]', BULK_UPLOAD: 'bg-violet-100 text-violet-700', STOCK_IN: 'bg-emerald-100 text-emerald-700', SALE: 'bg-blue-100 text-blue-700', SALE_VOID: 'bg-amber-100 text-amber-700', OPNAME_INLINE: 'bg-cyan-100 text-cyan-700', OPNAME_SESSION: 'bg-cyan-100 text-cyan-700', TRANSFER_OUT: 'bg-purple-100 text-purple-700', TRANSFER_IN: 'bg-indigo-100 text-indigo-700', PURCHASE_ORDER: 'bg-teal-100 text-teal-700', ADJUSTMENT: 'bg-orange-100 text-orange-700' };
  return m[s] || 'bg-slate-100 text-slate-900 dark:text-[#e3e2e2]';
}

function pmLabel(m?: string | null) {
  if (!m) return '';
  const map: Record<string, string> = { CASH: 'Tunai', QRIS: 'QRIS', TRANSFER: 'Transfer', HUTANG: 'Hutang' };
  return map[m] || m;
}
function pmBadge(m?: string | null) {
  if (!m) return '';
  const map: Record<string, string> = { CASH: 'bg-emerald-50 text-emerald-700', QRIS: 'bg-blue-50 text-blue-700', TRANSFER: 'bg-indigo-50 text-indigo-700', HUTANG: 'bg-amber-50 text-amber-700' };
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

<style scoped>
/* ── Fancy CSS: staggered entrance ── */
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

.space-y-5 > * {
  animation: fadeSlideUp 0.45s ease-out both;
}
.space-y-5 > *:nth-child(1) { animation-delay: 0ms; }
.space-y-5 > *:nth-child(2) { animation-delay: 80ms; }
.space-y-5 > *:nth-child(3) { animation-delay: 160ms; }
.space-y-5 > *:nth-child(4) { animation-delay: 240ms; }

/* table row left-border glow on hover */
table tbody tr {
  transition: all 0.15s ease;
}
table tbody tr:hover {
  box-shadow: inset 3px 0 0 #6366F1;
}

/* qty change number count effect */
@keyframes countPop {
  0% { transform: scale(0.7); opacity: 0; }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
span[class*="font-mono"][class*="font-bold"] {
  animation: countPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

/* gradient header slow shimmer */
@keyframes headerShimmer {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
div[class*="bg-gradient-to-r"][class*="from-indigo"] {
  background-size: 200% 200%;
  animation: headerShimmer 6s ease infinite;
}

/* badge micro-animation */
@keyframes badgeSlide {
  from { opacity: 0; transform: translateX(-4px); }
  to { opacity: 1; transform: translateX(0); }
}
span[class*="rounded-full"][class*="font-semibold"],
span[class*="rounded"][class*="font-bold"] {
  animation: badgeSlide 0.3s ease-out both;
}
</style>
