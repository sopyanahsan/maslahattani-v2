<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="relative overflow-hidden rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 text-white shadow-lg flex-1">
        <div class="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
        <div class="absolute -left-4 -bottom-4 w-20 h-20 rounded-full bg-white/5" />
        <h1 class="relative text-lg font-bold">Stok &amp; Inventaris</h1>
        <p class="relative text-xs text-violet-100 mt-0.5">Overview stok, restok cepat, dan opname produk.</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          class="h-9 px-3 text-xs font-semibold border border-slate-200 rounded-lg
                 hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors flex items-center gap-1.5"
          @click="showRestockModal = true"
        >
          <PackagePlusIcon class="w-4 h-4 text-emerald-600" />
          Restok
        </button>
        <button
          type="button"
          class="h-9 px-3 text-xs font-semibold border border-slate-200 rounded-lg
                 hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors flex items-center gap-1.5"
          @click="showOpnameModal = true"
        >
          <ClipboardCheckIcon class="w-4 h-4 text-blue-600" />
          Opname
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div v-if="summary" class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="stat-card bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <p class="text-[11px] text-slate-500 uppercase tracking-wide">Total Produk</p>
        <p class="text-lg font-bold font-mono tabular-nums text-slate-950 dark:text-[#e3e2e2] mt-1">
          {{ summary.totalProducts }}
        </p>
      </div>
      <div class="stat-card bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <p class="text-[11px] text-slate-500 uppercase tracking-wide">Stok Habis</p>
        <p class="text-lg font-bold font-mono tabular-nums text-red-600 mt-1">
          {{ summary.outOfStock }}
        </p>
      </div>
      <div class="stat-card bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <p class="text-[11px] text-slate-500 uppercase tracking-wide">Stok Menipis (&le;5)</p>
        <p class="text-lg font-bold font-mono tabular-nums text-amber-600 mt-1">
          {{ summary.lowStock }}
        </p>
      </div>
      <div class="stat-card bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <p class="text-[11px] text-slate-500 uppercase tracking-wide">Nilai Stok (Modal)</p>
        <p class="text-lg font-bold font-mono tabular-nums text-slate-950 dark:text-[#e3e2e2] mt-1">
          {{ formatRupiah(summary.totalStockValue) }}
        </p>
      </div>
    </div>

    <!-- Tab switcher -->
    <div class="flex gap-1 bg-slate-100 dark:bg-[#292a2a] rounded-lg p-1 w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="[
          'h-8 px-4 text-xs font-semibold rounded-md transition-all',
          activeTab === tab.value
            ? 'bg-white text-slate-950 shadow-sm'
            : 'text-slate-500 hover:text-slate-900',
        ]"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ============================================ -->
    <!-- TAB: Stock Overview                          -->
    <!-- ============================================ -->
    <section v-if="activeTab === 'overview'">
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <Loader2Icon class="w-5 h-5 animate-spin text-blue-600" />
        <span class="ml-2 text-sm text-slate-500 dark:text-[#869392]">Memuat stok...</span>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm flex items-start gap-2"
      >
        <AlertCircleIcon class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-bold text-red-800">Error</p>
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
      </div>

      <!-- Stock table -->
      <div
        v-else-if="stockItems.length > 0"
        class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg shadow-sm overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-[600px]">
            <thead class="bg-slate-50 dark:bg-[#292a2a] border-b border-slate-200 dark:border-[#3d4948]">
              <tr>
                <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">
                  Produk
                </th>
                <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">
                  SKU
                </th>
                <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">
                  Qty
                </th>
                <th class="px-4 py-2.5 text-right text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">
                  Nilai (Modal)
                </th>
                <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="item in stockItems"
                :key="item.id"
                class="hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors"
              >
                <td class="px-4 py-3 text-sm font-medium text-slate-900 dark:text-[#e3e2e2]">
                  {{ item.product.name }}
                </td>
                <td class="px-4 py-3">
                  <code class="text-xs font-mono text-slate-600">{{ item.product.sku }}</code>
                </td>
                <td class="px-4 py-3 text-center text-sm font-mono tabular-nums font-semibold text-slate-900 dark:text-[#e3e2e2]">
                  {{ item.quantity }}
                </td>
                <td class="px-4 py-3 text-right text-sm font-mono tabular-nums text-slate-700">
                  {{ formatRupiah(item.quantity * item.product.cost) }}
                </td>
                <td class="px-4 py-3 text-center">
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                      item.quantity === 0
                        ? 'bg-red-100 text-red-700'
                        : item.quantity <= 5
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700',
                    ]"
                  >
                    {{ item.quantity === 0 ? 'Habis' : item.quantity <= 5 ? 'Menipis' : 'Aman' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="bg-white dark:bg-[#1e2020] border border-dashed border-slate-200 rounded-lg p-8 text-center">
        <PackageIcon class="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <p class="text-sm font-bold text-slate-500 dark:text-[#869392]">Belum ada data stok.</p>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- TAB: Stock History                           -->
    <!-- ============================================ -->
    <section v-if="activeTab === 'history'">
      <div v-if="historyLoading" class="flex items-center justify-center py-12">
        <Loader2Icon class="w-5 h-5 animate-spin text-blue-600" />
        <span class="ml-2 text-sm text-slate-500 dark:text-[#869392]">Memuat riwayat...</span>
      </div>

      <div
        v-else-if="historyItems.length > 0"
        class="bg-white dark:bg-[#1e2020] border border-slate-200 dark:border-[#3d4948] rounded-lg shadow-sm overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-[650px]">
            <thead class="bg-slate-50 dark:bg-[#292a2a] border-b border-slate-200 dark:border-[#3d4948]">
              <tr>
                <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">
                  Waktu
                </th>
                <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">
                  Produk
                </th>
                <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">
                  Tipe
                </th>
                <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">
                  Sumber
                </th>
                <th class="px-4 py-2.5 text-center text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">
                  Perubahan
                </th>
                <th class="px-4 py-2.5 text-left text-[11px] font-bold text-slate-600 dark:text-[#869392] uppercase tracking-wide">
                  Catatan
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="h in historyItems"
                :key="h.id"
                class="hover:bg-slate-50 dark:hover:bg-[#292a2a] transition-colors"
              >
                <td class="px-4 py-2.5 text-xs text-slate-600 font-mono tabular-nums">
                  {{ formatDateTime(h.createdAt) }}
                </td>
                <td class="px-4 py-2.5 text-sm text-slate-900 dark:text-[#e3e2e2]">
                  {{ h.stock.product.name }}
                </td>
                <td class="px-4 py-2.5 text-center">
                  <span
                    :class="[
                      'inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                      historyTypeBadge(h.type),
                    ]"
                  >
                    {{ h.type }}
                  </span>
                </td>
                <td class="px-4 py-2.5">
                  <div class="flex items-center gap-1 flex-wrap">
                    <span
                      :class="[
                        'inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold',
                        sourceBadgeClass(h.source),
                      ]"
                    >
                      {{ sourceLabel(h.source) }}
                    </span>
                    <span
                      v-if="h.paymentMethod"
                      :class="[
                        'inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase',
                        paymentMethodBadge(h.paymentMethod),
                      ]"
                    >
                      {{ paymentMethodLabel(h.paymentMethod) }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-2.5 text-center">
                  <span
                    :class="[
                      'text-xs font-mono tabular-nums font-semibold',
                      h.quantityChange > 0 ? 'text-emerald-600' : 'text-red-600',
                    ]"
                  >
                    {{ h.quantityChange > 0 ? '+' : '' }}{{ h.quantityChange }}
                  </span>
                  <span class="text-[10px] text-slate-400 ml-1">
                    ({{ h.quantityBefore }} → {{ h.quantityAfter }})
                  </span>
                </td>
                <td class="px-4 py-2.5 text-xs text-slate-600 max-w-[200px] truncate">
                  {{ h.notes || '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- History pagination -->
        <div
          v-if="historyMeta && historyMeta.totalPages > 1"
          class="px-4 py-3 border-t border-slate-200 flex items-center justify-between"
        >
          <p class="text-xs text-slate-500 dark:text-[#869392]">
            Halaman {{ historyMeta.page }} dari {{ historyMeta.totalPages }}
          </p>
          <div class="flex items-center gap-1">
            <button
              :disabled="historyMeta.page <= 1"
              class="h-7 px-3 text-xs font-semibold border border-slate-200 rounded-md
                     hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              @click="fetchHistory(historyMeta!.page - 1)"
            >
              Prev
            </button>
            <button
              :disabled="historyMeta.page >= historyMeta.totalPages"
              class="h-7 px-3 text-xs font-semibold border border-slate-200 rounded-md
                     hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              @click="fetchHistory(historyMeta!.page + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div v-else class="bg-white dark:bg-[#1e2020] border border-dashed border-slate-200 rounded-lg p-8 text-center">
        <HistoryIcon class="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <p class="text-sm font-bold text-slate-500 dark:text-[#869392]">Belum ada riwayat stok.</p>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- Restock Modal                                -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div
        v-if="showRestockModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm" @click="showRestockModal = false"></div>
        <form
          class="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4"
          @submit.prevent="handleRestock"
        >
          <h2 class="text-base font-bold text-slate-950 flex items-center gap-2">
            <PackagePlusIcon class="w-5 h-5 text-emerald-600" />
            Restok Produk
          </h2>

          <!-- Product select -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Produk <span class="text-red-500">*</span>
            </label>
            <select
              v-model="restockForm.productId"
              required
              class="w-full h-9 px-3 text-sm border border-slate-200 rounded-md
                     focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
            >
              <option value="">— Pilih produk —</option>
              <option v-for="item in stockItems" :key="item.productId" :value="item.productId">
                {{ item.product.name }} (stok: {{ item.quantity }})
              </option>
            </select>
          </div>

          <!-- Quantity -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Jumlah Masuk <span class="text-red-500">*</span>
            </label>
            <input
              v-model.number="restockForm.quantity"
              type="number"
              min="1"
              required
              placeholder="25"
              class="w-full h-9 px-3 text-sm font-mono border border-slate-200 rounded-md
                     focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Catatan</label>
            <input
              v-model="restockForm.notes"
              type="text"
              placeholder="Restok dari supplier X"
              class="w-full h-9 px-3 text-sm border border-slate-200 rounded-md
                     focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          <div
            v-if="restockError"
            class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700"
          >
            {{ restockError }}
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md
                     hover:bg-slate-200"
              @click="showRestockModal = false"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="restocking"
              class="h-9 px-4 text-xs font-semibold text-white bg-emerald-600 rounded-md
                     hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Loader2Icon v-if="restocking" class="w-3.5 h-3.5 animate-spin" />
              Tambah Stok
            </button>
          </div>
        </form>
      </div>
    </Teleport>

    <!-- ============================================ -->
    <!-- Opname Modal                                 -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div
        v-if="showOpnameModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm" @click="showOpnameModal = false"></div>
        <form
          class="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[80vh] overflow-y-auto"
          @submit.prevent="handleOpname"
        >
          <h2 class="text-base font-bold text-slate-950 flex items-center gap-2">
            <ClipboardCheckIcon class="w-5 h-5 text-blue-600" />
            Stok Opname
          </h2>
          <p class="text-xs text-slate-500 dark:text-[#869392]">
            Input stok fisik aktual per produk. Sistem otomatis hitung selisih.
          </p>

          <!-- Opname items -->
          <div class="space-y-2 max-h-[40vh] overflow-y-auto">
            <div
              v-for="item in opnameItems"
              :key="item.productId"
              class="flex items-center gap-3 bg-slate-50 rounded-md px-3 py-2"
            >
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-slate-900 truncate">
                  {{ item.productName }}
                </p>
                <p class="text-[10px] text-slate-500 dark:text-[#869392]">Sistem: {{ item.systemQty }}</p>
              </div>
              <input
                v-model.number="item.actualQuantity"
                type="number"
                min="0"
                class="w-20 h-8 px-2 text-sm font-mono text-center border border-slate-200 rounded-md
                       focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Catatan Opname</label>
            <input
              v-model="opnameNotes"
              type="text"
              placeholder="Opname bulanan Mei 2026"
              class="w-full h-9 px-3 text-sm border border-slate-200 rounded-md
                     focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          <div
            v-if="opnameError"
            class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700"
          >
            {{ opnameError }}
          </div>

          <!-- Opname result -->
          <div
            v-if="opnameResult"
            class="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1"
          >
            <p class="text-xs font-bold text-blue-900">
              Hasil: {{ opnameResult.summary.matched }}/{{ opnameResult.summary.totalProducts }} cocok
            </p>
            <p class="text-[11px] text-blue-700">
              Surplus: {{ opnameResult.summary.surplus }} · Selisih: {{ opnameResult.summary.selisih }}
            </p>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              class="h-9 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md
                     hover:bg-slate-200"
              @click="showOpnameModal = false"
            >
              {{ opnameResult ? 'Tutup' : 'Batal' }}
            </button>
            <button
              v-if="!opnameResult"
              type="submit"
              :disabled="opnaming"
              class="h-9 px-4 text-xs font-semibold text-white bg-blue-600 rounded-md
                     hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Loader2Icon v-if="opnaming" class="w-3.5 h-3.5 animate-spin" />
              Submit Opname
            </button>
          </div>
        </form>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, watch } from 'vue';
import { useAutoRefresh } from '@/shared/composables/useAutoRefresh';
import {
  PackagePlus as PackagePlusIcon,
  ClipboardCheck as ClipboardCheckIcon,
  Package as PackageIcon,
  History as HistoryIcon,
  Loader2 as Loader2Icon,
  AlertCircle as AlertCircleIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import stockService, {
  type StockItemDto,
  type StockSummary,
  type StockHistoryDto,
  type StockHistoryResponse,
  type StockOpnameResponse,
} from '@/shared/services/stock.service';

const authStore = useAuthStore();
const shopStore = useShopStore();

// ============================================
// State
// ============================================
const activeTab = ref<'overview' | 'history'>('overview');
const tabs = [
  { value: 'overview' as const, label: 'Overview Stok' },
  { value: 'history' as const, label: 'Riwayat' },
];

// Stock overview
const stockItems = ref<StockItemDto[]>([]);
const summary = ref<StockSummary | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// History
const historyItems = ref<StockHistoryDto[]>([]);
const historyMeta = ref<StockHistoryResponse['meta'] | null>(null);
const historyLoading = ref(false);

// Restock modal
const showRestockModal = ref(false);
const restocking = ref(false);
const restockError = ref<string | null>(null);
const restockForm = reactive({
  productId: '',
  quantity: 1,
  notes: '',
});

// Opname modal
const showOpnameModal = ref(false);
const opnaming = ref(false);
const opnameError = ref<string | null>(null);
const opnameNotes = ref('');
const opnameResult = ref<StockOpnameResponse | null>(null);

interface OpnameItemInput {
  productId: string;
  productName: string;
  systemQty: number;
  actualQuantity: number;
}
const opnameItems = ref<OpnameItemInput[]>([]);

// ============================================
// Methods
// ============================================

function getShopId(): string | undefined {
  return shopStore.currentShopId || authStore.user?.shopId || undefined;
}

async function fetchStock() {
  const shopId = getShopId();
  if (!shopId) return;

  loading.value = true;
  error.value = null;
  try {
    const response = await stockService.list(shopId);
    stockItems.value = response.data;
    summary.value = response.summary;

    // Pre-populate opname items
    opnameItems.value = response.data.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      systemQty: item.quantity,
      actualQuantity: item.quantity,
    }));
  } catch (err: any) {
    error.value = err.response?.data?.message ?? err.message ?? 'Gagal memuat stok.';
  } finally {
    loading.value = false;
  }
}

async function fetchHistory(page = 1) {
  const shopId = getShopId();
  if (!shopId) return;

  historyLoading.value = true;
  try {
    const response = await stockService.getHistory({
      shopId,
      page,
      limit: 20,
    });
    historyItems.value = response.data;
    historyMeta.value = response.meta;
  } catch {
    // silent
  } finally {
    historyLoading.value = false;
  }
}

async function handleRestock() {
  const shopId = getShopId();
  if (!shopId) return;

  restocking.value = true;
  restockError.value = null;
  try {
    await stockService.stockIn({
      shopId,
      productId: restockForm.productId,
      quantity: restockForm.quantity,
      notes: restockForm.notes || undefined,
    });
    showRestockModal.value = false;
    restockForm.productId = '';
    restockForm.quantity = 1;
    restockForm.notes = '';
    await fetchStock();
  } catch (err: any) {
    restockError.value = err.response?.data?.message ?? err.message ?? 'Gagal restok.';
  } finally {
    restocking.value = false;
  }
}

async function handleOpname() {
  const shopId = getShopId();
  if (!shopId) return;

  opnaming.value = true;
  opnameError.value = null;
  opnameResult.value = null;
  try {
    const result = await stockService.opname({
      shopId,
      items: opnameItems.value.map((item) => ({
        productId: item.productId,
        actualQuantity: item.actualQuantity,
      })),
      notes: opnameNotes.value || undefined,
    });
    opnameResult.value = result;
    await fetchStock();
  } catch (err: any) {
    opnameError.value = err.response?.data?.message ?? err.message ?? 'Gagal opname.';
  } finally {
    opnaming.value = false;
  }
}

// Watch tab change
watch(activeTab, (tab) => {
  if (tab === 'history' && historyItems.value.length === 0) {
    fetchHistory();
  }
});

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

function formatDateTime(iso: string): string {
  const d = iso.endsWith('Z') || iso.includes('+') ? new Date(iso) : new Date(iso + 'Z');
  return d.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function historyTypeBadge(type: string): string {
  switch (type) {
    case 'IN':
      return 'bg-emerald-100 text-emerald-700';
    case 'OUT':
      return 'bg-red-100 text-red-700';
    case 'OPNAME':
      return 'bg-blue-100 text-blue-700';
    case 'TRANSFER_IN':
      return 'bg-indigo-100 text-indigo-700';
    case 'TRANSFER_OUT':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function sourceLabel(source?: string | null): string {
  if (!source) return 'Lainnya';
  const map: Record<string, string> = {
    INITIAL: 'Stok Awal',
    BULK_UPLOAD: 'Import Excel',
    SEED: 'Seed Data',
    STOCK_IN: 'Restock',
    SALE: 'Penjualan',
    SALE_VOID: 'Void Penjualan',
    OPNAME_INLINE: 'Opname Cepat',
    OPNAME_SESSION: 'Sesi Opname',
    TRANSFER_OUT: 'Transfer Keluar',
    TRANSFER_IN: 'Transfer Masuk',
    PURCHASE_ORDER: 'PO Supplier',
    ADJUSTMENT: 'Penyesuaian',
  };
  return map[source] || source;
}

function sourceBadgeClass(source?: string | null): string {
  if (!source) return 'bg-slate-100 text-slate-600';
  const map: Record<string, string> = {
    INITIAL: 'bg-slate-100 text-slate-700',
    BULK_UPLOAD: 'bg-violet-100 text-violet-700',
    SEED: 'bg-slate-100 text-slate-600',
    STOCK_IN: 'bg-emerald-100 text-emerald-700',
    SALE: 'bg-blue-100 text-blue-700',
    SALE_VOID: 'bg-amber-100 text-amber-700',
    OPNAME_INLINE: 'bg-cyan-100 text-cyan-700',
    OPNAME_SESSION: 'bg-cyan-100 text-cyan-700',
    TRANSFER_OUT: 'bg-purple-100 text-purple-700',
    TRANSFER_IN: 'bg-indigo-100 text-indigo-700',
    PURCHASE_ORDER: 'bg-teal-100 text-teal-700',
    ADJUSTMENT: 'bg-orange-100 text-orange-700',
  };
  return map[source] || 'bg-slate-100 text-slate-700';
}

function paymentMethodLabel(method?: string | null): string {
  if (!method) return '';
  const map: Record<string, string> = {
    CASH: 'Tunai',
    QRIS: 'QRIS',
    TRANSFER: 'Transfer',
    HUTANG: 'Hutang',
  };
  return map[method] || method;
}

function paymentMethodBadge(method?: string | null): string {
  if (!method) return '';
  const map: Record<string, string> = {
    CASH: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    QRIS: 'bg-blue-50 text-blue-700 border border-blue-200',
    TRANSFER: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    HUTANG: 'bg-amber-50 text-amber-700 border border-amber-200',
  };
  return map[method] || 'bg-slate-50 text-slate-600 border border-slate-200';
}

// ============================================
// Lifecycle
// ============================================
onMounted(fetchStock);

useAutoRefresh(fetchStock);
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
.space-y-5 > *:nth-child(2) { animation-delay: 70ms; }
.space-y-5 > *:nth-child(3) { animation-delay: 140ms; }
.space-y-5 > *:nth-child(4) { animation-delay: 210ms; }
.space-y-5 > *:nth-child(5) { animation-delay: 280ms; }

/* stat cards bounce in */
@keyframes popIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
.stat-card {
  animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.stat-card:nth-child(1) { animation-delay: 150ms; }
.stat-card:nth-child(2) { animation-delay: 230ms; }
.stat-card:nth-child(3) { animation-delay: 310ms; }
.stat-card:nth-child(4) { animation-delay: 390ms; }

/* table row left-border glow on hover */
table tbody tr {
  transition: all 0.15s ease;
}
table tbody tr:hover {
  box-shadow: inset 3px 0 0 #6366F1;
}

/* status badge micro-animation */
@keyframes badgePop {
  0% { transform: scale(0.8); opacity: 0; }
  60% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}
span[class*="rounded-full"][class*="font-bold"] {
  animation: badgePop 0.3s ease-out both;
}

/* modal scaleIn */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
form[class*="relative"] {
  animation: scaleIn 0.2s ease-out;
}

/* gradient header shimmer */
@keyframes headerShimmer {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
header[class*="bg-gradient"],
div[class*="bg-gradient-to-r"][class*="from-violet"] {
  background-size: 200% 200%;
  animation: headerShimmer 6s ease infinite;
}
</style>
