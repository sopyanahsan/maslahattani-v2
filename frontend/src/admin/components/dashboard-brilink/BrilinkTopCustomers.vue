<template>
  <div
    class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
  >
    <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
      <h3 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
        Top Customers Hari Ini
      </h3>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-5 space-y-3">
      <div v-for="i in 5" :key="i" class="h-10 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="p-5 text-center">
      <p class="text-xs text-red-600 dark:text-red-400">{{ error }}</p>
    </div>

    <!-- Empty -->
    <div v-else-if="customers.length === 0" class="p-8 text-center">
      <p class="text-xs text-slate-500 dark:text-slate-400">Belum ada customer hari ini.</p>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-slate-100 dark:border-slate-800">
            <th class="px-5 py-2 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">#</th>
            <th class="px-2 py-2 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Customer</th>
            <th class="px-2 py-2 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Trx</th>
            <th class="px-5 py-2 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Volume</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50 dark:divide-slate-800">
          <tr
            v-for="(cust, idx) in customers"
            :key="idx"
            class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <td class="px-5 py-2.5">
              <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500">{{ idx + 1 }}</span>
            </td>
            <td class="px-2 py-2.5">
              <p class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                {{ cust.customerName }}
              </p>
              <p v-if="cust.customerPhone" class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {{ cust.customerPhone }}
              </p>
            </td>
            <td class="px-2 py-2.5 text-right">
              <span class="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                {{ cust.transactionCount }}
              </span>
            </td>
            <td class="px-5 py-2.5 text-right">
              <span class="text-xs font-mono text-slate-700 dark:text-slate-300">
                {{ formatCompact(cust.totalVolume) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TopCustomerItem } from '@/shared/services/dashboard-brilink.service';

defineProps<{
  customers: TopCustomerItem[];
  loading: boolean;
  error: string | null;
}>();

function formatCompact(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  return `Rp ${amount}`;
}
</script>
