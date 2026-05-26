<template>
  <div
    class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden h-full flex flex-col"
  >
    <div class="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800">
      <h3 class="text-sm font-bold text-slate-950 dark:text-slate-100">
        Status Operasional
      </h3>
      <p class="text-[11px] text-slate-500 dark:text-slate-400">
        Shift aktif, kasir online, transaksi terbaru
      </p>
    </div>

    <div class="p-4 sm:p-5 space-y-5 overflow-y-auto">
      <!-- Loading -->
      <div v-if="loading" class="space-y-3">
        <div
          v-for="i in 3"
          :key="i"
          class="h-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"
        />
      </div>

      <template v-else-if="data">
        <!-- Active shifts -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <p class="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Shift Aktif
            </p>
            <span
              class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
            >
              {{ data.activeShifts.length }} aktif
            </span>
          </div>
          <div v-if="data.activeShifts.length === 0" class="text-xs text-slate-400 dark:text-slate-500 italic">
            Belum ada shift terbuka.
          </div>
          <ul v-else class="space-y-1.5">
            <li
              v-for="s in data.activeShifts"
              :key="s.id"
              class="flex items-center justify-between text-sm"
            >
              <div class="min-w-0 flex-1 flex items-center gap-2">
                <component
                  :is="ClockIcon"
                  :class="[
                    'w-3.5 h-3.5 shrink-0',
                    s.isOverThreshold
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400',
                  ]"
                />
                <span class="truncate text-slate-900 dark:text-slate-100">
                  {{ s.cashierName }}
                </span>
              </div>
              <span
                :class="[
                  'shrink-0 text-[11px] font-mono',
                  s.isOverThreshold
                    ? 'text-amber-700 dark:text-amber-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400',
                ]"
              >
                {{ formatDuration(s.durationMinutes) }}
              </span>
            </li>
          </ul>
          <div class="mt-2 flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
            <span>Open <strong class="font-semibold text-slate-700 dark:text-slate-300">{{ data.shiftStats.open }}</strong></span>
            <span>Closed <strong class="font-semibold text-slate-700 dark:text-slate-300">{{ data.shiftStats.closed }}</strong></span>
            <span>Final <strong class="font-semibold text-slate-700 dark:text-slate-300">{{ data.shiftStats.finalized }}</strong></span>
          </div>
        </div>

        <!-- Last online cashiers -->
        <div>
          <p class="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
            Kasir Terakhir Online
          </p>
          <div
            v-if="data.lastOnlineCashiers.length === 0"
            class="text-xs text-slate-400 dark:text-slate-500 italic"
          >
            Belum ada data login kasir.
          </div>
          <ul v-else class="space-y-1.5">
            <li
              v-for="c in data.lastOnlineCashiers"
              :key="c.userId"
              class="flex items-center justify-between text-sm"
            >
              <div class="flex items-center gap-2 min-w-0">
                <div
                  class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-300 shrink-0"
                >
                  {{ initials(c.name) }}
                </div>
                <span class="truncate text-slate-900 dark:text-slate-100">
                  {{ c.name }}
                </span>
              </div>
              <span class="text-[11px] text-slate-500 dark:text-slate-400 font-mono shrink-0">
                {{ relativeTime(c.lastActiveAt) }}
              </span>
            </li>
          </ul>
        </div>

        <!-- Last transaction -->
        <div>
          <p class="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
            Transaksi Terbaru
          </p>
          <div
            v-if="!data.lastTransaction"
            class="text-xs text-slate-400 dark:text-slate-500 italic"
          >
            Belum ada transaksi.
          </div>
          <div
            v-else
            class="rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 flex items-center justify-between"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span
                  :class="[
                    'inline-block px-1.5 py-0.5 rounded text-[9px] font-bold',
                    data.lastTransaction.type === 'BRILINK'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                  ]"
                >
                  {{ data.lastTransaction.type }}
                </span>
                <span class="text-xs font-mono text-slate-700 dark:text-slate-200 truncate">
                  {{ data.lastTransaction.transactionNumber }}
                </span>
              </div>
              <p class="text-sm font-semibold text-slate-950 dark:text-slate-100 mt-0.5">
                {{ formatRupiah(data.lastTransaction.amount) }}
              </p>
            </div>
            <span class="text-[11px] text-slate-500 dark:text-slate-400 font-mono shrink-0 ml-2">
              {{ relativeTime(data.lastTransaction.createdAt) }}
            </span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Clock as ClockIcon } from 'lucide-vue-next';
import type { OperationsResponse } from '@/shared/services/dashboard.service';

withDefaults(
  defineProps<{
    data: OperationsResponse | null;
    loading?: boolean;
  }>(),
  { loading: false },
);

function initials(name: string): string {
  const parts = name.split(/[@\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? 'U') + (parts[1]?.[0] ?? '')).toUpperCase().slice(0, 2);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}j ${m}m`;
}

function formatRupiah(v: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v || 0);
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  if (diff < 60_000) return 'Baru saja';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} mnt lalu`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} jam lalu`;
  return `${Math.floor(diff / 86_400_000)} hari lalu`;
}
</script>
