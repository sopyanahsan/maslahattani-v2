<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-slate-950">Cabang / Toko</h1>
        <p class="text-xs text-slate-500 mt-0.5">Kelola cabang toko, lihat statistik, dan tambah cabang baru.</p>
      </div>
      <button type="button" class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 shrink-0" @click="openCreateModal">
        <PlusIcon class="w-4 h-4" /> Tambah Cabang
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
      <span class="ml-2 text-sm text-slate-500">Memuat cabang...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
      <AlertCircleIcon class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>

    <!-- Empty -->
    <div v-else-if="shops.length === 0" class="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
      <StoreIcon class="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p class="text-sm font-semibold text-slate-700">Belum ada cabang</p>
      <p class="text-xs text-slate-500 mt-1">Tambah cabang pertama untuk mulai operasional.</p>
    </div>

    <!-- Shops grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="shop in shops"
        :key="shop.id"
        class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hover:border-blue-300 transition-colors"
      >
        <div class="p-5 space-y-3">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
                <StoreIcon class="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">{{ shop.name }}</h3>
                <p class="text-[10px] text-slate-500 font-mono">#{{ shop.id.slice(-6).toUpperCase() }}</p>
              </div>
            </div>
            <button class="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors" title="Edit" @click="openEditModal(shop)">
              <PencilIcon class="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>

          <div class="space-y-1.5 text-xs text-slate-600">
            <div class="flex items-start gap-2">
              <MapPinIcon class="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{{ shop.address }}</span>
            </div>
            <div class="flex items-center gap-2">
              <PhoneIcon class="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{{ shop.phone }}</span>
            </div>
          </div>

          <!-- Stats -->
          <div v-if="shop._count" class="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
            <div class="text-center">
              <p class="text-xs font-mono font-bold text-slate-900">{{ shop._count.users }}</p>
              <p class="text-[10px] text-slate-500">Kasir</p>
            </div>
            <div class="text-center">
              <p class="text-xs font-mono font-bold text-slate-900">{{ shop._count.products }}</p>
              <p class="text-[10px] text-slate-500">Produk</p>
            </div>
            <div class="text-center">
              <p class="text-xs font-mono font-bold text-slate-900">{{ shop._count.transactions }}</p>
              <p class="text-[10px] text-slate-500">Trx</p>
            </div>
          </div>

          <!-- Child shops -->
          <div v-if="shop.childShops && shop.childShops.length > 0" class="pt-2 border-t border-slate-100">
            <p class="text-[10px] font-bold text-slate-500 uppercase mb-1">Sub-cabang</p>
            <div class="flex flex-wrap gap-1">
              <span v-for="child in shop.childShops" :key="child.id" class="inline-flex px-2 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-700">
                {{ child.name }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showModal = false"></div>
        <form class="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4" @submit.prevent="handleSubmit">
          <h2 class="text-base font-bold text-slate-950">{{ editingShop ? 'Edit Cabang' : 'Tambah Cabang Baru' }}</h2>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Cabang <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" required placeholder="Maslahat Tani Cabang 2" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Alamat <span class="text-red-500">*</span></label>
            <textarea v-model="form.address" rows="2" required placeholder="Jl. Raya No. 123, Kec. Cigombong" class="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">No. Telepon <span class="text-red-500">*</span></label>
            <input v-model="form.phone" type="text" required placeholder="08123456789" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>

          <div v-if="!editingShop">
            <label class="block text-xs font-semibold text-slate-700 mb-1">Cabang Induk (opsional)</label>
            <select v-model="form.parentShopId" class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
              <option value="">— Tidak ada (cabang utama) —</option>
              <option v-for="s in shops" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>

          <div v-if="formError" class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700">{{ formError }}</div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200" @click="showModal = false">Batal</button>
            <button type="submit" :disabled="submitting" class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
              <Loader2Icon v-if="submitting" class="w-3.5 h-3.5 animate-spin" />
              {{ editingShop ? 'Simpan' : 'Tambah' }}
            </button>
          </div>
        </form>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import {
  Plus as PlusIcon, Store as StoreIcon, Pencil as PencilIcon,
  MapPin as MapPinIcon, Phone as PhoneIcon,
  Loader2 as Loader2Icon, AlertCircle as AlertCircleIcon,
} from 'lucide-vue-next';
import shopsService, { type ShopDto } from '@/shared/services/shops.service';

const shops = ref<ShopDto[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const showModal = ref(false);
const editingShop = ref<ShopDto | null>(null);
const submitting = ref(false);
const formError = ref<string | null>(null);
const form = reactive({ name: '', address: '', phone: '', parentShopId: '' });

async function fetchShops() {
  loading.value = true; error.value = null;
  try { shops.value = await shopsService.list(); }
  catch (err: any) { error.value = err.response?.data?.message ?? err.message ?? 'Gagal memuat cabang.'; }
  finally { loading.value = false; }
}

function openCreateModal() {
  editingShop.value = null;
  form.name = ''; form.address = ''; form.phone = ''; form.parentShopId = '';
  formError.value = null; showModal.value = true;
}

function openEditModal(shop: ShopDto) {
  editingShop.value = shop;
  form.name = shop.name; form.address = shop.address; form.phone = shop.phone; form.parentShopId = '';
  formError.value = null; showModal.value = true;
}

async function handleSubmit() {
  submitting.value = true; formError.value = null;
  try {
    if (editingShop.value) {
      await shopsService.update(editingShop.value.id, { name: form.name, address: form.address, phone: form.phone });
    } else {
      await shopsService.create({ name: form.name, address: form.address, phone: form.phone, parentShopId: form.parentShopId || undefined });
    }
    showModal.value = false;
    await fetchShops();
  } catch (err: any) { formError.value = err.response?.data?.message ?? err.message ?? 'Gagal menyimpan cabang.'; }
  finally { submitting.value = false; }
}

onMounted(fetchShops);
</script>
