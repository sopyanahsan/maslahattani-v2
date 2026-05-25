<template>
  <div class="flex items-center gap-3">
    <div
      :class="[
        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
        muted ? 'bg-slate-100 border border-slate-200' : 'bg-blue-100 border border-blue-200',
      ]"
    >
      <component
        :is="icon"
        :class="['w-5 h-5', muted ? 'text-slate-600' : 'text-blue-600']"
      />
    </div>
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2 flex-wrap">
        <h2
          :class="[
            'text-base sm:text-lg font-bold leading-tight',
            muted ? 'text-slate-700' : 'text-slate-950',
          ]"
        >
          {{ title }}
        </h2>
        <span
          v-if="badge"
          :class="[
            'inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full',
            badgeClass,
          ]"
        >
          {{ badge }}
        </span>
      </div>
      <p v-if="subtitle" class="text-xs text-slate-500 mt-0.5">{{ subtitle }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';

type BadgeTone = 'emerald' | 'blue' | 'amber' | 'red' | 'slate';

const props = withDefaults(
  defineProps<{
    icon: Component;
    title: string;
    subtitle?: string;
    badge?: string;
    badgeTone?: BadgeTone;
    /** Style header lebih redup, dipakai untuk section yang belum aktif (mis. Phase 2). */
    muted?: boolean;
  }>(),
  {
    badgeTone: 'blue',
    muted: false,
  },
);

const badgeClass = computed(() => {
  const map: Record<BadgeTone, string> = {
    emerald: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    slate: 'bg-slate-200 text-slate-700',
  };
  return map[props.badgeTone];
});
</script>
