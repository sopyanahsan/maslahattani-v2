<template>
  <div class="space-y-5">
    <!-- Header -->
    <div>
      <h1 class="text-xl font-bold text-slate-950 dark:text-slate-100">Kas &amp; Rekening BRILink</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        Mutasi saldo BRI, daftar rekening, dan pengaturan metode kas BRILink.
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
      <component :is="activeIcon" class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
      <p class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
        {{ activeTitle }}
      </p>
      <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
        {{ activeDescription }}
      </p>
      <span class="inline-flex mt-4 text-[10px] font-bold uppercase tracking-wide
                   bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded">
        Implementasi detail di PRD section BRILink
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue';
import { Wallet as WalletIcon, Landmark as LandmarkIcon, Boxes as BoxesIcon } from 'lucide-vue-next';

type TabKey = 'mutasi' | 'rekening' | 'metode';
const tabs: { key: TabKey; label: string }[] = [
  { key: 'mutasi', label: 'Mutasi' },
  { key: 'rekening', label: 'Rekening BRI' },
  { key: 'metode', label: 'Metode Kas' },
];
const activeTab = ref<TabKey>('mutasi');

const activeIcon = computed<Component>(() => {
  if (activeTab.value === 'rekening') return LandmarkIcon;
  if (activeTab.value === 'metode') return BoxesIcon;
  return WalletIcon;
});

const activeTitle = computed(() => {
  if (activeTab.value === 'rekening') return 'Daftar Rekening BRI';
  if (activeTab.value === 'metode') return 'Metode Kas BRILink';
  return 'Mutasi Saldo BRILink';
});

const activeDescription = computed(() => {
  if (activeTab.value === 'rekening') {
    return 'Master data rekening BRI agen — 1 default + custom. Kelola saldo per rekening dan rekonsiliasi dengan mutasi BRI.';
  }
  if (activeTab.value === 'metode') {
    return 'CRUD kategori cashbox BRILink (TRANSFER, TARIK_TUNAI, TOPUP_PULSA, dst).';
  }
  return 'Riwayat keluar masuk uang per rekening BRILink, filter by tanggal & kategori.';
});
</script>
