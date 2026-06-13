<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="relative overflow-hidden rounded-lg bg-gradient-to-r from-pink-600 to-rose-500 px-6 py-5 text-white shadow-lg">
      <div class="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white dark:bg-[#1e2020]/10" />
      <h1 class="relative text-lg font-bold">Cetak Label Barcode</h1>
      <p class="relative text-xs text-pink-100 mt-0.5">Pilih produk dan cetak label barcode untuk rak toko.</p>
    </div>

    <!-- Controls -->
    <div class="flex flex-col sm:flex-row gap-3 flex-wrap items-start sm:items-center">
      <select v-model="filterCategory" class="h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg focus:border-blue-600 outline-none" @change="fetchProducts">
        <option value="">Semua Kategori</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>
      <select v-model="paperSize" class="h-9 px-3 text-sm border border-slate-200 dark:border-[#3d4948] dark:bg-[#1e2020] dark:text-[#e3e2e2] rounded-lg focus:border-blue-600 outline-none">
        <option value="105">Label No.105 (25×38mm) — 55/lembar</option>
        <option value="109">Label No.109 (13×38mm) — 105/lembar</option>
        <option value="108">Label No.108 (19×38mm) — 70/lembar</option>
        <option value="103">Label No.103 (32×64mm) — 27/lembar</option>
        <option value="a4">A4 Bebas (70×42mm) — 21/lembar</option>
      </select>
      <label class="flex items-center gap-1.5 cursor-pointer">
        <input v-model="showPrice" type="checkbox" class="w-4 h-4 text-blue-600 border-slate-200 dark:border-[#3d4948] rounded" />
        <span class="text-xs text-slate-700 dark:text-[#bcc9c7]">Tampilkan Harga</span>
      </label>
      <div class="flex-1"></div>
      <button type="button" class="h-9 px-4 text-xs font-semibold text-slate-700 bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg hover:bg-slate-50 flex items-center gap-1.5" @click="selectAll">
        Pilih Semua
      </button>
      <button type="button" :disabled="selectedIds.length === 0" class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5" @click="handlePrint">
        Cetak {{ selectedIds.length }} Label
      </button>
    </div>

    <!-- Product selection table -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <span class="text-sm text-slate-400 dark:text-[#869392]">Memuat produk...</span>
    </div>

    <div v-else-if="products.length === 0" class="bg-white dark:bg-[#1e2020] border border-dashed border-slate-200 rounded-lg p-10 text-center">
      <p class="text-sm font-semibold text-slate-700 dark:text-[#bcc9c7]">Belum ada produk</p>
    </div>

    <div v-else class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 dark:bg-[#292a2a] border-b border-slate-200 dark:border-[#3d4948]">
            <tr>
              <th class="px-3 py-2.5 text-center w-10"><input type="checkbox" :checked="allSelected" class="w-4 h-4 text-blue-600 border-slate-200 dark:border-[#3d4948] rounded" @change="toggleAll" /></th>
              <th class="px-3 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">Produk</th>
              <th class="px-3 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">SKU / Barcode</th>
              <th class="px-3 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">Kategori</th>
              <th class="px-3 py-2.5 text-right text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase">Harga</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="p in products" :key="p.id" class="hover:bg-slate-50 dark:bg-[#1a1c1c]/50 cursor-pointer" @click="toggleSelect(p.id)">
              <td class="px-3 py-2.5 text-center"><input type="checkbox" :checked="selectedIds.includes(p.id)" class="w-4 h-4 text-blue-600 border-slate-200 dark:border-[#3d4948] rounded pointer-events-none" /></td>
              <td class="px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-[#e3e2e2]">{{ p.name }}</td>
              <td class="px-3 py-2.5"><code class="text-[10px] font-mono text-slate-600 dark:text-[#bcc9c7] bg-slate-100 px-1.5 py-0.5 rounded">{{ p.barcode || p.sku }}</code></td>
              <td class="px-3 py-2.5 text-xs text-slate-500 dark:text-[#869392]">{{ p.category?.name || '—' }}</td>
              <td class="px-3 py-2.5 text-right text-xs font-mono text-slate-700 dark:text-[#bcc9c7]">{{ formatRupiah(p.price) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Print Area (hidden on screen, visible on print) -->
    <div id="print-labels-area" class="print-labels-container">
      <div :class="['print-labels', `paper-${paperSize}`]">
        <div v-for="p in selectedProducts" :key="'lbl-'+p.id" class="label-item">
          <svg :id="'bc-'+p.id" class="barcode-svg"></svg>
          <p class="label-sku">{{ p.barcode || p.sku }}</p>
          <p class="label-name">{{ p.name }}</p>
          <p v-if="showPrice" class="label-price">{{ formatRupiah(p.price) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, nextTick } from 'vue';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import api from '@/shared/services/api';
import JsBarcode from 'jsbarcode';

const authStore = useAuthStore();
const shopStore = useShopStore();

const products = ref<any[]>([]);
const categories = ref<any[]>([]);
const loading = ref(false);
const selectedIds = ref<string[]>([]);
const filterCategory = ref('');
const paperSize = ref('105');
const showPrice = ref(true);

const allSelected = computed(() => products.value.length > 0 && selectedIds.value.length === products.value.length);
const selectedProducts = computed(() => products.value.filter(p => selectedIds.value.includes(p.id)));

function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

async function fetchProducts() {
  const shopId = authStore.user?.shopId ?? shopStore.currentShopId ?? undefined;
  if (!shopId) return;
  loading.value = true;
  try {
    const params: any = { shopId, limit: 500 };
    if (filterCategory.value) params.categoryId = filterCategory.value;
    const { data } = await api.get('/products', { params });
    products.value = data.data || [];
  } catch { products.value = []; }
  finally { loading.value = false; }
}

async function fetchCategories() {
  try {
    const { data } = await api.get('/product-categories');
    categories.value = data.data || [];
  } catch { categories.value = []; }
}

function toggleSelect(id: string) {
  const idx = selectedIds.value.indexOf(id);
  if (idx >= 0) selectedIds.value.splice(idx, 1);
  else selectedIds.value.push(id);
}
function toggleAll() {
  if (allSelected.value) selectedIds.value = [];
  else selectedIds.value = products.value.map((p: any) => p.id);
}
function selectAll() {
  selectedIds.value = products.value.map((p: any) => p.id);
}

async function handlePrint() {
  if (selectedIds.value.length === 0) return;
  await nextTick();

  // Render barcodes into SVGs
  const barcodeHeight = { '105': 30, '109': 16, '108': 22, '103': 38, 'a4': 40 }[paperSize.value] || 30;
  for (const p of selectedProducts.value) {
    const el = document.getElementById('bc-' + p.id);
    if (el) {
      try {
        JsBarcode(el, p.barcode || p.sku, {
          format: 'CODE128',
          width: 1.2,
          height: barcodeHeight,
          displayValue: false,
          margin: 1,
        });
      } catch { /* invalid barcode chars */ }
    }
  }

  await nextTick();
  window.print();
}

onMounted(() => { fetchProducts(); fetchCategories(); });
</script>

<style>
/* Screen: hide print area */
.print-labels-container {
  position: fixed;
  left: -9999px;
  top: 0;
  visibility: hidden;
}

/* Print styles — presisi ukuran label pada kertas A4 (210×297mm) */
@media print {
  body * { visibility: hidden !important; }
  #print-labels-area, #print-labels-area * { visibility: visible !important; }
  #print-labels-area {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 210mm !important;
    height: 297mm !important;
    visibility: visible !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .print-labels {
    display: grid !important;
    margin: 0 !important;
    padding: 3mm !important;
    box-sizing: border-box;
  }

  /* Label No.105: 25×38mm → 5 col × 11 row = 55/A4 */
  .paper-105 { grid-template-columns: repeat(5, 38mm); grid-auto-rows: 25mm; gap: 1.5mm 2mm; }
  .paper-105 .label-item { width: 38mm; height: 25mm; }

  /* Label No.109: 13×38mm → 5 col × 21 row = 105/A4 */
  .paper-109 { grid-template-columns: repeat(5, 38mm); grid-auto-rows: 13mm; gap: 0.8mm 2mm; }
  .paper-109 .label-item { width: 38mm; height: 13mm; }

  /* Label No.108: 19×38mm → 5 col × 14 row = 70/A4 */
  .paper-108 { grid-template-columns: repeat(5, 38mm); grid-auto-rows: 19mm; gap: 1mm 2mm; }
  .paper-108 .label-item { width: 38mm; height: 19mm; }

  /* Label No.103: 32×64mm → 3 col × 9 row = 27/A4 */
  .paper-103 { grid-template-columns: repeat(3, 64mm); grid-auto-rows: 32mm; gap: 1mm 2mm; }
  .paper-103 .label-item { width: 64mm; height: 32mm; }

  /* A4 bebas: 70×42mm → 3 col × 7 row = 21/A4 */
  .paper-a4 { grid-template-columns: repeat(3, 68mm); grid-auto-rows: 40mm; gap: 1.5mm 2mm; }
  .paper-a4 .label-item { width: 68mm; height: 40mm; }

  /* Common label item */
  .label-item {
    border: 0.2px dashed #ccc;
    padding: 1mm;
    text-align: center;
    page-break-inside: avoid;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-sizing: border-box;
  }

  .barcode-svg { width: 80%; max-height: 60%; }
  .label-sku { font-size: 6pt; font-family: monospace; margin: 0.3mm 0; color: #444; line-height: 1; }
  .label-name { font-size: 6.5pt; font-weight: 600; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; line-height: 1.1; }
  .label-price { font-size: 7pt; font-weight: 700; color: #000; margin-top: 0.3mm; line-height: 1; }

  /* Smaller text for tiny labels */
  .paper-109 .label-sku { font-size: 5pt; }
  .paper-109 .label-name { font-size: 5.5pt; }
  .paper-109 .label-price { font-size: 6pt; }
  .paper-109 .barcode-svg { max-height: 50%; }

  /* Bigger text for large labels */
  .paper-103 .label-sku { font-size: 7pt; }
  .paper-103 .label-name { font-size: 8pt; }
  .paper-103 .label-price { font-size: 9pt; }
  .paper-a4 .label-sku { font-size: 7pt; }
  .paper-a4 .label-name { font-size: 8pt; }
  .paper-a4 .label-price { font-size: 9pt; }
}
</style>


<style scoped>
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
.space-y-5 > * {
  animation: fadeSlideUp 0.4s ease-out both;
}
.space-y-5 > *:nth-child(1) { animation-delay: 0ms; }
.space-y-5 > *:nth-child(2) { animation-delay: 80ms; }
.space-y-5 > *:nth-child(3) { animation-delay: 160ms; }
.space-y-5 > *:nth-child(4) { animation-delay: 240ms; }

/* gradient header shimmer */
@keyframes headerShimmer {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
div[class*="bg-gradient-to-r"][class*="from-pink"] {
  background-size: 200% 200%;
  animation: headerShimmer 6s ease infinite;
}

/* product card select glow */
div[class*="border-blue-500"] {
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  transition: box-shadow 0.2s ease;
}
</style>
