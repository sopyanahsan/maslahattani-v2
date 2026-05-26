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
          <!-- Shop selector (super-admin only, atau user dgn akses >1 cabang) -->
          <div v-if="canSwitchShop" class="relative">
            <button
              type="button"
              class="flex items-center gap-2 h-9 px-3 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
              @click="shopMenuOpen = !shopMenuOpen"
            >
              <component :is="Building2Icon" class="w-4 h-4 text-slate-600" />
              <div class="text-left">
                <p class="text-[10px] uppercase tracking-wide text-slate-500 leading-tight">
                  Cabang Aktif
                </p>
                <p class="text-xs font-semibold text-slate-900 leading-tight max-w-[180px] truncate">
                  {{ currentShopName || 'Belum dipilih' }}
                </p>
              </div>
              <component
                :is="ChevronDownIcon"
                :class="['w-4 h-4 text-slate-500 transition-transform', shopMenuOpen && 'rotate-180']"
              />
            </button>

            <!-- Dropdown -->
            <div
              v-if="shopMenuOpen"
              class="absolute right-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-30 overflow-hidden"
            >
              <div class="px-4 py-2 border-b border-slate-100 bg-slate-50">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Pilih cabang ({{ availableShops.length }})
                </p>
              </div>
              <div class="max-h-72 overflow-y-auto">
                <button
                  v-for="shop in availableShops"
                  :key="shop.id"
                  type="button"
                  :disabled="switchingShop"
                  :class="[
                    'w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-start gap-2 disabled:opacity-60',
                    currentShopId === shop.id && 'bg-blue-50',
                  ]"
                  @click="handleSwitchShop(shop.id)"
                >
                  <component
                    :is="currentShopId === shop.id ? CheckIcon : StoreIcon"
                    :class="[
                      'w-4 h-4 shrink-0 mt-0.5',
                      currentShopId === shop.id ? 'text-blue-600' : 'text-slate-400',
                    ]"
                  />
                  <div class="flex-1 min-w-0">
                    <p
                      :class="[
                        'text-sm font-medium truncate',
                        currentShopId === shop.id ? 'text-blue-700' : 'text-slate-900',
                      ]"
                    >
                      {{ shop.name }}
                    </p>
                    <p class="text-[11px] text-slate-500 truncate">{{ shop.address }}</p>
                  </div>
                </button>
              </div>
              <div class="border-t border-slate-100 px-4 py-2 bg-slate-50">
                <p v-if="switchError" class="text-[11px] text-red-600">{{ switchError }}</p>
                <p v-else class="text-[10px] text-slate-500">
                  Klik untuk ganti konteks. Tab lain mungkin perlu refresh.
                </p>
              </div>
            </div>
          </div>

          <span class="text-xs text-slate-500 hidden xl:inline">
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
import { computed, onMounted, ref, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
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
  Building2 as Building2Icon,
  ChevronDown as ChevronDownIcon,
  Check as CheckIcon,
  Boxes as BoxesIcon,
  // BRILink
  Landmark as LandmarkIcon,
  ArrowRightLeft as TransferIcon,
  Banknote as BanknoteIcon,
  Smartphone as SmartphoneIcon,
  Percent as PercentIcon,
  ScrollText as MutationIcon,
  // Phase 1 (PRD)
  Clock as ShiftIcon,
  Building2 as ShopIcon,
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const shopStore = useShopStore();

const sidebarOpen = ref(false);
const shopMenuOpen = ref(false);
const switchingShop = ref(false);
const switchError = ref('');

// === Shop selector state ===
const currentShopName = computed(() => shopStore.currentShopName);
const currentShopId = computed(() => shopStore.currentShopId);
const availableShops = computed(() => shopStore.availableShops);

/**
 * Switcher cabang ditampilin kalau:
 * - User SUPER_ADMIN (bisa pilih semua cabang), ATAU
 * - User punya akses ke >1 cabang (defensive — saat ini schema 1 user = 1 shop,
 *   tapi nanti kalau berubah tetep aman)
 * - Atau SUPER_ADMIN belum pilih cabang (requireShopSelection still true)
 */
const canSwitchShop = computed(
  () => authStore.isSuperAdmin || availableShops.value.length > 1,
);

async function handleSwitchShop(shopId: string) {
  if (shopId === currentShopId.value) {
    shopMenuOpen.value = false;
    return;
  }

  switchingShop.value = true;
  switchError.value = '';

  try {
    await shopStore.selectShop(shopId);
    await authStore.fetchUser();
    shopMenuOpen.value = false;
    // Reload current view supaya data refresh sesuai cabang baru.
    // Pakai router.replace dgn ?_t= untuk trigger re-mount tanpa full page reload.
    router.replace({
      path: route.path,
      query: { ...route.query, _t: Date.now().toString() },
    });
  } catch (err: any) {
    switchError.value = err?.message ?? 'Gagal ganti cabang.';
  } finally {
    switchingShop.value = false;
  }
}

// Pre-fetch shops list sekali saat mount supaya dropdown selalu siap
// (login response sudah set buat super-admin, tapi reload page bisa kosong)
onMounted(async () => {
  if (canSwitchShop.value && availableShops.value.length === 0) {
    try {
      await shopStore.fetchShops();
    } catch {
      // Silent: dropdown akan empty kalau gagal
    }
  }

  // Auto-select first shop kalau super-admin belum punya cabang aktif
  if (authStore.isSuperAdmin && !shopStore.hasCurrentShop) {
    const shops = availableShops.value;
    if (shops.length > 0) {
      try {
        await shopStore.selectShop(shops[0].id);
        await authStore.fetchUser();
      } catch {
        // Silent: user bisa pilih manual dari dropdown
      }
    }
  }
});

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
      { to: '/admin/shifts', label: 'Shift', icon: ShiftIcon },
      { to: '/admin/kasir', label: 'Kasir', icon: UsersIcon },
    ],
  },
  {
    title: 'BRILink',
    badge: 'Phase 2',
    muted: true,
    items: [
      { to: '/admin/brilink/transfer', label: 'Transfer', icon: TransferIcon },
      { to: '/admin/brilink/cash', label: 'Tarik Tunai', icon: BanknoteIcon },
      { to: '/admin/brilink/topup', label: 'Top Up & Pulsa', icon: SmartphoneIcon },
      { to: '/admin/brilink/mutations', label: 'Mutasi', icon: MutationIcon },
      { to: '/admin/brilink/fees', label: 'Pengaturan Fee', icon: PercentIcon },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { to: '/admin/shops', label: 'Cabang', icon: ShopIcon },
      { to: '/admin/cashbox-categories', label: 'Kategori Cashbox', icon: BoxesIcon },
      { to: '/admin/reports', label: 'Laporan', icon: ReportIcon },
    ],
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
    'admin-shifts': 'Shift',
    'admin-shift-detail': 'Detail Shift',
    'admin-kasir': 'Kasir',
    'admin-shops': 'Cabang',
    'admin-cashbox-categories': 'Kategori Cashbox',
    'admin-reports': 'Laporan',
    'admin-settings': 'Pengaturan',
    'admin-brilink-transfer': 'BRILink — Transfer',
    'admin-brilink-cash': 'BRILink — Tarik Tunai',
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
    'admin-shifts': 'Buka, tutup, dan rekonsiliasi shift kasir',
    'admin-shift-detail': 'Rincian shift dan finalisasi audit kas',
    'admin-kasir': 'Manajemen akun kasir',
    'admin-shops': 'Kelola cabang & multi-toko',
    'admin-cashbox-categories': 'Kategori kas terpisah (Retail, Subsidi Pupuk, dll)',
    'admin-reports': 'Laporan penjualan & laba',
    'admin-settings': 'Konfigurasi toko & sistem',
    'admin-brilink-transfer': 'Kirim dana antar bank',
    'admin-brilink-cash': 'Layani tarik tunai pelanggan',
    'admin-brilink-topup': 'Top up e-wallet, pulsa, PLN & paket data',
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
