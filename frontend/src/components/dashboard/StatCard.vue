<template>
  <div class="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-5">
    <div class="flex items-start justify-between mb-3">
      <div :class="['w-9 h-9 rounded-lg flex items-center justify-center', toneIconBg]">
        <component :is="icon" :class="['w-4 h-4', toneIconColor]" />
      </div>
      <span
        v-if="delta && !loading"
        :class="[
          'text-[11px] font-semibold flex items-center gap-0.5',
          deltaPositive ? 'text-emerald-600' : 'text-amber-600',
        ]"
      >
        <component
          :is="deltaPositive ? TrendingUpIcon : TrendingDownIcon"
          class="w-3 h-3"
        />
        {{ delta }}
      </span>
    </div>

    <p class="text-[11px] sm:text-xs text-slate-500 mb-1">{{ label }}</p>

    <p v-if="loading" class="h-7 w-24 bg-slate-200 rounded animate-pulse"></p>
    <p v-else class="text-lg sm:text-xl font-bold font-mono text-slate-950 leading-tight break-words">
      {{ value }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon } from 'lucide-vue-next';

type Tone = 'blue' | 'indigo' | 'emerald' | 'amber' | 'red' | 'slate';

const props = withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    delta?: string;
    deltaPositive?: boolean;
    icon: Component;
    tone?: Tone;
    loading?: boolean;
  }>(),
  {
    deltaPositive: true,
    tone: 'blue',
    loading: false,
  },
);

const toneIconBg = computed(() => {
  const map: Record<Tone, string> = {
    blue: 'bg-blue-100',
    indigo: 'bg-indigo-100',
    emerald: 'bg-emerald-100',
    amber: 'bg-amber-100',
    red: 'bg-red-100',
    slate: 'bg-slate-100',
  };
  return map[props.tone];
});

const toneIconColor = computed(() => {
  const map: Record<Tone, string> = {
    blue: 'text-blue-600',
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    slate: 'text-slate-700',
  };
  return map[props.tone];
});
</script>
