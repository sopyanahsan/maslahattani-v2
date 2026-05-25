<template>
  <div class="bg-white border border-slate-200 rounded-lg p-8 sm:p-12 text-center max-w-2xl mx-auto">
    <div
      class="mx-auto w-14 h-14 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center mb-4"
    >
      <component :is="WrenchIcon" class="w-7 h-7 text-blue-600" />
    </div>
    <h2 class="text-xl sm:text-2xl font-bold text-slate-950 mb-1">
      {{ title }}
    </h2>
    <p class="text-sm text-slate-500 mb-2">Sedang dalam pengembangan</p>
    <p v-if="description" class="text-sm text-slate-600 max-w-md mx-auto">
      {{ description }}
    </p>

    <div class="mt-6 flex items-center justify-center gap-3">
      <RouterLink
        to="/admin/dashboard"
        class="inline-flex items-center gap-2 h-10 px-4 bg-slate-100 text-slate-900 text-sm font-semibold rounded-md border border-slate-200 hover:bg-slate-200 transition-colors"
      >
        <component :is="ArrowLeftIcon" class="w-4 h-4" />
        Kembali ke Dashboard
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Wrench as WrenchIcon, ArrowLeft as ArrowLeftIcon } from 'lucide-vue-next';

const route = useRoute();

const title = computed(() => {
  const meta = (route.meta?.title as string | undefined) || 'Halaman';
  return meta.replace(/\s*[—-]\s*Maslahat Tani.*$/i, '').trim() || meta;
});

const description = computed(() => {
  return (route.meta?.description as string | undefined) || '';
});
</script>
