<template>
  <div class="min-h-screen bg-slate-900 px-4 py-8 flex items-center justify-center">
    <div class="w-full max-w-2xl">
      <!-- Header -->
      <div class="text-center mb-8">
        <div
          class="mx-auto w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4"
        >
          <component :is="Building2Icon" class="w-8 h-8 text-blue-400" />
        </div>
        <h1 class="text-2xl font-bold text-white">Pilih Cabang</h1>
        <p class="text-sm text-slate-400 dark:text-[#869392] mt-1">
          Halo <span class="text-blue-300">{{ displayName }}</span>, pilih cabang yang
          ingin dikelola sekarang.
        </p>
      </div>

      <!-- Loading state -->
      <div
        v-if="isLoading"
        class="bg-white dark:bg-[#1e2020] rounded-2xl shadow-xl border border-slate-200 p-8 text-center"
      >
        <component :is="Loader2Icon" class="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
        <p class="text-sm text-slate-600 dark:text-[#bcc9c7]">Memuat daftar cabang…</p>
      </div>

      <!-- Error state -->
      <div
        v-else-if="errorMessage"
        class="bg-white dark:bg-[#1e2020] rounded-2xl shadow-xl border border-slate-200 p-6"
      >
        <div class="flex items-start gap-2 bg-red-50 border-l-4 border-red-500 rounded-md p-4">
          <component :is="AlertCircleIcon" class="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="text-sm font-semibold text-red-800">Gagal memuat cabang</p>
            <p class="text-xs text-red-700 mt-1">{{ errorMessage }}</p>
          </div>
        </div>
        <button
          type="button"
          class="mt-4 w-full h-10 px-4 bg-slate-100 text-slate-900 dark:text-[#e3e2e2] text-sm font-semibold rounded-md border border-slate-200 hover:bg-slate-200 transition-colors"
          @click="loadShops"
        >
          Coba lagi
        </button>
      </div>

      <!-- Empty state — no shops -->
      <div
        v-else-if="shops.length === 0"
        class="bg-white dark:bg-[#1e2020] rounded-2xl shadow-xl border border-slate-200 p-8 text-center"
      >
        <div class="text-4xl mb-3 opacity-50">🏪</div>
        <p class="text-base font-semibold text-slate-900 dark:text-[#e3e2e2]">Belum ada cabang</p>
        <p class="text-sm text-slate-600 dark:text-[#bcc9c7] mt-1 max-w-sm mx-auto">
          Sistem belum punya cabang terdaftar. Hubungi developer untuk seed data
          atau buat cabang pertama via API.
        </p>
      </div>

      <!-- Shop cards -->
      <div v-else class="space-y-3">
        <button
          v-for="shop in shops"
          :key="shop.id"
          type="button"
          :disabled="selectingShopId !== null"
          class="w-full bg-white dark:bg-[#1e2020] rounded-2xl shadow-xl border border-slate-200 p-5 sm:p-6 text-left hover:border-blue-400 hover:shadow-2xl transition-all disabled:opacity-60 disabled:cursor-not-allowed group"
          @click="handleSelect(shop.id)"
        >
          <div class="flex items-start gap-4">
            <!-- Icon -->
            <div
              class="shrink-0 w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-colors"
            >
              <component
                :is="
                  selectingShopId === shop.id ? Loader2Icon : StoreIcon
                "
                :class="[
                  'w-6 h-6 text-blue-600 group-hover:text-white transition-colors',
                  selectingShopId === shop.id && 'animate-spin',
                ]"
              />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-bold text-slate-950 dark:text-[#e3e2e2] truncate">
                {{ shop.name }}
              </h3>
              <p class="text-xs text-slate-500 dark:text-[#869392] mt-0.5 line-clamp-1">
                {{ shop.address }}
              </p>
              <p class="text-[11px] font-mono text-slate-400 dark:text-[#869392] mt-0.5">
                {{ shop.phone }}
              </p>

              <!-- Counters (kalau backend kasih) -->
              <div
                v-if="hasCounts(shop)"
                class="flex flex-wrap items-center gap-3 mt-3 text-[11px]"
              >
                <div class="flex items-center gap-1 text-slate-600 dark:text-[#bcc9c7]">
                  <component :is="UsersIcon" class="w-3 h-3" />
                  <span>{{ shop._count?.users ?? 0 }} kasir</span>
                </div>
                <div class="flex items-center gap-1 text-slate-600 dark:text-[#bcc9c7]">
                  <component :is="PackageIcon" class="w-3 h-3" />
                  <span>{{ shop._count?.products ?? 0 }} produk</span>
                </div>
                <div class="flex items-center gap-1 text-slate-600 dark:text-[#bcc9c7]">
                  <component :is="ReceiptIcon" class="w-3 h-3" />
                  <span>{{ shop._count?.transactions ?? 0 }} trx</span>
                </div>
              </div>
            </div>

            <!-- Arrow -->
            <component
              :is="ChevronRightIcon"
              class="w-5 h-5 text-slate-300 group-hover:text-blue-600 shrink-0 mt-1 transition-colors"
            />
          </div>
        </button>

        <!-- Selection error -->
        <div
          v-if="selectErrorMessage"
          class="bg-red-50 border-l-4 border-red-500 rounded-md p-4 flex items-start gap-2"
        >
          <component :is="AlertCircleIcon" class="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p class="text-sm text-red-800">{{ selectErrorMessage }}</p>
        </div>
      </div>

      <!-- Footer: logout escape hatch -->
      <div class="text-center mt-6">
        <button
          type="button"
          class="text-sm text-slate-400 dark:text-[#869392] hover:text-slate-300 transition-colors"
          @click="handleLogout"
        >
          Bukan saya, keluar →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Building2 as Building2Icon,
  Store as StoreIcon,
  Loader2 as Loader2Icon,
  AlertCircle as AlertCircleIcon,
  ChevronRight as ChevronRightIcon,
  Users as UsersIcon,
  Package as PackageIcon,
  Receipt as ReceiptIcon,
} from 'lucide-vue-next';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useShopStore } from '@/shared/stores/shop.store';
import type { ShopListItem } from '@/shared/services/shop.service';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const shopStore = useShopStore();

