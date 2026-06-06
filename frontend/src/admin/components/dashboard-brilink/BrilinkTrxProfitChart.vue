<template>
  <div
    class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
  >
    <!-- Header: tabs + period selector -->
    <div
      class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <!-- Tabs -->
      <div class="flex gap-0.5 bg-slate-200/60 dark:bg-slate-800 rounded-lg p-0.5 w-fit">
        <button
          v-for="t in tabs"
          :key="t.value"
          type="button"
          :class="[
            'h-7 px-3 text-[11px] font-semibold rounded-md transition-colors',
            activeTab === t.value
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200',
          ]"
          @click="$emit('update:type', t.value)"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- Period selector -->
      <div class="flex gap-0.5 bg-slate-200/60 dark:bg-slate-800 rounded-lg p-0.5 w-fit">
        <button
          v-for="p in periods"
          :key="p.value"
          type="button"
          :class="[
            'h-7 px-2.5 text-[11px] font-semibold rounded-md transition-colors',
            activePeriod === p.value
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200',
          ]"
          @click="$emit('update:period', p.value)"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <div class="p-5">
      <!-- Loading -->
      <div v-if="loading" class="space-y-2.5">
        <div v-for="i in 8" :key="i" class="flex items-center gap-3 animate-pulse">
          <div class="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
          <div class="flex-1 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="py-10 text-center">
        <p class="text-xs text-red-600 dark:text-red-400">{{ error }}</p>
      </div>

      <!-- Empty -->
      <div
        v-else-if="!hasData"
        class="py-12 flex flex-col items-center text-slate-400 dark:text-slate-500"
      >
        <component :is="BarChartIcon" class="w-10 h-10 mb-2 opacity-60" />
        <p class="text-sm font-semibold">Belum ada data</p>
        <p class="text-[11px] mt-0.5">Data akan muncul setelah ada transaksi sukses.</p>
      </div>

      <!-- TRANSACTIONS (stacked) -->
      <div v-else-if="type === 'transactions'">
        <!-- Legend -->
        <div class="flex flex-wrap gap-2 mb-4">
          <span
            v-for="cat in categories"
            :key="cat.key"
            class="inline-flex items-center gap-1 text-[10px] font-semibold"
          >
            <span :class="['w-2.5 h-2.5 rounded-sm', cat.barColor]" />
            <span class="text-slate-600 dark:text-slate-400">{{ cat.label }}</span>
          </span>
        </div>

        <div class="space-y-1.5 max-h-[320px] overflow-y-auto">
          <div
            v-for="(label, idx) in labels"
            :key="`${label}-${idx}`"
            class="flex items-center gap-2"
          >
            <span class="text-[10px] font-mono text-slate-500 dark:text-slate-400 w-14 shrink-0 text-right">
              {{ formatLabel(label) }}
            </span>
            <div class="flex-1 flex h-4 rounded overflow-hidden bg-slate-100 dark:bg-slate-800">
              <div
                v-for="cat in categories"
                :key="cat.key"
                :class="cat.barColor"
                :style="{ width: stackedWidth(idx, cat.key) + '%' }"
                :title="`${cat.label}: ${datasetValue(idx, cat.key)}`"
              />
            </div>
            <span class="text-[10px] font-mono text-slate-600 dark:text-slate-400 w-8 shrink-0">
              {{ bucketTotal(idx) }}
            </span>
          </div>
        </div>
      </div>

      <!-- PROFIT (bars) -->
      <div v-else>
        <div class="space-y-2 max-h-[320px] overflow-y-auto">
          <div
            v-for="(label, idx) in labels"
            :key="`${label}-${idx}`"
            class="flex items-center gap-2"
          >
            <span class="text-[10px] font-mono text-slate-500 dark:text-slate-400 w-14 shrink-0 text-right">
              {{ formatLabel(label) }}
            </span>
            <div class="flex-1 flex items-center gap-2">
              <div
                class="h-4 rounded-sm bg-emerald-500 transition-all duration-500"
                :style="{ width: profitBarWidth(profitData[idx]) }"
              />
              <span class="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                {{ formatCompact(profitData[idx]) }}
              </span>
            </div>
          </div>
        </div>
        <!-- Total profit footer -->
        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span class="text-[11px] text-slate-500 dark:text-slate-400">Total Profit Periode</span>
          <span class="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {{ formatRupiah(totalProfit) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BarChart3 as BarChartIcon } from 'lucide-vue-next';
