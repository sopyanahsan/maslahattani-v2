<template>
  <div class="space-y-2">
    <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
      Hitung Uang Fisik per Pecahan
    </p>

    <!-- Denomination grid -->
    <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
      <div
        v-for="key in DENOMINATION_KEYS"
        :key="key"
        class="grid grid-cols-12 items-center gap-2"
      >
        <!-- Label -->
        <div class="col-span-4 flex items-center gap-1.5">
          <span class="text-xs font-mono text-slate-700">
            {{ key === 'lainnya' ? 'Lainnya / Koin' : `Rp ${formatNumber(parseInt(key))}` }}
          </span>
        </div>

        <!-- Input -->
        <div class="col-span-4">
          <div class="relative">
            <span
              v-if="key === 'lainnya'"
              class="absolute inset-y-0 left-0 pl-2 flex items-center text-[10px] font-mono text-slate-400"
            >
              Rp
            </span>
            <input
              :value="formattedValues[key] || ''"
              type="text"
              inputmode="numeric"
              :placeholder="key === 'lainnya' ? '0' : '0'"
              :disabled="disabled"
              :class="[
                'w-full h-8 text-xs font-mono text-right rounded border border-slate-200 bg-white focus:ring-2 focus:ring-blue-200 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed',
                key === 'lainnya' ? 'pl-7 pr-2' : 'px-2',
              ]"
              @input="(e) => handleInput(key, e)"
            />
          </div>
        </div>

        <!-- Suffix -->
        <div class="col-span-1 text-[10px] text-slate-500 font-mono">
          {{ key === 'lainnya' ? '' : 'lbr' }}
        </div>

        <!-- Subtotal -->
        <div class="col-span-3 text-right">
          <span
            :class="[
              'text-xs font-mono',
              subtotals[key] > 0 ? 'text-slate-900 font-semibold' : 'text-slate-400',
            ]"
          >
            {{ subtotals[key] > 0 ? `Rp ${formatNumber(subtotals[key])}` : '—' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Total -->
    <div
      class="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center justify-between"
    >
      <p class="text-xs font-bold text-blue-900">Total Uang Tunai</p>
      <p class="text-base font-mono font-bold text-blue-900">
        Rp {{ formatNumber(total) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import {
  DENOMINATION_KEYS,
  computeTotalFromDenominations,
  type CashDenominations,
} from '@/shared/services/shift.service';

interface Props {
  /** Two-way bound value via v-model. Object dengan keys denominasi. */
  modelValue: CashDenominations;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: CashDenominations): void;
  /** Emit total terkalkulasi setiap kali ada perubahan input. */
  (e: 'totalChange', total: number): void;
}>();

/**
 * Local reactive state untuk display value (formatted dgn separator).
 * Internal numeric value tetap dipegang oleh `props.modelValue`.
 */
const formattedValues = reactive<Record<string, string>>({});

// Hydrate display values dari modelValue saat mount / berubah eksternal.
watch(
  () => props.modelValue,
  (val) => {
    for (const key of DENOMINATION_KEYS) {
      const num = val[key as keyof CashDenominations] ?? 0;
      formattedValues[key] = num === 0 ? '' : formatNumber(num);
    }
  },
  { immediate: true, deep: true },
);

const subtotals = computed<Record<string, number>>(() => {
  const result: Record<string, number> = {};
  for (const key of DENOMINATION_KEYS) {
    const value = props.modelValue[key as keyof CashDenominations] ?? 0;
    if (key === 'lainnya') {
      result[key] = value;
    } else {
      result[key] = parseInt(key, 10) * value;
    }
  }
  return result;
});

const total = computed(() => computeTotalFromDenominations(props.modelValue));

// Emit total saat berubah supaya parent bisa display / submit.
watch(total, (val) => emit('totalChange', val), { immediate: true });

function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

function handleInput(key: keyof CashDenominations, event: Event) {
  const target = event.target as HTMLInputElement;
  const cleaned = target.value.replace(/\D/g, '');
  const parsed = cleaned === '' ? 0 : parseInt(cleaned, 10);

  // Update display
  formattedValues[key as string] = parsed === 0 ? '' : formatNumber(parsed);

  // Emit new modelValue with this key updated
  const next: CashDenominations = { ...props.modelValue, [key]: parsed };
  emit('update:modelValue', next);
}
</script>
