<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Mobile Topbar -->
    <header
      class="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="p-2 -ml-2 text-slate-700 hover:bg-slate-100 rounded-md"
          aria-label="Toggle menu"
          @click="sidebarOpen = !sidebarOpen"
        >
          <component :is="MenuIcon" class="w-5 h-5" />
        </button>
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
            <component :is="StoreIcon" class="w-4 h-4 text-white" />
          </div>
          <h1 class="text-sm font-bold text-slate-950">Maslahat Tani</h1>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="p-2 text-slate-600 hover:bg-slate-100 rounded-md"
          aria-label="Logout"
          @click="handleLogout"
        >
          <component :is="LogOutIcon" class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Sidebar overlay (mobile) -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      @click="sidebarOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside
      class="fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Logo -->
      <div class="h-16 px-5 flex items-center border-b border-slate-800 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <component :is="StoreIcon" class="w-5 h-5 text-white" />
          </div>
          <div>
            <p class="text-sm font-bold leading-tight">Maslahat Tani</p>
            <p class="text-[11px] text-slate-400 leading-tight">Admin Dashboard</p>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        <div v-for="group in navGroups" :key="group.title">
          <!-- Group header -->
          <div class="flex items-center justify-between px-3 mb-1.5">
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {{ group.title }}
            </p>
            <span
              v-if="group.badge"
              class="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-300"
            >
              {{ group.badge }}
            </span>
          </div>

          <!-- Group items -->
          <div class="space-y-0.5">
            <RouterLink
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              custom
              v-slot="{ isActive, href, navigate }"
            >
              <a
                :href="href"
                :class="[
                  'flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white font-medium'
                    : group.muted
                    ? 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                ]"
                @click="(e) => onNavClick(e, navigate)"
              >
                <component :is="item.icon" class="w-4 h-4 shrink-0" />
                <span class="truncate">{{ item.label }}</span>
                <span
                  v-if="item.badge"
                  class="ml-auto px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500 text-white"
                >
                  {{ item.badge }}
                </span>
              </a>
            </RouterLink>
          </div>
        </div>
      </nav>

      <!-- Bottom section -->
      <div class="border-t border-slate-800 p-3 space-y-0.5 shrink-0">
        <RouterLink
          v-for="item in bottomNav"
          :key="item.to"
          :to="item.to"
          custom
          v-slot="{ isActive, href, navigate }"
        >
          <a
            :href="href"
            :class="[
              'flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors',
              isActive
                ? 'bg-blue-600 text-white font-medium'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white',
            ]"
            @click="(e) => onNavClick(e, navigate)"
          >
            <component :is="item.icon" class="w-4 h-4 shrink-0" />
            <span>{{ item.label }}</span>
          </a>
        </RouterLink>

        <button
          type="button"
          class="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors text-slate-300 hover:bg-red-600/20 hover:text-red-300"
          @click="handleLogout"
        >
          <component :is="LogOutIcon" class="w-4 h-4 shrink-0" />
          Logout
        </button>

        <!-- User info -->
        <div class="mt-2 pt-3 border-t border-slate-800 flex items-center gap-2 px-2">
          <div
            class="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-semibold text-blue-300"
          >
            {{ userInitials }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-white truncate">{{ displayName }}</p>
            <p class="text-[11px] text-slate-400 truncate">{{ roleLabel }}</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <main class="lg:ml-64 min-h-screen">
      <!-- Desktop topbar -->
      <header
        class="hidden lg:flex sticky top-0 z-20 h-16 bg-white border-b border-slate-200 px-6 items-center justify-between"
      >
        <div>
          <h2 class="text-lg font-bold text-slate-950">{{ pageTitle }}</h2>
          <p class="text-xs text-slate-500">{{ pageSubtitle }}</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-500">
            {{ todayLabel }}
          </span>
          <div class="h-8 w-px bg-slate-200"></div>
          <div class="flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-xs font-semibold text-blue-700"
            >
              {{ userInitials }}
            </div>
            <div class="text-right">
              <p class="text-xs font-semibold text-slate-900">{{ displayName }}</p>
              <p class="text-[11px] text-slate-500">{{ roleLabel }}</p>
            </div>
          </div>
        </div>
      </header>

      <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import {
  Menu as MenuIcon,
  Store as StoreIcon,
  LayoutDashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  Package as PackageIcon,
  HandCoins as DebtIcon,
  Wallet as WalletIcon,
  Users as UsersIcon,
  BarChart3 as ReportIcon,
  Settings as SettingsIcon,
  LogOut as LogOutIcon,
  // BRILink
  Landmark as LandmarkIcon,
  ArrowRightLeft as TransferIcon,
  Banknote as BanknoteIcon,
  Smartphone as SmartphoneIcon,
  Percent as PercentIcon,
  ScrollText as MutationIcon,
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const sidebarOpen = ref(false);

interface NavItem {
  to: string;
  label: string;
  icon: Component;
  badge?: string | number;
}

interface NavGroup {
  title: string;
  badge?: string;
  /** Render dengan warna lebih redup untuk modul yang belum aktif. */
  muted?: boolean;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Retail',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: DashboardIcon },
      { to: '/admin/transactions', label: 'Transaksi', icon: ReceiptIcon },
      { to: '/admin/products', label: 'Produk & Stok', icon: PackageIcon },
      { to: '/admin/debts', label: 'Hutang', icon: DebtIcon },
      { to: '/admin/payments', label: 'Pembayaran', icon: WalletIcon },
      { to: '/admin/kasir', label: 'Kasir', icon: UsersIcon },
    ],
  },
  {
    title: 'BRILink',
    badge: 'Phase 2',
    muted: true,
    items: [
      { to: '/admin/brilink/transfer', label: 'Transfer', icon: TransferIcon },
      { to: '/admin/brilink/cash', label: 'Tarik / Setor', icon: BanknoteIcon },
      { to: '/admin/brilink/topup', label: 'Top Up & Pulsa', icon: SmartphoneIcon },
      { to: '/admin/brilink/mutations', label: 'Mutasi', icon: MutationIcon },
      { to: '/admin/brilink/fees', label: 'Pengaturan Fee', icon: PercentIcon },
    ],
  },
  {
    title: 'Sistem',
    items: [{ to: '/admin/reports', label: 'Laporan', icon: ReportIcon }],
  },
];

