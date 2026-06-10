<template>
  <div class="min-h-screen bg-slate-50 flex flex-col">
    <!-- Top Bar -->
    <header
      class="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between"
    >
      <div class="flex items-center gap-2 min-w-0">
        <div class="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
          <component :is="DropletsIcon" class="w-4 h-4 text-white" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-bold text-slate-950 leading-tight truncate">
            Ngalir
          </p>
          <p class="text-[10px] text-slate-500 leading-tight truncate">
            {{ shopName || 'Toko' }}
            <span v-if="userName"> · {{ userName }}</span>
          </p>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <!-- Online/Offline indicator + pending sync count -->
        <div class="flex items-center gap-1.5 mr-1">
          <span
            :class="[
              'w-2 h-2 rounded-full shrink-0',
              isOnline ? 'bg-emerald-500' : 'bg-red-500 animate-pulse',
            ]"
          />
          <span
            v-if="pendingCount > 0"
            class="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700"
          >
            <component :is="CloudOffIcon" class="w-2.5 h-2.5" />
            {{ pendingCount }}
          </span>
          <span
            v-if="isSyncing"
            class="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700"
          >
            <component :is="Loader2Icon" class="w-2.5 h-2.5 animate-spin" />
            Sync
          </span>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 overflow-y-auto pb-20">
      <!-- Settings changed notification banner -->
      <div
        v-if="settingsStore.settingsChanged"
        class="sticky top-0 z-20 bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-start gap-3"
      >
        <div class="shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
          <svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-amber-900">Pengaturan sistem diperbarui oleh admin</p>
          <ul class="mt-1 space-y-0.5">
            <li v-for="field in settingsStore.changedFields" :key="field" class="text-xs text-amber-700">
              &bull; {{ field }}
            </li>
          </ul>
          <p class="text-[11px] text-amber-600 mt-1.5">Perubahan sudah diterapkan otomatis.</p>
        </div>
        <button
          type="button"
          class="shrink-0 px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
          @click="settingsStore.dismissChange()"
        >
          OK
        </button>
      </div>

      <div class="max-w-6xl mx-auto">
        <RouterView v-slot="{ Component, route }">
          <Transition :name="transitionName" mode="out-in">
            <component :is="Component" :key="route.path" />
          </Transition>
        </RouterView>
      </div>
    </main>

    <!-- Bottom Nav (5 tabs with center FAB) -->
    <nav
      class="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200"
      role="navigation"
    >
      <div class="max-w-3xl mx-auto grid grid-cols-5 h-16 relative">
        <!-- Tab 1: Beranda -->
        <RouterLink to="/dashboard" custom v-slot="{ isActive, href, navigate }">
          <a
            :href="href"
            :class="[
              'flex flex-col items-center justify-center gap-0.5 transition-colors text-[10px] font-medium',
              isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900',
            ]"
            @click="(e) => navigate(e)"
          >
            <component :is="HomeIcon" class="w-5 h-5" />
            <span>Beranda</span>
          </a>
        </RouterLink>

        <!-- Tab 2: BRILink (if enabled) OR Riwayat (if disabled) -->
        <RouterLink v-if="brilinkEnabled" to="/brilink/menu" custom v-slot="{ isActive, href, navigate }">
          <a
            :href="href"
            :class="[
              'flex flex-col items-center justify-center gap-0.5 transition-colors text-[10px] font-medium',
              isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900',
            ]"
            @click="(e) => navigate(e)"
          >
            <component :is="LandmarkIcon" class="w-5 h-5" />
            <span>BRILink</span>
          </a>
        </RouterLink>
        <RouterLink v-else to="/retail/history" custom v-slot="{ isActive, href, navigate }">
          <a
            :href="href"
            :class="[
              'flex flex-col items-center justify-center gap-0.5 transition-colors text-[10px] font-medium',
              isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900',
            ]"
            @click="(e) => navigate(e)"
          >
            <component :is="HistoryIcon" class="w-5 h-5" />
            <span>Riwayat</span>
          </a>
        </RouterLink>

        <!-- Tab 3: Kasir (Center FAB) -->
        <RouterLink to="/retail/pos" custom v-slot="{ isActive, href, navigate }">
          <a
            :href="href"
            class="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium relative"
            @click="(e) => navigate(e)"
          >
            <div
              :class="[
                'absolute -top-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all',
                isActive
                  ? 'bg-blue-600 shadow-blue-200'
                  : 'bg-blue-500 hover:bg-blue-600 shadow-blue-100',
              ]"
            >
              <component :is="ShoppingCartIcon" class="w-6 h-6 text-white" />
            </div>
            <span class="mt-7" :class="isActive ? 'text-blue-600' : 'text-slate-500'">Kasir</span>
          </a>
        </RouterLink>

        <!-- Tab 4: Laporan -->
        <RouterLink to="/reports" custom v-slot="{ isActive, href, navigate }">
          <a
            :href="href"
            :class="[
              'flex flex-col items-center justify-center gap-0.5 transition-colors text-[10px] font-medium',
              isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900',
            ]"
            @click="(e) => navigate(e)"
          >
            <component :is="BarChart3Icon" class="w-5 h-5" />
            <span>Laporan</span>
          </a>
        </RouterLink>

        <!-- Tab 5: Pengaturan -->
        <RouterLink to="/settings" custom v-slot="{ isActive, href, navigate }">
          <a
            :href="href"
            :class="[
              'flex flex-col items-center justify-center gap-0.5 transition-colors text-[10px] font-medium',
              isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900',
            ]"
            @click="(e) => navigate(e)"
          >
            <component :is="SettingsIcon" class="w-5 h-5" />
            <span>Pengaturan</span>
          </a>
        </RouterLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import { useSettingsStore } from '@/shared/stores/settings.store';
