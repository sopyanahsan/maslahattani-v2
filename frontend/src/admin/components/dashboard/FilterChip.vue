<template>
  <button
    type="button"
    :class="[
      'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap border',
      active
        ? activeClass
        : subtle
        ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200',
    ]"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type Tone = 'blue' | 'indigo' | 'emerald' | 'amber' | 'red' | 'slate';

const props = withDefaults(
  defineProps<{
    active: boolean;
    tone?: Tone;
    /** Render lebih kecil/redup untuk sub-filter. */
    subtle?: boolean;
  }>(),
  {
    tone: 'slate',
    subtle: false,
  },
);

const activeClass = computed(() => {
  const map: Record<Tone, string> = {
    blue: 'bg-blue-600 text-white border-blue-600',
    indigo: 'bg-indigo-600 text-white border-indigo-600',
    emerald: 'bg-emerald-600 text-white border-emerald-600',
    amber: 'bg-amber-500 text-white border-amber-500',
    red: 'bg-red-600 text-white border-red-600',
    slate: 'bg-slate-900 text-white border-slate-900',
  };
  return map[props.tone];
});
</script>
