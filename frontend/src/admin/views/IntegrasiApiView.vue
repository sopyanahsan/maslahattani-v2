<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-xl font-bold text-slate-950 dark:text-slate-100">Integrasi API</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        Kelola koneksi API pihak ketiga — Tripay PPOB, dan integrasi lainnya.
      </p>
    </div>

    <!-- Tab switcher -->
    <div class="border-b border-slate-200 dark:border-slate-800 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
      <nav class="flex gap-1 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          :class="[
            'px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 shrink-0',
            activeTab === tab.value
              ? 'border-blue-600 text-blue-700 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100',
          ]"
          @click="activeTab = tab.value"
        >
          <component :is="tab.icon" class="w-3.5 h-3.5" />
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2Icon class="w-5 h-5 animate-spin text-slate-400" />
      <span class="ml-2 text-sm text-slate-500 dark:text-slate-400">Memuat konfigurasi...</span>
    </div>

    <template v-else>
      <!-- TAB: TRIPAY PPOB -->
      <section v-if="activeTab === 'tripay'" class="space-y-4">
        <!-- Status Card -->
        <div :class="['rounded-xl border p-4 flex items-center gap-4', config.isActive ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800']">
          <div :class="['w-10 h-10 rounded-full flex items-center justify-center', config.isActive ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-slate-100 dark:bg-slate-800']">
            <PlugIcon :class="['w-5 h-5', config.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400']" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold" :class="config.isActive ? 'text-emerald-800 dark:text-emerald-200' : 'text-slate-700 dark:text-slate-300'">
              {{ config.isActive ? 'Tripay Aktif' : 'Tripay Belum Aktif' }}
            </p>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ config.isActive ? `Mode: ${config.mode} — Merchant: ${config.merchantCode}` : 'Masukkan kredensial API untuk mengaktifkan PPOB.' }}
            </p>
            <p v-if="config.lastVerifiedAt" class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              Terakhir diverifikasi: {{ formatDate(config.lastVerifiedAt) }}
            </p>
          </div>
          <span :class="['px-2 py-1 text-[10px] font-bold uppercase rounded-full', config.isActive ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400']">
            {{ config.isActive ? 'AKTIF' : 'NONAKTIF' }}
          </span>
        </div>

        <!-- Saldo Deposit Card -->
        <div v-if="config.isActive" class="rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <WalletIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p class="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Saldo Deposit Tripay</p>
                <div v-if="saldoLoading" class="h-6 w-28 rounded bg-blue-200/50 dark:bg-blue-800/50 animate-pulse mt-0.5" />
                <p v-else class="text-xl font-bold text-blue-900 dark:text-blue-100 font-mono leading-tight">
                  {{ saldo !== null ? formatRupiahFull(saldo) : '—' }}
                </p>
              </div>
            </div>
            <button
              type="button"
              :disabled="saldoLoading"
              class="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-800/50 text-blue-600 dark:text-blue-400 transition-colors disabled:opacity-50"
              title="Refresh saldo"
              @click="loadSaldo"
            >
              <RefreshCwIcon :class="['w-4 h-4', saldoLoading && 'animate-spin']" />
            </button>
          </div>
          <p v-if="saldoError" class="text-[10px] text-red-600 dark:text-red-400 mt-2">{{ saldoError }}</p>
          <p v-else-if="saldo !== null && saldo < 50000" class="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-2 flex items-center gap-1">
            <AlertTriangleIcon class="w-3 h-3" /> Saldo rendah! Segera top-up deposit Tripay.
          </p>
        </div>

        <!-- Config Form -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <KeyIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" /> Kredensial Tripay API
            </h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Dapatkan dari <a href="https://tripay.co.id" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">tripay.co.id</a> → Menu Developer.
            </p>
          </div>

          <form class="p-5 space-y-4" @submit.prevent="handleSaveConfig">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">API Key</label>
                <input v-model="form.apiKey" type="password" placeholder="DEV-xxxxxxxx" class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Private Key</label>
                <input v-model="form.privateKey" type="password" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Merchant Code</label>
                <input v-model="form.merchantCode" type="text" placeholder="T12345" class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">PIN Transaksi</label>
                <input v-model="form.pin" type="password" placeholder="4 digit" maxlength="4" class="w-full h-9 px-3 text-sm font-mono border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mode</label>
                <select v-model="form.mode" class="w-full h-9 px-3 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
                  <option value="sandbox">Sandbox (Testing)</option>
                  <option value="production">Production (Live)</option>
                </select>
              </div>
            </div>

            <!-- Toggle active -->
            <div class="flex items-center gap-3 pt-2">
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="form.isActive" type="checkbox" class="sr-only peer" />
                <div class="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
              </label>
              <span class="text-xs font-medium text-slate-700 dark:text-slate-300">Aktifkan Integrasi Tripay</span>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button type="submit" :disabled="saving" class="inline-flex items-center gap-2 px-4 h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                <Loader2Icon v-if="saving" class="w-3.5 h-3.5 animate-spin" />
                <SaveIcon v-else class="w-3.5 h-3.5" />
                Simpan Konfigurasi
              </button>
              <button type="button" :disabled="verifying" class="inline-flex items-center gap-2 px-4 h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50" @click="handleVerify">
                <Loader2Icon v-if="verifying" class="w-3.5 h-3.5 animate-spin" />
                <CheckCircleIcon v-else class="w-3.5 h-3.5" />
                Verifikasi Koneksi
              </button>
            </div>

            <div v-if="feedback" :class="['text-xs font-medium p-3 rounded-lg', feedbackClass]">{{ feedback }}</div>
          </form>
        </div>

        <!-- PPOB Categories Info -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ZapIcon class="w-4 h-4 text-amber-500" /> Layanan PPOB Tersedia
            </h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Setelah Tripay aktif, kasir bisa akses layanan ini dari menu PPOB di webapp.</p>
          </div>
          <div class="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <div v-for="cat in ppobCategories" :key="cat.code" class="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <div class="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <component :is="getCategoryIcon(cat.icon)" class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p class="text-[10px] font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight">{{ cat.label }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- TAB: WEBHOOK -->
      <section v-if="activeTab === 'webhook'" class="space-y-4">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center">
          <div class="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
            <WebhookIcon class="w-7 h-7 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 class="text-sm font-bold text-slate-700 dark:text-slate-300">Webhook & Callback</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            URL callback Tripay untuk update status transaksi otomatis. Set di panel Tripay:
          </p>
          <div class="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <code class="text-[11px] font-mono text-slate-800 dark:text-slate-200">{{ callbackUrl }}</code>
            <button type="button" class="p-1 text-slate-400 hover:text-blue-600 transition-colors" @click="copyCallback">
              <CopyIcon class="w-3.5 h-3.5" />
            </button>
          </div>
          <p v-if="copied" class="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Tersalin!</p>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  Loader2 as Loader2Icon,
  Plug as PlugIcon,
  Key as KeyIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Zap as ZapIcon,
  Smartphone as SmartphoneIcon,
  Wifi as WifiIcon,
  Droplets as DropletsIcon,
  HeartPulse as HeartPulseIcon,
  Tv as TvIcon,
  Wallet as WalletIcon,
  Gamepad2 as Gamepad2Icon,
  Phone as PhoneIcon,
  Webhook as WebhookIcon,
  Copy as CopyIcon,
  RefreshCw as RefreshCwIcon,
  AlertTriangle as AlertTriangleIcon,
} from 'lucide-vue-next';
import { useShopStore } from '@/shared/stores/shop.store';
import {
  getTripayConfig,
  saveTripayConfig,
  verifyTripayConfig,
  getTripayBalance,
  type TripayConfig,
  type PpobCategory,
} from '@/shared/services/tripay.service';

