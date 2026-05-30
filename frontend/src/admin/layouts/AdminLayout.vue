<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
    <!-- Mobile Topbar -->
    <header
      class="lg:hidden sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-14 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="p-2 -ml-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
          aria-label="Toggle menu"
          @click="sidebarOpen = !sidebarOpen"
        >
          <component :is="MenuIcon" class="w-5 h-5" />
        </button>
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
            <component :is="StoreIcon" class="w-4 h-4 text-white" />
          </div>
          <h1 class="text-sm font-bold text-slate-950 dark:text-slate-100">Maslahat Tani</h1>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <!-- Theme toggle (mobile) -->
        <button
          type="button"
          class="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
          :aria-label="`Switch to ${themeResolved === 'dark' ? 'light' : 'dark'} mode`"
          @click="toggleTheme"
        >
          <component :is="themeResolved === 'dark' ? SunIcon : MoonIcon" class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
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

    <!-- Sidebar (always dark) -->
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
      <nav class="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        <!-- Top-level items (Home, Dashboard Retail) -->
        <div class="space-y-0.5 mb-3">
          <RouterLink
            v-for="item in topItems"
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
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              ]"
              @click="(e) => onNavClick(e, navigate)"
            >
              <component :is="item.icon" class="w-4 h-4 shrink-0" />
              <span class="truncate">{{ item.label }}</span>
            </a>
          </RouterLink>
        </div>

        <!-- Grouped items -->
        <div v-for="group in navGroups" :key="group.title" class="mb-3">
          <div class="px-3 mb-1.5">
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {{ group.title }}
            </p>
          </div>

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
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                ]"
                @click="(e) => onNavClick(e, navigate)"
              >
                <component :is="item.icon" class="w-4 h-4 shrink-0" />
                <span class="truncate">{{ item.label }}</span>
                <span
                  v-if="item.badge"
                  :class="[
                    'ml-auto px-1.5 py-0.5 text-[10px] font-semibold rounded-full',
                    item.badgeColor || 'bg-amber-500 text-white',
                  ]"
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
        class="hidden lg:flex sticky top-0 z-20 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 items-center justify-between transition-colors"
      >
        <div>
          <h2 class="text-lg font-bold text-slate-950 dark:text-slate-100">{{ pageTitle }}</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ pageSubtitle }}</p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Shop selector -->
          <div v-if="canSwitchShop" class="relative">
            <button
              type="button"
              class="flex items-center gap-2 h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              @click="shopMenuOpen = !shopMenuOpen"
            >
              <component :is="Building2Icon" class="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <div class="text-left">
                <p class="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400 leading-tight">
                  Cabang Aktif
                </p>
                <p class="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight max-w-[180px] truncate">
                  {{ currentShopName || 'Belum dipilih' }}
                </p>
              </div>
              <component
                :is="ChevronDownIcon"
                :class="['w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform', shopMenuOpen && 'rotate-180']"
              />
            </button>

            <div
              v-if="shopMenuOpen"
              class="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-30 overflow-hidden"
            >
              <div class="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                    'w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-start gap-2 disabled:opacity-60',
                    currentShopId === shop.id && 'bg-blue-50 dark:bg-blue-950/30',
                  ]"
                  @click="handleSwitchShop(shop.id)"
                >
                  <component
                    :is="currentShopId === shop.id ? CheckIcon : StoreIcon"
                    :class="[
                      'w-4 h-4 shrink-0 mt-0.5',
                      currentShopId === shop.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500',
                    ]"
                  />
                  <div class="flex-1 min-w-0">
                    <p
                      :class="[
                        'text-sm font-medium truncate',
                        currentShopId === shop.id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-slate-100',
                      ]"
                    >
                      {{ shop.name }}
                    </p>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">{{ shop.address }}</p>
                  </div>
                </button>
              </div>
              <div class="border-t border-slate-100 dark:border-slate-800 px-4 py-2 bg-slate-50 dark:bg-slate-800">
                <p v-if="switchError" class="text-[11px] text-red-600 dark:text-red-400">{{ switchError }}</p>
                <p v-else class="text-[10px] text-slate-500 dark:text-slate-400">
                  Klik untuk ganti konteks. Tab lain mungkin perlu refresh.
                </p>
              </div>
            </div>
          </div>

          <!-- Theme toggle (desktop) -->
          <button
            type="button"
            class="h-9 w-9 flex items-center justify-center rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            :aria-label="themeAriaLabel"
            :title="themeAriaLabel"
            @click="toggleTheme"
          >
            <component :is="themeIcon" class="w-4 h-4" />
          </button>

          <span class="text-xs text-slate-500 dark:text-slate-400 hidden xl:inline">
            {{ todayLabel }}
          </span>
          <div class="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
          <div class="flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 flex items-center justify-center text-xs font-semibold text-blue-700 dark:text-blue-300"
            >
              {{ userInitials }}
            </div>
            <div class="text-right">
              <p class="text-xs font-semibold text-slate-900 dark:text-slate-100">{{ displayName }}</p>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">{{ roleLabel }}</p>
            </div>
          </div>
        </div>
      </header>



      <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto text-slate-900 dark:text-slate-100">
        <RouterView />
      </div>
    </main>

    <!-- ============================================ -->
    <!-- Switch Branch Confirmation Modal             -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showSwitchConfirmation" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="cancelSwitchShop"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
          <div class="flex items-start gap-3">
            <div class="shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Building2Icon class="w-5 h-5 text-amber-600" />
            </div>
            <div class="min-w-0">
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">
                Ganti Cabang Aktif?
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Anda akan beralih dari <strong class="text-slate-700 dark:text-slate-200">{{ currentShopName || '—' }}</strong> ke
                <strong class="text-blue-700 dark:text-blue-400">{{ pendingSwitchShopName }}</strong>.
              </p>
            </div>
          </div>

          <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-1.5">
            <p class="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase">
              ⚠️ Yang akan berubah:
            </p>
            <ul class="text-[11px] text-amber-700 dark:text-amber-300 space-y-0.5 ml-1">
              <li>• Data produk &amp; stok yang ditampilkan</li>
              <li>• Pengaturan sistem (toggle ON/OFF)</li>
              <li>• Transaksi, hutang, kas, dan laporan</li>
              <li>• Semua perubahan disimpan ke cabang yang aktif</li>
            </ul>
          </div>

          <p v-if="switchError" class="text-xs text-red-600 dark:text-red-400">{{ switchError }}</p>

          <div class="flex justify-end gap-2 pt-1">
            <button
              type="button"
              :disabled="switchingShop"
              class="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
              @click="cancelSwitchShop"
            >
              Batal
            </button>
            <button
              type="button"
              :disabled="switchingShop"
              class="h-9 px-5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
              @click="confirmSwitchShop"
            >
              <Loader2Icon v-if="switchingShop" class="w-3.5 h-3.5 animate-spin" />
              {{ switchingShop ? 'Memuat...' : 'Ya, Pindah ke ' + pendingSwitchShopName }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, type Component } from 'vue';
