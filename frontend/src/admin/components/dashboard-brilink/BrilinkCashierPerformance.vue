<template>
  <div
    class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
  >
    <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
      <h3 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
        Performance Kasir BRILink Hari Ini
      </h3>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-5 space-y-3">
      <div v-for="i in 5" :key="i" class="h-10 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="p-5 text-center">
      <p class="text-xs text-red-600 dark:text-red-400">{{ error }}</p>
    </div>

    <!-- Empty -->
    <div v-else-if="cashiers.length === 0" class="p-8 text-center">
      <p class="text-xs text-slate-500 dark:text-slate-400">Belum ada transaksi kasir hari ini.</p>
    </div>

    <!-- Bar chart + list -->
    <div v-else class="p-5 space-y-3">
      <div
        v-for="(cashier, idx) in cashiers"
        :key="cashier.userId"
        class="space-y-1"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-4">{{ idx + 1 }}</span>
            <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
              {{ cashier.name }}
            </span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-[10px] font-mono text-slate-600 dark:text-slate-400">
              {{ cashier.transactionCount }} trx
            </span>
            <span class="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
              {{ formatCompact(cashier.totalFee) }}
            </span>
          </div>
        </div>
        <!-- Bar -->
        <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            class="h-full rounded-full bg-purple-500 dark:bg-purple-400 transition-all"
            :style="{ width: getBarWidth(cashier.transactionCount) + '%' }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CashierPerformanceItem } from '@/shared/services/dashboard-brilink.service';

const props = defineProps<{
  cashiers: CashierPerformanceItem[];
  loading: boolean;
  error: string | null;
}>();

const maxCount = computed(() => {
  if (props.cashiers.length === 0) return 1;
  return Math.max(...props.cashiers.map((c) => c.transactionCount), 1);
});

function getBarWidth(count: number): number {
  return Math.round((count / maxCount.value) * 100);
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  return `Rp ${amount}`;
}
</script>
