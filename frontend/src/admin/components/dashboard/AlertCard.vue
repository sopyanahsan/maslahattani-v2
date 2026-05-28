<template>
  <div
    :class="[
      'rounded-lg border p-4 sm:p-5 flex flex-col gap-2 transition-colors',
      cardClass,
    ]"
  >
    <div class="flex items-start gap-3">
      <div :class="['w-9 h-9 rounded-lg flex items-center justify-center shrink-0', iconBg]">
        <component :is="resolvedIcon" :class="['w-4 h-4', iconColor]" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center justify-between gap-2">
          <p class="text-sm font-bold leading-tight" :class="titleColor">
            {{ title }}
          </p>
          <span
            v-if="!allClear && count > 0"
            :class="[
              'text-[10px] font-bold px-2 py-0.5 rounded-full',
              countBadgeClass,
            ]"
          >
            {{ count }}
          </span>
        </div>
        <p
          class="text-[11px] mt-0.5 leading-snug"
          :class="descColor"
        >
          {{ description }}
        </p>
      </div>
    </div>

    <slot />

    <div v-if="actionLabel && actionTo && !allClear" class="mt-1">
      <RouterLink
        :to="actionTo"
        :class="[
          'inline-flex items-center gap-1 text-[11px] font-semibold underline-offset-2 hover:underline',
          actionColor,
        ]"
      >
        {{ actionLabel }} →
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';
import { RouterLink } from 'vue-router';
import {
  AlertCircle as AlertCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  Clock as ClockIcon,
  CheckCircle2 as CheckCircle2Icon,
  type LucideIcon,
} from 'lucide-vue-next';

type Severity = 'red' | 'yellow' | 'orange' | 'green';

const props = withDefaults(
  defineProps<{
    severity: Severity;
    icon?: Component | LucideIcon;
    title: string;
    count?: number;
    description: string;
    actionLabel?: string;
    actionTo?: string;
    /** Override severity styling: tampilkan card "all clear" hijau. */
    allClear?: boolean;
  }>(),
  {
    count: 0,
    allClear: false,
  },
);

const resolvedIcon = computed<Component | LucideIcon>(() => {
  if (props.allClear) return CheckCircle2Icon;
  if (props.icon) return props.icon;
  switch (props.severity) {
    case 'red':
      return AlertCircleIcon;
    case 'yellow':
      return AlertTriangleIcon;
    case 'orange':
      return ClockIcon;
    case 'green':
      return CheckCircle2Icon;
    default:
      return AlertCircleIcon;
  }
});

const effectiveSeverity = computed<Severity>(() =>
  props.allClear ? 'green' : props.severity,
);

const cardClass = computed(() => {
  switch (effectiveSeverity.value) {
    case 'red':
      return 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50';
    case 'yellow':
      return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-900/50';
    case 'orange':
      return 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900/50';
    case 'green':
      return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50';
  }
});

const iconBg = computed(() => {
  switch (effectiveSeverity.value) {
    case 'red':
      return 'bg-red-100 dark:bg-red-900/30';
    case 'yellow':
      return 'bg-yellow-100 dark:bg-yellow-900/30';
    case 'orange':
      return 'bg-orange-100 dark:bg-orange-900/30';
    case 'green':
      return 'bg-emerald-100 dark:bg-emerald-900/30';
  }
});

const iconColor = computed(() => {
  switch (effectiveSeverity.value) {
    case 'red':
      return 'text-red-600 dark:text-red-400';
    case 'yellow':
      return 'text-yellow-700 dark:text-yellow-400';
    case 'orange':
      return 'text-orange-700 dark:text-orange-400';
    case 'green':
      return 'text-emerald-600 dark:text-emerald-400';
  }
});

const titleColor = computed(() => {
  switch (effectiveSeverity.value) {
    case 'red':
      return 'text-red-800 dark:text-red-200';
    case 'yellow':
      return 'text-yellow-900 dark:text-yellow-200';
    case 'orange':
      return 'text-orange-900 dark:text-orange-200';
    case 'green':
      return 'text-emerald-800 dark:text-emerald-200';
  }
});

const descColor = computed(() => {
  switch (effectiveSeverity.value) {
    case 'red':
      return 'text-red-700 dark:text-red-300';
    case 'yellow':
      return 'text-yellow-800 dark:text-yellow-300';
    case 'orange':
      return 'text-orange-800 dark:text-orange-300';
    case 'green':
      return 'text-emerald-700 dark:text-emerald-300';
  }
});

const countBadgeClass = computed(() => {
  switch (effectiveSeverity.value) {
    case 'red':
      return 'bg-red-600 text-white';
    case 'yellow':
      return 'bg-yellow-600 text-white';
    case 'orange':
      return 'bg-orange-600 text-white';
    case 'green':
      return 'bg-emerald-600 text-white';
  }
});

const actionColor = computed(() => {
  switch (effectiveSeverity.value) {
    case 'red':
      return 'text-red-700 dark:text-red-300';
    case 'yellow':
      return 'text-yellow-800 dark:text-yellow-300';
    case 'orange':
      return 'text-orange-800 dark:text-orange-300';
    case 'green':
      return 'text-emerald-700 dark:text-emerald-300';
  }
});
</script>
