<template>
  <div
    class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
  >
    <div
      class="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between"
    >
      <div>
        <h3 class="text-sm font-bold text-slate-950 dark:text-slate-100">
          Grafik Penjualan
        </h3>
        <p class="text-[11px] text-slate-500 dark:text-slate-400">
          {{ subtitle }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <span class="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400">
          <span class="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Omzet
        </span>
        <span class="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400">
          <span class="w-3 h-3 rounded-sm bg-emerald-400 inline-block" /> Profit
        </span>
      </div>
    </div>

    <div class="p-4 sm:p-5">
      <!-- Loading -->
      <div v-if="loading" class="space-y-2">
        <div
          v-for="i in 8"
          :key="i"
          class="flex items-center gap-3 animate-pulse"
        >
          <div class="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="flex-1 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>

      <!-- Empty -->
      <div
        v-else-if="!hasData"
        class="py-12 flex flex-col items-center text-slate-400 dark:text-slate-500"
      >
        <component :is="BarChartIcon" class="w-10 h-10 mb-2 opacity-60" />
        <p class="text-sm font-semibold">Belum ada transaksi</p>
        <p class="text-[11px] mt-0.5">Data akan muncul setelah ada transaksi.</p>
      </div>

      <!-- Vertical bar chart -->
      <div v-else class="space-y-2.5">
        <div
          v-for="(label, idx) in labels"
          :key="`${label}-${idx}`"
          class="flex items-center gap-2"
        >
          <span
            class="text-[10px] text-slate-500 dark:text-slate-400 w-14 shrink-0 text-right font-mono"
          >
            {{ formatLabel(label) }}
          </span>
          <div class="flex-1 flex flex-col gap-0.5">
            <!-- Revenue bar -->
            <div class="flex items-center gap-2">
              <div
                class="h-3.5 rounded-sm bg-blue-500 transition-all duration-500"
                :style="{ width: barWidth(revenue[idx]) }"
              />
              <span class="text-[10px] text-slate-600 dark:text-slate-300 font-mono">
                {{ formatCompact(revenue[idx]) }}
              </span>
            </div>
            <!-- Profit bar -->
            <div class="flex items-center gap-2">
              <div
                class="h-2.5 rounded-sm bg-emerald-400 transition-all duration-500"
                :style="{ width: barWidth(profit[idx]) }"
              />
              <span class="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                {{ formatCompact(profit[idx]) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BarChart3 as BarChartIcon } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    labels: string[];
    revenue: number[];
    profit: number[];
    /** today | week | month — pengaruhi format label "00:00" vs "DD/MM". */
    period?: 'today' | 'week' | 'month';
    loading?: boolean;
  }>(),
  {
    period: 'today',
    loading: false,
  },
);

const max = computed(() => {
  return Math.max(1, ...props.revenue, ...props.profit);
});

const hasData = computed(
  () => props.labels.length > 0 && props.revenue.some((v) => v > 0),
);

const subtitle = computed(() => {
  if (props.period === 'today') return 'Per jam, hari ini (Asia/Jakarta)';
  if (props.period === 'week') return 'Per hari, 7 hari terakhir';
  return 'Per hari, 30 hari terakhir';
});

function barWidth(v: number): string {
  if (max.value === 0) return '0%';
  return `${Math.max(1, (v / max.value) * 100)}%`;
}

function formatLabel(label: string): string {
  // YYYY-MM-DD → DD/MM
  if (label.length === 10 && label.includes('-')) {
    const parts = label.split('-');
    return `${parts[2]}/${parts[1]}`;
  }
  return label;
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000_000)
    return `${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}rb`;
  return String(amount);
}
</script>
