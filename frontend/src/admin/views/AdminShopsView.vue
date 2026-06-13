<template>
  <div class="space-y-5">
    <!-- Action bar -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span v-if="overview" class="text-xs text-slate-500 dark:text-[#869392]">{{ overview.shops.length }} cabang</span>
      </div>
      <button type="button" class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 shrink-0" @click="openCreateModal">
        <PlusIcon class="w-4 h-4" /> Tambah Cabang
      </button>
    </div>

    <!-- Totals Strip -->
    <div v-if="overview" class="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
      <div class="shrink-0 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/80/60 rounded-lg px-5 py-3 shadow-sm">
        <p class="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Omzet Hari Ini</p>
        <p class="text-lg font-bold font-mono text-slate-900 whitespace-nowrap">{{ formatRupiah(overview.totals.omzet) }}</p>
        <p class="text-[10px] text-slate-400">{{ overview.totals.trx }} trx</p>
      </div>
      <div class="shrink-0 bg-white border border-slate-200/80/60 rounded-lg px-4 py-3 shadow-sm">
        <p class="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Kas Retail</p>
        <p class="text-sm font-bold font-mono text-slate-900 whitespace-nowrap">{{ formatRupiah(overview.totals.kasRetail) }}</p>
      </div>
      <div class="shrink-0 bg-white border border-slate-200/80/60 rounded-lg px-4 py-3 shadow-sm">
        <p class="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Kas BRILink</p>
        <p class="text-sm font-bold font-mono text-slate-900 whitespace-nowrap">{{ formatRupiah(overview.totals.kasBrilink) }}</p>
      </div>
      <div v-if="overview.totals.stokRendah > 0" class="shrink-0 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 shadow-sm">
        <p class="text-[9px] font-semibold uppercase tracking-wider text-amber-600 mb-0.5">Stok Rendah</p>
        <p class="text-sm font-bold font-mono text-amber-700 whitespace-nowrap">{{ overview.totals.stokRendah }} produk</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400 dark:text-[#869392]" />
    </div>

    <!-- Empty -->
    <div v-else-if="!overview || overview.shops.length === 0" class="bg-white dark:bg-[#1e2020] border border-dashed border-slate-200 rounded-lg p-10 text-center">
      <StoreIcon class="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p class="text-sm font-semibold text-slate-700">Belum ada cabang</p>
    </div>

    <!-- Branch Cards (Dashboard style) -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div v-for="shop in overview.shops" :key="shop.id"
        class="bg-white border border-slate-200/80/60 rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden">
        <!-- Header -->
        <div class="px-5 pt-4 pb-3 flex items-start justify-between">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
              <StoreIcon class="w-5 h-5 text-blue-600" />
            </div>
            <div class="min-w-0">
              <h3 class="text-sm font-bold text-slate-900 truncate">{{ shop.name }}</h3>
              <p class="text-[10px] text-slate-500 truncate">{{ shop.address }}</p>
            </div>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button class="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors" title="Edit" @click="openEditModal(shop)">
              <PencilIcon class="w-3.5 h-3.5 text-slate-600" />
            </button>
            <button class="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center hover:bg-red-50 transition-colors" title="Hapus" @click="confirmDeleteShop(shop)">
              <Trash2Icon class="w-3.5 h-3.5 text-red-500" />
            </button>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="px-5 pb-4 grid grid-cols-4 gap-3">
          <div class="text-center">
            <p class="text-base font-bold font-mono text-slate-900 dark:text-[#e3e2e2]">{{ formatCompact(shop.stats.omzetHariIni) }}</p>
            <p class="text-[9px] text-slate-500 dark:text-[#869392]">Omzet</p>
          </div>
          <div class="text-center">
            <p class="text-base font-bold font-mono text-slate-900 dark:text-[#e3e2e2]">{{ shop.stats.trxHariIni }}</p>
            <p class="text-[9px] text-slate-500 dark:text-[#869392]">Trx</p>
          </div>
          <div class="text-center">
            <p class="text-base font-bold font-mono" :class="shop.stats.stokRendah > 0 ? 'text-amber-600' : 'text-slate-900 dark:text-[#e3e2e2]'">{{ shop.stats.stokRendah }}</p>
            <p class="text-[9px] text-slate-500 dark:text-[#869392]">Stok Rendah</p>
          </div>
          <div class="text-center">
            <p class="text-base font-bold font-mono" :class="shop.stats.kasirAktif > 0 ? 'text-emerald-600' : 'text-slate-400'">{{ shop.stats.kasirAktif }}</p>
            <p class="text-[9px] text-slate-500 dark:text-[#869392]">Kasir Online</p>
          </div>
        </div>

        <!-- Kas Row -->
        <div class="px-5 pb-4 flex items-center gap-4 border-t border-slate-200 pt-3">
          <div class="flex-1">
            <p class="text-[9px] text-slate-400">Kas Retail</p>
            <p class="text-xs font-bold font-mono text-slate-800">{{ formatRupiah(shop.stats.kasRetail) }}</p>
          </div>
          <div class="flex-1">
            <p class="text-[9px] text-slate-400">Kas BRILink</p>
            <p class="text-xs font-bold font-mono text-slate-800">{{ formatRupiah(shop.stats.kasBrilink) }}</p>
          </div>
          <div class="flex-1 text-right">
            <p class="text-[9px] text-slate-400">{{ shop.stats.kasirTotal }} kasir · {{ shop.stats.produkTotal }} produk</p>
            <p class="text-[10px] text-slate-400">{{ shop.phone }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showModal = false"></div>
        <form class="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4" @submit.prevent="handleSubmit">
          <h2 class="text-base font-bold text-slate-950 dark:text-[#e3e2e2]">{{ editingShop ? 'Edit Cabang' : 'Tambah Cabang Baru' }}</h2>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Cabang <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" required placeholder="Nama Cabang" class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Alamat <span class="text-red-500">*</span></label>
            <textarea v-model="form.address" rows="2" required placeholder="Jl. Raya No. 123" class="w-full text-sm border border-slate-200 rounded-md px-3 py-2 focus:border-blue-600 outline-none resize-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">No. Telepon <span class="text-red-500">*</span></label>
            <input v-model="form.phone" type="text" required placeholder="08123456789" class="w-full h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-md focus:border-blue-600 outline-none" />
          </div>
          <div v-if="formError" class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700">{{ formError }}</div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md" @click="showModal = false">Batal</button>
            <button type="submit" :disabled="submitting" class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
              <Loader2Icon v-if="submitting" class="w-3.5 h-3.5 animate-spin" />
              {{ editingShop ? 'Simpan' : 'Tambah' }}
            </button>
          </div>
        </form>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showDeleteModal = false"></div>
        <div class="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <Trash2Icon class="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-[#e3e2e2]">Hapus Cabang?</h3>
              <p class="text-xs text-slate-600 mt-1">
                Cabang <strong>{{ deletingShop?.name }}</strong> akan dihapus. Cabang yang masih punya data (kasir/produk/transaksi) tidak bisa dihapus.
              </p>
            </div>
          </div>
          <div v-if="deleteError" class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700">{{ deleteError }}</div>
          <div class="flex justify-end gap-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md" @click="showDeleteModal = false">Batal</button>
            <button type="button" :disabled="deleting" class="h-9 px-4 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5" @click="handleDelete">
              <Loader2Icon v-if="deleting" class="w-3.5 h-3.5 animate-spin" />
              Hapus
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import { useAutoRefresh } from '@/shared/composables/useAutoRefresh';
import {
  Plus as PlusIcon, Store as StoreIcon, Pencil as PencilIcon, Trash2 as Trash2Icon,
  Loader2 as Loader2Icon,
} from 'lucide-vue-next';
import api from '@/shared/services/api';
import shopsService from '@/shared/services/shops.service';

// State
const overview = ref<any>(null);
const loading = ref(false);

// Modal
const showModal = ref(false);
const editingShop = ref<any>(null);
const submitting = ref(false);
const formError = ref<string | null>(null);
const form = reactive({ name: '', address: '', phone: '' });

// Delete
const showDeleteModal = ref(false);
const deletingShop = ref<any>(null);
const deleting = ref(false);
const deleteError = ref<string | null>(null);

// Helpers
function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}
function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
  return String(n);
}

// Fetch
async function fetchOverview() {
  loading.value = true;
  try {
    const { data } = await api.get('/shops/multi/overview');
    overview.value = data;
  } catch {
    // Fallback: load basic shop list
    try {
      const shops = await shopsService.list();
      overview.value = { shops: shops.map((s: any) => ({ ...s, stats: { omzetHariIni: 0, trxHariIni: 0, kasirTotal: s._count?.users || 0, kasirAktif: 0, produkTotal: s._count?.products || 0, stokRendah: 0, kasRetail: 0, kasBrilink: 0 } })), totals: { omzet: 0, trx: 0, kasRetail: 0, kasBrilink: 0, stokRendah: 0 } };
    } catch { overview.value = null; }
  } finally { loading.value = false; }
}

// CRUD
function openCreateModal() {
  editingShop.value = null;
  form.name = ''; form.address = ''; form.phone = '';
  formError.value = null; showModal.value = true;
}
function openEditModal(shop: any) {
  editingShop.value = shop;
  form.name = shop.name; form.address = shop.address; form.phone = shop.phone;
  formError.value = null; showModal.value = true;
}
async function handleSubmit() {
  submitting.value = true; formError.value = null;
  try {
    if (editingShop.value) {
      await shopsService.update(editingShop.value.id, { name: form.name, address: form.address, phone: form.phone });
    } else {
      await shopsService.create({ name: form.name, address: form.address, phone: form.phone });
    }
    showModal.value = false;
    await fetchOverview();
  } catch (err: any) { formError.value = err.response?.data?.message || err.message || 'Gagal.'; }
  finally { submitting.value = false; }
}

// Delete
function confirmDeleteShop(shop: any) {
  deletingShop.value = shop;
  deleteError.value = null;
  showDeleteModal.value = true;
}
async function handleDelete() {
  if (!deletingShop.value) return;
  deleting.value = true; deleteError.value = null;
  try {
    await api.delete(`/shops/${deletingShop.value.id}`);
    showDeleteModal.value = false;
    await fetchOverview();
  } catch (err: any) { deleteError.value = err.response?.data?.message || err.message || 'Gagal menghapus.'; }
  finally { deleting.value = false; }
}

onMounted(fetchOverview);
useAutoRefresh(fetchOverview);
</script>


<style scoped>
@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
.space-y-5 > * { animation: fadeSlideUp 0.4s ease-out both; }
.space-y-5 > *:nth-child(1) { animation-delay: 0ms; }
.space-y-5 > *:nth-child(2) { animation-delay: 80ms; }
.space-y-5 > *:nth-child(3) { animation-delay: 160ms; }
@keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
div[class*="shrink-0"][class*="rounded-lg"] { animation: popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
div[class*="shrink-0"]:nth-child(1) { animation-delay: 100ms; }
div[class*="shrink-0"]:nth-child(2) { animation-delay: 180ms; }
div[class*="shrink-0"]:nth-child(3) { animation-delay: 260ms; }
div[class*="shrink-0"]:nth-child(4) { animation-delay: 340ms; }
</style>
