<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-slate-900">Produk &amp; Stok</h1>
        <p class="text-sm text-slate-500 mt-0.5">Kelola produk, harga, dan stok inventaris</p>
      </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center gap-2 h-10 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
      >
        <component :is="PlusIcon" class="w-4 h-4" />
        Tambah Produk
      </button>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="bg-white rounded-lg border border-slate-200 p-4">
        <p class="text-xs text-slate-500">Total Produk</p>
        <p class="text-xl font-bold text-slate-900 mt-1">{{ productList.length }}</p>
      </div>
      <div class="bg-white rounded-lg border border-slate-200 p-4">
        <p class="text-xs text-slate-500">Stok Rendah</p>
        <p class="text-xl font-bold text-amber-600 mt-1">{{ lowStockCount }}</p>
      </div>
      <div class="bg-white rounded-lg border border-slate-200 p-4">
        <p class="text-xs text-slate-500">Habis</p>
        <p class="text-xl font-bold text-red-600 mt-1">{{ outOfStockCount }}</p>
      </div>
      <div class="bg-white rounded-lg border border-slate-200 p-4">
        <p class="text-xs text-slate-500">Total Nilai Stok</p>
        <p class="text-xl font-bold text-slate-900 mt-1">{{ totalStockValue }}</p>
      </div>
    </div>


    <!-- Filters & Search -->
    <div class="bg-white rounded-xl border border-slate-200 p-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <component :is="SearchIcon" class="w-4 h-4 text-slate-400" />
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nama produk atau SKU..."
            class="input-field pl-10"
          />
        </div>
        <select v-model="filterCategory" class="input-field sm:w-44">
          <option value="all">Semua Kategori</option>
          <option value="sembako">Sembako</option>
          <option value="minuman">Minuman</option>
          <option value="rokok">Rokok</option>
          <option value="kebersihan">Kebersihan</option>
          <option value="lainnya">Lainnya</option>
        </select>
        <select v-model="filterStock" class="input-field sm:w-40">
          <option value="all">Semua Stok</option>
          <option value="low">Stok Rendah</option>
          <option value="out">Habis</option>
          <option value="normal">Normal</option>
        </select>
      </div>
    </div>


    <!-- Product Grid / Table -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50">
              <th class="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Produk</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden md:table-cell">SKU</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden lg:table-cell">Kategori</th>
              <th class="text-right px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Harga Jual</th>
              <th class="text-right px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden sm:table-cell">Modal</th>
              <th class="text-center px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Stok</th>
              <th class="text-right px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="product in filteredProducts"
              :key="product.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="px-5 py-3.5">
                <p class="font-medium text-slate-900">{{ product.name }}</p>
                <p class="text-xs text-slate-500 sm:hidden">{{ product.sku }}</p>
              </td>
              <td class="px-5 py-3.5 hidden md:table-cell">
                <span class="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{{ product.sku }}</span>
              </td>
              <td class="px-5 py-3.5 hidden lg:table-cell">
                <span class="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{{ product.category }}</span>
              </td>
              <td class="px-5 py-3.5 text-right font-medium text-slate-900">{{ formatRupiah(product.price) }}</td>
              <td class="px-5 py-3.5 text-right text-slate-500 hidden sm:table-cell">{{ formatRupiah(product.cost) }}</td>
              <td class="px-5 py-3.5 text-center">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                  :class="getStockBadgeClass(product.stock)"
                >
                  {{ product.stock }} pcs
                </span>
              </td>
              <td class="px-5 py-3.5 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button @click="openStockModal(product)" class="p-1.5 rounded-md hover:bg-slate-100 transition-colors" title="Stok Masuk">
                    <component :is="PackagePlusIcon" class="w-4 h-4 text-emerald-600" />
                  </button>
                  <button @click="openEditModal(product)" class="p-1.5 rounded-md hover:bg-slate-100 transition-colors" title="Edit">
                    <component :is="PencilIcon" class="w-4 h-4 text-slate-500" />
                  </button>
                  <button @click="confirmDelete(product)" class="p-1.5 rounded-md hover:bg-slate-100 transition-colors" title="Hapus">
                    <component :is="Trash2Icon" class="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="filteredProducts.length === 0" class="p-10 text-center">
        <component :is="PackageIcon" class="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p class="text-sm font-medium text-slate-600">Tidak ada produk ditemukan</p>
        <p class="text-xs text-slate-400 mt-1">Coba ubah filter atau tambah produk baru</p>
      </div>
    </div>


    <!-- Create/Edit Product Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="closeModal" />
        <div class="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 z-10 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-bold text-slate-900">{{ editingProduct ? 'Edit Produk' : 'Tambah Produk Baru' }}</h3>
            <button @click="closeModal" class="p-1 rounded-md hover:bg-slate-100 text-slate-400">
              <component :is="XIcon" class="w-5 h-5" />
            </button>
          </div>
          <form @submit.prevent="handleSubmitProduct" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-slate-900 mb-1.5">Nama Produk</label>
                <input v-model="modalForm.name" type="text" placeholder="Beras Pandan 5kg" class="input-field" required />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-900 mb-1.5">SKU</label>
                <input v-model="modalForm.sku" type="text" placeholder="BR-001" class="input-field font-mono" required />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-900 mb-1.5">Kategori</label>
                <select v-model="modalForm.category" class="input-field" required>
                  <option value="">Pilih kategori...</option>
                  <option value="Sembako">Sembako</option>
                  <option value="Minuman">Minuman</option>
                  <option value="Rokok">Rokok</option>
                  <option value="Kebersihan">Kebersihan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-900 mb-1.5">Harga Jual (Rp)</label>
                <input v-model.number="modalForm.price" type="number" min="0" placeholder="15000" class="input-field" required />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-900 mb-1.5">Harga Modal (Rp)</label>
                <input v-model.number="modalForm.cost" type="number" min="0" placeholder="12000" class="input-field" required />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-900 mb-1.5">Stok Awal</label>
                <input v-model.number="modalForm.stock" type="number" min="0" placeholder="100" class="input-field" :disabled="!!editingProduct" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-900 mb-1.5">Min. Stok (alert)</label>
                <input v-model.number="modalForm.minStock" type="number" min="0" placeholder="10" class="input-field" />
              </div>
            </div>
            <!-- Profit preview -->
            <div v-if="modalForm.price && modalForm.cost" class="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p class="text-xs text-emerald-700">
                Profit per item: <span class="font-bold">{{ formatRupiah(modalForm.price - modalForm.cost) }}</span>
                ({{ Math.round(((modalForm.price - modalForm.cost) / modalForm.cost) * 100) }}%)
              </p>
            </div>
            <div class="flex items-center gap-3 pt-2">
              <button type="submit" :disabled="isSubmitting" class="flex-1 h-10 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <component v-if="isSubmitting" :is="Loader2Icon" class="w-4 h-4 animate-spin" />
                {{ editingProduct ? 'Simpan' : 'Tambah Produk' }}
              </button>
              <button type="button" @click="closeModal" class="h-10 px-4 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors">Batal</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>


    <!-- Stock In Modal -->
    <Teleport to="body">
      <div v-if="showStockModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showStockModal = false" />
        <div class="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 z-10">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-bold text-slate-900">Stok Masuk</h3>
            <button @click="showStockModal = false" class="p-1 rounded-md hover:bg-slate-100 text-slate-400">
              <component :is="XIcon" class="w-5 h-5" />
            </button>
          </div>
          <div class="mb-4 bg-slate-50 rounded-lg p-3">
            <p class="text-sm font-medium text-slate-900">{{ stockTarget?.name }}</p>
            <p class="text-xs text-slate-500">Stok saat ini: {{ stockTarget?.stock }} pcs</p>
          </div>
          <form @submit.prevent="handleStockIn" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-900 mb-1.5">Jumlah Masuk</label>
              <input v-model.number="stockInAmount" type="number" min="1" placeholder="0" class="input-field" required />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-900 mb-1.5">Catatan (opsional)</label>
              <input v-model="stockInNote" type="text" placeholder="Restock dari supplier" class="input-field" />
            </div>
            <button type="submit" :disabled="isSubmitting" class="w-full h-10 px-4 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <component v-if="isSubmitting" :is="Loader2Icon" class="w-4 h-4 animate-spin" />
              Tambah Stok
            </button>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showDeleteModal = false" />
        <div class="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 z-10 text-center">
          <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <component :is="Trash2Icon" class="w-6 h-6 text-red-600" />
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-2">Hapus Produk?</h3>
          <p class="text-sm text-slate-600 mb-5">
            Produk <span class="font-semibold">{{ deleteTarget?.name }}</span> akan dihapus permanen. Aksi ini tidak bisa dibatalkan.
          </p>
          <div class="flex gap-3">
            <button @click="handleDelete" :disabled="isSubmitting" class="flex-1 h-10 px-4 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <component v-if="isSubmitting" :is="Loader2Icon" class="w-4 h-4 animate-spin" />
              Ya, Hapus
            </button>
            <button @click="showDeleteModal = false" class="flex-1 h-10 px-4 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors">Batal</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>


