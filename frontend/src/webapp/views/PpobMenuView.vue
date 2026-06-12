<template>
  <div class="font-hanken overflow-x-hidden w-full min-h-screen bg-slate-50 dark:bg-slate-950">
    <!-- HEADER -->
    <header class="relative overflow-hidden px-4 pt-4 pb-5 bg-gradient-to-br from-[#4f46e5] via-[#6366f1] to-[#818cf8]">
      <div class="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
      <div class="absolute -left-6 -bottom-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
      <div class="relative z-10 flex items-center gap-3 mb-4">
        <RouterLink to="/dashboard" class="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors">
          <ChevronLeftIcon class="w-5 h-5 text-white" />
        </RouterLink>
        <div>
          <h1 class="font-bold text-base text-white leading-tight">PPOB</h1>
          <p class="text-[11px] text-white/70 leading-none">Pembayaran &amp; Pembelian Online</p>
        </div>
        <ZapIcon class="ml-auto w-7 h-7 text-white/30" />
      </div>
      <div class="relative z-10 flex gap-3">
        <div class="flex-1 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-2.5">
          <p class="text-[9px] font-semibold text-white/60 uppercase tracking-wider">Hari Ini</p>
          <p class="text-lg font-bold text-white font-mono leading-tight">{{ todayCount }}</p>
          <p class="text-[9px] text-white/50">transaksi</p>
        </div>
        <div class="flex-1 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-2.5">
          <p class="text-[9px] font-semibold text-white/60 uppercase tracking-wider">Pendapatan</p>
          <p class="text-lg font-bold text-white font-mono leading-tight">{{ formatRupiahShort(todayRevenue) }}</p>
          <p class="text-[9px] text-white/50">fee hari ini</p>
        </div>
      </div>
    </header>

    <!-- Category Tabs: Prabayar / Pascabayar -->
    <div class="px-4 -mt-3 relative z-20">
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        <!-- Tab switcher -->
        <div class="flex gap-1 mb-3 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          <button
            type="button"
            :class="['flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all', activeType === 'prepaid' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-slate-400']"
            @click="activeType = 'prepaid'"
          >
            Prabayar
          </button>
          <button
            type="button"
            :class="['flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all', activeType === 'postpaid' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-slate-400']"
            @click="activeType = 'postpaid'"
          >
            Pascabayar
          </button>
        </div>

        <!-- Loading Categories -->
        <div v-if="catLoading" class="grid grid-cols-4 sm:grid-cols-5 gap-3">
          <div v-for="i in 8" :key="i" class="flex flex-col items-center gap-1.5 p-2">
            <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div class="h-2 w-10 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
          </div>
        </div>

        <!-- Dynamic Categories Grid -->
        <div v-else class="grid grid-cols-4 sm:grid-cols-5 gap-3">
          <button
            v-for="cat in displayedCategories"
            :key="cat.id || cat.code"
            type="button"
            class="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
            @click="selectCategory(cat)"
          >
            <div :class="['w-10 h-10 rounded-full flex items-center justify-center', getCatBg(cat)]">
              <component :is="getCatIcon(cat)" :class="['w-5 h-5', getCatTextColor(cat)]" />
            </div>
            <p class="text-[10px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">
              {{ cat.name || cat.label }}
            </p>
          </button>
        </div>

        <p v-if="!catLoading && displayedCategories.length === 0" class="text-center text-xs text-slate-400 dark:text-slate-500 py-4">
          Belum ada kategori. Pastikan Tripay sudah aktif di Pengaturan.
        </p>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="px-4 mt-4 pb-24">
      <div class="flex items-center justify-between mb-2">
        <p class="text-xs font-bold text-slate-700 dark:text-slate-300">Transaksi Terakhir</p>
        <RouterLink to="/ppob/history" class="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">Lihat Semua</RouterLink>
      </div>
      <div v-if="trxLoading" class="space-y-2"><div v-for="i in 3" :key="i" class="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" /></div>
      <div v-else-if="recentTrx.length === 0" class="text-center py-8">
        <div class="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2"><ReceiptTextIcon class="w-6 h-6 text-slate-300 dark:text-slate-600" /></div>
        <p class="text-xs text-slate-500 dark:text-slate-400">Belum ada transaksi PPOB.</p>
      </div>
      <div v-else class="space-y-2">
        <div v-for="trx in recentTrx" :key="trx.id" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 flex items-center gap-3">
          <div :class="['w-9 h-9 rounded-full flex items-center justify-center shrink-0', statusBg(trx.status)]">
            <component :is="statusIcon(trx.status)" :class="['w-4 h-4', statusColor(trx.status)]" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{{ trx.productCode }}</p>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate">{{ trx.customerId }}</p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">{{ formatRupiah(trx.total) }}</p>
            <span :class="['text-[8px] font-bold px-1.5 py-0.5 rounded-full', statusBadge(trx.status)]">{{ trx.status }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- PREPAID BOTTOM SHEET (pilih produk → langsung bayar)         -->
    <!-- ============================================================ -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="showSheet && activeType === 'prepaid'" class="fixed inset-0 z-50">
          <div class="absolute inset-0 bg-black/50" @click="closeSheet" />
          <div class="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden">
            <div class="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div class="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto mb-3" />
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <ZapIcon class="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ selectedCategory?.name || 'Prabayar' }}</h2>
                  <p class="text-[10px] text-slate-500 dark:text-slate-400">Masukkan nomor & pilih produk</p>
                </div>
                <button type="button" class="ml-auto p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" @click="closeSheet"><XIcon class="w-4 h-4 text-slate-400" /></button>
              </div>
            </div>
            <!-- Input Nomor -->
            <div class="px-5 pt-4 pb-3 shrink-0">
              <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">No HP / ID Pelanggan</label>
              <input v-model="inputCustomerId" type="text" inputmode="numeric" placeholder="08xxxx atau No Meter PLN..." class="w-full h-10 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
            </div>
            <!-- Products -->
            <div class="flex-1 overflow-y-auto px-5 pb-5">
              <p class="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 sticky top-0 bg-white dark:bg-slate-900 py-1">Produk Tersedia</p>
              <div v-if="productsLoading" class="space-y-2"><div v-for="i in 5" :key="i" class="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" /></div>
              <div v-else-if="products.length === 0" class="text-center py-8"><p class="text-xs text-slate-400">Tidak ada produk.</p></div>
              <div v-else class="space-y-2">
                <button v-for="prod in products" :key="prod.code" type="button" :class="['w-full text-left px-3.5 py-3 rounded-xl border transition-all active:scale-[0.98]', selectedProduct?.code === prod.code ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 ring-1 ring-indigo-300' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900']" @click="selectedProduct = prod">
                  <div class="flex items-center justify-between">
                    <div class="min-w-0 flex-1"><p class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{{ prod.name }}</p><p class="text-[10px] text-slate-500">{{ prod.code }}</p></div>
                    <div class="text-right shrink-0 ml-3"><p class="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">{{ formatRupiah(prod.price) }}</p></div>
                  </div>
                </button>
              </div>
            </div>
            <!-- Pay Button -->
            <div v-if="selectedProduct" class="shrink-0 px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div class="flex items-center justify-between mb-2">
                <p class="text-xs text-slate-600 dark:text-slate-400">Total:</p>
                <p class="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">{{ formatRupiah((selectedProduct.price || 0) + (selectedProduct.fee || 0)) }}</p>
              </div>
              <button type="button" :disabled="!inputCustomerId || paying" class="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2" @click="handlePayPrepaid">
                <Loader2Icon v-if="paying" class="w-4 h-4 animate-spin" /><SendIcon v-else class="w-4 h-4" /> Bayar Sekarang
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ============================================================ -->
    <!-- POSTPAID BOTTOM SHEET (2 step: inquiry → bayar)              -->
    <!-- ============================================================ -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="showSheet && activeType === 'postpaid'" class="fixed inset-0 z-50">
          <div class="absolute inset-0 bg-black/50" @click="closeSheet" />
          <div class="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden">
            <div class="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div class="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto mb-3" />
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <ReceiptTextIcon class="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ selectedCategory?.name || 'Pascabayar' }}</h2>
                  <p class="text-[10px] text-slate-500 dark:text-slate-400">Cek tagihan → Bayar</p>
                </div>
                <button type="button" class="ml-auto p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" @click="closeSheet"><XIcon class="w-4 h-4 text-slate-400" /></button>
              </div>
            </div>

            <!-- Step 1: Input & Cek Tagihan -->
            <div class="px-5 pt-4 pb-3 shrink-0 space-y-3">
              <div>
                <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">No HP Pelanggan</label>
                <input v-model="postpaidPhone" type="text" inputmode="numeric" placeholder="08xxxxxxxxxx" class="w-full h-10 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">No Pelanggan / ID Tagihan</label>
                <input v-model="postpaidNoPelanggan" type="text" inputmode="numeric" placeholder="No meter PLN / ID pelanggan..." class="w-full h-10 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
              </div>
              <!-- Produk select (jika ada products) -->
              <div v-if="products.length > 0">
                <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Produk</label>
                <select v-model="selectedPostpaidCode" class="w-full h-10 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none">
                  <option value="">Pilih produk...</option>
                  <option v-for="p in products" :key="p.code" :value="p.code">{{ p.name }} ({{ p.code }})</option>
                </select>
              </div>
              <button
                type="button"
                :disabled="!postpaidNoPelanggan || !postpaidPhone || inquiryLoading"
                class="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                @click="handleCekTagihan"
              >
                <Loader2Icon v-if="inquiryLoading" class="w-4 h-4 animate-spin" /><SearchIcon v-else class="w-4 h-4" /> Cek Tagihan
              </button>
            </div>

            <!-- Step 2: Inquiry Result & Bayar -->
            <div v-if="inquiryResult" class="px-5 pb-5 shrink-0 space-y-3">
              <div class="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-2">
                <p class="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">Detail Tagihan</p>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div><p class="text-[9px] text-slate-500">Nama</p><p class="font-semibold text-slate-800 dark:text-slate-200">{{ inquiryResult.nama || '-' }}</p></div>
                  <div><p class="text-[9px] text-slate-500">Periode</p><p class="font-semibold text-slate-800 dark:text-slate-200">{{ inquiryResult.periode || '-' }}</p></div>
                  <div><p class="text-[9px] text-slate-500">Tagihan</p><p class="font-bold font-mono text-slate-900 dark:text-slate-100">{{ formatRupiah(inquiryResult.jumlah_tagihan || 0) }}</p></div>
                  <div><p class="text-[9px] text-slate-500">Admin</p><p class="font-mono text-slate-700 dark:text-slate-300">{{ formatRupiah(inquiryResult.biaya_admin || 0) }}</p></div>
                </div>
                <div class="border-t border-amber-200 dark:border-amber-800 pt-2 flex items-center justify-between">
                  <p class="text-xs font-bold text-slate-700 dark:text-slate-300">Total Bayar</p>
                  <p class="text-base font-bold text-amber-800 dark:text-amber-200 font-mono">{{ formatRupiah(inquiryResult.jumlah_bayar || 0) }}</p>
                </div>
              </div>

              <button
                type="button"
                :disabled="paying"
                class="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                @click="handlePayPostpaid"
              >
                <Loader2Icon v-if="paying" class="w-4 h-4 animate-spin" /><SendIcon v-else class="w-4 h-4" /> Bayar Tagihan
              </button>
            </div>

            <!-- Error inquiry -->
            <div v-if="inquiryError" class="px-5 pb-3">
              <div class="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-xs text-red-700 dark:text-red-300 font-medium">
                {{ inquiryError }}
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Success Modal with Receipt -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showSuccess" class="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto">
          <div class="absolute inset-0 bg-black/50" @click="closeSuccess" />
          <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-5 my-4 max-h-[90vh] overflow-y-auto">
            <button type="button" class="absolute top-3 right-3 p-1 z-10" @click="closeSuccess"><XIcon class="w-4 h-4 text-slate-400" /></button>
            <ReceiptPpob v-if="successData" :transaction="successData" :shop-name="shopStore.currentShopName || 'Posify'" />
            <button type="button" class="w-full h-10 mt-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-xl no-print" @click="closeSuccess">Tutup</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import {
  ChevronLeft as ChevronLeftIcon, Zap as ZapIcon, Smartphone as SmartphoneIcon,
  Wifi as WifiIcon, Droplets as DropletsIcon, HeartPulse as HeartPulseIcon,
  Tv as TvIcon, Wallet as WalletIcon, Gamepad2 as Gamepad2Icon, Phone as PhoneIcon,
  ReceiptText as ReceiptTextIcon, X as XIcon, Search as SearchIcon,
  Loader2 as Loader2Icon, Send as SendIcon, CheckCircle as CheckCircleIcon,
  Check as CheckIcon, Clock as ClockIcon, RotateCcw as RotateCcwIcon,
  CreditCard as CreditCardIcon, Landmark as LandmarkIcon,
  ShoppingBag as ShoppingBagIcon,
} from 'lucide-vue-next';
import { useShopStore } from '@/shared/stores/shop.store';
import {
  getPrepaidCategories,
  getPostpaidCategories,
  getPrepaidProducts,
  getPostpaidProducts,
  ppobInquiry,
  createPpobTransaction,
  listPpobTransactions,
  type PpobProduct,
  type PpobTransaction,
} from '@/shared/services/tripay.service';
import ReceiptPpob from '@/webapp/components/ReceiptPpob.vue';

const shopStore = useShopStore();
const shopId = computed(() => shopStore.currentShopId || '');

// ============================================
// Tab state: prepaid vs postpaid
// ============================================
const activeType = ref<'prepaid' | 'postpaid'>('prepaid');

// ============================================
// Dynamic Categories from Tripay API
// ============================================
const catLoading = ref(false);
const prepaidCategories = ref<any[]>([]);
const postpaidCategories = ref<any[]>([]);

const displayedCategories = computed(() =>
  activeType.value === 'prepaid' ? prepaidCategories.value : postpaidCategories.value
);

async function loadCategories() {
  catLoading.value = true;
  try {
    const [prepaid, postpaid] = await Promise.all([
      getPrepaidCategories(shopId.value).catch(() => []),
      getPostpaidCategories(shopId.value).catch(() => []),
    ]);
    prepaidCategories.value = prepaid;
    postpaidCategories.value = postpaid;
  } catch {
    // Fallback — leave empty
  } finally {
    catLoading.value = false;
  }
}

// Icon/color helpers for dynamic categories
const colorPalette = ['pink', 'purple', 'yellow', 'amber', 'blue', 'green', 'indigo', 'cyan', 'red', 'teal'];
const iconMap: Record<string, any> = {
  smartphone: SmartphoneIcon, wifi: WifiIcon, zap: ZapIcon,
  droplets: DropletsIcon, 'heart-pulse': HeartPulseIcon, tv: TvIcon,
  wallet: WalletIcon, 'gamepad-2': Gamepad2Icon, phone: PhoneIcon,
  'credit-card': CreditCardIcon, landmark: LandmarkIcon,
  'shopping-bag': ShoppingBagIcon, 'receipt-text': ReceiptTextIcon,
};

function getCatBg(cat: any) {
  const color = cat.color || colorPalette[(cat.id || 0) % colorPalette.length];
  const bgMap: Record<string, string> = {
    pink: 'bg-pink-100 dark:bg-pink-900/30', purple: 'bg-purple-100 dark:bg-purple-900/30',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30', amber: 'bg-amber-100 dark:bg-amber-900/30',
    blue: 'bg-blue-100 dark:bg-blue-900/30', green: 'bg-green-100 dark:bg-green-900/30',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30', cyan: 'bg-cyan-100 dark:bg-cyan-900/30',
    red: 'bg-red-100 dark:bg-red-900/30', teal: 'bg-teal-100 dark:bg-teal-900/30',
  };
  return bgMap[color] || 'bg-slate-100 dark:bg-slate-800';
}

function getCatTextColor(cat: any) {
  const color = cat.color || colorPalette[(cat.id || 0) % colorPalette.length];
  const textMap: Record<string, string> = {
    pink: 'text-pink-600 dark:text-pink-400', purple: 'text-purple-600 dark:text-purple-400',
    yellow: 'text-yellow-600 dark:text-yellow-400', amber: 'text-amber-600 dark:text-amber-400',
    blue: 'text-blue-600 dark:text-blue-400', green: 'text-green-600 dark:text-green-400',
    indigo: 'text-indigo-600 dark:text-indigo-400', cyan: 'text-cyan-600 dark:text-cyan-400',
    red: 'text-red-600 dark:text-red-400', teal: 'text-teal-600 dark:text-teal-400',
  };
  return textMap[color] || 'text-slate-600 dark:text-slate-400';
}

function getCatIcon(cat: any) {
  if (cat.icon && iconMap[cat.icon]) return iconMap[cat.icon];
  // Auto-detect icon from category name
  const name = (cat.name || '').toLowerCase();
  if (name.includes('pulsa')) return SmartphoneIcon;
  if (name.includes('data') || name.includes('internet')) return WifiIcon;
  if (name.includes('pln') || name.includes('listrik')) return ZapIcon;
  if (name.includes('pdam') || name.includes('air')) return DropletsIcon;
  if (name.includes('bpjs') || name.includes('kesehatan')) return HeartPulseIcon;
  if (name.includes('tv') || name.includes('wifi')) return TvIcon;
  if (name.includes('e-money') || name.includes('emoney') || name.includes('wallet')) return WalletIcon;
  if (name.includes('game') || name.includes('voucher')) return Gamepad2Icon;
  if (name.includes('telkom') || name.includes('telepon')) return PhoneIcon;
  return ZapIcon;
}

// ============================================
// Stats
// ============================================
const todayCount = ref(0);
const todayRevenue = ref(0);

// ============================================
// Transactions
// ============================================
const trxLoading = ref(false);
const recentTrx = ref<PpobTransaction[]>([]);

// ============================================
// Sheet state
// ============================================
const showSheet = ref(false);
const selectedCategory = ref<any>(null);
const productsLoading = ref(false);
const products = ref<PpobProduct[]>([]);

// Prepaid
const selectedProduct = ref<PpobProduct | null>(null);
const inputCustomerId = ref('');

// Postpaid
const postpaidPhone = ref('');
const postpaidNoPelanggan = ref('');
const selectedPostpaidCode = ref('');
const inquiryLoading = ref(false);
const inquiryResult = ref<any>(null);
const inquiryError = ref('');

// General
const paying = ref(false);
const showSuccess = ref(false);
const successData = ref<any>(null);

// ============================================
// Category selection
// ============================================
function selectCategory(cat: any) {
  selectedCategory.value = cat;
  selectedProduct.value = null;
  inputCustomerId.value = '';
  postpaidPhone.value = '';
  postpaidNoPelanggan.value = '';
  selectedPostpaidCode.value = '';
  inquiryResult.value = null;
  inquiryError.value = '';
  showSheet.value = true;
  loadProducts(cat);
}

async function loadProducts(cat: any) {
  productsLoading.value = true;
  try {
    const catId = cat.id || cat.code;
    if (activeType.value === 'prepaid') {
      products.value = await getPrepaidProducts(shopId.value, catId);
    } else {
      products.value = await getPostpaidProducts(shopId.value, catId);
    }
  } catch {
    products.value = [];
  } finally {
    productsLoading.value = false;
  }
}

function closeSheet() {
  showSheet.value = false;
  selectedCategory.value = null;
  products.value = [];
  selectedProduct.value = null;
  inquiryResult.value = null;
  inquiryError.value = '';
}

// ============================================
// Prepaid: langsung bayar
// ============================================
async function handlePayPrepaid() {
  if (!selectedProduct.value || !inputCustomerId.value) return;
  paying.value = true;
  try {
    const isPln = (selectedProduct.value.code || '').toUpperCase().includes('PLN');
    const result = await createPpobTransaction({
      productCode: selectedProduct.value.code,
      customerId: inputCustomerId.value,
      type: 'prepaid',
      amount: selectedProduct.value.price,
      noMeterPln: isPln ? inputCustomerId.value : undefined,
    });
    successData.value = result.transaction;
    showSuccess.value = true;
    closeSheet();
    loadRecentTransactions();
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Gagal membuat transaksi.');
  } finally {
    paying.value = false;
  }
}

// ============================================
// Postpaid: Step 1 — Cek Tagihan
// ============================================
async function handleCekTagihan() {
  if (!postpaidNoPelanggan.value || !postpaidPhone.value) return;
  inquiryLoading.value = true;
  inquiryResult.value = null;
  inquiryError.value = '';
  try {
    const code = selectedPostpaidCode.value || products.value[0]?.code || selectedCategory.value?.code || '';
    const result = await ppobInquiry(code, postpaidNoPelanggan.value, shopId.value, postpaidPhone.value);
    inquiryResult.value = result;
  } catch (err: any) {
    inquiryError.value = err?.response?.data?.message || 'Gagal cek tagihan. Periksa nomor pelanggan.';
  } finally {
    inquiryLoading.value = false;
  }
}

// ============================================
// Postpaid: Step 2 — Bayar Tagihan
// ============================================
async function handlePayPostpaid() {
  if (!inquiryResult.value) return;
  paying.value = true;
  try {
    const code = selectedPostpaidCode.value || products.value[0]?.code || selectedCategory.value?.code || '';
    const result = await createPpobTransaction({
      productCode: code,
      customerId: postpaidNoPelanggan.value,
      type: 'postpaid',
      customerName: inquiryResult.value.nama,
      customerPhone: postpaidPhone.value,
      amount: inquiryResult.value.jumlah_bayar || 0,
      orderId: String(inquiryResult.value.order_id || inquiryResult.value.tagihan_id || inquiryResult.value.id),
    });
    successData.value = result.transaction;
    showSuccess.value = true;
    closeSheet();
    loadRecentTransactions();
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Gagal bayar tagihan.');
  } finally {
    paying.value = false;
  }
}

function closeSuccess() { showSuccess.value = false; successData.value = null; }

// ============================================
// Transactions
// ============================================
async function loadRecentTransactions() {
  if (!shopId.value) return;
  trxLoading.value = true;
  try {
    const r = await listPpobTransactions({ shopId: shopId.value, limit: 5 });
    recentTrx.value = r.data;
    const today = new Date().toISOString().slice(0, 10);
    const tt = r.data.filter(t => t.createdAt.slice(0, 10) === today);
    todayCount.value = tt.length;
    todayRevenue.value = tt.reduce((s, t) => s + (t.fee || 0), 0);
  } catch {
    recentTrx.value = [];
  } finally {
    trxLoading.value = false;
  }
}

// ============================================
// Status helpers
// ============================================
function statusBg(s: string) { return s === 'SUCCESS' ? 'bg-emerald-100 dark:bg-emerald-900/30' : s === 'FAILED' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'; }
function statusColor(s: string) { return s === 'SUCCESS' ? 'text-emerald-600 dark:text-emerald-400' : s === 'FAILED' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'; }
function statusIcon(s: string) { return s === 'SUCCESS' ? CheckIcon : s === 'FAILED' ? XIcon : ClockIcon; }
function statusBadge(s: string) { return s === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : s === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'; }
function formatRupiah(n: number) { return 'Rp ' + n.toLocaleString('id-ID'); }
function formatRupiahShort(n: number) { if (n >= 1_000_000) return 'Rp ' + (n / 1_000_000).toFixed(1) + 'jt'; if (n >= 1_000) return 'Rp ' + (n / 1_000).toFixed(0) + 'rb'; return 'Rp ' + n; }

// ============================================
// Init
// ============================================
onMounted(() => {
  loadCategories();
  loadRecentTransactions();
});
</script>

<style scoped>
.sheet-enter-active,.sheet-leave-active { transition: all .3s ease; }
.sheet-enter-from > div:last-child,.sheet-leave-to > div:last-child { transform: translateY(100%); }
.sheet-enter-from > div:first-child,.sheet-leave-to > div:first-child { opacity: 0; }
.fade-enter-active,.fade-leave-active { transition: opacity .2s; }
.fade-enter-from,.fade-leave-to { opacity: 0; }
</style>
