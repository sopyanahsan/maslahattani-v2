<template>
  <div class="flex items-center justify-between py-2">
    <div class="min-w-0 pr-4">
      <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ label }}</p>
      <p v-if="desc" class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{{ desc }}</p>
    </div>
    <button
      type="button"
      :class="[
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0',
        modelValue ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600',
      ]"
      @click="$emit('update:modelValue', !modelValue)"
    >
      <span
        :class="[
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
          modelValue ? 'translate-x-6' : 'translate-x-1',
        ]"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  label: string;
  desc?: string;
}>();

defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();
</script>
