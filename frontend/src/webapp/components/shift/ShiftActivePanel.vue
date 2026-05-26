<template>
  <div class="space-y-4">
    <!-- Active Shift Card -->
    <div
      class="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-2xl p-5 shadow-sm"
    >
      <div class="flex items-start justify-between gap-3 mb-4">
        <div class="flex items-center gap-2">
          <span
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              Shift Aktif
            </span>
          </span>
        </div>
        <p class="text-[11px] text-slate-500 font-mono">
          #{{ shortShiftId }}
        </p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p class="text-[11px] text-slate-500">Dimulai</p>
          <p class="text-sm font-semibold text-slate-900 mt-0.5">
            {{ startTimeLabel }}
          </p>
        </div>
        <div>
          <p class="text-[11px] text-slate-500">Durasi</p>
          <p class="text-sm font-semibold text-slate-900 mt-0.5 font-mono">
            {{ durationLabel }}
          </p>
        </div>
        <div>
          <p class="text-[11px] text-slate-500">Transaksi</p>
          <p class="text-sm font-semibold text-slate-900 mt-0.5 font-mono">
            {{ transactionCount }}
          </p>
        </div>
        <div>
          <p class="text-[11px] text-slate-500">Cabang</p>
          <p class="text-sm font-semibold text-slate-900 mt-0.5 truncate">
            {{ shift.shop?.name || '—' }}
          </p>
        </div>
      </div>

      <!-- Per-category breakdown -->
      <div class="space-y-2 mb-4">
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
          Saldo per Kategori
        </p>
        <div
          v-for="cb in shift.cashBoxes"
          :key="cb.id"
          class="bg-white border border-slate-200 rounded-lg p-3"
        >
          <div class="flex items-center gap-2 mb-2">
            <span
              :class="[
                'inline-flex items-center justify-center w-7 h-7 rounded-md shrink-0',
                colorBg(cb.category.color),
              ]"
            >
              <span :class="['text-xs font-bold', colorText(cb.category.color)]">
                {{ initials(cb.category.name) }}
              </span>
            </span>
            <p class="text-xs font-semibold text-slate-900 flex-1 truncate">
              {{ cb.category.name }}
            </p>
            <span
              v-if="cb.category.isDefault"
              class="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-100 text-blue-700"
            >
              Default
            </span>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <p class="text-[10px] text-slate-500">Saldo Awal</p>
              <p class="text-xs font-mono font-semibold text-slate-900 mt-0.5">
                {{ formatRupiah(cb.startingCash) }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-slate-500">Cash Masuk</p>
              <p class="text-xs font-mono font-semibold text-emerald-700 mt-0.5">
                {{ formatRupiah(cb.expectedCash) }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-slate-500">QRIS</p>
              <p class="text-xs font-mono font-semibold text-blue-700 mt-0.5">
                {{ formatRupiah(cb.expectedQRIS) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div
        v-if="shift.notes"
        class="bg-white border border-slate-200 rounded-lg p-3 mb-4"
      >
        <p class="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">
          Catatan saat buka shift
        </p>
        <p class="text-xs text-slate-700 whitespace-pre-line">{{ shift.notes }}</p>
      </div>

      <!-- Action: open close form -->
      <button
        v-if="!showCloseForm"
        type="button"
        :disabled="loading"
        class="w-full h-12 px-6 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        @click="showCloseForm = true"
      >
        <component :is="StopCircleIcon" class="w-4 h-4" />
        Tutup Shift
      </button>
    </div>

    <!-- Close Shift Form -->
    <form
      v-if="showCloseForm"
      class="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5"
      @submit.prevent="handleSubmitClose"
    >
      <div class="flex items-start gap-3">
        <div
          class="w-12 h-12 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center shrink-0"
        >
          <component :is="StopCircleIcon" class="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h2 class="text-base font-bold text-slate-950">Tutup Shift</h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Hitung uang fisik di laci kas per kategori, lalu input nominal
            aktualnya. Sistem otomatis hitung selisih dengan ekspektasi.
          </p>
        </div>
      </div>

      <!-- Error -->
      <div
        v-if="errorMessage"
        class="bg-red-50 border-l-4 border-red-500 rounded-md p-3 flex items-start gap-2"
      >
        <component :is="AlertCircleIcon" class="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        <p class="text-xs text-red-800">{{ errorMessage }}</p>
      </div>

      <!-- Per-category actual inputs -->
      <div class="space-y-3">
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Aktual per Kategori
        </p>
        <div
          v-for="cb in shift.cashBoxes"
          :key="cb.id"
          class="border border-slate-200 rounded-xl p-4 space-y-3"
        >
          <div class="flex items-center gap-2">
            <span
              :class="[
                'inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
                colorBg(cb.category.color),
              ]"
            >
              <span :class="['text-sm font-bold', colorText(cb.category.color)]">
                {{ initials(cb.category.name) }}
              </span>
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-900 truncate">
                {{ cb.category.name }}
              </p>
              <p class="text-[10px] text-slate-500">
                Ekspektasi: Rp {{ formatNumber(cb.startingCash + cb.expectedCash) }}
                cash · Rp {{ formatNumber(cb.expectedQRIS) }} QRIS
              </p>
            </div>
          </div>

          <!-- Actual cash via denomination breakdown -->
          <CashDenominationInput
            v-model="denominationsByCategory[cb.categoryId]"
            :disabled="loading"
            @total-change="(total) => onDenominationTotalChange(cb.categoryId, total)"
          />

          <!-- Actual QRIS -->
          <div>
            <label class="block text-xs font-semibold text-slate-900 mb-1">
              Total QRIS <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <span
                class="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-mono text-slate-500"
              >
                Rp
              </span>
              <input
                :value="formattedQRIS[cb.categoryId] || ''"
                type="text"
                inputmode="numeric"
                placeholder="0"
                required
                :disabled="loading"
                class="input-field pl-10 font-mono text-right text-sm"
                @input="(e) => handleNumericInput(cb.categoryId, 'qris', e)"
                @blur="handleClearError"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div>
        <label for="close-notes" class="block text-xs font-semibold text-slate-900 mb-1.5">
          Catatan <span class="text-slate-400">(opsional)</span>
        </label>
        <textarea
          id="close-notes"
          v-model="notes"
          rows="2"
          placeholder="Mis. Selisih Rp 5.000 karena kembalian receh"
          :disabled="loading"
          class="input-field resize-none"
          @input="handleClearError"
        ></textarea>
      </div>

      <!-- Buttons -->
      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          :disabled="loading"
          class="h-12 px-4 bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg hover:bg-slate-200 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-colors disabled:opacity-50"
          @click="handleCancel"
        >
          Batal
        </button>
        <button
          type="submit"
          :disabled="loading"
          class="h-12 px-4 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <component v-if="loading" :is="Loader2Icon" class="w-4 h-4 animate-spin" />
          {{ loading ? 'Menutup…' : 'Tutup Shift' }}
        </button>
      </div>

      <!-- Helper -->
      <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
        <component :is="AlertTriangleIcon" class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p class="text-[11px] text-amber-800 leading-relaxed">
          Setelah ditutup, shift menunggu finalisasi admin. Pastikan semua
          uang fisik sudah dihitung dengan teliti per kategori.
        </p>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  StopCircle as StopCircleIcon,
  AlertCircle as AlertCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  Loader2 as Loader2Icon,
} from 'lucide-vue-next';
import type {
  ShiftDto,
  CloseShiftPayload,
  CashDenominations,
} from '@/shared/services/shift.service';
import CashDenominationInput from './CashDenominationInput.vue';

interface Props {
  shift: ShiftDto;
  transactionCount: number;
  durationMinutes: number;
  loading?: boolean;
  errorMessage?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  errorMessage: null,
});

const emit = defineEmits<{
  (e: 'close-shift', payload: CloseShiftPayload): void;
  (e: 'clear-error'): void;
}>();

const showCloseForm = ref(false);

/**
 * Per-category state. Keyed by categoryId.
 * - denominationsByCategory: breakdown lembar pecahan
 * - actualCash: total per category, derived dari denominations
 * - actualQRIS: total QRIS per category, manual input
 */
const denominationsByCategory = reactive<Record<string, CashDenominations>>({});
const actualCash = reactive<Record<string, number>>({});
const actualQRIS = reactive<Record<string, number>>({});
const formattedQRIS = reactive<Record<string, string>>({});

const notes = ref('');

/**
 * Init state per cashbox saat shift loaded / cashboxes berubah.
 * Setiap kategori dapat object kosong supaya v-model di
 * CashDenominationInput langsung reactive.
 */
watch(
  () => props.shift.cashBoxes,
  (cashBoxes) => {
    for (const cb of cashBoxes) {
      if (!denominationsByCategory[cb.categoryId]) {
        denominationsByCategory[cb.categoryId] = {};
      }
      if (actualCash[cb.categoryId] == null) {
        actualCash[cb.categoryId] = 0;
      }
      if (actualQRIS[cb.categoryId] == null) {
        actualQRIS[cb.categoryId] = 0;
        formattedQRIS[cb.categoryId] = '';
      }
    }
  },
  { immediate: true },
);

const shortShiftId = computed(() => props.shift.id.slice(-6).toUpperCase());

const startTimeLabel = computed(() =>
  new Date(props.shift.startTime).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }),
);

