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
      <div v-if="loading" class="h-64 flex items-end gap-1 animate-pulse">
        <div
          v-for="i in 12"
          :key="i"
          class="flex-1 bg-slate-200 dark:bg-slate-800 rounded-t"
          :style="{ height: `${20 + Math.random() * 60}%` }"
        />
      </div>

      <!-- Empty -->
      <div
        v-else-if="!hasData"
        class="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500"
      >
        <component :is="BarChartIcon" class="w-10 h-10 mb-2 opacity-60" />
        <p class="text-sm font-semibold">Belum ada transaksi</p>
        <p class="text-[11px] mt-0.5">Data akan muncul setelah ada transaksi.</p>
      </div>

      <!-- Vertical bar chart (bars go UP) -->
      <div v-else>
        <!-- Y-axis scale + bars area -->
        <div class="flex gap-2">
          <!-- Y-axis labels -->
          <div class="flex flex-col justify-between h-64 text-right pr-1 shrink-0">
            <span class="text-[9px] font-mono text-slate-400">{{ formatCompact(max) }}</span>
            <span class="text-[9px] font-mono text-slate-400">{{ formatCompact(Math.round(max * 0.75)) }}</span>
            <span class="text-[9px] font-mono text-slate-400">{{ formatCompact(Math.round(max * 0.5)) }}</span>
            <span class="text-[9px] font-mono text-slate-400">{{ formatCompact(Math.round(max * 0.25)) }}</span>
            <span class="text-[9px] font-mono text-slate-400">0</span>
          </div>

          <!-- Bars container -->
          <div class="flex-1 relative">
            <!-- Grid lines -->
            <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div class="border-b border-slate-100 dark:border-slate-800" />
              <div class="border-b border-slate-100 dark:border-slate-800" />
              <div class="border-b border-slate-100 dark:border-slate-800" />
              <div class="border-b border-slate-100 dark:border-slate-800" />
              <div class="border-b border-slate-200 dark:border-slate-700" />
            </div>

            <!-- Bars -->
            <div class="h-64 flex items-end gap-[2px] relative z-10">
              <div
                v-for="(label, idx) in labels"
                :key="`${label}-${idx}`"
                class="flex-1 flex items-end justify-center gap-[1px] group"
                :title="`${formatLabel(label)}: Omzet ${formatCompact(revenue[idx])}, Profit ${formatCompact(profit[idx])}`"
              >
                <!-- Revenue bar -->
                <div
                  class="w-full max-w-[16px] bg-blue-500 rounded-t transition-all duration-500 hover:bg-blue-600"
                  :style="{ height: barHeight(revenue[idx]) }"
                />
                <!-- Profit bar -->
                <div
                  class="w-full max-w-[12px] bg-emerald-400 rounded-t transition-all duration-500 hover:bg-emerald-500"
                  :style="{ height: barHeight(profit[idx]) }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- X-axis labels -->
        <div class="flex gap-[2px] mt-2 ml-8">
          <div
            v-for="(label, idx) in labels"
            :key="`x-${label}-${idx}`"
            class="flex-1 text-center"
          >
            <span
              v-if="shouldShowLabel(idx)"
              class="text-[9px] font-mono text-slate-500 dark:text-slate-400"
            >
              {{ formatLabel(label) }}
            </span>
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

function barHeight(v: number): string {
  if (max.value === 0 || v === 0) return '2px';
  return `${Math.max(1, (v / max.value) * 100)}%`;
}

/**
 * Show every N-th label to avoid overlap.
 * Today (24h) → every 2nd, Week (7d) → all, Month (30d) → every 3rd.
 */
function shouldShowLabel(idx: number): boolean {
  const total = props.labels.length;
  if (total <= 7) return true;
  if (total <= 14) return idx % 2 === 0;
  return idx % 3 === 0;
}

function formatLabel(label: string): string {
  if (label.length === 10 && label.includes('-')) {
    const parts = label.split('-');
    return `${parts[2]}/${parts[1]}`;
  }
  // "00:00" → "00"
  if (label.includes(':')) return label.split(':')[0];
  return label;
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}rb`;
  return String(amount);
}
</script>