import { useSyncService } from '@/shared/services/sync.service';
import {
  Droplets as DropletsIcon,
  Home as HomeIcon,
  ShoppingCart as ShoppingCartIcon,
  Landmark as LandmarkIcon,
  BarChart3 as BarChart3Icon,
  Settings as SettingsIcon,
  CloudOff as CloudOffIcon,
  Loader2 as Loader2Icon,
  History as HistoryIcon,
} from 'lucide-vue-next';

const authStore = useAuthStore();
const shopStore = useShopStore();
const settingsStore = useSettingsStore();
const { isSyncing, pendingCount, startAutoSync, stopAutoSync, refreshPendingCount } = useSyncService();

const isOnline = ref(navigator.onLine);

// Page transition logic
const router = useRouter();
const transitionName = ref('page-fade');

// Route depth map for directional transitions
const routeDepth: Record<string, number> = {
  '/dashboard': 0,
  '/brilink/menu': 0,
  '/retail/pos': 0,
  '/reports': 0,
  '/settings': 0,
  '/retail/history': 1,
  '/retail/shift': 1,
  '/retail/receipt': 2,
  '/brilink/transaction': 1,
};

function getRouteDepth(path: string): number {
  // Exact match first
  if (routeDepth[path] !== undefined) return routeDepth[path];
  // Check prefix matches
  for (const [routePath, depth] of Object.entries(routeDepth)) {
    if (path.startsWith(routePath)) return depth;
  }
  return 1; // default mid-level
}

router.afterEach((to, from) => {
  const toDepth = getRouteDepth(to.path);
  const fromDepth = getRouteDepth(from.path);

  if (toDepth === fromDepth) {
    // Same level (tab switch) — use fade
    transitionName.value = 'page-fade';
  } else if (toDepth > fromDepth) {
    // Going deeper — slide left
    transitionName.value = 'page-slide-left';
  } else {
    // Going back — slide right
    transitionName.value = 'page-slide-right';
  }
});

/**
 * shopId yang dipakai untuk fetch settings.
 * Computed supaya reactive — kalau user async loaded / shop berubah, auto refetch.
 */
const activeShopId = computed(
  () => shopStore.currentShopId ?? authStore.user?.shopId ?? null,
);

function handleOnlineChange() { isOnline.value = navigator.onLine; }

onMounted(() => {
  window.addEventListener('online', handleOnlineChange);
  window.addEventListener('offline', handleOnlineChange);
  startAutoSync();
  refreshPendingCount();
  // Fetch settings + start polling for admin changes
  if (activeShopId.value) {
    settingsStore.fetchSettings(activeShopId.value);
    settingsStore.startPolling(activeShopId.value);
  }
});

// Kalau shopId baru tersedia setelah mount (mis. authStore.user async selesai),
// atau admin ganti cabang, fetch ulang settings supaya toggle ter-apply.
watch(activeShopId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    settingsStore.fetchSettings(newId);
    settingsStore.startPolling(newId);
  }
});

onUnmounted(() => {
  window.removeEventListener('online', handleOnlineChange);
  window.removeEventListener('offline', handleOnlineChange);
  stopAutoSync();
  settingsStore.stopPolling();
});

const shopName = computed(() => shopStore.currentShopName);
const userName = computed(() => authStore.user?.username || authStore.user?.email);
const brilinkEnabled = computed(() => settingsStore.isBrilinkEnabled);
</script>
