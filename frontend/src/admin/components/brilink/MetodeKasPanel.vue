<template>
  <div class="space-y-4">
    <!-- Sub-tabs -->
    <div class="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
      <button
        v-for="tab in subTabs"
        :key="tab.key"
        type="button"
        :class="[
          'h-7 px-3 text-[11px] font-semibold rounded-md transition-colors',
          activeSubTab === tab.key
            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200',
        ]"
        @click="activeSubTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ============================================ -->
    <!-- SUB-TAB: Produk Pulsa & Data                 -->
    <!-- ============================================ -->
    <template v-if="activeSubTab === 'produk'">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <select
            v-model="filterOperator"
            class="h-8 px-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md"
            @change="fetchProducts"
          >
            <option value="">Semua Operator</option>
            <option v-for="op in operators" :key="op" :value="op">{{ op }}</option>
          </select>
          <select
            v-model="filterCategory"
            class="h-8 px-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md"
            @change="fetchProducts"
          >
            <option value="">Semua Tipe</option>
            <option value="TOPUP_PULSA">Pulsa</option>
            <option value="TOPUP_DATA">Paket Data</option>
            <option value="TOPUP_EWALLET">E-Wallet</option>
            <option value="TOPUP_PLN">Token PLN</option>
          </select>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            class="h-8 px-3 text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1"
            @click="handleDownloadTemplate"
          >
            <DownloadIcon class="w-3 h-3" /> Template
          </button>
          <label
            class="h-8 px-3 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-950/50 cursor-pointer flex items-center gap-1"
          >
            <UploadIcon class="w-3 h-3" /> Upload Excel
            <input type="file" accept=".xlsx,.xls" class="hidden" @change="handleBulkUpload" />
          </label>
          <button
            type="button"
            class="h-8 px-3 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md hover:bg-amber-100 dark:hover:bg-amber-950/50"
            @click="showSeedModal = true"
          >
            Seed Template
          </button>
          <button
            type="button"
            class="h-8 px-3 text-[10px] font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
            @click="openProductModal(null)"
          >
            + Tambah
          </button>
        </div>
      </div>

      <!-- Products loading -->
      <div v-if="productsLoading" class="text-center py-8 text-xs text-slate-400">Memuat produk...</div>

      <!-- Products empty -->
      <div v-else-if="products.length === 0" class="text-center py-8 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada produk</p>
        <p class="text-xs text-slate-400 mt-1">Klik "Seed Template" untuk generate produk default, atau tambah manual.</p>
      </div>

      <!-- Products table -->
      <div v-else class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[700px]">
            <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="px-3 py-2 text-left text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Nama</th>
                <th class="px-3 py-2 text-left text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Kategori</th>
                <th class="px-3 py-2 text-left text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Operator/Provider</th>
                <th class="px-3 py-2 text-right text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Nominal</th>
                <th class="px-3 py-2 text-right text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Harga Beli</th>
                <th class="px-3 py-2 text-right text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Harga Jual</th>
                <th class="px-3 py-2 text-right text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Profit</th>
                <th class="px-3 py-2 text-center text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Aktif</th>
                <th class="px-3 py-2 text-center text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="p in products" :key="p.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100">{{ p.name }}</td>
                <td class="px-3 py-2"><span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{{ categoryLabel(p.category) }}</span></td>
                <td class="px-3 py-2 text-xs text-slate-600 dark:text-slate-400">{{ p.operator || p.provider || '—' }}</td>
                <td class="px-3 py-2 text-right text-xs font-mono text-slate-700 dark:text-slate-300">{{ p.nominal ? formatRupiah(p.nominal) : '—' }}</td>
                <td class="px-3 py-2 text-right text-xs font-mono text-slate-700 dark:text-slate-300">{{ formatRupiah(p.buyPrice) }}</td>
                <td class="px-3 py-2 text-right text-xs font-mono text-slate-900 dark:text-slate-100">{{ formatRupiah(p.sellPrice) }}</td>
                <td class="px-3 py-2 text-right text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">{{ formatRupiah(p.sellPrice - p.buyPrice) }}</td>
                <td class="px-3 py-2 text-center">
                  <button
                    type="button"
                    :class="['w-8 h-4 rounded-full relative transition-colors', p.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600']"
                    @click="toggleProduct(p)"
                  >
                    <span :class="['absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform', p.isActive ? 'left-[18px]' : 'left-0.5']" />
                  </button>
                </td>
                <td class="px-3 py-2 text-center">
                  <button class="text-[10px] text-blue-600 hover:underline mr-1" @click="openProductModal(p)">Edit</button>
                  <button class="text-[10px] text-red-600 hover:underline" @click="handleDeleteProduct(p)">Hapus</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="px-3 py-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          {{ products.length }} produk
        </div>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- SUB-TAB: Daftar Bank                         -->
    <!-- ============================================ -->
    <template v-if="activeSubTab === 'bank'">
      <div class="flex items-center gap-3 mb-3">
        <input
          v-model="bankSearch"
          type="text"
          placeholder="Cari bank (nama/kode)..."
          class="h-8 px-3 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md w-64 focus:border-blue-500 outline-none"
          @input="debouncedFetchBanks"
        />
        <span class="text-[10px] text-slate-400 dark:text-slate-500">{{ banks.length }} bank</span>
      </div>

      <div v-if="banksLoading" class="text-center py-8 text-xs text-slate-400">Memuat...</div>
      <div v-else class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden max-h-[500px] overflow-y-auto">
        <table class="w-full">
          <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 sticky top-0">
            <tr>
              <th class="px-3 py-2 text-left text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Kode</th>
              <th class="px-3 py-2 text-left text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Nama Bank</th>
              <th class="px-3 py-2 text-left text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Singkatan</th>
              <th class="px-3 py-2 text-center text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Aktif</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="b in banks" :key="b.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td class="px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-400">{{ b.code }}</td>
              <td class="px-3 py-2 text-xs text-slate-900 dark:text-slate-100">{{ b.name }}</td>
              <td class="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{{ b.shortName }}</td>
              <td class="px-3 py-2 text-center">
                <button
                  type="button"
                  :class="['w-8 h-4 rounded-full relative transition-colors', b.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600']"
                  @click="handleToggleBank(b)"
                >
                  <span :class="['absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform', b.isActive ? 'left-[18px]' : 'left-0.5']" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- SUB-TAB: E-Wallet & PLN                      -->
    <!-- ============================================ -->
    <template v-if="activeSubTab === 'ewallet'">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- E-Wallet Providers -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4">
          <h3 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">E-Wallet Providers</h3>
          <div v-if="ewalletsLoading" class="text-center py-4 text-xs text-slate-400">Memuat...</div>
          <div v-else class="space-y-2">
            <div
              v-for="ew in ewallets"
              :key="ew.id"
              class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
            >
              <div class="flex items-center gap-2">
                <span class="text-base">{{ ew.icon || '💳' }}</span>
                <div>
                  <p class="text-xs font-semibold text-slate-900 dark:text-slate-100">{{ ew.name }}</p>
                  <p class="text-[10px] text-slate-400">{{ ew.code }}</p>
                </div>
              </div>
              <button
                type="button"
                :class="['w-9 h-5 rounded-full relative transition-colors', ew.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600']"
                @click="handleToggleEwallet(ew)"
              >
                <span :class="['absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', ew.isActive ? 'left-[18px]' : 'left-0.5']" />
              </button>
            </div>
          </div>
        </div>

        <!-- PLN info -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4">
          <h3 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">Token PLN</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Nominal PLN dikelola di tab "Produk" dengan kategori TOPUP_PLN. Klik "Seed Template" di tab Produk untuk generate nominal default.
          </p>
          <div class="space-y-1.5">
            <div
              v-for="pln in plnProducts"
              :key="pln.id"
              class="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-md"
            >
              <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">{{ pln.name }}</span>
              <div class="text-right">
                <span class="text-xs font-mono text-slate-900 dark:text-slate-100">{{ formatRupiah(pln.sellPrice) }}</span>
                <span class="text-[10px] text-emerald-600 dark:text-emerald-400 ml-2">+{{ formatRupiah(pln.sellPrice - pln.buyPrice) }}</span>
              </div>
            </div>
            <p v-if="plnProducts.length === 0" class="text-xs text-slate-400 text-center py-3">Belum ada produk PLN. Seed dari tab Produk.</p>
          </div>
        </div>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- MODAL: Create/Edit Product                   -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showProductModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showProductModal = false" />
        <form class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6 space-y-3" @submit.prevent="handleSaveProduct">
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ editingProduct ? 'Edit Produk' : 'Tambah Produk' }}</h3>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Kategori *</label>
              <select v-model="productForm.category" required class="w-full h-8 px-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md">
                <option value="TOPUP_PULSA">Pulsa</option>
                <option value="TOPUP_DATA">Paket Data</option>
                <option value="TOPUP_EWALLET">E-Wallet</option>
                <option value="TOPUP_PLN">Token PLN</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Operator / Provider</label>
              <input v-model="productForm.operatorOrProvider" type="text" placeholder="TELKOMSEL / GOPAY" class="w-full h-8 px-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md" />
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Produk *</label>
            <input v-model="productForm.name" type="text" required placeholder="Pulsa 10rb" class="w-full h-8 px-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md" />
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Nominal</label>
              <input v-model.number="productForm.nominal" type="number" min="0" placeholder="10000" class="w-full h-8 px-2 text-xs font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Harga Beli *</label>
              <input v-model.number="productForm.buyPrice" type="number" min="0" required class="w-full h-8 px-2 text-xs font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Harga Jual *</label>
              <input v-model.number="productForm.sellPrice" type="number" min="0" required class="w-full h-8 px-2 text-xs font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md" />
            </div>
          </div>

          <div v-if="productForm.sellPrice > 0 && productForm.buyPrice > 0" class="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
            Profit: {{ formatRupiah(productForm.sellPrice - productForm.buyPrice) }}
          </div>

          <div v-if="productError" class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md p-2 text-[11px] text-red-700 dark:text-red-300">{{ productError }}</div>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="h-8 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md" @click="showProductModal = false">Batal</button>
            <button type="submit" :disabled="savingProduct" class="h-8 px-3 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
              {{ savingProduct ? '...' : editingProduct ? 'Simpan' : 'Tambah' }}
            </button>
          </div>
        </form>
      </div>
    </Teleport>

    <!-- ============================================ -->
    <!-- MODAL: Seed Template                         -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showSeedModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showSeedModal = false" />
        <div class="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">Seed Produk dari Template</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Generate produk default (pulsa, paket data, PLN, e-wallet) untuk semua operator.
            <strong class="text-red-500">Produk existing akan dihapus dan diganti.</strong>
          </p>

          <div class="space-y-2">
            <label v-for="t in templates" :key="t.value" :class="['flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all', seedTemplate === t.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300']">
              <input v-model="seedTemplate" type="radio" :value="t.value" class="mt-0.5" />
              <div>
                <p class="text-xs font-bold text-slate-800 dark:text-slate-200">{{ t.label }}</p>
                <p class="text-[10px] text-slate-500 mt-0.5">{{ t.desc }}</p>
              </div>
            </label>
          </div>

          <div class="flex justify-end gap-2">
            <button type="button" class="h-8 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md" @click="showSeedModal = false">Batal</button>
            <button type="button" :disabled="seeding" class="h-8 px-3 text-xs font-semibold text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:opacity-50" @click="handleSeed">
              {{ seeding ? 'Generating...' : 'Generate' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed } from 'vue';
import {
  Download as DownloadIcon,
  Upload as UploadIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import brilinkProductsService, {
  type BrilinkProductItem,
  type BankItem,
  type EwalletProviderItem,
} from '@/shared/services/brilink-products.service';

const authStore = useAuthStore();
const shopStore = useShopStore();

type SubTab = 'produk' | 'bank' | 'ewallet';
const subTabs: { key: SubTab; label: string }[] = [
  { key: 'produk', label: 'Produk Pulsa/Data' },
  { key: 'bank', label: 'Daftar Bank' },
  { key: 'ewallet', label: 'E-Wallet & PLN' },
];
const activeSubTab = ref<SubTab>('produk');

const operators = ['TELKOMSEL', 'XL', 'INDOSAT', 'THREE', 'AXIS', 'SMARTFREN'];
const templates = [
  { value: 'standard', label: 'Standar', desc: 'Harga rata-rata agen BRILink' },
  { value: 'premium', label: 'Premium', desc: 'Harga lebih tinggi (profit max)' },
  { value: 'economy', label: 'Ekonomis', desc: 'Harga rendah (volume tinggi)' },
];

// ============================================
// State
// ============================================
const products = ref<BrilinkProductItem[]>([]);
const productsLoading = ref(false);
const filterOperator = ref('');
const filterCategory = ref('');

const banks = ref<BankItem[]>([]);
const banksLoading = ref(false);
const bankSearch = ref('');

const ewallets = ref<EwalletProviderItem[]>([]);
const ewalletsLoading = ref(false);

// Product modal
const showProductModal = ref(false);
const editingProduct = ref<BrilinkProductItem | null>(null);
const savingProduct = ref(false);
const productError = ref<string | null>(null);
const productForm = reactive({
  category: 'TOPUP_PULSA',
  operatorOrProvider: '',
  name: '',
  nominal: 0,
  buyPrice: 0,
  sellPrice: 0,
});

// Seed modal
const showSeedModal = ref(false);
const seedTemplate = ref('standard');
const seeding = ref(false);

// ============================================
// Computed
// ============================================
const plnProducts = computed(() => products.value.filter(p => p.category === 'TOPUP_PLN'));

// ============================================
// Helpers
// ============================================
function getShopId(): string | undefined {
  return shopStore.currentShopId || authStore.user?.shopId || undefined;
}

// ── Bulk Upload Handlers ──────────────────────────────────────────────────────
async function handleDownloadTemplate() {
  try {
    const blob = await brilinkProductsService.downloadBulkTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-produk-brilink.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  } catch { alert('Gagal download template.'); }
}

const uploadResult = ref<{ message: string; success: number; updated: number; skipped: number; errors: string[] } | null>(null);

async function handleBulkUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const shopId = getShopId();
  if (!shopId) { alert('Shop belum dipilih.'); return; }

  try {
    const result = await brilinkProductsService.bulkUpload(shopId, file);
    uploadResult.value = result;
    alert(result.message);
    await fetchProducts();
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Gagal upload.');
  } finally {
    // Reset file input
    (e.target as HTMLInputElement).value = '';
  }
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    TOPUP_PULSA: 'Pulsa', TOPUP_DATA: 'Data', TOPUP_EWALLET: 'E-Wallet', TOPUP_PLN: 'PLN',
  };
  return map[cat] || cat;
}