<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import {
  Plus as PlusIcon,
  Search as SearchIcon,
  Package as PackageIcon,
  PackagePlus as PackagePlusIcon,
  Pencil as PencilIcon,
  Trash2 as Trash2Icon,
  X as XIcon,
  Loader2 as Loader2Icon,
} from 'lucide-vue-next';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
}

const searchQuery = ref('');
const filterCategory = ref('all');
const filterStock = ref('all');

const showModal = ref(false);
const editingProduct = ref<Product | null>(null);
const isSubmitting = ref(false);

const showStockModal = ref(false);
const stockTarget = ref<Product | null>(null);
const stockInAmount = ref(0);
const stockInNote = ref('');

const showDeleteModal = ref(false);
const deleteTarget = ref<Product | null>(null);

const modalForm = reactive({
  name: '',
  sku: '',
  category: '',
  price: 0,
  cost: 0,
  stock: 0,
  minStock: 10,
});

// Dummy product data
const productList = ref<Product[]>([
  { id: '1', name: 'Beras Pandan 5kg', sku: 'BR-005', category: 'Sembako', price: 72000, cost: 65000, stock: 12, minStock: 5 },
  { id: '2', name: 'Minyak Goreng 1L', sku: 'MG-001', category: 'Sembako', price: 18000, cost: 15500, stock: 3, minStock: 10 },
  { id: '3', name: 'Gula Pasir 1kg', sku: 'GL-001', category: 'Sembako', price: 16000, cost: 14000, stock: 5, minStock: 10 },
  { id: '4', name: 'Indomie Goreng', sku: 'MIE-001', category: 'Sembako', price: 3500, cost: 3000, stock: 48, minStock: 20 },
  { id: '5', name: 'Aqua 600ml', sku: 'AQ-600', category: 'Minuman', price: 4000, cost: 3200, stock: 24, minStock: 12 },
  { id: '6', name: 'Teh Botol Sosro', sku: 'TBS-001', category: 'Minuman', price: 5000, cost: 4000, stock: 18, minStock: 12 },
  { id: '7', name: 'Sampoerna Mild 16', sku: 'SM-016', category: 'Rokok', price: 32000, cost: 29000, stock: 8, minStock: 5 },
  { id: '8', name: 'Djarum Super 12', sku: 'DS-012', category: 'Rokok', price: 22000, cost: 19500, stock: 0, minStock: 5 },
  { id: '9', name: 'Sabun Lifebuoy', sku: 'SB-LB', category: 'Kebersihan', price: 4500, cost: 3500, stock: 15, minStock: 10 },
  { id: '10', name: 'Rinso 800g', sku: 'RS-800', category: 'Kebersihan', price: 12000, cost: 10000, stock: 7, minStock: 5 },
]);

