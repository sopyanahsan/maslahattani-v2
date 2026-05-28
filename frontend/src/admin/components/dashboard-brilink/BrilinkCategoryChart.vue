<template>
  <div
    class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
  >
    <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
      <h3 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
        Transaksi BRILink per Kategori
      </h3>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-6">
      <div class="space-y-3">
        <div v-for="i in 5" :key="i" class="h-6 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="p-6 text-center">
      <p class="text-xs text-red-600 dark:text-red-400">{{ error }}</p>
    </div>

    <!-- Chart -->
    <div v-else-if="chartData" class="p-5">
      <!-- Legend -->
      <div class="flex flex-wrap gap-2 mb-4">
        <span
          v-for="cat in categories"
          :key="cat.key"
          class="inline-flex items-center gap-1 text-[10px] font-semibold"
        >
          <span :class="['w-2.5 h-2.5 rounded-sm', cat.color]" />
          <span class="text-slate-600 dark:text-slate-400">{{ cat.label }}</span>
        </span>
      </div>

      <!-- CSS Bar Chart -->
      <div class="space-y-1 max-h-[280px] overflow-y-auto">
        <div
          v-for="(label, idx) in chartData.labels"
          :key="label"
          class="flex items-center gap-2"
        >
          <span class="text-[10px] font-mono text-slate-500 dark:text-slate-400 w-12 shrink-0 text-right">
            {{ label.length > 5 ? label.slice(5) : label }}
          </span>
          <div class="flex-1 flex h-4 rounded overflow-hidden bg-slate-100 dark:bg-slate-800">
            <div
              v-for="cat in categories"
              :key="cat.key"
              :class="[cat.barColor]"
              :style="{ width: getBarWidth(idx, cat.key) + '%' }"
              :title="`${cat.label}: ${getBarValue(idx, cat.key)}`"
            />
          </div>
          <span class="text-[10px] font-mono text-slate-600 dark:text-slate-400 w-8 shrink-0">
            {{ getTotalForBucket(idx) }}
          </span>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="chartData.labels.length === 0"
        class="text-center py-8"
      >
        <p class="text-xs text-slate-500 dark:text-slate-400">Belum ada data transaksi.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BrilinkTransactionsChartResponse } from '@/shared/services/dashboard-brilink.service';

const props = defineProps<{
  chartData: BrilinkTransactionsChartResponse | null;
  loading: boolean;
  error: string | null;
}>();

const categories = [
  { key: 'TRANSFER_BRI', label: 'TF BRI', color: 'bg-blue-500', barColor: 'bg-blue-500' },
  { key: 'TRANSFER_OTHER', label: 'TF Lain', color: 'bg-indigo-500', barColor: 'bg-indigo-500' },
  { key: 'TARIK_TUNAI', label: 'Tarik', color: 'bg-amber-500', barColor: 'bg-amber-500' },
  { key: 'TOPUP_PULSA', label: 'Pulsa', color: 'bg-pink-500', barColor: 'bg-pink-500' },
  { key: 'TOPUP_DATA', label: 'Data', color: 'bg-purple-500', barColor: 'bg-purple-500' },
  { key: 'TOPUP_EWALLET', label: 'E-Wallet', color: 'bg-cyan-500', barColor: 'bg-cyan-500' },
  { key: 'TOPUP_PLN', label: 'PLN', color: 'bg-yellow-500', barColor: 'bg-yellow-500' },
];

const maxTotal = computed(() => {
  if (!props.chartData) return 1;
  let max = 0;
  for (let i = 0; i < props.chartData.labels.length; i++) {
    let total = 0;
    for (const cat of categories) {
      total += props.chartData.datasets[cat.key]?.[i] ?? 0;
    }
    if (total > max) max = total;
  }
  return max || 1;
});

function getTotalForBucket(idx: number): number {
  if (!props.chartData) return 0;
  let total = 0;
  for (const cat of categories) {
    total += props.chartData.datasets[cat.key]?.[idx] ?? 0;
  }
  return total;
}

function getBarWidth(idx: number, catKey: string): number {
  if (!props.chartData) return 0;
  const val = props.chartData.datasets[catKey]?.[idx] ?? 0;
  const total = getTotalForBucket(idx);
  if (total === 0) return 0;
  // Width relative to max bucket (so the biggest bucket fills 100%)
  const bucketPercent = (total / maxTotal.value) * 100;
  // This cat's share of the bucket
  return (val / total) * bucketPercent;
}

function getBarValue(idx: number, catKey: string): number {
  if (!props.chartData) return 0;
  return props.chartData.datasets[catKey]?.[idx] ?? 0;
}
</script>
