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
  <div class="hidden md:block space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <RouterLink
          :to="{ name: 'admin-shifts' }"
          class="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center
                 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeftIcon class="w-4 h-4 text-slate-600" />
        </RouterLink>
        <div></div>
      </div>

      <ShiftStatusBadge v-if="shift" :status="shift.status" />
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2Icon class="w-6 h-6 animate-spin text-slate-400" />
      <span class="ml-2 text-sm text-slate-500">Memuat data shift...</span>
    </div>

    <!-- Error state -->
    <div
      v-else-if="loadError"
      class="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
    >
      <AlertCircleIcon class="w-8 h-8 text-red-400 mx-auto mb-2" />
      <p class="text-sm font-medium text-red-800">{{ loadError }}</p>
      <button
        class="mt-3 text-xs text-red-600 hover:text-red-700 underline"
        @click="loadDetail"
      >
        Coba lagi
      </button>
    </div>

    <!-- ============================================ -->
    <!-- 3-Column Settlement Layout                   -->
    <!-- ============================================ -->
    <div v-else-if="shift" class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- ============================================ -->
      <!-- COLUMN 1: Sales Summary                     -->
      <!-- ============================================ -->
      <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div class="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ReceiptIcon class="w-4 h-4 text-blue-600" />
            Ringkasan Penjualan
          </h3>
        </div>

        <div class="p-5 space-y-4">
          <!-- Per cashbox category -->
          <div
            v-for="cb in shift.cashBoxes"
            :key="cb.id"
            class="space-y-2 pb-3 border-b border-slate-100 last:border-0 last:pb-0"
          >
            <div class="flex items-center gap-2 mb-1.5">
              <span
                :class="[
                  'inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold',
                  colorBg(cb.category.color),
                  colorText(cb.category.color),
                ]"
              >
                {{ cb.category.code.slice(0, 2) }}
              </span>
              <span class="text-xs font-semibold text-slate-800">{{ cb.category.name }}</span>
            </div>

            <!-- Tunai -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-500 flex items-center gap-1.5">
                  <BanknoteIcon class="w-3.5 h-3.5 text-emerald-500" />
                  Tunai (Expected)
                </span>
                <span class="text-xs font-mono font-semibold text-slate-900">
                  {{ formatRupiah(cb.startingCash + cb.expectedCash) }}
                </span>
              </div>
              <div class="flex items-center justify-between pl-5">
                <span class="text-[11px] text-slate-400">Actual (kasir)</span>
                <span class="text-xs font-mono text-slate-600">
                  {{ cb.actualCash != null ? formatRupiah(cb.actualCash) : '—' }}
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
                <span class="text-xs font-mono font-semibold text-slate-900">
                  {{ formatRupiah(cb.expectedQRIS) }}
                </span>
              </div>
              <div class="flex items-center justify-between pl-5">
                <span class="text-[11px] text-slate-400">Actual (kasir)</span>
                <span class="text-xs font-mono text-slate-600">
                  {{ cb.actualQRIS != null ? formatRupiah(cb.actualQRIS) : '—' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Debit/Kredit placeholder -->
          <div class="space-y-1 opacity-50 pt-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500 flex items-center gap-1.5">
                <CreditCardIcon class="w-3.5 h-3.5 text-indigo-500" />
                Debit/Kredit
              </span>
              <span class="text-xs font-mono text-slate-400">—</span>
            </div>
            <p class="text-[10px] text-slate-400 pl-5">Belum tersedia (Phase 2)</p>
          </div>

          <!-- Totals -->
          <div class="border-t border-slate-200 pt-3 space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-700">Total Expected (Tunai)</span>
              <span class="text-sm font-mono font-bold text-slate-950">
                {{ formatRupiah(totalExpectedCash) }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500">Total QRIS</span>
              <span class="text-xs font-mono font-semibold text-slate-700">
                {{ formatRupiah(totalExpectedQRIS) }}
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
              <span class="font-medium text-slate-700">
                {{ shift.user?.username ?? shift.user?.email ?? '—' }}
              </span>
            </div>
            <div class="flex justify-between">
              <span>Durasi</span>
              <span class="font-mono font-medium text-slate-700">{{ duration }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- COLUMN 2: Cash Input (Total + Optional Detail) -->
      <!-- ============================================ -->
      <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div class="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CoinsIcon class="w-4 h-4 text-amber-600" />
            Hitung Kas Fisik
          </h3>
          <p class="text-[11px] text-slate-500 mt-0.5">
            Input total uang fisik di laci. Detail pecahan opsional.
          </p>
        </div>

        <div class="p-5 space-y-4">
          <!-- Per category: simple total input -->
          <div
            v-for="cb in shift.cashBoxes"
            :key="'cash-' + cb.id"
            class="space-y-3"
          >
            <div
              v-if="shift.cashBoxes.length > 1"
              class="flex items-center gap-2"
            >
              <span
                :class="[
                  'inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold',
                  colorBg(cb.category.color),
                  colorText(cb.category.color),
                ]"
              >
                {{ cb.category.code.slice(0, 2) }}
              </span>
              <span class="text-xs font-semibold text-slate-700">
                {{ cb.category.name }}
              </span>
            </div>

            <!-- Total Cash Input (PRIMARY - single field) -->
            <div>
              <label class="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Total Uang Tunai Fisik</label>
              <div class="relative mt-1">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-mono text-slate-500">Rp</span>
                <input
                  :value="getDenomTotal(cb.categoryId) > 0 ? formatRupiah(getDenomTotal(cb.categoryId)).replace('Rp', '').trim() : ''"
                  type="text"
                  inputmode="numeric"
                  placeholder="0"
                  :disabled="shift.status === 'FINALIZED'"
                  class="w-full h-11 pl-10 pr-3 text-lg font-mono font-bold text-right border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                  @input="(e) => handleDirectTotalInput(cb.categoryId, e)"
                />
              </div>
              <p class="text-[9px] text-slate-400 mt-1">Ekspektasi sistem: {{ formatRupiah(cb.startingCash + cb.expectedCash) }}</p>
            </div>

            <!-- Collapsible Denomination Detail (OPTIONAL) -->
            <details class="group">
              <summary class="flex items-center gap-1.5 cursor-pointer text-[10px] font-semibold text-blue-600 hover:text-blue-700 select-none">
                <svg class="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
                Detail pecahan (opsional)
              </summary>
              <div class="mt-2">
                <CashDenominationInput
                  :model-value="getDenomination(cb.categoryId)"
                  :disabled="shift.status === 'FINALIZED'"
                  @update:model-value="(val) => setDenomination(cb.categoryId, val)"
                  @total-change="(val) => setDenomTotal(cb.categoryId, val)"
                />
              </div>
            </details>

            <div
              v-if="shift.cashBoxes.length > 1"
              class="border-b border-slate-100 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0"
            />
          </div>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- COLUMN 3: Reconciliation & Finalize          -->
      <!-- ============================================ -->
      <div class="space-y-5">
        <!-- Reconciliation Card -->
        <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div class="px-5 py-3 border-b border-slate-200 bg-slate-50">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ScaleIcon class="w-4 h-4 text-purple-600" />
              Rekonsiliasi
            </h3>
          </div>

          <div class="p-5 space-y-3">
            <!-- Per category reconciliation -->
            <div
              v-for="cb in shift.cashBoxes"
              :key="'recon-' + cb.id"
              class="space-y-2 pb-3 border-b border-slate-100 last:border-0 last:pb-0"
            >
              <p
                v-if="shift.cashBoxes.length > 1"
                class="text-[11px] font-bold text-slate-600 uppercase tracking-wide"
              >
                {{ cb.category.name }}
              </p>

              <!-- Actual (from denomination) -->
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-500">Actual (Hitung Fisik)</span>
                <span class="text-xs font-mono font-semibold text-slate-900">
                  {{ formatRupiah(getDenomTotal(cb.categoryId)) }}
                </span>
              </div>

              <!-- Expected -->
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-500">Expected (Sistem)</span>
                <span class="text-xs font-mono font-semibold text-slate-900">
                  {{ formatRupiah(cb.startingCash + cb.expectedCash) }}
                </span>
              </div>

              <!-- Difference -->
              <div class="flex items-center justify-between pt-1">
                <span class="text-xs font-bold text-slate-700">Selisih</span>
                <span
                  :class="[
                    'text-sm font-mono font-bold',
                    getDifference(cb.categoryId, cb.startingCash + cb.expectedCash) > 0
                      ? 'text-emerald-600'
                      : getDifference(cb.categoryId, cb.startingCash + cb.expectedCash) < 0
                        ? 'text-red-600'
                        : 'text-slate-900',
                  ]"
                >
                  {{ formatVariance(getDifference(cb.categoryId, cb.startingCash + cb.expectedCash)) }}
                </span>
              </div>

              <!-- Badge -->
              <div class="flex justify-end">
                <span
                  v-if="getDenomTotal(cb.categoryId) > 0"
                  :class="[
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide',
                    getDifference(cb.categoryId, cb.startingCash + cb.expectedCash) > 0
                      ? 'bg-emerald-100 text-emerald-700'
                      : getDifference(cb.categoryId, cb.startingCash + cb.expectedCash) < 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-700',
                  ]"
                >
                  <TrendingUpIcon
                    v-if="getDifference(cb.categoryId, cb.startingCash + cb.expectedCash) > 0"
                    class="w-3 h-3"
                  />
                  <TrendingDownIcon
                    v-else-if="getDifference(cb.categoryId, cb.startingCash + cb.expectedCash) < 0"
                    class="w-3 h-3"
                  />
                  <MinusIcon v-else class="w-3 h-3" />
                  {{
                    getDifference(cb.categoryId, cb.startingCash + cb.expectedCash) > 0
                      ? 'SURPLUS'
                      : getDifference(cb.categoryId, cb.startingCash + cb.expectedCash) < 0
                        ? 'DEFICIT'
                        : 'BALANCE'
                  }}
                </span>
              </div>
            </div>

            <!-- Grand total reconciliation -->
            <div
              v-if="shift.cashBoxes.length > 1"
              class="border-t border-slate-200 pt-3 space-y-1.5"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-700">Total Selisih</span>
                <span
                  :class="[
                    'text-sm font-mono font-bold',
                    grandDifference > 0
                      ? 'text-emerald-600'
                      : grandDifference < 0
                        ? 'text-red-600'
                        : 'text-slate-900',
                  ]"
                >
                  {{ formatVariance(grandDifference) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes Card -->
        <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div class="px-5 py-3 border-b border-slate-200 bg-slate-50">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileTextIcon class="w-4 h-4 text-slate-500" />
              Catatan
            </h3>
          </div>
          <div class="p-5 space-y-3">
            <!-- Existing notes from kasir -->
            <div v-if="shift.notes" class="bg-slate-50 rounded-md px-3 py-2">
              <p class="text-[10px] font-bold text-slate-500 uppercase mb-1">Catatan Kasir</p>
              <p class="text-xs text-slate-700 whitespace-pre-line">{{ shift.notes }}</p>
            </div>

            <!-- Admin note -->
            <div>
              <label class="block text-[11px] text-slate-500 mb-1">
                Catatan Admin (opsional)
              </label>
              <textarea
                v-model="finalizeNotes"
                rows="3"
                class="w-full text-sm border border-slate-300 rounded-md px-3 py-2
                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none
                       disabled:bg-slate-100 disabled:text-slate-400 resize-none"
                placeholder="Catatan tambahan untuk finalisasi..."
                :disabled="shift.status === 'FINALIZED'"
              />
            </div>
          </div>
        </div>

        <!-- Finalize Button (CLOSED only) -->
        <div v-if="shift.status === 'CLOSED'">
          <div
            v-if="finalizeError"
            class="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5"
          >
            {{ finalizeError }}
          </div>
          <button
            type="button"
            :disabled="finalizing"
            class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                   bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold
                   transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            @click="handleFinalize"
          >
            <Loader2Icon v-if="finalizing" class="w-4 h-4 animate-spin" />
            <CheckCircleIcon v-else class="w-4 h-4" />
            {{ finalizing ? 'Memfinalisasi...' : 'Finalisasi Shift' }}
          </button>
        </div>

        <!-- Already finalized info -->
        <div
          v-if="shift.status === 'FINALIZED'"
          class="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-start gap-2.5"
        >
          <CheckCircleIcon class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p class="text-xs font-bold text-emerald-800">Shift telah difinalisasi</p>
            <p class="text-[11px] text-emerald-700 mt-0.5">
              Oleh <strong>{{ shift.finalizedBy ?? '—' }}</strong>
              <span v-if="shift.finalizedAt">
                &middot; {{ formatDateTime(shift.finalizedAt) }}
              </span>
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
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  ArrowLeft as ArrowLeftIcon,
  Receipt as ReceiptIcon,
  Banknote as BanknoteIcon,
  QrCode as QrCodeIcon,
  CreditCard as CreditCardIcon,
  Coins as CoinsIcon,
  Scale as ScaleIcon,
  FileText as FileTextIcon,
  CheckCircle2 as CheckCircleIcon,
  AlertCircle as AlertCircleIcon,
  Loader2 as Loader2Icon,
  Monitor as MonitorIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Minus as MinusIcon,
} from 'lucide-vue-next';
import CashDenominationInput from '@/admin/components/shift/CashDenominationInput.vue';
import ShiftStatusBadge from '@/admin/components/shift/ShiftStatusBadge.vue';
import shiftService, {
  type ShiftDto,
  type ShiftDetailTransaction,
  type CashDenominations,
} from '@/shared/services/shift.service';

const route = useRoute();

// ============================================
// State
// ============================================
const shift = ref<ShiftDto | null>(null);
const transactions = ref<ShiftDetailTransaction[]>([]);
const loading = ref(false);
const loadError = ref<string | null>(null);
const finalizing = ref(false);
const finalizeError = ref<string | null>(null);
const finalizeNotes = ref('');

/** Per-category denomination inputs: categoryId → CashDenominations */
const denominationInputs = reactive<Record<string, CashDenominations>>({});
/** Per-category computed totals from CashDenominationInput */
const denomTotals = reactive<Record<string, number>>({});

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

const duration = computed(() => {
  if (!shift.value?.startTime) return '—';
  const start = new Date(shift.value.startTime).getTime();
  const end = shift.value.endTime
    ? new Date(shift.value.endTime).getTime()
    : Date.now();
  const minutes = Math.floor((end - start) / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}j ${mins}m`;
});

const totalExpectedCash = computed(() => {
  if (!shift.value) return 0;
  return shift.value.cashBoxes.reduce(
    (sum, cb) => sum + cb.startingCash + cb.expectedCash,
    0,
  );
});

const totalExpectedQRIS = computed(() => {
  if (!shift.value) return 0;
  return shift.value.cashBoxes.reduce((sum, cb) => sum + cb.expectedQRIS, 0);
});

const grandDifference = computed(() => {
  if (!shift.value) return 0;
  return shift.value.cashBoxes.reduce((sum, cb) => {
    const expected = cb.startingCash + cb.expectedCash;
    return sum + getDifference(cb.categoryId, expected);
  }, 0);
});

// ============================================
// Methods
// ============================================

function getDenomination(categoryId: string): CashDenominations {
  return denominationInputs[categoryId] ?? {};
}

function setDenomination(categoryId: string, val: CashDenominations) {
  denominationInputs[categoryId] = val;
}

function getDenomTotal(categoryId: string): number {
  return denomTotals[categoryId] ?? 0;
}

function setDenomTotal(categoryId: string, val: number) {
  denomTotals[categoryId] = val;
}

/**
 * Handle direct total input (single number field).
 * Sets the total directly without denomination breakdown.
 * Clears any existing denomination values.
 */
function handleDirectTotalInput(categoryId: string, event: Event) {
  const target = event.target as HTMLInputElement;
  const cleaned = target.value.replace(/\D/g, '');
  const parsed = cleaned === '' ? 0 : parseInt(cleaned, 10);
  denomTotals[categoryId] = parsed;
  // Clear denomination breakdown (user is inputting total directly)
  denominationInputs[categoryId] = { lainnya: parsed };
}

function getDifference(categoryId: string, expected: number): number {
  return getDenomTotal(categoryId) - expected;
}

async function loadDetail() {
  const shiftId = route.params.id as string;
  if (!shiftId) return;

  loading.value = true;
  loadError.value = null;
  try {
    const response = await shiftService.getDetail(shiftId);
    shift.value = response.shift;
    transactions.value = response.transactions?.data ?? [];

    // Pre-populate denomination inputs if shift already has them
    for (const cb of response.shift.cashBoxes) {
      if (cb.cashDenominations) {
        denominationInputs[cb.categoryId] = { ...cb.cashDenominations };
      }
    }
  } catch (err: any) {
    loadError.value =
      err?.response?.data?.message ?? err?.message ?? 'Gagal memuat detail shift.';
  } finally {
    loading.value = false;
  }
}

async function handleFinalize() {
  if (!shift.value || finalizing.value) return;

  finalizing.value = true;
  finalizeError.value = null;
  try {
    await shiftService.finalize(shift.value.id, {
      notes: finalizeNotes.value.trim() || undefined,
    });
    // Refresh
    finalizeNotes.value = '';
    await loadDetail();
  } catch (err: any) {
    finalizeError.value =
      err?.response?.data?.message ?? err?.message ?? 'Gagal memfinalisasi shift.';
  } finally {
    finalizing.value = false;
  }
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatVariance(value: number): string {
  if (value === 0) return formatRupiah(0);
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatRupiah(value)}`;
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

function colorBg(color?: string | null): string {
  const c = (color ?? '').toLowerCase();
  const map: Record<string, string> = {
    amber: 'bg-amber-100',
    emerald: 'bg-emerald-100',
    green: 'bg-emerald-100',
    red: 'bg-red-100',
    purple: 'bg-purple-100',
    pink: 'bg-pink-100',
    indigo: 'bg-indigo-100',
    orange: 'bg-orange-100',
    blue: 'bg-blue-100',
  };
  return map[c] ?? 'bg-blue-100';
}

function colorText(color?: string | null): string {
  const c = (color ?? '').toLowerCase();
  const map: Record<string, string> = {
    amber: 'text-amber-700',
    emerald: 'text-emerald-700',
    green: 'text-emerald-700',
    red: 'text-red-700',
    purple: 'text-purple-700',
    pink: 'text-pink-700',
    indigo: 'text-indigo-700',
    orange: 'text-orange-700',
    blue: 'text-blue-700',
  };
  return map[c] ?? 'text-blue-700';
}

// ============================================
// Lifecycle
// ============================================
onMounted(loadDetail);
</script>
