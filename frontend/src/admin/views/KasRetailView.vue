<template>
  <div class="space-y-5">
    <!-- Header -->
    <div>
      <h1 class="text-xl font-bold text-slate-950 dark:text-slate-100">Kas Retail</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        Mutasi kas retail dan pengaturan metode kas (kategori cashbox).
      </p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :class="[
          'h-8 px-4 text-xs font-semibold rounded-md transition-colors',
          activeTab === tab.key
            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200',
        ]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab content placeholder -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
      <component :is="activeTab === 'mutasi' ? WalletIcon : BoxesIcon" class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
      <p class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
        {{ activeTab === 'mutasi' ? 'Mutasi Kas Retail' : 'Metode Kas Retail' }}
      </p>
      <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
        {{ activeTab === 'mutasi'
          ? 'Riwayat cash in/out, audit kas, dan saldo per kategori. Implementasi detail menyusul di PRD section ini.'
          : 'CRUD kategori cashbox retail (RETAIL, SUBSIDI_PUPUK, dst). Implementasi detail menyusul di PRD section ini.' }}
      </p>
      <div class="mt-4 flex justify-center gap-2">
        <RouterLink
          v-if="activeTab === 'mutasi'"
          to="/admin/payments"
          class="inline-flex items-center gap-2 h-8 px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300
                 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700
                 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          Lihat halaman Pembayaran lama
        </RouterLink>
        <RouterLink
          v-else
          to="/admin/cashbox-categories"
          class="inline-flex items-center gap-2 h-8 px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300
                 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700
                 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          Lihat halaman Kategori Cashbox lama
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Wallet as WalletIcon, Boxes as BoxesIcon } from 'lucide-vue-next';

type TabKey = 'mutasi' | 'metode';
const tabs: { key: TabKey; label: string }[] = [
  { key: 'mutasi', label: 'Mutasi' },
  { key: 'metode', label: 'Metode Kas' },
];
const activeTab = ref<TabKey>('mutasi');
</script>
