<template>
  <div class="min-h-screen bg-slate-50 flex flex-col">
    <!-- Top Bar -->
    <header
      class="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between"
    >
      <div class="flex items-center gap-2 min-w-0">
        <div class="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
          <component :is="StoreIcon" class="w-4 h-4 text-white" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-bold text-slate-950 leading-tight truncate">
            Maslahat Tani
          </p>
          <p class="text-[10px] text-slate-500 leading-tight truncate">
            {{ shopName || 'Cabang' }}
            <span v-if="userName"> · {{ userName }}</span>
          </p>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          aria-label="Logout"
          @click="handleLogout"
        >
          <component :is="LogOutIcon" class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 overflow-y-auto pb-20">
      <div class="p-4 max-w-3xl mx-auto">
        <RouterView />
      </div>
    </main>

    <!-- Bottom Nav (mobile-first, kasir webapp pakai handheld) -->
    <nav
      class="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200"
      role="navigation"
    >
      <div class="max-w-3xl mx-auto grid grid-cols-4 h-16">
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
              'flex flex-col items-center justify-center gap-0.5 transition-colors text-[10px] font-medium relative',
              isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900',
            ]"
            @click="(e) => navigate(e)"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span>{{ item.label }}</span>
            <span
              v-if="item.phase2"
              class="absolute top-1 right-1/2 translate-x-6 text-[8px] font-bold uppercase bg-slate-200 text-slate-600 px-1 rounded"
            >
              P2
            </span>
          </a>
        </RouterLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import {
  Store as StoreIcon,
  LogOut as LogOutIcon,
  Home as HomeIcon,
  ShoppingCart as POSIcon,
  Landmark as LandmarkIcon,
  History as HistoryIcon,
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const shopStore = useShopStore();

const shopName = computed(() => shopStore.currentShopName);
const userName = computed(() => authStore.user?.username || authStore.user?.email);

interface NavItem {
  to: string;
  label: string;
  icon: Component;
  phase2?: boolean;
}

const bottomNav: NavItem[] = [
  { to: '/dashboard', label: 'Beranda', icon: HomeIcon },
  { to: '/retail/pos', label: 'Retail', icon: POSIcon },
  { to: '/brilink/transfer', label: 'BRILink', icon: LandmarkIcon, phase2: true },
  { to: '/retail/history', label: 'Riwayat', icon: HistoryIcon },
];

async function handleLogout() {
  await authStore.logout();
  router.push({ name: 'login' });
}
</script>
