<template>
  <div
    class="rounded-lg border border-slate-200 dark:border-[#3d4948] bg-white dark:bg-[#1e2020] overflow-hidden"
  >
    <div
      class="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-[#3d4948] flex items-center justify-between"
    >
      <div>
        <h3 class="text-sm font-bold text-slate-950 dark:text-[#e3e2e2]">
          Grafik Penjualan
        </h3>
        <p class="text-[11px] text-slate-500 dark:text-[#bcc9c7]">
          {{ subtitle }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <span class="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-[#bcc9c7]">
          <span class="w-3 h-3 rounded-full bg-[#00A19B] inline-block" /> Omzet
        </span>
        <span class="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-[#bcc9c7]">
          <span class="w-3 h-3 rounded-full bg-emerald-400 inline-block" /> Profit
        </span>
      </div>
    </div>

    <div class="p-4 sm:p-5">
      <!-- Loading -->
      <div v-if="loading" class="h-56 flex items-center justify-center">
        <div class="w-8 h-8 border-4 border-slate-200 dark:border-[#3d4948] border-t-[#00A19B] rounded-full animate-spin" />
      </div>

      <!-- Empty: no transactions at all -->
      <div
        v-else-if="activePoints.length === 0"
        class="h-56 flex flex-col items-center justify-center text-slate-400 dark:text-[#bcc9c7]"
      >
        <svg class="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 13l4-4 4 4 4-8 4 4"/><path stroke-linecap="round" stroke-width="1.5" d="M3 18h18"/></svg>
        <p class="text-sm font-semibold">Belum ada transaksi</p>
        <p class="text-[11px] mt-0.5">Grafik muncul otomatis saat ada transaksi baru.</p>
      </div>

      <!-- Chart: only shows data points that actually exist -->
      <div v-else>
        <div class="flex gap-2">
          <!-- Y-axis labels -->
          <div class="flex flex-col justify-between h-56 text-right pr-1 shrink-0 w-12">
            <span class="text-[9px] font-mono text-slate-400">{{ formatCompact(yMax) }}</span>
            <span class="text-[9px] font-mono text-slate-400">{{ formatCompact(Math.round(yMax * 0.75)) }}</span>
            <span class="text-[9px] font-mono text-slate-400">{{ formatCompact(Math.round(yMax * 0.5)) }}</span>
            <span class="text-[9px] font-mono text-slate-400">{{ formatCompact(Math.round(yMax * 0.25)) }}</span>
            <span class="text-[9px] font-mono text-slate-400">0</span>
          </div>

          <!-- Chart container -->
          <div class="flex-1 relative h-56" ref="chartContainer">
            <!-- Grid lines (horizontal) -->
            <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div class="border-b border-dashed border-slate-100 dark:border-[#3d4948]" />
              <div class="border-b border-dashed border-slate-100 dark:border-[#3d4948]" />
              <div class="border-b border-dashed border-slate-100 dark:border-[#3d4948]" />
              <div class="border-b border-dashed border-slate-100 dark:border-[#3d4948]" />
              <div class="border-b border-slate-200 dark:border-[#3d4948]" />
            </div>

            <!-- SVG Chart -->
            <svg class="absolute inset-0 w-full h-full overflow-visible" :viewBox="`0 0 ${chartWidth} ${chartHeight}`" preserveAspectRatio="xMidYMid meet">
              <!-- Revenue gradient area -->
              <path :d="revenueArea" fill="url(#revGrad)" />
              <!-- Profit gradient area -->
              <path :d="profitArea" fill="url(#prfGrad)" />
              <!-- Revenue line -->
              <polyline
                :points="revenueLine"
                fill="none"
                stroke="#00A19B"
                :stroke-width="strokeWidth"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <!-- Profit line -->
              <polyline
                :points="profitLine"
                fill="none"
                stroke="#34D399"
                :stroke-width="strokeWidth * 0.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <!-- Revenue dots (always visible) -->
              <circle
                v-for="(pt, i) in revCoords"
                :key="`dot-${i}`"
                :cx="pt.x"
                :cy="pt.y"
                :r="dotRadius"
                fill="#00A19B"
                stroke="white"
                :stroke-width="dotRadius * 0.6"
              />
              <!-- Defs -->
              <defs>
                <linearGradient id="revGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#00A19B" stop-opacity="0.3" />
                  <stop offset="100%" stop-color="#00A19B" stop-opacity="0.02" />
                </linearGradient>
                <linearGradient id="prfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#34D399" stop-opacity="0.15" />
                  <stop offset="100%" stop-color="#34D399" stop-opacity="0.01" />
                </linearGradient>
              </defs>
            </svg>

            <!-- Hover zones -->
            <div class="absolute inset-0 flex z-10">
              <div
                v-for="(item, idx) in activePoints"
                :key="`hz-${idx}`"
                class="flex-1 relative group cursor-crosshair"
              >
                <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-[#00A19B]/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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

        <!-- X-axis labels (only for active points) -->
        <div class="flex mt-2 ml-14">
          <div
            v-for="(item, idx) in activePoints"
            :key="`xl-${idx}`"
            class="flex-1 text-center"
          >
            <span class="text-[9px] font-mono text-slate-500 dark:text-slate-400">
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

// Chart dimensions (logical, SVG viewBox)
const chartWidth = 600;
const chartHeight = 300;
const padX = 30;
const padY = 20;
const strokeWidth = 4;
const dotRadius = 5;

interface DataPoint {
  label: string;
  shortLabel: string;
  revenue: number;
  profit: number;
}

/**
 * REAL-TIME behavior for "today":
 * Only include hours that have data (revenue > 0 OR profit > 0).
 * This means the chart grows as new transactions come in throughout the day.
 *
 * For "week"/"month": show all days but only ones with data OR fill gaps.
 */
const activePoints = computed<DataPoint[]>(() => {
  if (props.period === 'today') {
    // Only show hours that have actual transactions
    const items: DataPoint[] = [];
    for (let i = 0; i < props.labels.length; i++) {
      const rev = props.revenue[i] ?? 0;
      const prf = props.profit[i] ?? 0;
      if (rev === 0 && prf === 0) continue; // skip empty hours
      const label = props.labels[i];
      const hour = parseInt(label.split(':')[0], 10);
      items.push({
        label: `${String(hour).padStart(2, '0')}:00`,
        shortLabel: String(hour).padStart(2, '0'),
        revenue: rev,
        profit: prf,
      });
    }
    return items;
  }

  // Week/Month: include all days from backend
  if (props.labels.length === 0) return [];
  return props.labels.map((label, i) => ({
    label: formatFullLabel(label),
    shortLabel: formatShortLabel(label),
    revenue: props.revenue[i] ?? 0,
    profit: props.profit[i] ?? 0,
  }));
});

// Y-axis: 0 to highest value (auto-scale)
const yMax = computed(() => {
  const pts = activePoints.value;
  if (pts.length === 0) return 500_000;
  const dataMax = Math.max(...pts.map((d) => d.revenue), ...pts.map((d) => d.profit));
  if (dataMax <= 0) return 500_000;
  // Add 20% headroom and round to nice number
  const withHeadroom = dataMax * 1.2;
  const magnitude = Math.pow(10, Math.floor(Math.log10(withHeadroom)));
  return Math.ceil(withHeadroom / magnitude) * magnitude;
});

const subtitle = computed(() => {
  if (props.period === 'today') {
    if (activePoints.value.length === 0) return 'Real-time — per jam (Asia/Jakarta)';
    const first = activePoints.value[0].shortLabel;
    const last = activePoints.value[activePoints.value.length - 1].shortLabel;
    return `Real-time, ${first}:00 — ${last}:00 (Asia/Jakarta)`;
  }
  if (props.period === 'week') return 'Per hari, 7 hari terakhir';
  return 'Per hari, 30 hari terakhir';
});

// ============================================
// SVG COORDINATE CALCULATION
// ============================================

interface Coord { x: number; y: number }

function toCoords(values: number[]): Coord[] {
  const n = values.length;
  if (n === 0) return [];
  const usableW = chartWidth - padX * 2;
  const usableH = chartHeight - padY * 2;
  return values.map((v, i) => ({
    x: padX + (n === 1 ? usableW / 2 : (i / (n - 1)) * usableW),
    y: padY + usableH - (v / yMax.value) * usableH,
  }));
}

const revCoords = computed(() => toCoords(activePoints.value.map((d) => d.revenue)));
const prfCoords = computed(() => toCoords(activePoints.value.map((d) => d.profit)));

const revenueLine = computed(() => revCoords.value.map((p) => `${p.x},${p.y}`).join(' '));
const profitLine = computed(() => prfCoords.value.map((p) => `${p.x},${p.y}`).join(' '));

function makeAreaPath(coords: Coord[]): string {
  if (coords.length === 0) return '';
  const bottomY = chartHeight - padY;
  const line = coords.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  return `${line} L${coords[coords.length - 1].x},${bottomY} L${coords[0].x},${bottomY} Z`;
}

const revenueArea = computed(() => makeAreaPath(revCoords.value));
const profitArea = computed(() => makeAreaPath(prfCoords.value));

// ============================================
// HELPERS
// ============================================

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
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}
</script>
