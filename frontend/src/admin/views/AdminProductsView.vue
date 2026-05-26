<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-slate-950">Produk & Stok</h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Master produk, harga jual & modal, stok per cabang.
        </p>
      </div>
      <button
        type="button"
        class="h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg
               hover:bg-blue-700 transition-colors flex items-center gap-1.5 shrink-0"
        @click="openCreateModal"
      >
        <PlusIcon class="w-4 h-4" />
        Tambah Produk
      </button>
    </div>

    <!-- Search & filter bar -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama atau SKU produk..."
          class="w-full h-9 pl-9 pr-3 text-sm border border-slate-300 rounded-lg
                 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          @input="debouncedSearch"
        />
      </div>
      <div class="flex items-center gap-2 text-xs text-slate-500">
        <span v-if="meta">{{ meta.total }} produk</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
      <span class="ml-2 text-sm text-slate-500">Memuat produk...</span>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2"
    >
      <AlertCircleIcon class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      <div>
        <p class="text-sm text-red-800">{{ error }}</p>
        <button class="text-xs text-red-600 underline mt-1" @click="fetchProducts">Coba lagi</button>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="products.length === 0"
      class="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center"
    >
      <PackageIcon class="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p class="text-sm font-semibold text-slate-700">Belum ada produk</p>
      <p class="text-xs text-slate-500 mt-1">
        {{ searchQuery ? 'Tidak ditemukan produk dengan kata kunci tersebut.' : 'Tambah produk pertama untuk mulai berjualan.' }}
      </p>
    </div>

    <!-- Product Table -->
    <div v-else class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[700px]">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Produk
              </th>
              <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                SKU
              </th>
              <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Harga Jual
              </th>
              <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Modal
              </th>
              <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Margin
              </th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Stok
              </th>
              <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="product in products"
              :key="product.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="px-4 py-3">
                <p class="text-sm font-medium text-slate-900">{{ product.name }}</p>
              </td>
              <td class="px-4 py-3">
                <code class="text-xs font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                  {{ product.sku }}
                </code>
              </td>
              <td class="px-4 py-3 text-right text-sm font-mono text-slate-900">
                {{ formatRupiah(product.price) }}
              </td>
              <td class="px-4 py-3 text-right text-sm font-mono text-slate-600">
                {{ formatRupiah(product.cost) }}
              </td>
              <td class="px-4 py-3 text-right">
                <span
                  :class="[
                    'text-xs font-mono font-semibold',
                    getMargin(product) > 0 ? 'text-emerald-600' : 'text-red-600',
                  ]"
                >
                  {{ getMarginPercent(product) }}%
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold',
                    getTotalStock(product) === 0
                      ? 'bg-red-100 text-red-700'
                      : getTotalStock(product) <= 5
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700',
                  ]"
                >
                  {{ getTotalStock(product) }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button
                    class="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center
                           hover:bg-slate-100 transition-colors"
                    title="Edit"
                    @click="openEditModal(product)"
                  >
                    <PencilIcon class="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <button
                    class="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center
                           hover:bg-red-50 hover:border-red-200 transition-colors"
                    title="Hapus"
                    @click="confirmDelete(product)"
                  >
                    <Trash2Icon class="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="meta && meta.totalPages > 1"
        class="px-4 py-3 border-t border-slate-200 flex items-center justify-between"
      >
        <p class="text-xs text-slate-500">
          Halaman {{ meta.page }} dari {{ meta.totalPages }}
        </p>
        <div class="flex items-center gap-1">
          <button
            :disabled="meta.page <= 1"
            class="h-7 px-2.5 text-xs font-medium border border-slate-200 rounded-md
                   hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            @click="goPage(meta!.page - 1)"
          >
            Prev
          </button>
          <button
            :disabled="meta.page >= meta.totalPages"
            class="h-7 px-2.5 text-xs font-medium border border-slate-200 rounded-md
                   hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            @click="goPage(meta!.page + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- Create / Edit Modal                          -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40" @click="closeModal"></div>

        <!-- Modal -->
        <form
          class="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4"
          @submit.prevent="handleSubmitForm"
        >
          <h2 class="text-base font-bold text-slate-950">
            {{ editingProduct ? 'Edit Produk' : 'Tambah Produk Baru' }}
          </h2>

          <!-- Name -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Nama Produk <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="Beras 5kg Premium"
              class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <!-- SKU (only on create) -->
          <div v-if="!editingProduct">
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              SKU <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.sku"
              type="text"
              required
              placeholder="BRS-5KG-001"
              class="w-full h-9 px-3 text-sm font-mono border border-slate-300 rounded-md
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <!-- Price & Cost -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Harga Jual (Rp) <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="form.price"
                type="number"
                min="0"
                required
                placeholder="75000"
                class="w-full h-9 px-3 text-sm font-mono border border-slate-300 rounded-md
                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Modal (Rp) <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="form.cost"
                type="number"
                min="0"
                required
                placeholder="60000"
                class="w-full h-9 px-3 text-sm font-mono border border-slate-300 rounded-md
                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <!-- Initial stock (only on create) -->
          <div v-if="!editingProduct">
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Stok Awal
            </label>
            <input
              v-model.number="form.initialStock"
              type="number"
              min="0"
              placeholder="0"
              class="w-full h-9 px-3 text-sm font-mono border border-slate-300 rounded-md
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <!-- Error -->
          <div
            v-if="formError"
            class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700"
          >
            {{ formError }}
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md
                     hover:bg-slate-200 transition-colors"
              @click="closeModal"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md
                     hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Loader2Icon v-if="submitting" class="w-3.5 h-3.5 animate-spin" />
              {{ editingProduct ? 'Simpan' : 'Tambah' }}
            </button>
          </div>
        </form>
      </div>
    </Teleport>

    <!-- ============================================ -->
    <!-- Delete Confirmation Modal                    -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/40" @click="showDeleteModal = false"></div>
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <Trash2Icon class="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">Hapus Produk?</h3>
              <p class="text-xs text-slate-600 mt-1">
                Produk <strong>{{ deletingProduct?.name }}</strong> akan dihapus (soft delete).
                Data historis tetap tersimpan.
              </p>
            </div>
          </div>
          <div
            v-if="deleteError"
            class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700"
          >
            {{ deleteError }}
          </div>
          <div class="flex items-center justify-end gap-2">
            <button
              type="button"
              class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md
                     hover:bg-slate-200 transition-colors"
              @click="showDeleteModal = false"
            >
              Batal
            </button>
            <button
              type="button"
              :disabled="deleting"
              class="h-9 px-4 text-xs font-semibold text-white bg-red-600 rounded-md
                     hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              @click="handleDelete"
            >
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
import {
  Plus as PlusIcon,
  Search as SearchIcon,
  Pencil as PencilIcon,
  Trash2 as Trash2Icon,
  Package as PackageIcon,
  Loader2 as Loader2Icon,
  AlertCircle as AlertCircleIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import productsService, {
  type ProductDto,
  type ProductListResponse,
} from '@/shared/services/products.service';

const authStore = useAuthStore();

// ============================================
// State
// ============================================
const products = ref<ProductDto[]>([]);
const meta = ref<ProductListResponse['meta'] | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const currentPage = ref(1);

// Modal state
const showModal = ref(false);
const editingProduct = ref<ProductDto | null>(null);
const submitting = ref(false);
const formError = ref<string | null>(null);

const form = reactive({
  name: '',
  sku: '',
  price: 0,
  cost: 0,
  initialStock: 0,
});

// Delete state
const showDeleteModal = ref(false);
const deletingProduct = ref<ProductDto | null>(null);
const deleting = ref(false);
const deleteError = ref<string | null>(null);

// Debounce timer
let searchTimer: ReturnType<typeof setTimeout> | null = null;

// ============================================
// Methods
// ============================================

async function fetchProducts() {
  loading.value = true;
  error.value = null;
  try {
    const shopId = authStore.user?.shopId;
    const response = await productsService.list({
      shopId: shopId || undefined,
      search: searchQuery.value || undefined,
      page: currentPage.value,
      limit: 20,
    });
    products.value = response.data;
    meta.value = response.meta;
  } catch (err: any) {
    error.value = err.response?.data?.message ?? err.message ?? 'Gagal memuat produk.';
  } finally {
    loading.value = false;
  }
}

function debouncedSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchProducts();
  }, 400);
}

