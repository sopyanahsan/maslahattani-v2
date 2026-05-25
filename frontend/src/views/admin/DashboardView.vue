<template>
  <div class="space-y-6">
    <!-- Welcome Banner -->
    <div class="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 sm:p-6 text-white">
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-xl font-bold">Selamat datang, {{ authStore.fullName || 'Admin' }}!</h1>
          <p class="text-blue-100 text-sm mt-1">Berikut ringkasan toko hari ini — {{ todayFormatted }}</p>
        </div>
        <div class="hidden sm:flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
          <component :is="CalendarIcon" class="w-4 h-4 text-blue-200" />
          <span class="text-xs font-medium text-blue-100">{{ todayFormatted }}</span>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="stat in statsCards"
        :key="stat.label"
        class="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">{{ stat.label }}</p>
            <p class="text-2xl font-bold text-slate-900 mt-1">{{ stat.value }}</p>
            <div class="flex items-center gap-1 mt-2">
              <component
                :is="stat.trend === 'up' ? TrendingUpIcon : TrendingDownIcon"
                class="w-3.5 h-3.5"
                :class="stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'"
              />
              <span
                class="text-xs font-medium"
                :class="stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'"
              >
                {{ stat.change }}
              </span>
              <span class="text-xs text-slate-400">vs kemarin</span>
            </div>
          </div>
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            :class="stat.iconBg"
          >
            <component :is="stat.icon" class="w-5 h-5" :class="stat.iconColor" />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Transaksi Terakhir (2 cols) -->
      <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200">
        <div class="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 class="text-sm font-semibold text-slate-900">Transaksi Terakhir</h3>
          <RouterLink
            to="/admin/transaksi"
            class="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Lihat Semua &rarr;
          </RouterLink>
        </div>
        <div class="divide-y divide-slate-100">
          <div
            v-for="trx in recentTransactions"
            :key="trx.id"
            class="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors"
          >
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              :class="trx.type === 'sale' ? 'bg-emerald-100' : 'bg-amber-100'"
            >
              <component
                :is="trx.type === 'sale' ? ShoppingCartIcon : ReceiptIcon"
                class="w-4 h-4"
                :class="trx.type === 'sale' ? 'text-emerald-600' : 'text-amber-600'"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-900 truncate">{{ trx.description }}</p>
              <p class="text-xs text-slate-500">{{ trx.time }} — {{ trx.kasir }}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-sm font-semibold" :class="trx.type === 'sale' ? 'text-emerald-600' : 'text-slate-900'">
                {{ trx.amount }}
              </p>
              <span
                class="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                :class="getStatusClass(trx.status)"
              >
                {{ trx.status }}
              </span>
            </div>
          </div>
        </div>
        <div v-if="recentTransactions.length === 0" class="p-8 text-center">
          <component :is="InboxIcon" class="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p class="text-sm text-slate-500">Belum ada transaksi hari ini</p>
        </div>
      </div>

      <!-- Sidebar: Hutang & Quick Actions -->
      <div class="space-y-6">
        <!-- Hutang Jatuh Tempo -->
        <div class="bg-white rounded-xl border border-slate-200">
          <div class="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 class="text-sm font-semibold text-slate-900">Hutang Jatuh Tempo</h3>
            <span class="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              {{ overdueDebts.length }}
            </span>
          </div>
          <div class="divide-y divide-slate-100">
            <div
              v-for="debt in overdueDebts"
              :key="debt.id"
              class="px-5 py-3"
            >
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-slate-900">{{ debt.customer }}</p>
                <p class="text-sm font-semibold text-red-600">{{ debt.amount }}</p>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">Jatuh tempo: {{ debt.dueDate }}</p>
            </div>
          </div>
          <div v-if="overdueDebts.length === 0" class="p-5 text-center">
            <p class="text-xs text-slate-400">Tidak ada hutang jatuh tempo</p>
          </div>
          <div class="p-3 border-t border-slate-100">
            <RouterLink
              to="/admin/hutang"
              class="block text-center text-xs text-blue-600 hover:text-blue-700 font-medium py-1"
            >
              Kelola Hutang &rarr;
            </RouterLink>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-xl border border-slate-200 p-5">
          <h3 class="text-sm font-semibold text-slate-900 mb-3">Aksi Cepat</h3>
          <div class="grid grid-cols-2 gap-2">
            <RouterLink
              v-for="action in quickActions"
              :key="action.label"
              :to="action.path"
              class="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
            >
              <component :is="action.icon" class="w-5 h-5 text-slate-600" />
              <span class="text-[11px] font-medium text-slate-700">{{ action.label }}</span>
            </RouterLink>
          </div>
        </div>

        <!-- Stok Rendah -->
        <div class="bg-white rounded-xl border border-slate-200">
          <div class="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 class="text-sm font-semibold text-slate-900">Stok Rendah</h3>
            <component :is="AlertTriangleIcon" class="w-4 h-4 text-amber-500" />
          </div>
          <div class="divide-y divide-slate-100">
            <div
              v-for="item in lowStockItems"
              :key="item.id"
              class="flex items-center justify-between px-5 py-3"
            >
              <div>
                <p class="text-sm font-medium text-slate-900">{{ item.name }}</p>
                <p class="text-xs text-slate-500">SKU: {{ item.sku }}</p>
              </div>
              <span class="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                {{ item.stock }} pcs
              </span>
            </div>
          </div>
          <div v-if="lowStockItems.length === 0" class="p-5 text-center">
            <p class="text-xs text-slate-400">Semua stok aman</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import {
  Calendar as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
  Wallet as WalletIcon,
  Users as UsersIcon,
  Package as PackageIcon,
  UserPlus as UserPlusIcon,
  Clock as ClockIcon,
  AlertTriangle as AlertTriangleIcon,
  Inbox as InboxIcon,
  DollarSign as DollarSignIcon,
  CreditCard as CreditCardIcon,
} from 'lucide-vue-next';