const bottomNav: NavItem[] = [
  { to: '/admin/settings', label: 'Pengaturan', icon: SettingsIcon },
];

function onNavClick(e: MouseEvent, navigate: (e?: MouseEvent) => void) {
  navigate(e);
  sidebarOpen.value = false;
}

const displayName = computed(() => {
  const u = authStore.user;
  if (!u) return 'Admin';
  return u.username || u.email || 'Admin';
});

const userInitials = computed(() => {
  const name = displayName.value;
  const parts = name.split(/[@\s._-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? 'A';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase().slice(0, 2);
});

const roleLabel = computed(() => {
  const r = authStore.user?.role;
  if (r === 'SUPER_ADMIN') return 'Super Admin';
  if (r === 'ADMIN') return 'Admin';
  if (r === 'CASHIER_SUPERVISOR') return 'Supervisor Kasir';
  if (r === 'KASIR') return 'Kasir';
  return '—';
});

const pageTitle = computed(() => {
  const meta = route.meta?.title as string | undefined;
  if (meta) {
    // Strip suffix " — Maslahat Tani" kalau ada
    return meta.replace(/\s*[—-]\s*Maslahat Tani.*$/i, '').trim() || meta;
  }
  const fallback: Record<string, string> = {
    'admin-dashboard': 'Dashboard',
    'admin-transactions': 'Transaksi',
    'admin-products': 'Produk & Stok',
    'admin-debts': 'Hutang',
    'admin-payments': 'Pembayaran',
    'admin-kasir': 'Kasir',
    'admin-reports': 'Laporan',
    'admin-settings': 'Pengaturan',
    'admin-brilink-transfer': 'BRILink — Transfer',
    'admin-brilink-cash': 'BRILink — Tarik / Setor',
    'admin-brilink-topup': 'BRILink — Top Up',
    'admin-brilink-mutations': 'BRILink — Mutasi',
    'admin-brilink-fees': 'BRILink — Fee',
  };
  return fallback[String(route.name ?? '')] ?? 'Admin';
});

const pageSubtitle = computed(() => {
  const map: Record<string, string> = {
    'admin-dashboard': 'Ringkasan operasional toko hari ini',
    'admin-transactions': 'Riwayat & manajemen transaksi',
    'admin-products': 'Master produk dan stok gudang',
    'admin-debts': 'Manajemen hutang pelanggan',
    'admin-payments': 'Mutasi kas dan pembayaran',
    'admin-kasir': 'Manajemen akun kasir',
    'admin-reports': 'Laporan penjualan & laba',
    'admin-settings': 'Konfigurasi toko & sistem',
    'admin-brilink-transfer': 'Kirim dana antar bank',
    'admin-brilink-cash': 'Layani tarik & setor tunai',
    'admin-brilink-topup': 'Top up e-wallet, pulsa & paket data',
    'admin-brilink-mutations': 'Riwayat transaksi BRILink',
    'admin-brilink-fees': 'Atur margin fee per transaksi',
  };
  return map[String(route.name ?? '')] ?? '';
});

const todayLabel = computed(() => {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
});

async function handleLogout() {
  await authStore.logout();
  router.push({ name: 'admin-login' });
}
</script>
