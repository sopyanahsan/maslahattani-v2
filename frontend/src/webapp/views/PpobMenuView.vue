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

    <!-- Category Grid -->
    <div class="px-4 -mt-3 relative z-20">
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        <p class="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">Pilih Layanan</p>
        <div class="grid grid-cols-4 sm:grid-cols-5 gap-3">
          <button v-for="cat in categories" :key="cat.code" type="button" class="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all" @click="selectCategory(cat)">
            <div :class="['w-10 h-10 rounded-full flex items-center justify-center', catBg(cat.color)]">
              <component :is="getCatIcon(cat.icon)" :class="['w-5 h-5', catText(cat.color)]" />
            </div>
            <p class="text-[10px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">{{ cat.label }}</p>
          </button>
        </div>
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

    <!-- Product Bottom Sheet -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="showSheet" class="fixed inset-0 z-50">
          <div class="absolute inset-0 bg-black/50" @click="closeSheet" />
          <div class="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden">
            <div class="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div class="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto mb-3" />
              <div class="flex items-center gap-3">
                <div :class="['w-9 h-9 rounded-full flex items-center justify-center', catBg(selectedCategory?.color || 'blue')]">
                  <component :is="getCatIcon(selectedCategory?.icon || 'zap')" :class="['w-4.5 h-4.5', catText(selectedCategory?.color || 'blue')]" />
                </div>
                <div>
                  <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ selectedCategory?.label }}</h2>
                  <p class="text-[10px] text-slate-500 dark:text-slate-400">Pilih produk atau masukkan nomor</p>
                </div>
                <button type="button" class="ml-auto p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" @click="closeSheet"><XIcon class="w-4 h-4 text-slate-400" /></button>
              </div>
            </div>
            <!-- Input -->
            <div class="px-5 pt-4 pb-3 shrink-0">
              <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Nomor Pelanggan / Tujuan</label>
              <div class="flex gap-2">
                <input v-model="inputCustomerId" type="text" inputmode="numeric" placeholder="Masukkan nomor..." class="flex-1 h-10 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" @keyup.enter="handleInquiry" />
                <button type="button" :disabled="!inputCustomerId || inquiryLoading" class="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 flex items-center gap-1.5" @click="handleInquiry">
                  <Loader2Icon v-if="inquiryLoading" class="w-3.5 h-3.5 animate-spin" /><SearchIcon v-else class="w-3.5 h-3.5" /> Cek
                </button>
              </div>
            </div>
            <!-- Inquiry Result -->
            <div v-if="inquiryResult" class="px-5 pb-3 shrink-0">
              <div class="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3">
                <p class="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase mb-1">Detail Tagihan</p>
                <div class="grid grid-cols-2 gap-1.5">
                  <div><p class="text-[9px] text-slate-500">Nama</p><p class="text-xs font-semibold text-slate-800 dark:text-slate-200">{{ inquiryResult.customer_name || '-' }}</p></div>
                  <div><p class="text-[9px] text-slate-500">Nominal</p><p class="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">{{ formatRupiah(inquiryResult.amount || 0) }}</p></div>
                </div>
              </div>
            </div>
            <!-- Products -->
            <div class="flex-1 overflow-y-auto px-5 pb-5">
              <p class="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 sticky top-0 bg-white dark:bg-slate-900 py-1">Produk Tersedia</p>
              <div v-if="productsLoading" class="space-y-2"><div v-for="i in 5" :key="i" class="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" /></div>
              <div v-else-if="products.length === 0" class="text-center py-8"><p class="text-xs text-slate-400">Tidak ada produk.</p></div>
              <div v-else class="space-y-2">
                <button v-for="prod in products" :key="prod.code" type="button" :class="['w-full text-left px-3.5 py-3 rounded-xl border transition-all active:scale-[0.98]', selectedProduct?.code === prod.code ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 ring-1 ring-indigo-300' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900']" @click="selectProduct(prod)">
                  <div class="flex items-center justify-between">
                    <div class="min-w-0 flex-1"><p class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{{ prod.name }}</p><p class="text-[10px] text-slate-500">{{ prod.code }}</p></div>
                    <div class="text-right shrink-0 ml-3"><p class="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">{{ formatRupiah(prod.price) }}</p></div>
                  </div>
                </button>
              </div>
            </div>
            <!-- Pay -->
            <div v-if="selectedProduct" class="shrink-0 px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div class="flex items-center justify-between mb-2">
                <p class="text-xs text-slate-600 dark:text-slate-400">Total:</p>
                <p class="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">{{ formatRupiah((selectedProduct.price || 0) + (selectedProduct.fee || 0)) }}</p>
              </div>
              <button type="button" :disabled="!inputCustomerId || paying" class="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2" @click="handlePay">
                <Loader2Icon v-if="paying" class="w-4 h-4 animate-spin" /><SendIcon v-else class="w-4 h-4" /> Bayar Sekarang
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Success Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showSuccess" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50" @click="closeSuccess" />
          <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div class="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4"><CheckCircleIcon class="w-8 h-8 text-emerald-600 dark:text-emerald-400" /></div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Transaksi Berhasil!</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">{{ successData?.productCode }} — {{ successData?.customerId }}</p>
            <p v-if="successData?.serialNumber" class="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg mb-3 select-all">SN: {{ successData.serialNumber }}</p>
            <p class="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">{{ formatRupiah(successData?.total || 0) }}</p>
            <button type="button" class="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl" @click="closeSuccess">Selesai</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ChevronLeft as ChevronLeftIcon, Zap as ZapIcon, Smartphone as SmartphoneIcon, Wifi as WifiIcon, Droplets as DropletsIcon, HeartPulse as HeartPulseIcon, Tv as TvIcon, Wallet as WalletIcon, Gamepad2 as Gamepad2Icon, Phone as PhoneIcon, ReceiptText as ReceiptTextIcon, X as XIcon, Search as SearchIcon, Loader2 as Loader2Icon, Send as SendIcon, CheckCircle as CheckCircleIcon, Check as CheckIcon, Clock as ClockIcon, RotateCcw as RotateCcwIcon } from 'lucide-vue-next';
