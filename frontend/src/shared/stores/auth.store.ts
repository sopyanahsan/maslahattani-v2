import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import authService, {
  type AuthUserDto,
  type LoginPayload,
  type LoginResponse,
  type ShopDto,
} from '@/shared/services/auth.service';
import { useShopStore } from './shop.store';
import { useShiftStore } from './shift.store';

export type AuthUser = AuthUserDto;

/**
 * Hasil login dari sisi store untuk konsumsi UI.
 * - 'success'                  → token full, user.shopId valid, boleh redirect ke dashboard
 * - 'otp_required'             → backend minta OTP (admin/super-admin step 1)
 * - 'shop_selection_required'  → super-admin perlu pilih cabang dulu (token sudah ada
 *                                 tapi shopId=null; UI redirect ke /admin/select-shop)
 */
export type LoginOutcome =
  | { status: 'success'; user: AuthUser; shop?: ShopDto }
  | { status: 'otp_required'; message: string }
  | { status: 'shop_selection_required'; user: AuthUser; shops: ShopDto[] };

export const useAuthStore = defineStore('auth', () => {
  // ============================================
  // State
  // ============================================
  const user = ref<AuthUser | null>(null);
  const token = ref<string | null>(localStorage.getItem('access_token'));
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'));
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ============================================
  // Getters
  // ============================================
  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(
    () => user.value?.role === 'ADMIN' || user.value?.role === 'SUPER_ADMIN',
  );
  const isSuperAdmin = computed(() => user.value?.role === 'SUPER_ADMIN');
  const isKasir = computed(
    () =>
      user.value?.role === 'KASIR' ||
      user.value?.role === 'CASHIER_SUPERVISOR',
  );
  const userRole = computed(() => user.value?.role);
  const fullName = computed(() => user.value?.username || user.value?.email || '');

  /**
   * Super-admin yang sudah login tapi belum pilih cabang.
   * Frontend pakai flag ini untuk redirect ke /admin/select-shop.
   */
  const requireShopSelection = computed(
    () => isSuperAdmin.value && !user.value?.shopId,
  );

  // ============================================
  // Actions
  // ============================================

  function setTokens(accessToken: string, refresh: string) {
    token.value = accessToken;
    refreshToken.value = refresh;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refresh);
  }

  function clearAuth() {
    user.value = null;
    token.value = null;
    refreshToken.value = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // Clear shop context juga (lazy import supaya gak circular)
    try {
      const shopStore = useShopStore();
      shopStore.clear();
    } catch {
      // shop store belum di-init (mis. di module init), abaikan
    }

    // Clear shift state juga supaya tidak bocor antar user
    try {
      const shiftStore = useShiftStore();
      shiftStore.clear();
    } catch {
      // shift store belum di-init, abaikan
    }
  }

  /**
   * Login. Return LoginOutcome supaya UI tahu next step:
   *  - 'success'                 → redirect ke dashboard
   *  - 'otp_required'            → tampil OTP step di form
   *  - 'shop_selection_required' → redirect ke /admin/select-shop
   *
   * Throw `Error` kalau credential salah atau request fail.
   */
  async function login(payload: LoginPayload): Promise<LoginOutcome> {
    loading.value = true;
    error.value = null;

    try {
      const response: LoginResponse = await authService.login(payload);
      const shopStore = useShopStore();

      // Branch 1: backend butuh OTP. Belum ada token sama sekali.
      if (response.success === false && response.requireOtp) {
        return {
          status: 'otp_required',
          message: response.message || 'Kode OTP telah dikirim ke email Anda.',
        };
      }

      // Branch 2: super-admin butuh pilih cabang. Token sudah ada (shopId=null).
      if (response.success === true && response.requireShopSelection) {
        setTokens(response.token, response.refreshToken);
        user.value = response.user;
        // Simpan list shops biar shop selection page bisa render tanpa fetch ulang
        shopStore.setAvailableShops(response.shops);
        return {
          status: 'shop_selection_required',
          user: response.user,
          shops: response.shops,
        };
      }

      // Branch 3: success direct (regular user dengan shop assigned).
      if (response.success === true) {
        setTokens(response.token, response.refreshToken);
        user.value = response.user;
        if (response.shop) {
          shopStore.setCurrentShop(response.shop);
        }
        return { status: 'success', user: response.user, shop: response.shop };
      }

      // Defensive: shape gak kenal
      throw new Error('Response login tidak valid.');
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Login gagal. Periksa email/username dan password Anda.';
      error.value = message;
      throw new Error(message);
    } finally {
      loading.value = false;
    }
  }

  async function fetchUser(): Promise<void> {
    if (!token.value) return;

    try {
      const me = await authService.getMe();
      user.value = {
        id: me.id,
        email: me.email,
        username: me.username,
        role: me.role,
        status: me.status,
        shopId: me.shopId,
      };

      // Sync currentShop kalau /me kasih currentShop info
      const shopStore = useShopStore();
      if (me.currentShop) {
        shopStore.setCurrentShop(me.currentShop);
      }
    } catch {
      // Token invalid atau network error → clear auth
      clearAuth();
    }
  }

  async function logout(): Promise<void> {
    try {
      await authService.logout();
    } catch {
      // Ignore logout API errors
    } finally {
      clearAuth();
    }
  }

  function clearError() {
    error.value = null;
  }

  return {
    // State
    user,
    token,
    refreshToken,
    loading,
    error,
    // Getters
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    isKasir,
    userRole,
    fullName,
    requireShopSelection,
    // Actions
    login,
    logout,
    fetchUser,
    clearAuth,
    clearError,
    setTokens,
  };
});
