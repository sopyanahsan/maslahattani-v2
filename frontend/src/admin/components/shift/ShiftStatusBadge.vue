<template>
  <span
    :class="[
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide',
      tone.bg,
      tone.text,
    ]"
  >
    <span v-if="status === 'OPEN'" class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
    <component v-else-if="status === 'FINALIZED'" :is="CheckIcon" class="w-3 h-3" />
    <component v-else :is="ClockIcon" class="w-3 h-3" />
    {{ tone.label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Check as CheckIcon, Clock as ClockIcon } from 'lucide-vue-next';
import type { ShiftStatus } from '@/shared/services/shift.service';

interface Props {
  status: ShiftStatus;
}

const props = defineProps<Props>();

const tone = computed(() => {
  switch (props.status) {
    case 'OPEN':
      return {
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        label: 'Aktif',
      };
    case 'CLOSED':
      return {
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        label: 'Ditutup',
      };
    case 'FINALIZED':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        label: 'Final',
      };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-600', label: '?' };
  }
});
</script>
