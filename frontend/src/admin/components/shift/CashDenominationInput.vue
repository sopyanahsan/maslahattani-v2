<template>
  <div class="space-y-4">
    <!-- Category Header -->
    <div
      v-for="category in categories"
      :key="category.label"
      class="space-y-2"
    >
      <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wide">
        {{ category.label }}
      </h4>
      <div class="space-y-1.5">
        <div
          v-for="denom in category.denominations"
          :key="denom.value"
          class="flex items-center gap-3"
        >
          <!-- Denomination label -->
          <span class="w-20 text-xs font-mono text-slate-600 text-right shrink-0">
            {{ formatDenom(denom.value) }}
          </span>

          <!-- Multiply sign -->
          <span class="text-xs text-slate-400 shrink-0">&times;</span>

          <!-- Quantity input -->
          <input
            :value="getQuantity(denom.value)"
            type="number"
            min="0"
            inputmode="numeric"
            class="w-16 h-8 px-2 text-sm font-mono text-center border border-slate-300 rounded-md
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none
                   disabled:bg-slate-100 disabled:text-slate-400"
            :disabled="disabled"
            @input="onInput(denom.value, $event)"
          />

          <!-- Equals sign -->
          <span class="text-xs text-slate-400 shrink-0">=</span>

          <!-- Subtotal -->
          <span class="flex-1 text-xs font-mono text-slate-900 text-right">
            {{ formatRupiah(getQuantity(denom.value) * denom.value) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Grand Total -->
    <div class="pt-3 border-t border-slate-200 flex items-center justify-between">
      <span class="text-sm font-bold text-slate-900">Total Tunai</span>
      <span class="text-base font-bold font-mono text-slate-950">
        {{ formatRupiah(grandTotal) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface DenominationEntry {
  value: number;
  quantity: number;
}

interface Props {
  /** Map of denomination value → quantity */
  modelValue: Record<number, number>;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: Record<number, number>];
}>();

// Indonesian Rupiah denominations grouped by category
const categories = [
  {
    label: 'Kertas',
    denominations: [
      { value: 100000 },
      { value: 50000 },
      { value: 20000 },
      { value: 10000 },
      { value: 5000 },
      { value: 2000 },
      { value: 1000 },
    ],
  },
  {
    label: 'Logam',
    denominations: [
      { value: 500 },
      { value: 200 },
      { value: 100 },
    ],
  },
];

function getQuantity(denom: number): number {
  return props.modelValue[denom] ?? 0;
}

function onInput(denom: number, event: Event) {
  const target = event.target as HTMLInputElement;
  const qty = Math.max(0, parseInt(target.value) || 0);
  emit('update:modelValue', {
    ...props.modelValue,
    [denom]: qty,
  });
}

const grandTotal = computed(() => {
  return Object.entries(props.modelValue).reduce((sum, [denom, qty]) => {
    return sum + Number(denom) * (qty || 0);
  }, 0);
});

function formatDenom(value: number): string {
  if (value >= 1000) return `${(value / 1000).toLocaleString('id-ID')}rb`;
  return value.toString();
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Expose grandTotal for parent
defineExpose({ grandTotal });
</script>