// Computed
const lowStockCount = computed(() => productList.value.filter((p) => p.stock > 0 && p.stock <= p.minStock).length);
const outOfStockCount = computed(() => productList.value.filter((p) => p.stock === 0).length);
const totalStockValue = computed(() => {
  const total = productList.value.reduce((sum, p) => sum + p.cost * p.stock, 0);
  return formatRupiah(total);
});

const filteredProducts = computed(() => {
  return productList.value.filter((p) => {
    const matchSearch = !searchQuery.value ||
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchCategory = filterCategory.value === 'all' ||
      p.category.toLowerCase() === filterCategory.value;

    let matchStock = true;
    if (filterStock.value === 'low') matchStock = p.stock > 0 && p.stock <= p.minStock;
    else if (filterStock.value === 'out') matchStock = p.stock === 0;
    else if (filterStock.value === 'normal') matchStock = p.stock > p.minStock;

    return matchSearch && matchCategory && matchStock;
  });
});

// Helpers
function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

function getStockBadgeClass(stock: number): string {
  if (stock === 0) return 'bg-red-100 text-red-700';
  if (stock <= 10) return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
}

// Modal Actions
function openCreateModal() {
  editingProduct.value = null;
  Object.assign(modalForm, { name: '', sku: '', category: '', price: 0, cost: 0, stock: 0, minStock: 10 });
  showModal.value = true;
}

function openEditModal(product: Product) {
  editingProduct.value = product;
  Object.assign(modalForm, { ...product });
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingProduct.value = null;
}

async function handleSubmitProduct() {
  isSubmitting.value = true;
  await new Promise((r) => setTimeout(r, 800));

  if (editingProduct.value) {
    const idx = productList.value.findIndex((p) => p.id === editingProduct.value!.id);
    if (idx !== -1) {
      productList.value[idx] = { ...productList.value[idx], ...modalForm };
    }
  } else {
    productList.value.unshift({
      id: String(Date.now()),
      name: modalForm.name,
      sku: modalForm.sku,
      category: modalForm.category,
      price: modalForm.price,
      cost: modalForm.cost,
      stock: modalForm.stock,
      minStock: modalForm.minStock,
    });
  }

  isSubmitting.value = false;
  closeModal();
}

// Stock In
function openStockModal(product: Product) {
  stockTarget.value = product;
  stockInAmount.value = 0;
  stockInNote.value = '';
  showStockModal.value = true;
}

async function handleStockIn() {
  if (!stockTarget.value || stockInAmount.value <= 0) return;
  isSubmitting.value = true;
  await new Promise((r) => setTimeout(r, 500));

  const idx = productList.value.findIndex((p) => p.id === stockTarget.value!.id);
  if (idx !== -1) {
    productList.value[idx].stock += stockInAmount.value;
  }

  isSubmitting.value = false;
  showStockModal.value = false;
}

// Delete
function confirmDelete(product: Product) {
  deleteTarget.value = product;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!deleteTarget.value) return;
  isSubmitting.value = true;
  await new Promise((r) => setTimeout(r, 500));

  productList.value = productList.value.filter((p) => p.id !== deleteTarget.value!.id);

  isSubmitting.value = false;
  showDeleteModal.value = false;
}
</script>
