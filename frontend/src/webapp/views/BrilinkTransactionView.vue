<template>
  <div class="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
    <!-- Top bar -->
    <div class="shrink-0 px-4 py-3 bg-white border-b border-slate-200">
      <h1 class="text-base font-bold text-slate-950">BRILink</h1>
      <p class="text-xs text-slate-500 mt-0.5">Transaksi BRILink — pilih kategori &amp; isi form.</p>
    </div>

    <!-- Saldo rekening BRI -->
    <div
      v-if="accountBalance !== null"
      class="shrink-0 px-4 py-2.5 flex items-center justify-between border-b"
      :class="accountBalance <= lowBalanceThreshold
        ? 'bg-amber-50 border-amber-200'
        : 'bg-emerald-50 border-emerald-100'"
    >
      <div class="flex items-center gap-2 min-w-0">
        <WalletIcon
          class="w-4 h-4 shrink-0"
          :class="accountBalance <= lowBalanceThreshold ? 'text-amber-600' : 'text-emerald-600'"
        />
        <span class="text-xs text-slate-500 truncate">
          Saldo BRI{{ accountLabel ? ` — ${accountLabel}` : '' }}
        </span>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span
          v-if="accountBalance <= lowBalanceThreshold"
          class="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700"
        >
          <AlertTriangleIcon class="w-3 h-3" /> Menipis
        </span>
        <span class="text-sm font-bold font-mono text-slate-900">{{ formatRupiah(accountBalance) }}</span>
      </div>
    </div>

    <!-- Main content -->
    <div class="flex-1 overflow-y-auto p-4 space-y-5">
      <!-- ============================================ -->
      <!-- Category Selector                            -->
      <!-- ============================================ -->
      <div>
        <p class="text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-2">
          Pilih Kategori
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            v-for="cat in BRILINK_CATEGORIES"
            :key="cat"
            type="button"
            :class="[
              'rounded-lg border p-3 text-left transition-colors',
              selectedCategory === cat
                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30',
            ]"
            @click="selectCategory(cat)"
          >
            <span :class="['inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1', categoryBadge(cat)]">
              {{ BRILINK_CATEGORY_LABELS[cat] }}
            </span>
            <p class="text-[10px] text-slate-500 mt-0.5">{{ categoryHint(cat) }}</p>
          </button>
        </div>
      </div>


      <!-- ============================================ -->
      <!-- Transaction Form                             -->
      <!-- ============================================ -->
      <form
        v-if="selectedCategory"
        class="bg-white border border-slate-200 rounded-xl p-5 space-y-4 max-w-lg"
        @submit.prevent="handleSubmit"
      >
        <h2 class="text-sm font-bold text-slate-900">
          {{ BRILINK_CATEGORY_LABELS[selectedCategory] }}
        </h2>

        <!-- Customer Name (with autocomplete) -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Nama Customer <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <input
              v-model="form.customerName"
              type="text"
              required
              placeholder="Ketik nama customer..."
              class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              @input="searchCustomer"
              @focus="showCustomerSuggestions = true"
            />
            <!-- Autocomplete dropdown -->
            <div v-if="showCustomerSuggestions && customerSuggestions.length > 0" class="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-36 overflow-y-auto">
              <button
                v-for="s in customerSuggestions"
                :key="s.id"
                type="button"
                class="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0"
                @click="selectCustomerSuggestion(s)"
              >
                <p class="text-xs font-medium text-slate-800">{{ s.name }}</p>
                <p v-if="s.phone" class="text-[10px] text-slate-400">{{ s.phone }}</p>
              </button>
            </div>
          </div>
        </div>

        <!-- Customer Phone (optional) -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            No. HP Customer <span class="text-slate-400">(opsional)</span>
          </label>
          <input
            v-model="form.customerPhone"
            type="tel"
            placeholder="08xxxxxxxxxx"
            class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <!-- Destination -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Tujuan / No. Rekening <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.destination"
            type="text"
            required
            :placeholder="destinationPlaceholder"
            class="w-full h-9 px-3 text-sm font-mono border border-slate-300 rounded-md
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>


        <!-- Amount -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Nominal <span class="text-red-500">*</span>
          </label>
          <input
            v-model.number="form.amount"
            type="number"
            required
            min="1000"
            step="1000"
            placeholder="100000"
            class="w-full h-9 px-3 text-sm font-mono border border-slate-300 rounded-md
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            @input="calculateFee"
          />
        </div>

        <!-- Fee display -->
        <div v-if="form.amount > 0" class="bg-slate-50 rounded-lg p-3 space-y-1.5">
          <div class="flex justify-between text-xs">
            <span class="text-slate-500">Nominal</span>
            <span class="font-mono text-slate-900">{{ formatRupiah(form.amount) }}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-500">Fee</span>
            <span class="font-mono text-emerald-600">{{ formatRupiah(calculatedFee) }}</span>
          </div>
          <div class="flex justify-between text-sm font-bold border-t border-slate-200 pt-1.5">
            <span class="text-slate-700">Total</span>
            <span class="font-mono text-slate-950">{{ formatRupiah(form.amount + calculatedFee) }}</span>
          </div>
        </div>

        <!-- Insufficient balance warning -->
        <div
          v-if="insufficientBalance"
          class="bg-amber-50 border border-amber-200 rounded-md p-2 flex items-start gap-2 text-xs text-amber-800"
        >
          <AlertTriangleIcon class="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Nominal melebihi saldo rekening BRI ({{ formatRupiah(accountBalance ?? 0) }}).
            Lakukan setor saldo dulu sebelum transaksi.
          </span>
        </div>

        <!-- Error -->
        <div
          v-if="submitError"
          class="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700"
        >
          {{ submitError }}
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="submitting || insufficientBalance"
          class="w-full h-11 bg-blue-600 text-white text-sm font-bold rounded-lg
                 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                 flex items-center justify-center gap-2"
        >
          <Loader2Icon v-if="submitting" class="w-4 h-4 animate-spin" />
          <SendIcon v-else class="w-4 h-4" />
          {{ submitting ? 'Memproses...' : 'Proses Transaksi' }}
        </button>
      </form>

      <!-- No category selected -->
      <div
        v-if="!selectedCategory"
        class="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center max-w-lg"
      >
        <WalletIcon class="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p class="text-sm font-semibold text-slate-700">Pilih kategori di atas</p>
        <p class="text-xs text-slate-500 mt-1">Untuk memulai transaksi BRILink.</p>
      </div>
    </div>


    <!-- ============================================ -->
    <!-- Success Receipt Modal                        -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showReceipt && receiptData" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50"></div>
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <div class="text-center">
            <div class="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircleIcon class="w-7 h-7 text-emerald-600" />
            </div>
            <h2 class="text-base font-bold text-slate-950">Transaksi Berhasil!</h2>
            <code class="text-xs font-mono text-slate-500">{{ receiptData.refNumber }}</code>
          </div>

          <div class="bg-slate-50 rounded-lg p-4 space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-slate-500">Kategori</span>
              <span class="font-bold text-slate-700">{{ BRILINK_CATEGORY_LABELS[receiptData.category] }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-500">Customer</span>
              <span class="font-semibold text-slate-900">{{ receiptData.customerName }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-500">Tujuan</span>
              <span class="font-mono text-slate-700">{{ receiptData.destination }}</span>
            </div>
            <div class="border-t border-slate-200 pt-2 flex justify-between text-xs">
              <span class="text-slate-500">Nominal</span>
              <span class="font-mono text-slate-900">{{ formatRupiah(receiptData.amount) }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-500">Fee</span>
              <span class="font-mono text-emerald-600">{{ formatRupiah(receiptData.fee) }}</span>
            </div>
            <div class="flex justify-between text-sm font-bold border-t border-slate-200 pt-2">
              <span class="text-slate-700">Total</span>
              <span class="font-mono text-slate-950">{{ formatRupiah(receiptData.total) }}</span>
            </div>
          </div>

          <!-- Print status -->
          <p
            v-if="printMsg"
            class="text-center text-xs"
            :class="printMsg.includes('tercetak') ? 'text-emerald-600' : 'text-slate-500'"
          >
            {{ printMsg }}
          </p>

          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              :disabled="printing"
              class="h-10 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg
                     hover:bg-slate-50 transition-colors disabled:opacity-50
                     flex items-center justify-center gap-1.5"
              @click="handlePrintBrilinkReceipt"
            >
              <Loader2Icon v-if="printing" class="w-4 h-4 animate-spin" />
              <PrinterIcon v-else class="w-4 h-4" />
              Cetak Struk
            </button>
            <button
              type="button"
              class="h-10 bg-blue-600 text-white text-sm font-semibold rounded-lg
                     hover:bg-blue-700 transition-colors"
              @click="closeReceipt"
            >
              Transaksi Baru
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>


<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  Loader2 as Loader2Icon,
  Send as SendIcon,
  Wallet as WalletIcon,
  CheckCircle2 as CheckCircleIcon,
  Printer as PrinterIcon,
  AlertTriangle as AlertTriangleIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import brilinkAccountService from '@/shared/services/brilink-account.service';
import brilinkService, {
  BRILINK_CATEGORY_LABELS,
  BRILINK_CATEGORIES,
  type BrilinkCategory,
  type BrilinkFeeDto,
  type CreateBrilinkTransactionPayload,
} from '@/shared/services/brilink.service';

const authStore = useAuthStore();
const shopStore = useShopStore();
const route = useRoute();

// ============================================
// State
// ============================================
const selectedCategory = ref<BrilinkCategory | null>(null);
const feeRules = ref<BrilinkFeeDto[]>([]);
const calculatedFee = ref(0);
const submitting = ref(false);
const submitError = ref<string | null>(null);
const showReceipt = ref(false);

// BRI account (saldo) state
const accountBalance = ref<number | null>(null);
const accountLabel = ref('');
const lowBalanceThreshold = ref(0);

// Print state
const printing = ref(false);
const printMsg = ref<string | null>(null);

const form = reactive({
  customerName: '',
  customerPhone: '',
  destination: '',
  amount: 0,
});

// Customer autocomplete
const customerSuggestions = ref<{ id: string; name: string; phone: string | null }[]>([]);
const showCustomerSuggestions = ref(false);
let customerSearchTimer: any = null;

function searchCustomer() {
  showCustomerSuggestions.value = true;
  const q = form.customerName.trim();
  if (q.length < 2) {
    customerSuggestions.value = [];
    return;
  }
  clearTimeout(customerSearchTimer);
  customerSearchTimer = setTimeout(async () => {
    try {
      const shopId = authStore.user?.shopId ?? shopStore.currentShopId ?? '';
      const { data } = await (await import('@/shared/services/api')).default.get('/customers/autocomplete', { params: { shopId, q } });
      customerSuggestions.value = data;
    } catch {
      customerSuggestions.value = [];
    }
  }, 300);
}

function selectCustomerSuggestion(c: { id: string; name: string; phone: string | null }) {
  form.customerName = c.name;
  form.customerPhone = c.phone || '';
  showCustomerSuggestions.value = false;
  customerSuggestions.value = [];
}

interface ReceiptInfo {
  refNumber: string;
  category: BrilinkCategory;
  customerName: string;
  destination: string;
  amount: number;
  fee: number;
  total: number;
  date: string;
}
const receiptData = ref<ReceiptInfo | null>(null);

const insufficientBalance = computed(
  () =>
    accountBalance.value !== null &&
    form.amount > 0 &&
    form.amount > accountBalance.value,
);


// ============================================
// Helpers
// ============================================

function getShopId(): string {
  return authStore.user?.shopId ?? shopStore.currentShopId ?? '';
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function categoryBadge(category: BrilinkCategory): string {
  switch (category) {
    case 'TRANSFER_BRI': return 'bg-blue-100 text-blue-700';
    case 'TRANSFER_OTHER': return 'bg-indigo-100 text-indigo-700';
    case 'TARIK_TUNAI': return 'bg-amber-100 text-amber-700';
    case 'TOPUP_PULSA': return 'bg-pink-100 text-pink-700';
    case 'TOPUP_DATA': return 'bg-purple-100 text-purple-700';
    case 'TOPUP_EWALLET': return 'bg-cyan-100 text-cyan-700';
    case 'TOPUP_PLN': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-slate-100 text-slate-700';
  }
}

function categoryHint(category: BrilinkCategory): string {
  switch (category) {
    case 'TRANSFER_BRI': return 'Sesama BRI';
    case 'TRANSFER_OTHER': return 'Antar bank';
    case 'TARIK_TUNAI': return 'Penarikan tunai';
    case 'TOPUP_PULSA': return 'Pulsa HP';
    case 'TOPUP_DATA': return 'Paket data';
    case 'TOPUP_EWALLET': return 'OVO, GoPay, dll';
    case 'TOPUP_PLN': return 'Token listrik';
    default: return '';
  }
}

const destinationPlaceholder = computed(() => {
  if (!selectedCategory.value) return '';
  switch (selectedCategory.value) {
    case 'TRANSFER_BRI':
    case 'TRANSFER_OTHER': return 'No. rekening tujuan';
    case 'TARIK_TUNAI': return 'No. rekening nasabah';
    case 'TOPUP_PULSA':
    case 'TOPUP_DATA': return 'No. HP tujuan';
    case 'TOPUP_EWALLET': return 'No. HP / ID akun';
    case 'TOPUP_PLN': return 'No. meter / ID pelanggan';
    default: return 'Tujuan';
  }
});


// ============================================
// Methods
// ============================================

async function selectCategory(cat: BrilinkCategory) {
  selectedCategory.value = cat;
  form.customerName = '';
  form.customerPhone = '';
  form.destination = '';
  form.amount = 0;
  calculatedFee.value = 0;
  submitError.value = null;

  // Load fee rules for this shop
  const shopId = getShopId();
  if (shopId) {
    try {
      feeRules.value = await brilinkService.listFees(shopId);
    } catch {
      feeRules.value = [];
    }
  }
}

function calculateFee() {
  if (!selectedCategory.value || !form.amount || form.amount <= 0) {
    calculatedFee.value = 0;
    return;
  }

  // Find matching fee rule for current category + amount
  const matchingRule = feeRules.value.find(
    (rule) =>
      rule.isActive &&
      rule.category === selectedCategory.value &&
      form.amount >= rule.minAmount &&
      form.amount <= rule.maxAmount,
  );

  if (matchingRule) {
    if (matchingRule.feeType === 'FLAT') {
      calculatedFee.value = matchingRule.feeAmount;
    } else {
      calculatedFee.value = Math.round((form.amount * matchingRule.feePercent) / 100);
    }
  } else {
    calculatedFee.value = 0;
  }
}

async function handleSubmit() {
  if (!selectedCategory.value) return;

  submitting.value = true;
  submitError.value = null;

  try {
    const payload: CreateBrilinkTransactionPayload = {
      category: selectedCategory.value,
      customerName: form.customerName,
      customerPhone: form.customerPhone || undefined,
      destination: form.destination,
      amount: form.amount,
    };

    const response = await brilinkService.createTransaction(payload);

    receiptData.value = {
      refNumber: response.summary.refNumber,
      category: response.summary.category,
      customerName: response.summary.customerName,
      destination: response.summary.destination,
      amount: response.summary.amount,
      fee: response.summary.fee,
      total: response.summary.total,
      date: new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    // Reflect the debited BRI balance returned by the backend
    if (response.account) {
      accountBalance.value = response.account.balance;
      lowBalanceThreshold.value = response.account.lowBalanceThreshold;
      accountLabel.value = response.account.label;
    }

    printMsg.value = null;
    showReceipt.value = true;
  } catch (err: any) {
    submitError.value = err.response?.data?.message ?? err.message ?? 'Gagal memproses transaksi.';
  } finally {
    submitting.value = false;
  }
}

async function handlePrintBrilinkReceipt() {
  if (!receiptData.value) return;
  printing.value = true;
  printMsg.value = null;
  try {
    const { thermalPrint } = await import('@/shared/services/thermal-print.service');
    if (!thermalPrint.isConnected) {
      printMsg.value = 'Mencari printer Bluetooth...';
      await thermalPrint.connect();
    }
    await thermalPrint.printBrilinkReceipt({
      shopName: shopStore.currentShopName || 'Toko',
      refNumber: receiptData.value.refNumber,
      date: receiptData.value.date,
      cashierName: authStore.user?.username || 'Kasir',
      category: BRILINK_CATEGORY_LABELS[receiptData.value.category],
      customerName: receiptData.value.customerName,
      destination: receiptData.value.destination,
      amount: receiptData.value.amount,
      fee: receiptData.value.fee,
      total: receiptData.value.total,
    });
    printMsg.value = `Struk tercetak ke ${thermalPrint.deviceName}`;
  } catch (err: any) {
    if (err?.message?.includes('cancelled') || err?.message?.includes('NotFound')) {
      printMsg.value = 'Pairing printer dibatalkan.';
    } else {
      printMsg.value = err?.message || 'Gagal cetak. Pastikan printer menyala & gunakan Chrome/Edge.';
    }
  } finally {
    printing.value = false;
  }
}

function closeReceipt() {
  showReceipt.value = false;
  receiptData.value = null;
  selectedCategory.value = null;
  form.customerName = '';
  form.customerPhone = '';
  form.destination = '';
  form.amount = 0;
  calculatedFee.value = 0;
  printing.value = false;
  printMsg.value = null;
}

async function loadAccountBalance() {
  const shopId = getShopId();
  if (!shopId) return;
  try {
    const accounts = await brilinkAccountService.list(shopId);
    const account =
      accounts.find((a) => a.isDefault && a.isActive) ??
      accounts.find((a) => a.isActive) ??
      accounts[0];
    if (account) {
      accountBalance.value = account.balance;
      lowBalanceThreshold.value = account.lowBalanceThreshold;
      accountLabel.value = account.label;
    }
  } catch {
    /* ignore */
  }
}

onMounted(() => {
  loadAccountBalance();

  // Preselect category from ?cat= query param sent by the BRILink menu.
  const cat = route.query.cat;
  if (typeof cat === 'string' && (BRILINK_CATEGORIES as string[]).includes(cat)) {
    selectCategory(cat as BrilinkCategory);
  }
});
</script>