const authStore = useAuthStore();

const todayFormatted = computed(() => {
  const now = new Date();
  return now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
});

// Dummy stats data (will be replaced with real API data)
const statsCards = [
  {
    label: 'Omzet Hari Ini',
    value: 'Rp 2.450.000',
    change: '+12%',
    trend: 'up',
    icon: DollarSignIcon,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    label: 'Profit',
    value: 'Rp 580.000',
    change: '+8%',
    trend: 'up',
    icon: TrendingUpIcon,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    label: 'Transaksi',
    value: '47',
    change: '+5',
    trend: 'up',
    icon: ShoppingCartIcon,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    label: 'Hutang Aktif',
    value: 'Rp 1.200.000',
    change: '-3%',
    trend: 'down',
    icon: CreditCardIcon,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
];

// Dummy recent transactions
const recentTransactions = [
  { id: '1', description: 'Beras 5kg + Minyak Goreng', time: '14:32', kasir: 'Rina', amount: 'Rp 125.000', type: 'sale', status: 'Lunas' },
  { id: '2', description: 'Rokok Sampoerna 1 Slop', time: '14:15', kasir: 'Rina', amount: 'Rp 210.000', type: 'sale', status: 'Lunas' },
  { id: '3', description: 'Gula 1kg + Kopi', time: '13:50', kasir: 'Budi', amount: 'Rp 45.000', type: 'sale', status: 'Hutang' },
  { id: '4', description: 'Sabun + Shampoo + Pasta Gigi', time: '13:22', kasir: 'Budi', amount: 'Rp 67.500', type: 'sale', status: 'Lunas' },
  { id: '5', description: 'Gas LPG 3kg', time: '12:45', kasir: 'Rina', amount: 'Rp 22.000', type: 'sale', status: 'Lunas' },
];

// Dummy overdue debts
const overdueDebts = [
  { id: '1', customer: 'Pak Slamet', amount: 'Rp 350.000', dueDate: '22 Mei 2026' },
  { id: '2', customer: 'Bu Ani', amount: 'Rp 125.000', dueDate: '20 Mei 2026' },
  { id: '3', customer: 'Mas Dedi', amount: 'Rp 75.000', dueDate: '18 Mei 2026' },
];

// Low stock items
const lowStockItems = [
  { id: '1', name: 'Minyak Goreng 1L', sku: 'MG-001', stock: 3 },
  { id: '2', name: 'Beras Pandan 5kg', sku: 'BR-005', stock: 2 },
  { id: '3', name: 'Gula Pasir 1kg', sku: 'GL-001', stock: 5 },
];

// Quick actions
const quickActions = [
  { label: 'Tambah Produk', path: '/admin/produk', icon: PackageIcon },
  { label: 'Buat Kasir', path: '/admin/kasir', icon: UserPlusIcon },
  { label: 'Buka Shift', path: '/admin/shift', icon: ClockIcon },
  { label: 'Kas Masuk', path: '/admin/kas', icon: WalletIcon },
];

function getStatusClass(status: string): string {
  switch (status) {
    case 'Lunas':
      return 'bg-emerald-100 text-emerald-700';
    case 'Hutang':
      return 'bg-amber-100 text-amber-700';
    case 'Void':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}
</script>