import api from '@/shared/services/api';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import { useTheme } from '@/shared/composables/useTheme';
import {
  Menu as MenuIcon,
  Store as StoreIcon,
  Home as HomeIcon,
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
  Loader2 as Loader2Icon,
  // BRILink
  Landmark as LandmarkIcon,
  ArrowRightLeft as TransferIcon,
  Percent as PercentIcon,
  // Shifts & Profile
  Clock as ShiftIcon,
  User as UserIcon,
  // Theme
  Sun as SunIcon,
  Moon as MoonIcon,
  Monitor as MonitorIcon,
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const shopStore = useShopStore();
const { resolved: themeResolved, mode: themeMode, toggle: cycleTheme } = useTheme();

const sidebarOpen = ref(false);
const shopMenuOpen = ref(false);
const switchingShop = ref(false);
const switchError = ref('');

// Confirmation modal state for switching active branch
const showSwitchConfirmation = ref(false);
const pendingSwitchShopId = ref<string | null>(null);
const pendingSwitchShopName = ref('');

// === Theme ===
const themeIcon = computed<Component>(() => {
  if (themeMode.value === 'system') return MonitorIcon;
  return themeResolved.value === 'dark' ? MoonIcon : SunIcon;
});
const themeAriaLabel = computed(() => {
  if (themeMode.value === 'light') return 'Switch to Dark mode';
  if (themeMode.value === 'dark') return 'Switch to System default';
  return 'Switch to Light mode';
});
function toggleTheme() {
  cycleTheme();
}

// === Shop selector ===
const currentShopName = computed(() => shopStore.currentShopName);
const currentShopId = computed(() => shopStore.currentShopId);
const availableShops = computed(() => shopStore.availableShops);

const canSwitchShop = computed(
  () => authStore.isSuperAdmin || availableShops.value.length > 1,
);

async function handleSwitchShop(shopId: string) {
  if (shopId === currentShopId.value) {
    shopMenuOpen.value = false;
    return;
  }
  // Show confirmation modal first — super-admin must explicitly confirm
  // which branch they want to manage. Prevents accidentally editing wrong
  // branch's data (e.g. settings, products, prices).
  pendingSwitchShopId.value = shopId;
  pendingSwitchShopName.value =
    availableShops.value.find((s) => s.id === shopId)?.name ?? 'cabang ini';
  shopMenuOpen.value = false;
  showSwitchConfirmation.value = true;
}

async function confirmSwitchShop() {
  if (!pendingSwitchShopId.value) return;
  switchingShop.value = true;
  switchError.value = '';
  try {
    await shopStore.selectShop(pendingSwitchShopId.value);
    await authStore.fetchUser();
    showSwitchConfirmation.value = false;
    pendingSwitchShopId.value = null;
    pendingSwitchShopName.value = '';
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

function cancelSwitchShop() {
  showSwitchConfirmation.value = false;
  pendingSwitchShopId.value = null;
  pendingSwitchShopName.value = '';
}

/**
 * Fetch pending counts and set badges on nav items.
 * Uses individual API calls until a dedicated badge-counts endpoint exists.
 */
async function fetchBadgeCounts() {
  const shopId = shopStore.currentShopId ?? authStore.user?.shopId;
  if (!shopId) return;

  try {
    // Parallel: pending cash-out, overdue debts, pending transfers
    const [cashFlowRes, debtsRes, transfersRes, shiftsRes] = await Promise.allSettled([
      api.get('/cash-flows', { params: { shopId, status: 'PENDING', type: 'CASH_OUT', limit: 0 } }),
      api.get('/debts', { params: { shopId, status: 'OVERDUE', limit: 0 } }),
      api.get('/transfers', { params: { shopId, status: 'PENDING', limit: 0 } }),
      api.get('/shifts', { params: { shopId, status: 'CLOSED', limit: 0 } }),
    ]);

    const getCount = (res: PromiseSettledResult<any>): number => {
      if (res.status === 'fulfilled') {
        const d = res.value?.data;
        return d?.meta?.total ?? d?.total ?? (Array.isArray(d?.data) ? d.data.length : 0);
      }
      return 0;
    };

    const pendingCashOut = getCount(cashFlowRes);
    const overdueDebts = getCount(debtsRes);
    const pendingTransfers = getCount(transfersRes);
    const unfinalizedShifts = getCount(shiftsRes);

    // Set badges on the appropriate nav items
    function setBadge(path: string, count: number, color?: string) {
      if (count <= 0) return;
      for (const group of navGroups.value) {
        const item = group.items.find((i) => i.to === path);
        if (item) {
          item.badge = count;
          if (color) item.badgeColor = color;
          break;
        }
      }
    }

    setBadge('/admin/kas-retail', pendingCashOut, 'bg-red-500 text-white');
    setBadge('/admin/debts', overdueDebts, 'bg-amber-500 text-white');
    setBadge('/admin/transfers', pendingTransfers, 'bg-blue-500 text-white');
    setBadge('/admin/shifts', unfinalizedShifts, 'bg-slate-500 text-white');
  } catch {
    /* silent — badges are optional enhancements */
  }
}

onMounted(async () => {
  if (canSwitchShop.value && availableShops.value.length === 0) {
    try {
      await shopStore.fetchShops();
    } catch {
      /* silent */
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

  // Fetch badge counts for sidebar notifications
  await fetchBadgeCounts();
});

// ============================================
// SIDEBAR NAVIGATION
// ============================================

interface NavItem {
  to: string;
  label: string;
  icon: Component;
  badge?: string | number;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const topItems: NavItem[] = [
  { to: '/admin/home', label: 'Home', icon: HomeIcon },
  { to: '/admin/dashboard', label: 'Dashboard Retail', icon: DashboardIcon },
];

const navGroups = ref<NavGroup[]>([
  {
    title: 'Retail',
    items: [
      { to: '/admin/transactions', label: 'Transaksi', icon: ReceiptIcon },
      { to: '/admin/debts', label: 'Hutang', icon: DebtIcon },
      { to: '/admin/kas-retail', label: 'Kas Retail', icon: WalletIcon },
    ],
  },
  {
    title: 'Inventaris',
    items: [
      { to: '/admin/products', label: 'Produk & Stok', icon: PackageIcon },
      { to: '/admin/shops', label: 'Cabang', icon: Building2Icon },
      { to: '/admin/opname-sessions', label: 'Stock Opname', icon: CheckIcon },
      { to: '/admin/suppliers', label: 'Supplier & PO', icon: PackageIcon },
      { to: '/admin/transfers', label: 'Transfer Stok', icon: TransferIcon },
    ],
  },
  {
    title: 'Keuangan',
    items: [
      { to: '/admin/reports', label: 'Laporan Retail', icon: ReportIcon },
    ],
  },
  {
    title: 'Operasional',
    items: [
      { to: '/admin/shifts', label: 'Shift', icon: ShiftIcon },
      { to: '/admin/users', label: 'Multi-User', icon: UsersIcon },
    ],
  },
  {
    title: 'BRILink',
    items: [
      { to: '/admin/brilink', label: 'Dashboard BRILink', icon: DashboardIcon },
      { to: '/admin/brilink/transaksi', label: 'Transaksi BRILink', icon: ReceiptIcon },
      { to: '/admin/kas-rekening-brilink', label: 'Kas & Rekening', icon: LandmarkIcon },
      { to: '/admin/brilink/fee', label: 'Pengaturan Fee', icon: PercentIcon },
    ],
  },
]);

const bottomNav: NavItem[] = [
  { to: '/admin/settings', label: 'Pengaturan', icon: SettingsIcon },
  { to: '/admin/profil', label: 'Profil', icon: UserIcon },
];

function onNavClick(e: MouseEvent, navigate: (e?: MouseEvent) => void) {
  navigate(e);
  sidebarOpen.value = false;
}

// ============================================
// USER INFO
// ============================================

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

// ============================================
// PAGE TITLES
// ============================================

const pageTitle = computed(() => {
  const meta = route.meta?.title as string | undefined;
  if (meta) {
    return meta.replace(/\s*[—-]\s*Maslahat Tani.*$/i, '').trim() || meta;
  }
  return 'Admin';
});

const pageSubtitle = computed(() => {
  return (route.meta?.description as string | undefined) || '';
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