import { useShopStore } from '@/shared/stores/shop.store';
import { getPpobProducts, ppobInquiry, createPpobTransaction, listPpobTransactions, type PpobCategory, type PpobProduct, type PpobTransaction } from '@/shared/services/tripay.service';

const shopStore = useShopStore();
const shopId = computed(() => shopStore.currentShopId || '');

const categories: PpobCategory[] = [
  { code: 'pulsa', label: 'Pulsa', icon: 'smartphone', color: 'pink' },
  { code: 'paket-data', label: 'Paket Data', icon: 'wifi', color: 'purple' },
  { code: 'pln', label: 'Token PLN', icon: 'zap', color: 'yellow' },
  { code: 'pln-postpaid', label: 'Listrik', icon: 'zap', color: 'amber' },
  { code: 'pdam', label: 'PDAM', icon: 'droplets', color: 'blue' },
  { code: 'bpjs', label: 'BPJS', icon: 'heart-pulse', color: 'green' },
  { code: 'internet', label: 'Internet', icon: 'tv', color: 'indigo' },
  { code: 'emoney', label: 'E-Money', icon: 'wallet', color: 'cyan' },
  { code: 'voucher-game', label: 'Game', icon: 'gamepad-2', color: 'red' },
  { code: 'telkom', label: 'Telkom', icon: 'phone', color: 'teal' },
];

function getCatIcon(icon: string) { const m: Record<string,any> = { smartphone: SmartphoneIcon, wifi: WifiIcon, zap: ZapIcon, droplets: DropletsIcon, 'heart-pulse': HeartPulseIcon, tv: TvIcon, wallet: WalletIcon, 'gamepad-2': Gamepad2Icon, phone: PhoneIcon }; return m[icon] || ZapIcon; }
function catBg(c: string) { const m: Record<string,string> = { pink:'bg-pink-100 dark:bg-pink-900/30', purple:'bg-purple-100 dark:bg-purple-900/30', yellow:'bg-yellow-100 dark:bg-yellow-900/30', amber:'bg-amber-100 dark:bg-amber-900/30', blue:'bg-blue-100 dark:bg-blue-900/30', green:'bg-green-100 dark:bg-green-900/30', indigo:'bg-indigo-100 dark:bg-indigo-900/30', cyan:'bg-cyan-100 dark:bg-cyan-900/30', red:'bg-red-100 dark:bg-red-900/30', teal:'bg-teal-100 dark:bg-teal-900/30' }; return m[c] || 'bg-slate-100 dark:bg-slate-800'; }
function catText(c: string) { const m: Record<string,string> = { pink:'text-pink-600 dark:text-pink-400', purple:'text-purple-600 dark:text-purple-400', yellow:'text-yellow-600 dark:text-yellow-400', amber:'text-amber-600 dark:text-amber-400', blue:'text-blue-600 dark:text-blue-400', green:'text-green-600 dark:text-green-400', indigo:'text-indigo-600 dark:text-indigo-400', cyan:'text-cyan-600 dark:text-cyan-400', red:'text-red-600 dark:text-red-400', teal:'text-teal-600 dark:text-teal-400' }; return m[c] || 'text-slate-600'; }

