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
      <div v-if="loading" class="h-72 flex items-end gap-1 animate-pulse">
        <div
          v-for="i in 16"
          :key="i"
          class="flex-1 bg-slate-200 dark:bg-slate-800 rounded-t"
          :style="{ height: `${20 + Math.random() * 60}%` }"
        />
      </div>

      <!-- Empty -->
      <div
        v-else-if="!hasData"
        class="h-72 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500"
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
          <div class="flex flex-col justify-between h-72 text-right pr-1 shrink-0 w-10">
            <span class="text-[9px] font-mono text-slate-400">{{ formatCompact(yMax) }}</span>
            <span class="text-[9px] font-mono text-slate-400">{{ formatCompact(Math.round(yMax * 0.75)) }}</span>
            <span class="text-[9px] font-mono text-slate-400">{{ formatCompact(Math.round(yMax * 0.5)) }}</span>
            <span class="text-[9px] font-mono text-slate-400">{{ formatCompact(Math.round(yMax * 0.25)) }}</span>
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
            <div class="h-72 flex items-end gap-[3px] relative z-10">
              <div
                v-for="(item, idx) in filteredData"
                :key="`bar-${idx}`"
                class="flex-1 flex items-end justify-center gap-[1px] relative group cursor-pointer"
              >
                <!-- Revenue bar -->
                <div
                  class="w-full max-w-[18px] bg-blue-500 rounded-t transition-all duration-500 group-hover:bg-blue-600"
                  :style="{ height: barHeight(item.revenue) }"
                />
                <!-- Profit bar -->
                <div
                  class="w-full max-w-[14px] bg-emerald-400 rounded-t transition-all duration-500 group-hover:bg-emerald-500"
                  :style="{ height: barHeight(item.profit) }"
                />

                <!-- Hover tooltip -->
                <div
                  class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20"
                >
                  <div class="bg-slate-900 dark:bg-slate-700 text-white rounded-lg px-3 py-2 text-[10px] whitespace-nowrap shadow-lg">
                    <p class="font-bold mb-1">{{ item.label }}</p>
                    <p class="flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-sm bg-blue-400 inline-block" />
                      Omzet: {{ formatRupiah(item.revenue) }}
                    </p>
                    <p class="flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-sm bg-emerald-400 inline-block" />
                      Profit: {{ formatRupiah(item.profit) }}
                    </p>
                    <div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- X-axis labels -->
        <div class="flex gap-[3px] mt-2 ml-12">
          <div
            v-for="(item, idx) in filteredData"
            :key="`x-${idx}`"
            class="flex-1 text-center"
          >
            <span
              v-if="shouldShowLabel(idx)"
              class="text-[9px] font-mono text-slate-500 dark:text-slate-400"
            >
              {{ item.shortLabel }}
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

// For "today" period: only show 06:00 - 21:00 (6am - 9pm)
const START_HOUR = 6;
const END_HOUR = 21;

interface ChartDataItem {
  label: string;
  shortLabel: string;
  revenue: number;
  profit: number;
}

const filteredData = computed<ChartDataItem[]>(() => {
  if (props.period === 'today') {
    // Filter hours 6-21 only
    const items: ChartDataItem[] = [];
    for (let i = 0; i < props.labels.length; i++) {
      const label = props.labels[i];
      // Extract hour from "06:00" or "06" format
      const hour = parseInt(label.split(':')[0], 10);
      if (isNaN(hour)) continue;
      if (hour < START_HOUR || hour > END_HOUR) continue;
      items.push({
        label: `${String(hour).padStart(2, '0')}:00`,
        shortLabel: String(hour).padStart(2, '0'),
        revenue: props.revenue[i] ?? 0,
        profit: props.profit[i] ?? 0,
      });
    }
    // If no data in that range yet, generate empty slots
    if (items.length === 0) {
      for (let h = START_HOUR; h <= END_HOUR; h++) {
        items.push({
          label: `${String(h).padStart(2, '0')}:00`,
          shortLabel: String(h).padStart(2, '0'),
          revenue: 0,
          profit: 0,
        });
      }
    }
    return items;
  }

  // Week/Month: use all data as-is
  return props.labels.map((label, i) => ({
    label: formatFullLabel(label),
    shortLabel: formatShortLabel(label),
    revenue: props.revenue[i] ?? 0,
    profit: props.profit[i] ?? 0,
  }));
});

const yMax = computed(() => {
  const dataMax = Math.max(1, ...filteredData.value.map(d => d.revenue), ...filteredData.value.map(d => d.profit));
  if (props.period === 'today') {
    // Auto-scale: use data max with nice rounding, minimum 100rb
    const minY = 100_000;
    const actual = Math.max(minY, dataMax);
    const magnitude = Math.pow(10, Math.floor(Math.log10(actual)));
    return Math.ceil(actual / magnitude) * magnitude;
  }
  // Auto-scale for week/month
  // Round up to nice number
  const magnitude = Math.pow(10, Math.floor(Math.log10(dataMax)));
  return Math.ceil(dataMax / magnitude) * magnitude;
});

const hasData = computed(() => {
  if (props.labels.length === 0) return false;
  // Check if there's any actual revenue or profit data (not all zeros)
  const totalRevenue = props.revenue.reduce((sum, v) => sum + v, 0);
  const totalProfit = props.profit.reduce((sum, v) => sum + v, 0);
  return totalRevenue > 0 || totalProfit > 0;
});

const subtitle = computed(() => {
  if (props.period === 'today') return `Per jam, ${START_HOUR}:00 — ${END_HOUR}:00 (Asia/Jakarta)`;
  if (props.period === 'week') return 'Per hari, 7 hari terakhir';
  return 'Per hari, 30 hari terakhir';
});

function barHeight(v: number): string {
  if (yMax.value === 0 || v === 0) return '0px';
  return `${Math.max(1, (v / yMax.value) * 100)}%`;
}

function shouldShowLabel(idx: number): boolean {
  const total = filteredData.value.length;
  if (total <= 16) return true;
  if (total <= 24) return idx % 2 === 0;
  return idx % 3 === 0;
}

function formatFullLabel(label: string): string {
  if (label.length === 10 && label.includes('-')) {
    return new Date(label).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }
  return label;
}

function formatShortLabel(label: string): string {
  if (label.length === 10 && label.includes('-')) {
    const parts = label.split('-');
    return `${parts[2]}/${parts[1]}`;
  }
  if (label.includes(':')) return label.split(':')[0];
  return label;
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}rb`;
  return String(amount);
}

function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n);
}
</script>
