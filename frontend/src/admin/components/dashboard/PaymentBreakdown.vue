<template>
  <div
    class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden h-full flex flex-col"
  >
    <div class="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800">
      <h3 class="text-sm font-bold text-slate-950 dark:text-slate-100">
        Metode Pembayaran
      </h3>
      <p class="text-[11px] text-slate-500 dark:text-slate-400">
        Breakdown amount + jumlah transaksi
      </p>
    </div>

    <div class="p-4 sm:p-5 flex-1 flex flex-col">
      <div v-if="loading" class="space-y-3">
        <div
          v-for="i in 4"
          :key="i"
          class="h-9 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"
        />
      </div>

      <div
        v-else-if="!hasData"
        class="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-6"
      >
        <component :is="WalletIcon" class="w-10 h-10 mb-2 opacity-60" />
        <p class="text-sm font-semibold">Belum ada pembayaran</p>
      </div>

      <template v-else>
        <!-- Stacked horizontal bar -->
        <div
          class="h-2.5 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 mb-4"
        >
          <div
            v-for="m in methods"
            :key="`stack-${m.key}`"
            :class="['h-full', m.color]"
            :style="{ width: `${percent(m.key)}%` }"
            :title="`${m.label}: ${percent(m.key)}%`"
          />
        </div>

        <!-- Per method row -->
        <div class="space-y-3">
          <div
            v-for="m in methods"
            :key="m.key"
            class="space-y-1"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span :class="['w-2.5 h-2.5 rounded-sm inline-block', m.color]" />
                {{ m.label }}
              </span>
              <span class="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {{ formatRupiah(amount(m.key)) }}
              </span>
            </div>
            <div class="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                :class="['h-full rounded-full transition-all duration-300', m.color]"
                :style="{ width: `${percent(m.key)}%` }"
              />
            </div>
            <p class="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span>{{ count(m.key) }} transaksi</span>
              <span>{{ percent(m.key) }}%</span>
            </p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Wallet as WalletIcon } from 'lucide-vue-next';
import type { PaymentBreakdownResponse } from '@/shared/services/dashboard.service';

const props = withDefaults(
  defineProps<{
    data: PaymentBreakdownResponse | null;
    loading?: boolean;
  }>(),
  { loading: false },
);

type MethodKey = 'cash' | 'qris' | 'transfer' | 'hutang';

const methods: Array<{ key: MethodKey; label: string; color: string }> = [
  { key: 'cash', label: 'Cash', color: 'bg-emerald-500' },
  { key: 'qris', label: 'QRIS', color: 'bg-blue-500' },
  { key: 'transfer', label: 'Transfer', color: 'bg-indigo-500' },
  { key: 'hutang', label: 'Hutang', color: 'bg-amber-500' },
];

const totalAmount = computed(() => {
  if (!props.data) return 0;
  return methods.reduce((sum, m) => sum + (props.data?.[m.key]?.amount || 0), 0);
});

const hasData = computed(() => totalAmount.value > 0);

function amount(k: MethodKey): number {
  return props.data?.[k]?.amount ?? 0;
}
function count(k: MethodKey): number {
  return props.data?.[k]?.count ?? 0;
}
function percent(k: MethodKey): number {
  // Percent dari API (sudah dihitung server-side); fallback ke compute lokal.
  if (props.data?.[k]?.percent !== undefined && props.data[k].percent !== null) {
    return props.data[k].percent;
  }
  if (totalAmount.value === 0) return 0;
  return Math.round((amount(k) / totalAmount.value) * 100 * 10) / 10;
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
