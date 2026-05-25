import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import shopService, { type ShopListItem } from '@/shared/services/shop.service';
import type { ShopDto } from '@/shared/services/auth.service';
import { useAuthStore } from './auth.store';

const CURRENT_SHOP_STORAGE_KEY = 'current_shop';

function loadCurrentShopFromStorage(): ShopDto | null {
  try {
    const raw = localStorage.getItem(CURRENT_SHOP_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ShopDto;
  } catch {
    return null;
  }
}

function persistCurrentShop(shop: ShopDto | null) {
  if (shop) {
    localStorage.setItem(CURRENT_SHOP_STORAGE_KEY, JSON.stringify(shop));
  } else {
    localStorage.removeItem(CURRENT_SHOP_STORAGE_KEY);
  }
}

/**
 * Shop store: manage cabang aktif + daftar cabang yang bisa diakses user.
 *
 * Bekerja bareng auth.store:
 * - auth.login() success → set currentShop dari response.shop
 * - auth.login() shop_selection_required → set availableShops dari response.shops
 * - selectShop() → POST /shops/select/:id → update auth tokens + set currentShop
 * - clear() dipanggil saat logout
 */
export const useShopStore = defineStore('shop', () => {
  // ============================================
  // State
  // ============================================
  const currentShop = ref<ShopDto | null>(loadCurrentShopFromStorage());
  const availableShops = ref<ShopListItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ============================================
  // Getters
  // ============================================
  const hasCurrentShop = computed(() => currentShop.value !== null);
  const hasMultipleShops = computed(() => availableShops.value.length > 1);
  const currentShopId = computed(() => currentShop.value?.id ?? null);
  const currentShopName = computed(() => currentShop.value?.name ?? '');

  // ============================================
  // Actions
  // ============================================

  /**
   * Set cabang aktif. Dipanggil saat login success / selectShop / fetchUser.
   * Persist ke localStorage biar reload tetap tahu cabang yang dipilih.
   */
  function setCurrentShop(shop: ShopDto | null) {
    currentShop.value = shop;
    persistCurrentShop(shop);
  }

  /**
   * Set daftar shops yang bisa diakses user. Dipanggil dari auth.login()
   * saat shop_selection_required, biar shop selection page gak perlu
   * fetch ulang.
   */
  function setAvailableShops(shops: ShopListItem[] | ShopDto[]) {
    availableShops.value = shops as ShopListItem[];
  }

  /**
   * Fetch ulang daftar shops dari API (mis. setelah create cabang baru).
   */
  async function fetchShops() {
    loading.value = true;
    error.value = null;
    try {
      const list = await shopService.list();
      availableShops.value = list;
      return list;
    } catch (err: any) {
      error.value =
        err.response?.data?.message ?? err.message ?? 'Gagal memuat daftar cabang.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Pilih cabang aktif. Backend re-issue JWT dgn shopId baru.
   * Update tokens di auth.store + set currentShop di shop.store.
   *
   * Dipakai untuk:
   * 1. Super-admin selesai login → pilih cabang pertama kali
   * 2. Super-admin yang udah punya cabang aktif → ganti cabang
   */
  async function selectShop(shopId: string) {
    loading.value = true;
    error.value = null;
    try {
      const response = await shopService.selectShop(shopId);
      const authStore = useAuthStore();

      // Update tokens di auth store (kalau auth.store sudah init)
      authStore.setTokens(response.token, response.refreshToken);

      // Update user.shopId di auth store sehingga requireShopSelection getter
      // langsung false → guard router gak loop redirect.
      if (authStore.user) {
        authStore.user.shopId = response.shop.id;
      }

      setCurrentShop(response.shop);
      return response.shop;
    } catch (err: any) {
      error.value =
        err.response?.data?.message ?? err.message ?? 'Gagal memilih cabang.';
      throw new Error(error.value!);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Clear semua shop state. Dipanggil dari auth.store.clearAuth/logout.
   */
  function clear() {
    currentShop.value = null;
    availableShops.value = [];
    error.value = null;
    persistCurrentShop(null);
  }

  function clearError() {
    error.value = null;
  }

  return {
    // State
    currentShop,
    availableShops,
    loading,
    error,
    // Getters
    hasCurrentShop,
    hasMultipleShops,
    currentShopId,
    currentShopName,
    // Actions
    setCurrentShop,
    setAvailableShops,
    fetchShops,
    selectShop,
    clear,
    clearError,
  };
});
