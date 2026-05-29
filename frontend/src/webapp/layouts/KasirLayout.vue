<template>
  <div class="min-h-screen bg-slate-50 flex flex-col">
    <!-- Top Bar -->
    <header
      class="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between"
    >
      <div class="flex items-center gap-2 min-w-0">
        <div class="w-8 h-8 rounded-md bg-violet-600 flex items-center justify-center shrink-0">
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
            class="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700"
          >
            <component :is="Loader2Icon" class="w-2.5 h-2.5 animate-spin" />
            Sync
          </span>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 overflow-y-auto pb-20">
      <div class="max-w-6xl mx-auto">
        <RouterView />
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
              isActive ? 'text-violet-600' : 'text-slate-500 hover:text-slate-900',
            ]"
            @click="(e) => navigate(e)"
          >
            <component :is="HomeIcon" class="w-5 h-5" />
            <span>Beranda</span>
          </a>
        </RouterLink>

        <!-- Tab 2: BRILink -->
        <RouterLink to="/brilink/menu" custom v-slot="{ isActive, href, navigate }">
          <a
            :href="href"
            :class="[
              'flex flex-col items-center justify-center gap-0.5 transition-colors text-[10px] font-medium',
              isActive ? 'text-violet-600' : 'text-slate-500 hover:text-slate-900',
            ]"
            @click="(e) => navigate(e)"
          >
            <component :is="LandmarkIcon" class="w-5 h-5" />
            <span>BRILink</span>
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
                  ? 'bg-violet-600 shadow-violet-200'
                  : 'bg-violet-500 hover:bg-violet-600 shadow-violet-100',
              ]"
            >
              <component :is="ShoppingCartIcon" class="w-6 h-6 text-white" />
            </div>
            <span class="mt-7" :class="isActive ? 'text-violet-600' : 'text-slate-500'">Kasir</span>
          </a>
        </RouterLink>

        <!-- Tab 4: Laporan -->
        <RouterLink to="/reports" custom v-slot="{ isActive, href, navigate }">
          <a
            :href="href"
            :class="[
              'flex flex-col items-center justify-center gap-0.5 transition-colors text-[10px] font-medium',
              isActive ? 'text-violet-600' : 'text-slate-500 hover:text-slate-900',
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
              isActive ? 'text-violet-600' : 'text-slate-500 hover:text-slate-900',
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
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
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
} from 'lucide-vue-next';

const authStore = useAuthStore();
const shopStore = useShopStore();
const { isSyncing, pendingCount, startAutoSync, stopAutoSync, refreshPendingCount } = useSyncService();

const isOnline = ref(navigator.onLine);

function handleOnlineChange() { isOnline.value = navigator.onLine; }

onMounted(() => {
  window.addEventListener('online', handleOnlineChange);
  window.addEventListener('offline', handleOnlineChange);
  startAutoSync();
  refreshPendingCount();
});

onUnmounted(() => {
  window.removeEventListener('online', handleOnlineChange);
  window.removeEventListener('offline', handleOnlineChange);
  stopAutoSync();
});

const shopName = computed(() => shopStore.currentShopName);
const userName = computed(() => authStore.user?.username || authStore.user?.email);
</script>
