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
            Hitung uang fisik di laci kas, lalu input nominal aktualnya. Sistem
            otomatis hitung selisih dengan ekspektasi.
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

      <!-- Actual Cash -->
      <div>
        <label for="actual-cash" class="block text-xs font-semibold text-slate-900 mb-1.5">
          Uang Tunai Aktual di Laci <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <span
            class="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-mono text-slate-500"
          >
            Rp
          </span>
          <input
            id="actual-cash"
            v-model="actualCashDisplay"
            type="text"
            inputmode="numeric"
            placeholder="0"
            required
            :disabled="loading"
            class="input-field pl-10 font-mono text-right text-base"
            @input="(e) => handleNumericInput(e, 'cash')"
            @blur="handleClearError"
          />
        </div>
        <p class="mt-1 text-xs text-slate-500">
          Hitung semua uang fisik di laci kas, termasuk saldo awal.
        </p>
      </div>

      <!-- Actual QRIS -->
      <div>
        <label for="actual-qris" class="block text-xs font-semibold text-slate-900 mb-1.5">
          Total QRIS Diterima <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <span
            class="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-mono text-slate-500"
          >
            Rp
          </span>
          <input
            id="actual-qris"
            v-model="actualQRISDisplay"
            type="text"
            inputmode="numeric"
            placeholder="0"
            required
            :disabled="loading"
            class="input-field pl-10 font-mono text-right text-base"
            @input="(e) => handleNumericInput(e, 'qris')"
            @blur="handleClearError"
          />
        </div>
        <p class="mt-1 text-xs text-slate-500">
          Cek di app mitra QRIS, total transaksi sukses hari ini.
        </p>
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
          Setelah ditutup, shift akan menunggu finalisasi admin. Pastikan semua
          uang fisik sudah dihitung dengan teliti.
        </p>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  StopCircle as StopCircleIcon,
  AlertCircle as AlertCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  Loader2 as Loader2Icon,
} from 'lucide-vue-next';
import type { ShiftDto, CloseShiftPayload } from '@/shared/services/shift.service';

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

const actualCash = ref<number>(0);
const actualCashDisplay = ref<string>('');
const actualQRIS = ref<number>(0);
const actualQRISDisplay = ref<string>('');
const notes = ref<string>('');

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

function handleNumericInput(event: Event, field: 'cash' | 'qris') {
  const target = event.target as HTMLInputElement;
  const cleaned = target.value.replace(/\D/g, '');
  const parsed = cleaned === '' ? 0 : parseInt(cleaned, 10);
  if (field === 'cash') {
    actualCash.value = parsed;
    actualCashDisplay.value = parsed === 0 ? '' : formatNumber(parsed);
  } else {
    actualQRIS.value = parsed;
    actualQRISDisplay.value = parsed === 0 ? '' : formatNumber(parsed);
  }
  handleClearError();
}

function handleClearError() {
  if (props.errorMessage) emit('clear-error');
}

function handleCancel() {
  showCloseForm.value = false;
  // reset
  actualCash.value = 0;
  actualCashDisplay.value = '';
  actualQRIS.value = 0;
  actualQRISDisplay.value = '';
  notes.value = '';
}

function handleSubmitClose() {
  emit('close-shift', {
    actualCash: actualCash.value,
    actualQRIS: actualQRIS.value,
    notes: notes.value.trim() || undefined,
  });
}
</script>