import type {
  BrilinkChartType,
  BrilinkChartPeriod,
  BrilinkTransactionsChartData,
  BrilinkProfitChartData,
} from '@/shared/services/brilink.service';

const props = defineProps<{
  type: BrilinkChartType;
  period: BrilinkChartPeriod;
  transactionsData: BrilinkTransactionsChartData | null;
  profitChartData: BrilinkProfitChartData | null;
  loading: boolean;
  error: string | null;
}>();

defineEmits<{
  (e: 'update:type', value: BrilinkChartType): void;
  (e: 'update:period', value: BrilinkChartPeriod): void;
}>();

const activeTab = computed(() => props.type);
const activePeriod = computed(() => props.period);

const tabs: { value: BrilinkChartType; label: string }[] = [
  { value: 'transactions', label: 'Transaksi' },
  { value: 'profit', label: 'Profit' },
];

const periods: { value: BrilinkChartPeriod; label: string }[] = [
  { value: 'today', label: 'Hari Ini' },
  { value: '7d', label: '7 Hari' },
  { value: '1m', label: '1 Bln' },
  { value: '3m', label: '3 Bln' },
];

const categories = [
  { key: 'TRANSFER_BRI', label: 'TF BRI', barColor: 'bg-blue-500' },
  { key: 'TRANSFER_OTHER', label: 'TF Lain', barColor: 'bg-indigo-500' },
  { key: 'TARIK_TUNAI', label: 'Tarik', barColor: 'bg-amber-500' },
  { key: 'TOPUP_PULSA', label: 'Pulsa', barColor: 'bg-pink-500' },
  { key: 'TOPUP_DATA', label: 'Data', barColor: 'bg-purple-500' },
  { key: 'TOPUP_EWALLET', label: 'E-Wallet', barColor: 'bg-cyan-500' },
  { key: 'TOPUP_PLN', label: 'PLN', barColor: 'bg-yellow-500' },
];

const labels = computed<string[]>(() => {
  if (props.type === 'transactions') return props.transactionsData?.labels ?? [];
  return props.profitChartData?.labels ?? [];
});

const profitData = computed<number[]>(() => props.profitChartData?.data ?? []);

const totalProfit = computed(() => profitData.value.reduce((s, v) => s + v, 0));

const hasData = computed(() => {
  if (props.type === 'transactions') {
    const d = props.transactionsData;
    if (!d || d.labels.length === 0) return false;
    return Object.values(d.datasets).some((arr) => arr.some((v) => v > 0));
  }
  return profitData.value.some((v) => v > 0);
});

// --- transactions stacked helpers ---
const maxBucketTotal = computed(() => {
  const d = props.transactionsData;
  if (!d) return 1;
  let max = 0;
  for (let i = 0; i < d.labels.length; i++) {
    let total = 0;
    for (const cat of categories) total += d.datasets[cat.key]?.[i] ?? 0;
    if (total > max) max = total;
  }
  return max || 1;
});

function datasetValue(idx: number, key: string): number {
  return props.transactionsData?.datasets[key]?.[idx] ?? 0;
}

function bucketTotal(idx: number): number {
  let total = 0;
  for (const cat of categories) total += datasetValue(idx, cat.key);
  return total;
}

function stackedWidth(idx: number, key: string): number {
  const val = datasetValue(idx, key);
  const total = bucketTotal(idx);
  if (total === 0) return 0;
  const bucketPercent = (total / maxBucketTotal.value) * 100;
  return (val / total) * bucketPercent;
}

// --- profit helpers ---
const maxProfit = computed(() => Math.max(1, ...profitData.value));

function profitBarWidth(v: number): string {
  if (!v || maxProfit.value === 0) return '0%';
  return `${Math.max(2, (v / maxProfit.value) * 100)}%`;
}

// --- formatters ---
function formatLabel(label: string): string {
  // YYYY-MM-DD → DD/MM ; "HH:00" stays
  if (label.length === 10 && label.includes('-')) {
    const parts = label.split('-');
    return `${parts[2]}/${parts[1]}`;
  }
  return label;
}

function formatCompact(amount: number): string {
  if (!amount) return '0';
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}rb`;
  return String(amount);
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
</script>
