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
          <span class="w-3 h-3 rounded-full bg-[#00A19B] inline-block" /> Omzet
        </span>
        <span class="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400">
          <span class="w-3 h-3 rounded-full bg-emerald-400 inline-block" /> Profit
        </span>
      </div>
    </div>

    <div class="p-4 sm:p-5">
      <!-- Loading -->
      <div v-if="loading" class="h-64 flex items-center justify-center">
        <div class="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-[#00A19B] rounded-full animate-spin" />
      </div>

      <!-- Empty -->
      <div
        v-else-if="!hasData"
        class="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500"
      >
        <svg class="w-10 h-10 mb-2 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 13l4-4 4 4 4-8 4 4" /><path stroke-linecap="round" stroke-width="1.5" d="M3 18h18" /></svg>
        <p class="text-sm font-semibold">Belum ada transaksi</p>
        <p class="text-[11px] mt-0.5">Data akan muncul setelah ada transaksi.</p>
      </div>

      <!-- Line Chart (SVG) -->
      <div v-else>
        <div class="flex gap-2">
          <!-- Y-axis labels -->
          <div class="flex flex-col justify-between h-64 text-right pr-1 shrink-0 w-12">
            <span class="text-[9px] font-mono text-slate-400">{{ formatCompact(yMax) }}</span>
            <span class="text-[9px] font-mono text-slate-400">{{ formatCompact(Math.round(yMax * 0.75)) }}</span>
            <span class="text-[9px] font-mono text-slate-400">{{ formatCompact(Math.round(yMax * 0.5)) }}</span>
            <span class="text-[9px] font-mono text-slate-400">{{ formatCompact(Math.round(yMax * 0.25)) }}</span>
            <span class="text-[9px] font-mono text-slate-400">0</span>
          </div>

          <!-- SVG Chart Area -->
          <div class="flex-1 relative h-64">
            <!-- Grid lines -->
            <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div class="border-b border-dashed border-slate-100 dark:border-slate-800" />
              <div class="border-b border-dashed border-slate-100 dark:border-slate-800" />
              <div class="border-b border-dashed border-slate-100 dark:border-slate-800" />
              <div class="border-b border-dashed border-slate-100 dark:border-slate-800" />
              <div class="border-b border-slate-200 dark:border-slate-700" />
            </div>

            <!-- SVG lines -->
            <svg
              class="absolute inset-0 w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <!-- Revenue area fill -->
              <path
                :d="revenueAreaPath"
                fill="url(#revenueGradient)"
                opacity="0.15"
              />
              <!-- Profit area fill -->
              <path
                :d="profitAreaPath"
                fill="url(#profitGradient)"
                opacity="0.1"
              />
              <!-- Revenue line -->
              <path
                :d="revenueLinePath"
                fill="none"
                stroke="#00A19B"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <!-- Profit line -->
              <path
                :d="profitLinePath"
                fill="none"
                stroke="#34D399"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-dasharray="6 3"
              />
              <!-- Revenue dots -->
              <circle
                v-for="(pt, i) in revenuePoints"
                :key="`rv-${i}`"
                :cx="pt.x"
                :cy="pt.y"
                r="3"
                fill="#00A19B"
                class="opacity-0 hover:opacity-100 transition-opacity"
              />
              <!-- Gradient defs -->
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#00A19B" stop-opacity="0.4" />
                  <stop offset="100%" stop-color="#00A19B" stop-opacity="0" />
                </linearGradient>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#34D399" stop-opacity="0.3" />
                  <stop offset="100%" stop-color="#34D399" stop-opacity="0" />
                </linearGradient>
              </defs>
            </svg>

            <!-- Hover columns (invisible, for tooltip) -->
            <div class="absolute inset-0 flex z-10">
              <div
                v-for="(item, idx) in filteredData"
                :key="`hover-${idx}`"
                class="flex-1 relative group cursor-crosshair"
              >
                <!-- Vertical hover line -->
                <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-slate-300 dark:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <!-- Tooltip -->
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 pointer-events-none">
                  <div class="bg-slate-900 dark:bg-slate-700 text-white rounded-lg px-3 py-2 text-[10px] whitespace-nowrap shadow-lg">
                    <p class="font-bold mb-1">{{ item.label }}</p>
                    <p class="flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full bg-[#00A19B] inline-block" />
                      Omzet: {{ formatRupiah(item.revenue) }}
                    </p>
                    <p class="flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                      Profit: {{ formatRupiah(item.profit) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- X-axis labels -->
        <div class="flex mt-2 ml-14">
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

// For "today" period: only show 06:00 - 21:00
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
    const items: ChartDataItem[] = [];
    for (let i = 0; i < props.labels.length; i++) {
      const label = props.labels[i];
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

  return props.labels.map((label, i) => ({
    label: formatFullLabel(label),
    shortLabel: formatShortLabel(label),
    revenue: props.revenue[i] ?? 0,
    profit: props.profit[i] ?? 0,
  }));
});

const yMax = computed(() => {
  const dataMax = Math.max(
    1,
    ...filteredData.value.map((d) => d.revenue),
    ...filteredData.value.map((d) => d.profit),
  );
  // Minimum scale 100rb for daily
  const minY = props.period === 'today' ? 100_000 : 1;
  const actual = Math.max(minY, dataMax);
  // Round up to nice number
  const magnitude = Math.pow(10, Math.floor(Math.log10(actual)));
  return Math.ceil(actual / magnitude) * magnitude;
});

const hasData = computed(() => {
  if (props.labels.length === 0) return false;
  const totalRevenue = props.revenue.reduce((sum, v) => sum + v, 0);
  const totalProfit = props.profit.reduce((sum, v) => sum + v, 0);
  return totalRevenue > 0 || totalProfit > 0;
});

const subtitle = computed(() => {
  if (props.period === 'today') return `Per jam, ${START_HOUR}:00 — ${END_HOUR}:00 (Asia/Jakarta)`;
  if (props.period === 'week') return 'Per hari, 7 hari terakhir';
  return 'Per hari, 30 hari terakhir';
});

// ============================================
// SVG LINE PATH GENERATION
// ============================================

interface Point {
  x: string;
  y: string;
}

function getPoints(values: number[]): Point[] {
  const count = values.length;
  if (count === 0) return [];
  return values.map((v, i) => ({
    x: `${(i / Math.max(1, count - 1)) * 100}%`,
    y: `${100 - (v / yMax.value) * 100}%`,
  }));
}

const revenuePoints = computed(() => getPoints(filteredData.value.map((d) => d.revenue)));
const profitPoints = computed(() => getPoints(filteredData.value.map((d) => d.profit)));

function buildLinePath(points: Point[]): string {
  if (points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

function buildAreaPath(points: Point[]): string {
  if (points.length === 0) return '';
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  return `${line} L 100% 100% L 0% 100% Z`;
}

const revenueLinePath = computed(() => buildLinePath(revenuePoints.value));
const profitLinePath = computed(() => buildLinePath(profitPoints.value));
const revenueAreaPath = computed(() => buildAreaPath(revenuePoints.value));
const profitAreaPath = computed(() => buildAreaPath(profitPoints.value));

// ============================================
// HELPERS
// ============================================

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