const todayCount = ref(0);
const todayRevenue = ref(0);
const trxLoading = ref(false);
const recentTrx = ref<PpobTransaction[]>([]);
const showSheet = ref(false);
const selectedCategory = ref<PpobCategory | null>(null);
const productsLoading = ref(false);
const products = ref<PpobProduct[]>([]);
const selectedProduct = ref<PpobProduct | null>(null);
const inputCustomerId = ref('');
const inquiryLoading = ref(false);
const inquiryResult = ref<any>(null);
const paying = ref(false);
const showSuccess = ref(false);
const successData = ref<any>(null);

function selectCategory(cat: PpobCategory) { selectedCategory.value = cat; selectedProduct.value = null; inputCustomerId.value = ''; inquiryResult.value = null; showSheet.value = true; loadProducts(cat.code); }
function closeSheet() { showSheet.value = false; selectedCategory.value = null; products.value = []; selectedProduct.value = null; }
async function loadProducts(category: string) { productsLoading.value = true; try { products.value = await getPpobProducts(shopId.value, category); } catch { products.value = []; } finally { productsLoading.value = false; } }
function selectProduct(prod: PpobProduct) { selectedProduct.value = prod; }
async function handleInquiry() { if (!inputCustomerId.value || !selectedCategory.value) return; inquiryLoading.value = true; inquiryResult.value = null; try { const code = selectedProduct.value?.code || selectedCategory.value.code; inquiryResult.value = await ppobInquiry(code, inputCustomerId.value, shopId.value); } catch {} finally { inquiryLoading.value = false; } }
async function handlePay() {
  if (!selectedProduct.value || !inputCustomerId.value) return;
  paying.value = true;
  try {
    const isPostpaid = ['pln-postpaid','pdam','bpjs','internet','telkom'].includes(selectedCategory.value?.code || '');
    const result = await createPpobTransaction({ productCode: selectedProduct.value.code, customerId: inputCustomerId.value, type: isPostpaid ? 'postpaid' : 'prepaid', customerName: inquiryResult.value?.customer_name, amount: selectedProduct.value.price });
    successData.value = result.transaction; showSuccess.value = true; closeSheet(); loadRecentTransactions();
  } catch (err: any) { alert(err?.response?.data?.message || 'Gagal membuat transaksi.'); } finally { paying.value = false; }
}
function closeSuccess() { showSuccess.value = false; successData.value = null; }
async function loadRecentTransactions() {
  if (!shopId.value) return; trxLoading.value = true;
  try { const r = await listPpobTransactions({ shopId: shopId.value, limit: 5 }); recentTrx.value = r.data; const today = new Date().toISOString().slice(0,10); const tt = r.data.filter(t => t.createdAt.slice(0,10) === today); todayCount.value = tt.length; todayRevenue.value = tt.reduce((s,t) => s + (t.fee||0), 0); } catch { recentTrx.value = []; } finally { trxLoading.value = false; }
}

function statusBg(s: string) { return s === 'SUCCESS' ? 'bg-emerald-100 dark:bg-emerald-900/30' : s === 'FAILED' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'; }
function statusColor(s: string) { return s === 'SUCCESS' ? 'text-emerald-600 dark:text-emerald-400' : s === 'FAILED' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'; }
function statusIcon(s: string) { return s === 'SUCCESS' ? CheckIcon : s === 'FAILED' ? XIcon : ClockIcon; }
function statusBadge(s: string) { return s === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : s === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'; }
function formatRupiah(n: number) { return 'Rp ' + n.toLocaleString('id-ID'); }
function formatRupiahShort(n: number) { if (n >= 1_000_000) return 'Rp ' + (n/1_000_000).toFixed(1)+'jt'; if (n >= 1_000) return 'Rp ' + (n/1_000).toFixed(0)+'rb'; return 'Rp '+n; }

onMounted(() => { loadRecentTransactions(); });
</script>
<style scoped>
.sheet-enter-active,.sheet-leave-active { transition: all .3s ease; }
.sheet-enter-from > div:last-child,.sheet-leave-to > div:last-child { transform: translateY(100%); }
.sheet-enter-from > div:first-child,.sheet-leave-to > div:first-child { opacity: 0; }
.fade-enter-active,.fade-leave-active { transition: opacity .2s; }
.fade-enter-from,.fade-leave-to { opacity: 0; }
</style>