const isLoading = ref(false);
const errorMessage = ref('');
const selectErrorMessage = ref('');
const selectingShopId = ref<string | null>(null);

const shops = computed<ShopListItem[]>(() => shopStore.availableShops);

const displayName = computed(
  () => authStore.user?.username || authStore.user?.email || 'Admin',
);

function hasCounts(
  shop: ShopListItem,
): shop is ShopListItem & { _count: NonNullable<ShopListItem['_count']> } {
  return !!shop._count;
}

async function loadShops() {
  errorMessage.value = '';
  // Kalau availableShops sudah terisi (dari login response), pakai itu.
  if (shops.value.length > 0) return;

  isLoading.value = true;
  try {
    await shopStore.fetchShops();
  } catch (err: any) {
    errorMessage.value =
      err?.response?.data?.message ?? err?.message ?? 'Gagal memuat cabang.';
  } finally {
    isLoading.value = false;
  }
}

async function handleSelect(shopId: string) {
  if (selectingShopId.value) return;

  selectingShopId.value = shopId;
  selectErrorMessage.value = '';

  try {
    await shopStore.selectShop(shopId);

    // Re-fetch profil supaya user.shopId di /me sinkron (penting untuk
    // guard router yang baca authStore.requireShopSelection).
    await authStore.fetchUser();

    const redirectTo = (route.query.redirect as string) || '/admin/dashboard';
    router.push(redirectTo);
  } catch (err: any) {
    selectErrorMessage.value = err?.message ?? 'Gagal memilih cabang.';
  } finally {
    selectingShopId.value = null;
  }
}

async function handleLogout() {
  await authStore.logout();
  router.push({ name: 'admin-login' });
}

onMounted(loadShops);
</script>