const durationLabel = computed(() => {
  const total = props.durationMinutes;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}j ${minutes}m`;
});

function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

function formatRupiah(value: number): string {
  return `Rp ${formatNumber(value)}`;
}

function handleNumericInput(
  categoryId: string,
  field: 'cash' | 'qris',
  event: Event,
) {
  const target = event.target as HTMLInputElement;
  const cleaned = target.value.replace(/\D/g, '');
  const parsed = cleaned === '' ? 0 : parseInt(cleaned, 10);

  // Cash now via denomination input — this handler hanya untuk QRIS sekarang.
  if (field === 'qris') {
    actualQRIS[categoryId] = parsed;
    formattedQRIS[categoryId] = parsed === 0 ? '' : formatNumber(parsed);
  }
  handleClearError();
}

/** Dipanggil oleh CashDenominationInput tiap total berubah. */
function onDenominationTotalChange(categoryId: string, total: number) {
  actualCash[categoryId] = total;
  handleClearError();
}

function handleClearError() {
  if (props.errorMessage) emit('clear-error');
}

function handleCancel() {
  showCloseForm.value = false;
  for (const key of Object.keys(denominationsByCategory)) {
    denominationsByCategory[key] = {};
  }
  for (const key of Object.keys(actualCash)) {
    actualCash[key] = 0;
  }
  for (const key of Object.keys(actualQRIS)) {
    actualQRIS[key] = 0;
    formattedQRIS[key] = '';
  }
  notes.value = '';
}

function handleSubmitClose() {
  emit('close-shift', {
    actualByCategory: props.shift.cashBoxes.map((cb) => ({
      categoryId: cb.categoryId,
      actualCash: actualCash[cb.categoryId] ?? 0,
      actualQRIS: actualQRIS[cb.categoryId] ?? 0,
      denominations: denominationsByCategory[cb.categoryId] ?? undefined,
    })),
    notes: notes.value.trim() || undefined,
  });
}

function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? ''))
    .toUpperCase()
    .slice(0, 2);
}

function colorBg(color?: string | null): string {
  switch ((color ?? '').toLowerCase()) {
    case 'amber':
      return 'bg-amber-100 border border-amber-200';
    case 'emerald':
    case 'green':
      return 'bg-emerald-100 border border-emerald-200';
    case 'red':
      return 'bg-red-100 border border-red-200';
    case 'purple':
      return 'bg-purple-100 border border-purple-200';
    case 'pink':
      return 'bg-pink-100 border border-pink-200';
    case 'indigo':
      return 'bg-indigo-100 border border-indigo-200';
    case 'orange':
      return 'bg-orange-100 border border-orange-200';
    case 'blue':
    default:
      return 'bg-blue-100 border border-blue-200';
  }
}

function colorText(color?: string | null): string {
  switch ((color ?? '').toLowerCase()) {
    case 'amber':
      return 'text-amber-700';
    case 'emerald':
    case 'green':
      return 'text-emerald-700';
    case 'red':
      return 'text-red-700';
    case 'purple':
      return 'text-purple-700';
    case 'pink':
      return 'text-pink-700';
    case 'indigo':
      return 'text-indigo-700';
    case 'orange':
      return 'text-orange-700';
    case 'blue':
    default:
      return 'text-blue-700';
  }
}
</script>