const shopStore = useShopStore();
const shopId = computed(() => shopStore.currentShopId || '');

const tabs = [
  { value: 'tripay', label: 'Tripay PPOB', icon: ZapIcon },
  { value: 'webhook', label: 'Webhook', icon: WebhookIcon },
];
const activeTab = ref('tripay');

const loading = ref(true);
const saving = ref(false);
const verifying = ref(false);
const feedback = ref('');
const feedbackType = ref<'success' | 'error'>('success');
const feedbackClass = computed(() =>
  feedbackType.value === 'success'
    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
    : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800',
);

const config = ref<TripayConfig>({ apiKey: '', privateKey: '', merchantCode: '', mode: 'sandbox', isActive: false, lastVerifiedAt: null });
const form = ref({ apiKey: '', privateKey: '', merchantCode: '', pin: '', mode: 'sandbox' as 'sandbox' | 'production', isActive: false });

const ppobCategories: PpobCategory[] = [
  { code: 'pulsa', label: 'Pulsa', icon: 'smartphone', color: 'pink' },
  { code: 'paket-data', label: 'Paket Data', icon: 'wifi', color: 'purple' },
  { code: 'pln', label: 'Token PLN', icon: 'zap', color: 'yellow' },
  { code: 'pln-postpaid', label: 'Tagihan Listrik', icon: 'zap', color: 'amber' },
  { code: 'pdam', label: 'PDAM', icon: 'droplets', color: 'blue' },
  { code: 'bpjs', label: 'BPJS', icon: 'heart-pulse', color: 'green' },
  { code: 'internet', label: 'Internet & TV', icon: 'tv', color: 'indigo' },
  { code: 'emoney', label: 'E-Money', icon: 'wallet', color: 'cyan' },
  { code: 'voucher-game', label: 'Voucher Game', icon: 'gamepad-2', color: 'red' },
  { code: 'telkom', label: 'Telkom/IndiHome', icon: 'phone', color: 'teal' },
];

