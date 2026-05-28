<template>
  <div
    class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
  >
    <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
      <h3 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
        Transaksi BRILink Terbaru
      </h3>
      <RouterLink
        to="/admin/brilink/transaksi"
        class="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
      >
        Lihat semua →
      </RouterLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-5 space-y-3">
      <div v-for="i in 5" :key="i" class="h-12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="p-5 text-center">
      <p class="text-xs text-red-600 dark:text-red-400">{{ error }}</p>
    </div>

    <!-- Empty -->
    <div v-else-if="transactions.length === 0" class="p-8 text-center">
      <p class="text-xs text-slate-500 dark:text-slate-400">Belum ada transaksi BRILink.</p>
    </div>

    <!-- List -->
    <div v-else class="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
      <div
        v-for="trx in transactions"
        :key="trx.id"
        class="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <!-- Status icon -->
        <div
          :class="[
            'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs',
            statusStyle(trx.status),
          ]"
        >
          {{ statusIcon(trx.status) }}
        </div>

        <!-- Info -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span :class="['text-[10px] font-bold uppercase px-1.5 py-0.5 rounded', categoryBadge(trx.category)]">
              {{ getCategoryShort(trx.category) }}
            </span>
            <span class="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
              {{ trx.customerName }}
            </span>
          </div>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {{ trx.destination }} &bull; {{ formatTime(trx.createdAt) }}
          </p>
        </div>

        <!-- Amount -->
        <div class="text-right shrink-0">
          <p class="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
            {{ formatRupiah(trx.amount) }}
          </p>
          <p class="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
            +{{ formatRupiah(trx.fee) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import type { BrilinkRecentTransaction } from '@/shared/services/dashboard-brilink.service';

defineProps<{
  transactions: BrilinkRecentTransaction[];
  loading: boolean;
  error: string | null;
}>();

function statusIcon(status: string): string {
  switch (status) {
    case 'SUCCESS': return '✓';
    case 'FAILED': return '✗';
    case 'PENDING': return '⏳';
    default: return '?';
  }
}

function statusStyle(status: string): string {
  switch (status) {
    case 'SUCCESS': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
    case 'FAILED': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    case 'PENDING': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
    default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
  }
}

function categoryBadge(cat: string): string {
  const map: Record<string, string> = {
    TRANSFER_BRI: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    TRANSFER_OTHER: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
    TARIK_TUNAI: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    TOPUP_PULSA: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
    TOPUP_DATA: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    TOPUP_EWALLET: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
    TOPUP_PLN: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  };
  return map[cat] ?? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
}

function getCategoryShort(cat: string): string {
  const map: Record<string, string> = {
    TRANSFER_BRI: 'TF BRI',
    TRANSFER_OTHER: 'TF Lain',
    TARIK_TUNAI: 'Tarik',
    TOPUP_PULSA: 'Pulsa',
    TOPUP_DATA: 'Data',
    TOPUP_EWALLET: 'E-Wallet',
    TOPUP_PLN: 'PLN',
  };
  return map[cat] ?? cat;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  });
}
</script>
