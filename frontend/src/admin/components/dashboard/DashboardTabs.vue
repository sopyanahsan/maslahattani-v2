<template>
  <div
    class="inline-flex bg-slate-100 border border-slate-200 rounded-lg p-1 gap-1 w-full sm:w-auto overflow-x-auto"
    role="tablist"
  >
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      role="tab"
      :aria-selected="modelValue === tab.value"
      :class="[
        'inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap flex-1 sm:flex-none',
        modelValue === tab.value
          ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
          : 'text-slate-600 hover:text-slate-900',
      ]"
      @click="emit('update:modelValue', tab.value)"
    >
      <component :is="tab.icon" class="w-4 h-4 shrink-0" />
      <span>{{ tab.label }}</span>
      <span
        v-if="tab.badge"
        class="text-[9px] font-bold uppercase tracking-wide bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full"
      >
        {{ tab.badge }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

export interface DashboardTab<V extends string = string> {
  value: V;
  label: string;
  icon: Component;
  badge?: string;
}

defineProps<{
  modelValue: string;
  tabs: DashboardTab[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>
