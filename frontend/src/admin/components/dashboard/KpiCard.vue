<template>
  <div
    class="rounded-lg border border-slate-200 dark:border-[#3d4948] bg-white dark:bg-[#1e2020] p-4 sm:p-5 shadow-sm transition-colors hover:border-slate-300 dark:hover:border-[#5fd9d2]/40"
  >
    <div class="flex items-start justify-between mb-3">
      <div
        :class="[
          'w-9 h-9 rounded-lg flex items-center justify-center',
          toneIconBg,
        ]"
      >
        <component :is="icon" :class="['w-4 h-4', toneIconColor]" />
      </div>

      <span
        v-if="!loading && previousValue !== undefined && previousValue !== null"
        :class="[
          'text-[11px] font-semibold flex items-center gap-0.5',
          deltaColor,
        ]"
      >
        <component :is="deltaIcon" class="w-3 h-3" />
        {{ formatPercent(changePercent) }}
      </span>
    </div>

    <p class="text-[11px] sm:text-xs mb-1 text-slate-500 dark:text-[#bcc9c7]">
      {{ label }}
    </p>

    <p
      v-if="loading"
      class="h-7 w-28 bg-slate-200 dark:bg-[#292a2a] rounded animate-pulse"
    />
    <p
      v-else
      class="text-lg sm:text-xl font-bold font-mono leading-tight break-words text-slate-950 dark:text-[#e3e2e2]"
    >
      {{ formattedValue }}
    </p>

    <p
      v-if="!loading && previousValue !== undefined && previousValue !== null"
      class="text-[10px] text-slate-400 dark:text-[#869392] mt-1"
    >
      Sebelumnya: {{ formatValue(previousValue) }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Minus as MinusIcon,
} from 'lucide-vue-next';

type Tone = 'blue' | 'indigo' | 'emerald' | 'amber' | 'red' | 'slate';
type Format = 'rupiah' | 'number';

const props = withDefaults(
  defineProps<{
    label: string;
    value: number;
    previousValue?: number | null;
    /** Optional pre-computed change %; kalau gak di-pass, di-derive dari value/previousValue. */
    changePercent?: number;
    icon: Component;
    tone?: Tone;
    format?: Format;
    loading?: boolean;
  }>(),
  {
    tone: 'blue',
    format: 'number',
    loading: false,
  },
);

const formattedValue = computed(() => formatValue(props.value));

const computedChangePercent = computed(() => {
  if (props.changePercent !== undefined) return props.changePercent;
  if (props.previousValue === undefined || props.previousValue === null) {
    return 0;
  }
  if (props.previousValue === 0) return props.value > 0 ? 100 : 0;
  return (
    Math.round(((props.value - props.previousValue) / props.previousValue) * 1000) /
    10
  );
});

const changePercent = computed(() => computedChangePercent.value);

const deltaColor = computed(() => {
  if (changePercent.value > 0)
    return 'text-emerald-600 dark:text-emerald-400';
  if (changePercent.value < 0) return 'text-red-600 dark:text-red-400';
  return 'text-slate-500 dark:text-slate-400';
});

const deltaIcon = computed<Component>(() => {
  if (changePercent.value > 0) return TrendingUpIcon;
  if (changePercent.value < 0) return TrendingDownIcon;
  return MinusIcon;
});

const toneIconBg = computed(() => {
  const map: Record<Tone, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30',
    amber: 'bg-amber-100 dark:bg-amber-900/30',
    red: 'bg-red-100 dark:bg-red-900/30',
    slate: 'bg-slate-100 dark:bg-slate-800',
  };
  return map[props.tone];
});

const toneIconColor = computed(() => {
  const map: Record<Tone, string> = {
    blue: 'text-blue-600 dark:text-blue-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
    slate: 'text-slate-700 dark:text-slate-300',
  };
  return map[props.tone];
});

function formatValue(v: number): string {
  if (props.format === 'rupiah') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v || 0);
  }
  return new Intl.NumberFormat('id-ID').format(v || 0);
}

function formatPercent(p: number): string {
  const sign = p > 0 ? '+' : '';
  return `${sign}${p}%`;
}
</script>
