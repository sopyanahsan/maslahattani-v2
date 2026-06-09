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

      <!-- Line Chart (ALWAYS render - even if all zeros) -->
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
              class="absolute inset-0 w-full h-full"
              viewBox="0 0 1000 400"
              preserveAspectRatio="none"
            >
              <!-- Revenue area fill -->
              <path
                :d="revenueAreaPath"
                fill="url(#revenueGrad)"
              />
              <!-- Profit area fill -->
              <path
                :d="profitAreaPath"
                fill="url(#profitGrad)"
              />
              <!-- Revenue line -->
              <polyline
                :points="revenuePolyline"
                fill="none"
                stroke="#00A19B"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <!-- Profit line -->
              <polyline
                :points="profitPolyline"
                fill="none"
                stroke="#34D399"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-dasharray="8 4"
              />
              <!-- Revenue dots -->
              <circle
                v-for="(pt, i) in revenueCoords"
                :key="`rv-${i}`"
                :cx="pt.x"
                :cy="pt.y"
                r="4"
                fill="#00A19B"
                stroke="white"
                stroke-width="2"
                class="opacity-0 hover:opacity-100 transition-opacity"
              />
              <!-- Gradient defs -->
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#00A19B" stop-opacity="0.25" />
                  <stop offset="100%" stop-color="#00A19B" stop-opacity="0.02" />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#34D399" stop-opacity="0.15" />
                  <stop offset="100%" stop-color="#34D399" stop-opacity="0.01" />
                </linearGradient>
              </defs>
            </svg>

            <!-- Hover columns (invisible) -->
            <div class="absolute inset-0 flex z-10">
              <div
                v-for="(item, idx) in filteredData"
                :key="`hover-${idx}`"
                class="flex-1 relative group cursor-crosshair"
              >
                <!-- Vertical hover line -->
                <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-slate-300 dark:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <!-- Dot indicator on hover -->
                <div
                  class="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#00A19B] border-2 border-white dark:border-slate-900 shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  :style="{ top: `${getYPercent(item.revenue)}%` }"
                />
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

            <!-- "Belum ada data" overlay if all zero (subtle, not blocking) -->
            <div
              v-if="allZero"
              class="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <p class="text-xs text-slate-400 dark:text-slate-500 bg-white/80 dark:bg-slate-900/80 px-3 py-1 rounded-md">
                Belum ada transaksi di periode ini
              </p>
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

const START_HOUR = 6;
const END_HOUR = 21;
const SVG_WIDTH = 1000;
const SVG_HEIGHT = 400;

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
    // Always generate 16 slots (06-21) even if backend returned nothing
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

  // Week/Month: always map all labels
  if (props.labels.length === 0) {
    // Fallback: generate 7 or 30 empty labels
    const count = props.period === 'week' ? 7 : 30;
    const items: ChartDataItem[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toISOString().slice(0, 10);
      items.push({
        label: formatFullLabel(label),
        shortLabel: formatShortLabel(label),
        revenue: 0,
        profit: 0,
      });
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

const allZero = computed(() => {
  return filteredData.value.every((d) => d.revenue === 0 && d.profit === 0);
});

const yMax = computed(() => {
  const dataMax = Math.max(
    ...filteredData.value.map((d) => d.revenue),
    ...filteredData.value.map((d) => d.profit),
  );
  if (dataMax <= 0) {
    // Default scale when no data
    return 500_000;
  }
  // Round up to nice number with 20% headroom
  const withHeadroom = dataMax * 1.2;
  const magnitude = Math.pow(10, Math.floor(Math.log10(withHeadroom)));
  return Math.ceil(withHeadroom / magnitude) * magnitude;
});

const subtitle = computed(() => {
  if (props.period === 'today') return `Per jam, ${START_HOUR}:00 — ${END_HOUR}:00 (Asia/Jakarta)`;
  if (props.period === 'week') return 'Per hari, 7 hari terakhir';
  return 'Per hari, 30 hari terakhir';
});

// ============================================
// SVG COORDINATE CALCULATION
// ============================================

interface Coord {
  x: number;
  y: number;
}

function valuesToCoords(values: number[]): Coord[] {
  const count = values.length;
  if (count === 0) return [];
  const padding = 20; // padding from edges
  const usableWidth = SVG_WIDTH - padding * 2;
  return values.map((v, i) => ({
    x: padding + (count === 1 ? usableWidth / 2 : (i / (count - 1)) * usableWidth),
    y: SVG_HEIGHT - (v / yMax.value) * SVG_HEIGHT,
  }));
}

const revenueCoords = computed(() => valuesToCoords(filteredData.value.map((d) => d.revenue)));
const profitCoords = computed(() => valuesToCoords(filteredData.value.map((d) => d.profit)));

const revenuePolyline = computed(() => revenueCoords.value.map((p) => `${p.x},${p.y}`).join(' '));
const profitPolyline = computed(() => profitCoords.value.map((p) => `${p.x},${p.y}`).join(' '));

const revenueAreaPath = computed(() => {
  const pts = revenueCoords.value;
  if (pts.length === 0) return '';
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  return `${line} L${pts[pts.length - 1].x},${SVG_HEIGHT} L${pts[0].x},${SVG_HEIGHT} Z`;
});

const profitAreaPath = computed(() => {
  const pts = profitCoords.value;
  if (pts.length === 0) return '';
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  return `${line} L${pts[pts.length - 1].x},${SVG_HEIGHT} L${pts[0].x},${SVG_HEIGHT} Z`;
});

function getYPercent(value: number): number {
  return 100 - (value / yMax.value) * 100;
}

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
    return new Date(label + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }
  return label;
}

function formatShortLabel(label: string): string {
  if (label.length === 10 && label.includes('-')) {
    const parts = label.split('-');
    return `${parseInt(parts[2])}/${parseInt(parts[1])}`;
  }
  if (label.includes(':')) return label.split(':')[0];
  return label;
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}rb`;
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
