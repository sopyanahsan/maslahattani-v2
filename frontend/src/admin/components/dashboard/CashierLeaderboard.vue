<template>
  <div
    class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden h-full flex flex-col"
  >
    <div class="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800">
      <h3 class="text-sm font-bold text-slate-950 dark:text-slate-100">
        Performa Kasir
      </h3>
      <p class="text-[11px] text-slate-500 dark:text-slate-400">
        Top {{ entries.length || 5 }} berdasarkan omzet
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-4 space-y-2.5">
      <div
        v-for="i in 5"
        :key="i"
        class="h-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"
      />
    </div>

    <!-- Empty -->
    <div
      v-else-if="entries.length === 0"
      class="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 dark:text-slate-500"
    >
      <component :is="UsersIcon" class="w-10 h-10 mb-2 opacity-60" />
      <p class="text-sm font-semibold">Belum ada data kasir</p>
      <p class="text-[11px] mt-0.5">Leaderboard muncul setelah ada transaksi.</p>
    </div>

    <!-- Leaderboard -->
    <ol v-else class="flex-1 divide-y divide-slate-100 dark:divide-slate-800">
      <li
        v-for="(c, idx) in entries"
        :key="c.userId"
        class="px-4 sm:px-5 py-3 flex items-center gap-3"
      >
        <span
          :class="[
            'shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
            idx === 0
              ? 'bg-amber-200 text-amber-900 dark:bg-amber-700/40 dark:text-amber-200'
              : idx === 1
                ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                : idx === 2
                  ? 'bg-orange-200 text-orange-900 dark:bg-orange-800/40 dark:text-orange-200'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
          ]"
        >
          {{ idx + 1 }}
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex items-baseline justify-between gap-2">
            <p class="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {{ c.name }}
            </p>
            <p class="text-xs font-mono text-slate-700 dark:text-slate-300 shrink-0">
              {{ formatRupiah(c.revenue) }}
            </p>
          </div>
          <div class="mt-1 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-500"
              :style="{ width: `${barPercent(c.revenue)}%` }"
            />
          </div>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            {{ c.transactionCount }} transaksi
          </p>
        </div>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Users as UsersIcon } from 'lucide-vue-next';
import type { CashierLeaderboardItem } from '@/shared/services/dashboard.service';

const props = withDefaults(
  defineProps<{
    entries: CashierLeaderboardItem[];
    loading?: boolean;
  }>(),
  { loading: false },
);

const topRevenue = computed(() => {
  if (!props.entries.length) return 0;
  return Math.max(...props.entries.map((e) => e.revenue), 1);
});

function barPercent(v: number): number {
  if (topRevenue.value === 0) return 0;
  return Math.max(2, Math.round((v / topRevenue.value) * 100));
}

function formatRupiah(v: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v || 0);
}
</script>
