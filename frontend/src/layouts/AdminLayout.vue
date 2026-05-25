<template>
  <div class="min-h-screen bg-slate-50 flex">
    <!-- Sidebar Overlay (Mobile) -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 px-5 h-16 border-b border-slate-800 shrink-0">
        <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <component :is="StoreIcon" class="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 class="text-sm font-bold leading-tight">Maslahat Tani</h1>
          <p class="text-[10px] text-slate-400">Admin Panel</p>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Menu Utama</p>

        <RouterLink
          v-for="item in mainMenuItems"
          :key="item.name"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="isActive(item.path)
            ? 'bg-blue-600/20 text-blue-300'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'"
          @click="sidebarOpen = false"
        >
          <component :is="item.icon" class="w-5 h-5 shrink-0" />
          <span>{{ item.label }}</span>
          <span
            v-if="item.badge"
            class="ml-auto text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full"
          >
            {{ item.badge }}
          </span>
        </RouterLink>

        <div class="pt-4 pb-2">
          <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Pengaturan</p>
        </div>

        <RouterLink
          v-for="item in settingsMenuItems"
          :key="item.name"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="isActive(item.path)
            ? 'bg-blue-600/20 text-blue-300'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'"
          @click="sidebarOpen = false"
        >
          <component :is="item.icon" class="w-5 h-5 shrink-0" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <!-- User Info -->
      <div class="border-t border-slate-800 px-4 py-3 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
            <component :is="UserIcon" class="w-4 h-4 text-slate-300" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-white truncate">{{ authStore.fullName || 'Admin' }}</p>
            <p class="text-[10px] text-slate-400">{{ authStore.userRole }}</p>
          </div>
          <button
            @click="handleLogout"
            class="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <component :is="LogOutIcon" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Topbar -->
      <header class="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 gap-4 shrink-0">
        <!-- Mobile menu toggle -->
        <button
          class="lg:hidden p-2 -ml-2 rounded-md hover:bg-slate-100 text-slate-600"
          @click="sidebarOpen = !sidebarOpen"
        >
          <component :is="MenuIcon" class="w-5 h-5" />
        </button>

        <!-- Page title -->
        <div class="flex-1">
          <h2 class="text-lg font-semibold text-slate-900">{{ pageTitle }}</h2>
        </div>

        <!-- Topbar Actions -->
        <div class="flex items-center gap-3">
          <!-- Notifications (placeholder) -->
          <button class="relative p-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors">
            <component :is="BellIcon" class="w-5 h-5" />
            <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <!-- Quick help -->
          <button class="p-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors">
            <component :is="HelpCircleIcon" class="w-5 h-5" />
          </button>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 p-4 sm:p-6 overflow-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import {
  Store as StoreIcon,
  LayoutDashboard as LayoutDashboardIcon,
  Users as UsersIcon,
  Package as PackageIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
  Wallet as WalletIcon,
  Clock as ClockIcon,
  Settings as SettingsIcon,
  Building2 as Building2Icon,
  User as UserIcon,
  LogOut as LogOutIcon,
  Menu as MenuIcon,
  Bell as BellIcon,
  HelpCircle as HelpCircleIcon,
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const sidebarOpen = ref(false);

const mainMenuItems = [
  { name: 'dashboard', path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
  { name: 'kasir', path: '/admin/kasir', label: 'Manajemen Kasir', icon: UsersIcon },
  { name: 'produk', path: '/admin/produk', label: 'Produk & Stok', icon: PackageIcon },
  { name: 'transaksi', path: '/admin/transaksi', label: 'Transaksi', icon: ShoppingCartIcon },
  { name: 'hutang', path: '/admin/hutang', label: 'Hutang', icon: ReceiptIcon, badge: '3' },
  { name: 'kas', path: '/admin/kas', label: 'Kas & Pembayaran', icon: WalletIcon },
  { name: 'shift', path: '/admin/shift', label: 'Shift & Settlement', icon: ClockIcon },
];

const settingsMenuItems = [
  { name: 'toko', path: '/admin/pengaturan/toko', label: 'Data Toko', icon: Building2Icon },
  { name: 'pengaturan', path: '/admin/pengaturan', label: 'Pengaturan Umum', icon: SettingsIcon },
];

function isActive(path: string): boolean {
  if (path === '/admin/dashboard') {
    return route.path === '/admin/dashboard';
  }
  return route.path.startsWith(path);
}

const pageTitle = computed(() => {
  const title = route.meta.pageTitle as string | undefined;
  return title || 'Dashboard';
});

async function handleLogout() {
  await authStore.logout();
  router.push('/admin/login');
}
</script>
