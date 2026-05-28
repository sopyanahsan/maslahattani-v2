<template>
  <div
    class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
  >
    <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
      <h3 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
        Saldo Rekening BRI
      </h3>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-5 space-y-3">
      <div v-for="i in 2" :key="i" class="h-16 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="p-5 text-center">
      <p class="text-xs text-red-600 dark:text-red-400">{{ error }}</p>
    </div>

    <!-- Empty -->
    <div v-else-if="accounts.length === 0" class="p-5 text-center">
      <p class="text-xs text-slate-500 dark:text-slate-400">Belum ada rekening BRI.</p>
      <RouterLink
        to="/admin/kas-rekening-brilink"
        class="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
      >
        Tambah Rekening →
      </RouterLink>
    </div>

    <!-- Account list -->
    <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
      <div
        v-for="account in accounts"
        :key="account.id"
        class="px-5 py-3 flex items-center justify-between gap-3"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <p class="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {{ account.label }}
            </p>
            <span
              v-if="account.isDefault"
              class="text-[9px] font-bold uppercase bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded"
            >
              Default
            </span>
          </div>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            {{ account.accountNumber }}
          </p>
        </div>
        <div class="text-right shrink-0">
          <p
            :class="[
              'text-sm font-bold font-mono',
              account.isLowBalance
                ? 'text-red-600 dark:text-red-400'
                : 'text-slate-900 dark:text-slate-100',
            ]"
          >
            {{ formatRupiah(account.balance) }}
          </p>
          <p
            v-if="account.isLowBalance"
            class="text-[10px] text-red-500 dark:text-red-400 font-semibold"
          >
            ⚠ Di bawah threshold
          </p>
        </div>
      </div>

      <!-- Link to full page -->
      <div class="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/50">
        <RouterLink
          to="/admin/kas-rekening-brilink"
          class="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Buka Mutasi & Rekening →
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import type { BrilinkAccountItem } from '@/shared/services/dashboard-brilink.service';

defineProps<{
  accounts: BrilinkAccountItem[];
  loading: boolean;
  error: string | null;
}>();

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
</script>
