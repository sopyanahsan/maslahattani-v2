<template>
  <div
    class="rounded-lg border border-slate-200 dark:border-[#3d4948] bg-white dark:bg-[#1e2020] overflow-hidden shadow-sm"
  >
    <div class="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-[#3d4948]">
      <h3 class="text-sm font-bold text-slate-950 dark:text-[#e3e2e2]">
        Penjualan per Kategori
      </h3>
      <p class="text-[11px] text-slate-500 dark:text-[#bcc9c7]">
        Proporsi omzet per kategori produk
      </p>
    </div>

    <div class="p-4 sm:p-5">
      <!-- Loading -->
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 5" :key="i" class="flex items-center gap-3 animate-pulse">
          <div class="h-4 w-20 bg-slate-200 dark:bg-[#292a2a] rounded" />
          <div class="flex-1 h-4 bg-slate-200 dark:bg-[#292a2a] rounded" />
        </div>
      </div>

      <!-- Empty -->
      <div
        v-else-if="sortedCategories.length === 0"
        class="py-8 text-center text-slate-400 dark:text-[#bcc9c7]"
      >
        <p class="text-xs">Belum ada data kategori</p>
      </div>

      <!-- Horizontal stacked bars per category -->
      <div v-else class="space-y-3">
        <div
          v-for="(cat, idx) in sortedCategories"
          :key="cat.name"
          class="group relative"
        >
          <div class="flex items-center gap-3">
            <!-- Category name -->
            <span class="text-[11px] font-medium text-slate-700 dark:text-[#bcc9c7] w-24 shrink-0 truncate">
              {{ cat.name || 'Lainnya' }}
            </span>
            <!-- Bar -->
            <div class="flex-1 h-6 bg-slate-100 dark:bg-[#292a2a] rounded-md overflow-hidden relative">
              <div
                :class="['h-full rounded-md transition-all duration-500', COLORS[idx % COLORS.length]]"
                :style="{ width: barWidth(cat.revenue) }"
              />
              <!-- Hover tooltip -->
              <div class="absolute inset-0 flex items-center px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="text-[10px] font-bold text-white drop-shadow-sm">
                  {{ formatCompact(cat.revenue) }} ({{ cat.percentage }}%)
                </span>
              </div>
            </div>
            <!-- Value -->
            <span class="text-[10px] font-mono text-slate-600 dark:text-[#bcc9c7] w-14 shrink-0 text-right">
              {{ formatCompact(cat.revenue) }}
            </span>
          </div>
        </div>

        <!-- Legend -->
        <div class="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-[#3d4948] mt-3">
          <span
            v-for="(cat, idx) in sortedCategories"
            :key="`leg-${cat.name}`"
            class="inline-flex items-center gap-1 text-[9px] text-slate-600 dark:text-[#bcc9c7]"
          >
            <span :class="['w-2 h-2 rounded-sm inline-block', COLORS[idx % COLORS.length]]" />
            {{ cat.name || 'Lainnya' }}: {{ cat.percentage }}%
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  /** Array of { name, revenue } from the payment/category breakdown */
  categories: Array<{ name: string; revenue: number }>;
  loading?: boolean;
}>();

const COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-orange-500',
];

const totalRevenue = computed(() =>
  props.categories.reduce((sum, c) => sum + c.revenue, 0),
);

const maxRevenue = computed(() =>
  Math.max(1, ...props.categories.map(c => c.revenue)),
);

const sortedCategories = computed(() =>
  [...props.categories]
    .sort((a, b) => b.revenue - a.revenue)
    .map(c => ({
      ...c,
      percentage: totalRevenue.value > 0
        ? Math.round((c.revenue / totalRevenue.value) * 100)
        : 0,
    })),
);

function barWidth(v: number): string {
  if (maxRevenue.value === 0) return '0%';
  return `${Math.max(2, (v / maxRevenue.value) * 100)}%`;
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}rb`;
  return String(amount);
}
</script>
