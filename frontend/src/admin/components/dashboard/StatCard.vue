<template>
  <div
    :class="[
      'rounded-lg border shadow-sm p-4 sm:p-5 transition-colors',
      disabled
        ? 'bg-slate-50 dark:bg-[#1a1c1c] border-slate-200 dark:border-[#3d4948] border-dashed'
        : 'bg-white dark:bg-[#1e2020] border-slate-200 dark:border-[#3d4948]',
    ]"
  >
    <div class="flex items-start justify-between mb-3">
      <div
        :class="[
          'w-9 h-9 rounded-lg flex items-center justify-center',
          disabled ? 'bg-slate-200' : toneIconBg,
        ]"
      >
        <component
          :is="icon"
          :class="['w-4 h-4', disabled ? 'text-slate-400' : toneIconColor]"
        />
      </div>

      <!-- Phase 2 / coming soon badge -->
      <span
        v-if="disabled"
        class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full"
      >
        <component :is="LockIcon" class="w-2.5 h-2.5" />
        {{ disabledLabel }}
      </span>

      <span
        v-else-if="delta && !loading"
        :class="[
          'text-[11px] font-semibold flex items-center gap-0.5',
          deltaPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
        ]"
      >
        <component
          :is="deltaPositive ? TrendingUpIcon : TrendingDownIcon"
          class="w-3 h-3"
        />
        {{ delta }}
      </span>
    </div>

    <p
      :class="[
        'text-[11px] sm:text-xs mb-1',
        disabled ? 'text-slate-400 dark:text-[#869392]' : 'text-slate-500 dark:text-[#bcc9c7]',
      ]"
    >
      {{ label }}
    </p>

    <p v-if="loading" class="h-7 w-24 bg-slate-200 dark:bg-[#292a2a] rounded animate-pulse"></p>
    <p
      v-else
      :class="[
        'text-lg sm:text-xl font-bold font-mono leading-tight break-words',
        disabled ? 'text-slate-400 dark:text-[#869392]' : 'text-slate-950 dark:text-[#e3e2e2]',
      ]"
    >
      {{ value }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Lock as LockIcon,
} from 'lucide-vue-next';

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
    /** Render greyed-out preview state (e.g. fitur Phase 2). */
    disabled?: boolean;
    /** Label badge saat disabled. Default: "PHASE 2". */
    disabledLabel?: string;
  }>(),
  {
    deltaPositive: true,
    tone: 'blue',
    loading: false,
    disabled: false,
    disabledLabel: 'Phase 2',
  },
);

const toneIconBg = computed(() => {
  const map: Record<Tone, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30',
    amber: 'bg-amber-100 dark:bg-amber-900/30',
    red: 'bg-red-100 dark:bg-red-900/30',
    slate: 'bg-slate-100 dark:bg-[#292a2a]',
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
    slate: 'text-slate-700 dark:text-[#bcc9c7]',
  };
  return map[props.tone];
});
</script>