// ============================================
// Fetch
// ============================================
async function fetchProducts() {
  const shopId = getShopId();
  if (!shopId) return;
  productsLoading.value = true;
  try {
    const res = await brilinkProductsService.listProducts({
      shopId,
      category: filterCategory.value || undefined,
      operator: filterOperator.value || undefined,
    });
    products.value = res.data;
  } catch { products.value = []; }
  finally { productsLoading.value = false; }
}

async function fetchBanks() {
  banksLoading.value = true;
  try { banks.value = await brilinkProductsService.listBanks(bankSearch.value || undefined); }
  catch { banks.value = []; }
  finally { banksLoading.value = false; }
}

async function fetchEwallets() {
  ewalletsLoading.value = true;
  try { ewallets.value = await brilinkProductsService.listEwalletProviders(); }
  catch { ewallets.value = []; }
  finally { ewalletsLoading.value = false; }
}

let bankTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedFetchBanks() {
  if (bankTimer) clearTimeout(bankTimer);
  bankTimer = setTimeout(fetchBanks, 300);
}

// ============================================
// Product CRUD
// ============================================
function openProductModal(product: BrilinkProductItem | null) {
  editingProduct.value = product;
  productError.value = null;
  if (product) {
    productForm.category = product.category;
    productForm.operatorOrProvider = product.operator || product.provider || '';
    productForm.name = product.name;
    productForm.nominal = product.nominal || 0;
    productForm.buyPrice = product.buyPrice;
    productForm.sellPrice = product.sellPrice;
  } else {
    productForm.category = 'TOPUP_PULSA';
    productForm.operatorOrProvider = '';
    productForm.name = '';
    productForm.nominal = 0;
    productForm.buyPrice = 0;
    productForm.sellPrice = 0;
  }
  showProductModal.value = true;
}

