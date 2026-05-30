<template>
  <div class="space-y-5">
    <div></div>

    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
      <component :is="ReceiptIcon" class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
      <p class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
        Halaman Transaksi BRILink
      </p>
      <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
        Untuk sementara, akses tab "Mutasi" di Dashboard BRILink lama.
        Implementasi detail di PRD section BRILink.
      </p>
      <RouterLink
        to="/admin/brilink"
        class="inline-flex items-center gap-2 h-8 px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300
               text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700
               hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        Buka Dashboard BRILink
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Receipt as ReceiptIcon } from 'lucide-vue-next';
</script>
