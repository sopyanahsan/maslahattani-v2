<template>
  <div class="space-y-6">
    <!-- Greeting -->
    <div>
      <h1 class="text-2xl font-bold text-slate-950 dark:text-slate-100">
        {{ greeting }}, {{ displayName }} 👋
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
        {{ todayLabel }}
      </p>
    </div>

    <!-- Today summary mini stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <p class="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Omzet Hari Ini</p>
        <p class="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
          {{ formatRupiah(stats.todayRevenue) }}
        </p>
      </div>
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <p class="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Transaksi</p>
        <p class="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{{ stats.todayTx }}</p>
      </div>
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <p class="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">BRILink Hari Ini</p>
        <p class="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{{ stats.todayBrilink }}</p>
      </div>
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <p class="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Hutang Aktif</p>
        <p class="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{{ stats.activeDebts }}</p>
      </div>
    </div>

    <!-- 2 main action cards -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <RouterLink
        to="/admin/dashboard"
        class="group bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800
               rounded-2xl p-6 text-white transition-all hover:shadow-xl hover:-translate-y-0.5"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
              <component :is="DashboardIcon" class="w-6 h-6" />
            </div>
            <h2 class="text-xl font-bold mb-1">Dashboard Retail</h2>
            <p class="text-sm text-blue-100">
              Lihat ringkasan transaksi retail, stok, dan operasional toko.
            </p>
          </div>
          <component :is="ArrowRightIcon" class="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition" />
        </div>
      </RouterLink>

      <RouterLink
        to="/admin/brilink"
        class="group bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800
               rounded-2xl p-6 text-white transition-all hover:shadow-xl hover:-translate-y-0.5"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
              <component :is="LandmarkIcon" class="w-6 h-6" />
            </div>
            <h2 class="text-xl font-bold mb-1">Dashboard BRILink</h2>
            <p class="text-sm text-indigo-100">
              Kelola layanan BRILink — transfer, tarik tunai, top-up, dan mutasi.
            </p>
          </div>
          <component :is="ArrowRightIcon" class="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition" />
        </div>
      </RouterLink>
    </div>

    <!-- Quick shortcuts -->
    <div>
      <p class="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
        Akses Cepat
      </p>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <RouterLink
          v-for="shortcut in shortcuts"
          :key="shortcut.to"
          :to="shortcut.to"
          class="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800
                 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/30
                 rounded-xl p-3 transition-colors"
        >
          <div :class="['w-9 h-9 rounded-lg flex items-center justify-center shrink-0', shortcut.bg]">
            <component :is="shortcut.icon" :class="['w-4 h-4', shortcut.iconColor]" />
          </div>
          <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">{{ shortcut.label }}</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue';
import { useAuthStore } from '@/shared/stores/auth.store';
import {
  LayoutDashboard as DashboardIcon,
  Landmark as LandmarkIcon,
  ArrowRight as ArrowRightIcon,
  Receipt as ReceiptIcon,
  Package as PackageIcon,
  Clock as ClockIcon,
  HandCoins as DebtIcon,
} from 'lucide-vue-next';

const authStore = useAuthStore();

interface ShortcutItem {
  to: string;
  label: string;
  icon: Component;
  bg: string;
  iconColor: string;
}

const shortcuts: ShortcutItem[] = [
  { to: '/admin/transactions', label: 'Lihat Transaksi', icon: ReceiptIcon, bg: 'bg-blue-100 dark:bg-blue-900/40', iconColor: 'text-blue-600 dark:text-blue-300' },
  { to: '/admin/products', label: 'Cek Stok Produk', icon: PackageIcon, bg: 'bg-emerald-100 dark:bg-emerald-900/40', iconColor: 'text-emerald-600 dark:text-emerald-300' },
  { to: '/admin/shifts', label: 'Buka/Tutup Shift', icon: ClockIcon, bg: 'bg-amber-100 dark:bg-amber-900/40', iconColor: 'text-amber-600 dark:text-amber-300' },
  { to: '/admin/debts', label: 'Hutang Pelanggan', icon: DebtIcon, bg: 'bg-rose-100 dark:bg-rose-900/40', iconColor: 'text-rose-600 dark:text-rose-300' },
];

// Stats placeholder — nanti di-fetch dari API analytics
const stats = ref({
  todayRevenue: 0,
  todayTx: 0,
  todayBrilink: 0,
  activeDebts: 0,
});

const displayName = computed(() => {
  const u = authStore.user;
  if (!u) return 'Admin';
  return u.username || u.email?.split('@')[0] || 'Admin';
});

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
});

const todayLabel = computed(() =>
  new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
);

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}
</script>
