<template>
  <div
    class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
  >
    <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
      <h3 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
        Breakdown per Kategori
      </h3>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-5 space-y-2">
      <div v-for="i in 7" :key="i" class="h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="p-5 text-center">
      <p class="text-xs text-red-600 dark:text-red-400">{{ error }}</p>
    </div>

    <!-- Content -->
    <div v-else-if="breakdown" class="p-5 space-y-3">
      <div
        v-for="item in breakdown.data"
        :key="item.category"
        class="space-y-1"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span
              :class="['w-2.5 h-2.5 rounded-sm', getCategoryColor(item.category)]"
            />
            <span class="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              {{ getCategoryLabel(item.category) }}
            </span>
          </div>
          <span class="text-[10px] font-mono text-slate-500 dark:text-slate-400">
            {{ item.count }} trx
          </span>
        </div>
        <!-- Progress bar -->
        <div class="flex items-center gap-2">
          <div class="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              :class="['h-full rounded-full', getCategoryBarColor(item.category)]"
              :style="{ width: item.volumePercent + '%' }"
            />
          </div>
          <span class="text-[10px] font-mono text-slate-600 dark:text-slate-400 w-10 text-right">
            {{ item.volumePercent }}%
          </span>
        </div>
        <div class="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
          <span>Vol: {{ formatCompact(item.volume) }}</span>
          <span class="text-emerald-600 dark:text-emerald-400">Fee: {{ formatCompact(item.feeEarnings) }}</span>
        </div>
      </div>

      <!-- Totals -->
      <div class="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <span class="text-[11px] font-bold text-slate-700 dark:text-slate-300">Total</span>
        <div class="text-right">
          <p class="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
            {{ formatCompact(breakdown.totalVolume) }}
          </p>
          <p class="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
            Fee: {{ formatCompact(breakdown.totalFee) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CategoryBreakdownResponse } from '@/shared/services/dashboard-brilink.service';

defineProps<{
  breakdown: CategoryBreakdownResponse | null;
  loading: boolean;
  error: string | null;
}>();

const CATEGORY_META: Record<string, { label: string; color: string; barColor: string }> = {
  TRANSFER_BRI: { label: 'Transfer BRI', color: 'bg-blue-500', barColor: 'bg-blue-500' },
  TRANSFER_OTHER: { label: 'Transfer Lain', color: 'bg-indigo-500', barColor: 'bg-indigo-500' },
  TARIK_TUNAI: { label: 'Tarik Tunai', color: 'bg-amber-500', barColor: 'bg-amber-500' },
  TOPUP_PULSA: { label: 'Top-Up Pulsa', color: 'bg-pink-500', barColor: 'bg-pink-500' },
  TOPUP_DATA: { label: 'Top-Up Data', color: 'bg-purple-500', barColor: 'bg-purple-500' },
  TOPUP_EWALLET: { label: 'Top-Up E-Wallet', color: 'bg-cyan-500', barColor: 'bg-cyan-500' },
  TOPUP_PLN: { label: 'Top-Up PLN', color: 'bg-yellow-500', barColor: 'bg-yellow-500' },
};

function getCategoryLabel(cat: string): string {
  return CATEGORY_META[cat]?.label ?? cat;
}

function getCategoryColor(cat: string): string {
  return CATEGORY_META[cat]?.color ?? 'bg-slate-400';
}

function getCategoryBarColor(cat: string): string {
  return CATEGORY_META[cat]?.barColor ?? 'bg-slate-400';
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  return `Rp ${amount}`;
}
</script>