async function handleSaveProduct() {
  const shopId = getShopId();
  if (!shopId) return;
  savingProduct.value = true;
  productError.value = null;
  try {
    const isEwallet = productForm.category === 'TOPUP_EWALLET';
    const payload = {
      name: productForm.name,
      nominal: productForm.nominal || undefined,
      buyPrice: productForm.buyPrice,
      sellPrice: productForm.sellPrice,
    };

    if (editingProduct.value) {
      await brilinkProductsService.updateProduct(editingProduct.value.id, payload);
    } else {
      await brilinkProductsService.createProduct({
        shopId,
        category: productForm.category,
        operator: !isEwallet ? (productForm.operatorOrProvider || undefined) : undefined,
        provider: isEwallet ? (productForm.operatorOrProvider || undefined) : undefined,
        ...payload,
      });
    }
    showProductModal.value = false;
    await fetchProducts();
  } catch (err: any) {
    productError.value = err?.response?.data?.message || 'Gagal menyimpan.';
  } finally { savingProduct.value = false; }
}

async function handleDeleteProduct(p: BrilinkProductItem) {
  if (!confirm(`Hapus produk "${p.name}"?`)) return;
  try {
    await brilinkProductsService.deleteProduct(p.id);
    await fetchProducts();
  } catch { /* silent */ }
}