function goPage(page: number) {
  currentPage.value = page;
  fetchProducts();
}

function openCreateModal() {
  editingProduct.value = null;
  form.name = '';
  form.sku = '';
  form.price = 0;
  form.cost = 0;
  form.initialStock = 0;
  formError.value = null;
  showModal.value = true;
}

function openEditModal(product: ProductDto) {
  editingProduct.value = product;
  form.name = product.name;
  form.sku = product.sku;
  form.price = product.price;
  form.cost = product.cost;
  form.initialStock = 0;
  formError.value = null;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingProduct.value = null;
}

async function handleSubmitForm() {
  submitting.value = true;
  formError.value = null;

  try {
    if (editingProduct.value) {
      await productsService.update(editingProduct.value.id, {
        name: form.name,
        price: form.price,
        cost: form.cost,
      });
    } else {
      const shopId = authStore.user?.shopId;
      if (!shopId) {
        formError.value = 'Tidak ada cabang aktif. Pilih cabang dulu.';
        return;
      }
      await productsService.create({
        shopId,
        name: form.name,
        sku: form.sku,
        price: form.price,
        cost: form.cost,
        initialStock: form.initialStock || undefined,
      });
    }
    closeModal();
    await fetchProducts();
  } catch (err: any) {
    formError.value = err.response?.data?.message ?? err.message ?? 'Gagal menyimpan produk.';
  } finally {
    submitting.value = false;
  }
}

function confirmDelete(product: ProductDto) {
  deletingProduct.value = product;
  deleteError.value = null;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!deletingProduct.value) return;
  deleting.value = true;
  deleteError.value = null;

  try {
    await productsService.remove(deletingProduct.value.id);
    showDeleteModal.value = false;
    deletingProduct.value = null;
    await fetchProducts();
  } catch (err: any) {
    deleteError.value = err.response?.data?.message ?? err.message ?? 'Gagal menghapus produk.';
  } finally {
    deleting.value = false;
  }
}

// ============================================
// Helpers
// ============================================

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getTotalStock(product: ProductDto): number {
  if (!product.stocks) return 0;
  return product.stocks.reduce((sum, s) => sum + s.quantity, 0);
}

function getMargin(product: ProductDto): number {
  return product.price - product.cost;
}

function getMarginPercent(product: ProductDto): string {
  if (product.cost === 0) return '∞';
  const pct = ((product.price - product.cost) / product.cost) * 100;
  return pct.toFixed(1);
}

// ============================================
// Lifecycle
// ============================================
onMounted(fetchProducts);
</script>
