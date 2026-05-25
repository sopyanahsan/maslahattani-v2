<template>
  <form
    class="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5"
    @submit.prevent="handleSubmit"
  >
    <!-- Header -->
    <div class="flex items-start gap-3">
      <div
        class="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0"
      >
        <component :is="PlayCircleIcon" class="w-6 h-6 text-emerald-600" />
      </div>
      <div>
        <h2 class="text-base font-bold text-slate-950">Buka Shift Baru</h2>
        <p class="text-xs text-slate-500 mt-0.5">
          Hitung uang fisik di laci kas dulu, lalu masukkan jumlah saldo awal.
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

    <!-- Starting cash -->
    <div>
      <label for="starting-cash" class="block text-xs font-semibold text-slate-900 mb-1.5">
        Saldo Kas Awal <span class="text-red-500">*</span>
      </label>
      <div class="relative">
        <span
          class="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-mono text-slate-500"
        >
          Rp
        </span>
        <input
          id="starting-cash"
          v-model="startingCashDisplay"
          type="text"
          inputmode="numeric"
          placeholder="0"
          required
          :disabled="loading"
          class="input-field pl-10 font-mono text-right text-base"
          :class="{ '!border-red-500 !ring-2 !ring-red-100': fieldError }"
          @input="handleCashInput"
          @blur="handleClearError"
        />
      </div>
      <p v-if="fieldError" class="mt-1 text-xs text-red-600">{{ fieldError }}</p>
      <p v-else class="mt-1 text-xs text-slate-500">
        Contoh: 500.000 (uang receh untuk kembalian).
      </p>
    </div>

    <!-- Notes (optional) -->
    <div>
      <label for="shift-notes" class="block text-xs font-semibold text-slate-900 mb-1.5">
        Catatan <span class="text-slate-400">(opsional)</span>
      </label>
      <textarea
        id="shift-notes"
        v-model="notes"
        rows="2"
        placeholder="Mis. Saldo dari shift kemarin, sudah dihitung 2x"
        :disabled="loading"
        class="input-field resize-none"
        @input="handleClearError"
      ></textarea>
    </div>

    <!-- Submit -->
    <button
      type="submit"
      :disabled="loading || !canSubmit"
      class="w-full h-12 px-6 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      <component v-if="loading" :is="Loader2Icon" class="w-4 h-4 animate-spin" />
      <component v-else :is="PlayCircleIcon" class="w-4 h-4" />
      {{ loading ? 'Membuka shift…' : 'Mulai Shift' }}
    </button>

    <!-- Helper -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
      <component :is="InfoIcon" class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
      <p class="text-[11px] text-blue-800 leading-relaxed">
        Shift wajib dibuka sebelum bertransaksi. Setiap transaksi akan dicatat
        dalam shift ini, dan saat tutup shift sistem hitung otomatis variance
        kas (selisih antara expected vs aktual).
      </p>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  PlayCircle as PlayCircleIcon,
  AlertCircle as AlertCircleIcon,
  Loader2 as Loader2Icon,
  Info as InfoIcon,
} from 'lucide-vue-next';
import type { OpenShiftPayload } from '@/shared/services/shift.service';

interface Props {
  loading?: boolean;
  errorMessage?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  errorMessage: null,
});

const emit = defineEmits<{
  (e: 'submit', payload: OpenShiftPayload): void;
  (e: 'clear-error'): void;
}>();

const startingCash = ref<number>(0);
const startingCashDisplay = ref<string>('');
const notes = ref<string>('');
const fieldError = ref<string>('');

const canSubmit = computed(() => startingCash.value >= 0);

function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

function handleCashInput(event: Event) {
  const target = event.target as HTMLInputElement;
  // Strip semua non-digit
  const cleaned = target.value.replace(/\D/g, '');
  const parsed = cleaned === '' ? 0 : parseInt(cleaned, 10);
  startingCash.value = parsed;
  startingCashDisplay.value = parsed === 0 ? '' : formatNumber(parsed);
  fieldError.value = '';
  handleClearError();
}

function handleClearError() {
  if (props.errorMessage) emit('clear-error');
}

function handleSubmit() {
  if (startingCash.value < 0) {
    fieldError.value = 'Saldo kas awal tidak boleh negatif.';
    return;
  }
  emit('submit', {
    startingCash: startingCash.value,
    notes: notes.value.trim() || undefined,
  });
}
</script>
