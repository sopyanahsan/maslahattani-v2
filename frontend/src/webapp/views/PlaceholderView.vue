<template>
  <div
    :class="[
      'border rounded-xl p-6 sm:p-10 text-center',
      isPhase2
        ? 'bg-gradient-to-br from-slate-50 to-blue-50/40 border-dashed border-slate-300'
        : 'bg-white border-slate-200',
    ]"
  >
    <div
      :class="[
        'mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4',
        isPhase2 ? 'bg-white border border-slate-200' : 'bg-blue-100 border border-blue-200',
      ]"
    >
      <component
        :is="isPhase2 ? LandmarkIcon : WrenchIcon"
        :class="['w-7 h-7', isPhase2 ? 'text-slate-700' : 'text-blue-600']"
      />
    </div>

    <div class="flex items-center justify-center gap-2 mb-1 flex-wrap">
      <h2 class="text-lg sm:text-xl font-bold text-slate-950">{{ title }}</h2>
      <span
        v-if="isPhase2"
        class="text-[10px] font-bold uppercase tracking-wide text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full"
      >
        Phase 2
      </span>
    </div>

    <p class="text-xs text-slate-500 mb-2">
      {{ isPhase2 ? 'Modul ini akan tersedia di Phase 2' : 'Sedang dalam pengembangan' }}
    </p>
    <p v-if="description" class="text-sm text-slate-600 max-w-md mx-auto">
      {{ description }}
    </p>

    <div class="mt-5">
      <RouterLink
        to="/dashboard"
        class="inline-flex items-center gap-2 h-10 px-4 bg-slate-100 text-slate-900 text-sm font-semibold rounded-md border border-slate-200 hover:bg-slate-200 transition-colors"
      >
        <component :is="ArrowLeftIcon" class="w-4 h-4" />
        Kembali
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  Wrench as WrenchIcon,
  Landmark as LandmarkIcon,
  ArrowLeft as ArrowLeftIcon,
} from 'lucide-vue-next';

const route = useRoute();

const title = computed(() => (route.meta?.title as string | undefined) ?? 'Halaman');
const description = computed(() => (route.meta?.description as string | undefined) ?? '');
const isPhase2 = computed(() => (route.meta?.phase as number | undefined) === 2);
</script>
