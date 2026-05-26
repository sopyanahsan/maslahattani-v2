<template>
  <div class="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
    <!-- Top bar -->
    <div class="shrink-0 px-4 py-3 bg-white border-b border-slate-200">
      <h1 class="text-base font-bold text-slate-950">BRILink</h1>
      <p class="text-xs text-slate-500 mt-0.5">Transaksi BRILink — pilih kategori &amp; isi form.</p>
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

        <!-- Customer Name -->
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Nama Customer <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.customerName"
            type="text"
            required
            placeholder="Nama lengkap customer"
            class="w-full h-9 px-3 text-sm border border-slate-300 rounded-md
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
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
          :disabled="submitting"
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

          <button
            type="button"
            class="w-full h-10 bg-blue-600 text-white text-sm font-semibold rounded-lg
                   hover:bg-blue-700 transition-colors"
            @click="closeReceipt"
          >
            Transaksi Baru
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>


<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import {
  Loader2 as Loader2Icon,
  Send as SendIcon,
  Wallet as WalletIcon,
  CheckCircle2 as CheckCircleIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import brilinkService, {
  BRILINK_CATEGORY_LABELS,
  BRILINK_CATEGORIES,
  type BrilinkCategory,
  type BrilinkFeeDto,
  type CreateBrilinkTransactionPayload,
} from '@/shared/services/brilink.service';

const authStore = useAuthStore();

// ============================================
// State
// ============================================
const selectedCategory = ref<BrilinkCategory | null>(null);
const feeRules = ref<BrilinkFeeDto[]>([]);
const calculatedFee = ref(0);
const submitting = ref(false);
const submitError = ref<string | null>(null);
const showReceipt = ref(false);

const form = reactive({
  customerName: '',
  customerPhone: '',
  destination: '',
  amount: 0,
});

interface ReceiptInfo {
  refNumber: string;
  category: BrilinkCategory;
  customerName: string;
  destination: string;
  amount: number;
  fee: number;
  total: number;
}
const receiptData = ref<ReceiptInfo | null>(null);


// ============================================
// Helpers
// ============================================

function getShopId(): string {
  return authStore.user?.shopId ?? '';
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
    };
    showReceipt.value = true;
  } catch (err: any) {
    submitError.value = err.response?.data?.message ?? err.message ?? 'Gagal memproses transaksi.';
  } finally {
    submitting.value = false;
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
}
</script>