async function toggleProduct(p: BrilinkProductItem) {
  try {
    await brilinkProductsService.updateProduct(p.id, { isActive: !p.isActive });
    p.isActive = !p.isActive;
  } catch { /* silent */ }
}

// ============================================
// Seed
// ============================================
async function handleSeed() {
  const shopId = getShopId();
  if (!shopId) return;
  seeding.value = true;
  try {
    await brilinkProductsService.seedProducts(shopId, seedTemplate.value);
    showSeedModal.value = false;
    await fetchProducts();
  } catch { /* silent */ }
  finally { seeding.value = false; }
}

// ============================================
// Bank toggle
// ============================================
async function handleToggleBank(b: BankItem) {
  try {
    await brilinkProductsService.toggleBank(b.id, !b.isActive);
    b.isActive = !b.isActive;
  } catch { /* silent */ }
}

// ============================================
// E-Wallet toggle
// ============================================
async function handleToggleEwallet(ew: EwalletProviderItem) {
  try {
    await brilinkProductsService.toggleEwalletProvider(ew.id, !ew.isActive);
    ew.isActive = !ew.isActive;
  } catch { /* silent */ }
}

// ============================================
// Lifecycle
// ============================================
onMounted(() => {
  fetchProducts();
  fetchBanks();
  fetchEwallets();
});
</script>