function getCategoryIcon(icon: string) {
  const map: Record<string, any> = { smartphone: SmartphoneIcon, wifi: WifiIcon, zap: ZapIcon, droplets: DropletsIcon, 'heart-pulse': HeartPulseIcon, tv: TvIcon, wallet: WalletIcon, 'gamepad-2': Gamepad2Icon, phone: PhoneIcon };
  return map[icon] || ZapIcon;
}

const callbackUrl = computed(() => {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  return `${base}/tripay/callback`;
});
const copied = ref(false);
function copyCallback() {
  navigator.clipboard.writeText(callbackUrl.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

async function loadConfig() {
  loading.value = true;
  try {
    const data = await getTripayConfig(shopId.value);
    config.value = data;
    form.value = { apiKey: '', privateKey: '', merchantCode: data.merchantCode || '', pin: '', mode: data.mode || 'sandbox', isActive: data.isActive };
  } catch { /* defaults */ } finally { loading.value = false; }
}

async function handleSaveConfig() {
  if (!form.value.apiKey || !form.value.privateKey || !form.value.merchantCode || !form.value.pin) {
    feedback.value = 'Semua field wajib diisi (termasuk PIN transaksi).'; feedbackType.value = 'error'; return;
  }
  saving.value = true; feedback.value = '';
  try {
    await saveTripayConfig(form.value);
    feedback.value = 'Konfigurasi berhasil disimpan!'; feedbackType.value = 'success';
    await loadConfig();
  } catch (err: any) {
    feedback.value = err?.response?.data?.message || 'Gagal menyimpan.'; feedbackType.value = 'error';
  } finally { saving.value = false; }
}

async function handleVerify() {
  verifying.value = true; feedback.value = '';
  try {
    const result = await verifyTripayConfig();
    feedback.value = result.message || 'Koneksi berhasil!'; feedbackType.value = 'success';
    await loadConfig();
  } catch (err: any) {
    feedback.value = err?.response?.data?.message || 'Verifikasi gagal.'; feedbackType.value = 'error';
  } finally { verifying.value = false; }
}

function formatDate(d: string) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ============================================
// Saldo Deposit Tripay
// ============================================
const saldo = ref<number | null>(null);
const saldoLoading = ref(false);
const saldoError = ref('');

async function loadSaldo() {
  if (!shopId.value || !config.value.isActive) return;
  saldoLoading.value = true;
  saldoError.value = '';
  try {
    const data = await getTripayBalance(shopId.value);
    // Tripay returns saldo as number or in data object
    saldo.value = typeof data === 'number' ? data : (data?.saldo ?? data?.balance ?? data ?? null);
  } catch (err: any) {
    saldoError.value = err?.response?.data?.message || 'Gagal memuat saldo.';
    saldo.value = null;
  } finally {
    saldoLoading.value = false;
  }
}

function formatRupiahFull(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

onMounted(() => {
  loadConfig().then(() => {
    if (config.value.isActive) loadSaldo();
  });
});
</script>
