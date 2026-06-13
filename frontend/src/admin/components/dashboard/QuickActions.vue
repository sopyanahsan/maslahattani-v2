<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
    <RouterLink
      v-for="action in actions"
      :key="action.label"
      :to="action.to"
      :class="[
        'group rounded-lg border px-3 py-2.5 transition-colors flex items-center gap-2',
        'border-slate-200 dark:border-[#3d4948] bg-white dark:bg-[#1e2020]',
        'hover:border-blue-300 dark:hover:border-[#5fd9d2]/50 hover:bg-blue-50/40 dark:hover:bg-[#5fd9d2]/5',
      ]"
    >
      <div
        :class="[
          'w-8 h-8 rounded-md flex items-center justify-center shrink-0',
          action.iconBg,
        ]"
      >
        <component :is="action.icon" :class="['w-4 h-4', action.iconColor]" />
      </div>
      <div class="min-w-0">
        <p class="text-xs font-semibold text-slate-900 dark:text-[#e3e2e2] truncate">
          {{ action.label }}
        </p>
        <p
          v-if="action.desc"
          class="text-[10px] text-slate-500 dark:text-[#bcc9c7] truncate"
        >
          {{ action.desc }}
        </p>
      </div>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import {
  LayoutDashboard as DashboardIcon,
  Wallet as WalletIcon,
  Receipt as ReceiptIcon,
} from 'lucide-vue-next';

/**
 * 6 action button utama yang muncul di dashboard.
 * Tetap tampil di order ini biar muscle-memory user gak berubah:
 * Dashboard Retail / BRILink → Mutasi Retail / BRILink → Transaksi Retail / BRILink.
 */
const actions = [
  {
    label: 'Dashboard Retail',
    desc: 'Halaman ini',
    to: '/admin/dashboard',
    icon: DashboardIcon,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    label: 'Mutasi Retail',
    desc: 'Kas retail',
    to: '/admin/kas-retail',
    icon: WalletIcon,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    label: 'Transaksi Retail',
    desc: 'Riwayat POS',
    to: '/admin/transactions',
    icon: ReceiptIcon,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
];
</script>
