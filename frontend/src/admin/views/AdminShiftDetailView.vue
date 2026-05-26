<template>
  <!-- Mobile blocker -->
  <div class="md:hidden flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
    <div class="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
      <MonitorIcon class="w-8 h-8 text-amber-600" />
    </div>
    <h2 class="text-lg font-bold text-slate-900 mb-2">Layar Terlalu Kecil</h2>
    <p class="text-sm text-slate-600 max-w-xs">
      Gunakan laptop/tablet untuk verifikasi shift.
    </p>
  </div>

  <!-- Desktop/Tablet Content -->
  <div class="hidden md:block space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          class="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center
                 hover:bg-slate-50 transition-colors"
          @click="goBack"
        >
          <ArrowLeftIcon class="w-4 h-4 text-slate-600" />
        </button>
        <div>
          <h1 class="text-xl font-bold text-slate-950">Detail Shift</h1>
          <p class="text-xs text-slate-500">
            {{ shiftMeta }}
          </p>
        </div>
      </div>

      <!-- Status badge -->
      <span
        :class="[
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide',
          statusBadgeClass,
        ]"
      >
        <span class="w-1.5 h-1.5 rounded-full" :class="statusDotClass"></span>
        {{ shift?.status ?? '...' }}
      </span>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2Icon class="w-6 h-6 animate-spin text-slate-400" />
      <span class="ml-2 text-sm text-slate-500">Memuat data shift...</span>
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
    >
      <AlertCircleIcon class="w-8 h-8 text-red-400 mx-auto mb-2" />
      <p class="text-sm font-medium text-red-800">{{ error }}</p>
      <button
        class="mt-3 text-xs text-red-600 hover:text-red-700 underline"
        @click="fetchDetail"
      >
        Coba lagi
      </button>
    </div>

    <!-- 3-Column Settlement Layout -->
    <div v-else-if="shift" class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- ============================================ -->
      <!-- COLUMN 1: Sales Summary                     -->
      <!-- ============================================ -->
      <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ReceiptIcon class="w-4 h-4 text-blue-600" />
            Ringkasan Penjualan
          </h3>
        </div>

        <div class="p-5 space-y-4">
          <!-- Tunai -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500 flex items-center gap-1.5">
                <BanknoteIcon class="w-3.5 h-3.5 text-emerald-500" />
                Tunai (Expected)
              </span>
              <span class="text-sm font-mono font-semibold text-slate-900">
                {{ formatRupiah(shift.expectedCash) }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500 pl-5">Actual (kasir input)</span>
              <span class="text-sm font-mono text-slate-700">
                {{ shift.actualCash != null ? formatRupiah(shift.actualCash) : '—' }}
              </span>
            </div>
          </div>

          <!-- QRIS -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500 flex items-center gap-1.5">
                <QrCodeIcon class="w-3.5 h-3.5 text-blue-500" />
                QRIS (Expected)
              </span>
              <span class="text-sm font-mono font-semibold text-slate-900">
                {{ formatRupiah(shift.expectedQRIS) }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500 pl-5">Actual (kasir input)</span>
              <span class="text-sm font-mono text-slate-700">
                {{ shift.actualQRIS != null ? formatRupiah(shift.actualQRIS) : '—' }}
              </span>
            </div>
          </div>

          <!-- Debit/Kredit placeholder -->
          <div class="space-y-1 opacity-50">
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500 flex items-center gap-1.5">
                <CreditCardIcon class="w-3.5 h-3.5 text-indigo-500" />
                Debit/Kredit
              </span>
              <span class="text-sm font-mono text-slate-400">—</span>
            </div>
            <p class="text-[10px] text-slate-400 pl-5">Belum tersedia (Phase 2)</p>
          </div>

          <!-- Divider -->
          <div class="border-t border-slate-200 pt-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-700">Total Expected</span>
              <span class="text-sm font-mono font-bold text-slate-950">
                {{ formatRupiah(shift.expectedCash + shift.expectedQRIS) }}
              </span>
            </div>
          </div>

          <!-- Transaction count -->
          <div class="bg-slate-50 rounded-md px-3 py-2 flex items-center justify-between">
            <span class="text-xs text-slate-500">Jumlah Transaksi</span>
            <span class="text-sm font-mono font-semibold text-slate-900">
              {{ transactions.length }} trx
            </span>
          </div>

          <!-- Shift time info -->
          <div class="space-y-1.5 text-[11px] text-slate-500">
            <div class="flex justify-between">
              <span>Mulai</span>
              <span class="font-mono">{{ formatDateTime(shift.startTime) }}</span>
            </div>
            <div v-if="shift.endTime" class="flex justify-between">
              <span>Selesai</span>
              <span class="font-mono">{{ formatDateTime(shift.endTime) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Kasir</span>
              <span class="font-medium text-slate-700">{{ shift.user?.username ?? shift.user?.email ?? '—' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- COLUMN 2: Cash Denomination Input            -->
      <!-- ============================================ -->
      <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CoinsIcon class="w-4 h-4 text-amber-600" />
            Input Uang Tunai (per Pecahan)
          </h3>
          <p class="text-[11px] text-slate-500 mt-0.5">
            Hitung fisik kas oleh admin saat finalisasi
          </p>
        </div>

        <div class="p-5">
          <CashDenominationInput
            v-model="denominations"
            :disabled="shift.status === 'FINALIZED'"
          />
        </div>
      </div>

      <!-- ============================================ -->
      <!-- COLUMN 3: Reconciliation & Finalize          -->
      <!-- ============================================ -->
      <div class="space-y-5">
        <!-- Reconciliation Card -->
        <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 bg-slate-50">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ScaleIcon class="w-4 h-4 text-purple-600" />
              Rekonsiliasi
            </h3>
          </div>

          <div class="p-5 space-y-4">
            <!-- Actual (from denomination) -->
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500">Actual (Hitung Fisik)</span>
              <span class="text-sm font-mono font-semibold text-slate-900">
                {{ formatRupiah(denominationTotal) }}
              </span>
            </div>

            <!-- Expected -->
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500">Expected (Sistem)</span>
              <span class="text-sm font-mono font-semibold text-slate-900">
                {{ formatRupiah(shift.expectedCash) }}
              </span>
            </div>

            <!-- Divider -->
            <div class="border-t border-slate-200"></div>

            <!-- Difference -->
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-700">Selisih</span>
              <span
                :class="[
                  'text-sm font-mono font-bold',
                  differenceColor,
                ]"
              >
                {{ differenceSign }}{{ formatRupiah(Math.abs(difference)) }}
              </span>
            </div>

            <!-- Badge -->
            <div class="flex justify-end">
              <span
                v-if="denominationTotal > 0"
                :class="[
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide',
                  differenceBadgeClass,
                ]"
              >
                <component :is="differenceBadgeIcon" class="w-3 h-3" />
                {{ differenceBadgeLabel }}
              </span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 bg-slate-50">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileTextIcon class="w-4 h-4 text-slate-500" />
              Catatan
            </h3>
          </div>
          <div class="p-5">
            <!-- Existing notes from kasir -->
            <div v-if="shift.notes" class="mb-3 bg-slate-50 rounded-md px-3 py-2">
              <p class="text-[10px] font-bold text-slate-500 uppercase mb-1">Catatan Kasir</p>
              <p class="text-xs text-slate-700">{{ shift.notes }}</p>
            </div>

            <!-- Admin note -->
            <label class="block text-[11px] text-slate-500 mb-1">Catatan Admin (opsional)</label>
            <textarea
              v-model="adminNotes"
              rows="3"
              class="w-full text-sm border border-slate-300 rounded-md px-3 py-2
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none
                     disabled:bg-slate-100 disabled:text-slate-400 resize-none"
              placeholder="Catatan tambahan untuk finalisasi..."
              :disabled="shift.status === 'FINALIZED'"
            />
          </div>
        </div>

        <!-- Finalize Button -->
        <button
          v-if="shift.status === 'CLOSED'"
          :disabled="finalizing"
          class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold
                 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleFinalize"
        >
          <Loader2Icon v-if="finalizing" class="w-4 h-4 animate-spin" />
          <CheckCircle2Icon v-else class="w-4 h-4" />
          {{ finalizing ? 'Memfinalisasi...' : 'Finalisasi Shift' }}
        </button>

        <!-- Already finalized info -->
        <div
          v-if="shift.status === 'FINALIZED'"
          class="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-start gap-2.5"
        >
          <CheckCircle2Icon class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p class="text-xs font-bold text-emerald-800">Shift telah difinalisasi</p>
            <p class="text-[11px] text-emerald-700 mt-0.5">
              Oleh {{ shift.finalizedBy ?? '—' }}
              <span v-if="shift.finalizedAt"> &middot; {{ formatDateTime(shift.finalizedAt) }}</span>
            </p>
          </div>
        </div>

        <!-- Open shift cannot be finalized -->
        <div
          v-if="shift.status === 'OPEN'"
          class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2.5"
        >
          <AlertCircleIcon class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p class="text-xs font-bold text-amber-800">Shift masih aktif</p>
            <p class="text-[11px] text-amber-700 mt-0.5">
              Shift harus ditutup oleh kasir sebelum bisa difinalisasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft as ArrowLeftIcon,
  Receipt as ReceiptIcon,
  Banknote as BanknoteIcon,
  QrCode as QrCodeIcon,
  CreditCard as CreditCardIcon,
  Coins as CoinsIcon,
  Scale as ScaleIcon,
  FileText as FileTextIcon,
  CheckCircle2 as CheckCircle2Icon,
  AlertCircle as AlertCircleIcon,
  Loader2 as Loader2Icon,
  Monitor as MonitorIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Minus as MinusIcon,
} from 'lucide-vue-next';
import CashDenominationInput from '@/admin/components/shift/CashDenominationInput.vue';
import shiftService, {
  type ShiftDto,
  type ShiftDetailTransaction,
} from '@/shared/services/shift.service';

const route = useRoute();
const router = useRouter();

// ============================================
// State
// ============================================
const shift = ref<ShiftDto | null>(null);
const transactions = ref<ShiftDetailTransaction[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const finalizing = ref(false);
const adminNotes = ref('');

// Cash denomination model: { denominationValue: quantity }
const denominations = ref<Record<number, number>>({});

// ============================================
// Computed
// ============================================
const shiftMeta = computed(() => {
  if (!shift.value) return 'Memuat...';
  const shop = shift.value.shop?.name ?? 'Unknown';
  const date = new Date(shift.value.startTime).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `${shop} — ${date}`;
});

const statusBadgeClass = computed(() => {
  switch (shift.value?.status) {
    case 'OPEN':
      return 'bg-emerald-100 text-emerald-700';
    case 'CLOSED':
      return 'bg-amber-100 text-amber-700';
    case 'FINALIZED':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
});

const statusDotClass = computed(() => {
  switch (shift.value?.status) {
    case 'OPEN':
      return 'bg-emerald-500';
    case 'CLOSED':
      return 'bg-amber-500';
    case 'FINALIZED':
      return 'bg-blue-500';
    default:
      return 'bg-slate-400';
  }
});

const denominationTotal = computed(() => {
  return Object.entries(denominations.value).reduce((sum, [denom, qty]) => {
    return sum + Number(denom) * (qty || 0);
  }, 0);
});

const difference = computed(() => {
  if (!shift.value) return 0;
  return denominationTotal.value - shift.value.expectedCash;
});

const differenceSign = computed(() => {
  if (difference.value > 0) return '+';
  if (difference.value < 0) return '-';
  return '';
});

const differenceColor = computed(() => {
  if (difference.value > 0) return 'text-emerald-600';
  if (difference.value < 0) return 'text-red-600';
  return 'text-slate-900';
});

const differenceBadgeClass = computed(() => {
  if (difference.value > 0) return 'bg-emerald-100 text-emerald-700';
  if (difference.value < 0) return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-700';
});

const differenceBadgeLabel = computed(() => {
  if (difference.value > 0) return 'SURPLUS';
  if (difference.value < 0) return 'DEFICIT';
  return 'BALANCE';
});

const differenceBadgeIcon = computed(() => {
  if (difference.value > 0) return TrendingUpIcon;
  if (difference.value < 0) return TrendingDownIcon;
  return MinusIcon;
});

// ============================================
// Methods
// ============================================

function goBack() {
  router.push({ name: 'admin-shifts' });
}

async function fetchDetail() {
  const shiftId = route.params.id as string;
  if (!shiftId) return;

  loading.value = true;
  error.value = null;

  try {
    const response = await shiftService.getDetail(shiftId);
    shift.value = response.shift;
    transactions.value = response.transactions?.data ?? [];
  } catch (err: any) {
    error.value =
      err.response?.data?.message ?? err.message ?? 'Gagal memuat detail shift.';
  } finally {
    loading.value = false;
  }
}

async function handleFinalize() {
  if (!shift.value || finalizing.value) return;

  finalizing.value = true;
  try {
    const response = await shiftService.finalize(shift.value.id, {
      notes: adminNotes.value || undefined,
    });
    shift.value = response.shift;
  } catch (err: any) {
    error.value =
      err.response?.data?.message ?? err.message ?? 'Gagal memfinalisasi shift.';
  } finally {
    finalizing.value = false;
  }
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================
// Lifecycle
// ============================================
onMounted(() => {
  fetchDetail();
});
</script>
