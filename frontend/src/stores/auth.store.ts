import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import authService, {
  type AuthUserDto,
  type LoginPayload,
  type LoginResponse,
} from '@/services/auth.service';

export type AuthUser = AuthUserDto;

/** Hasil login dari sisi store untuk UI:
 *  - 'success'      → token sudah ada, user terisi, boleh redirect.
 *  - 'otp_required' → backend minta OTP (khusus admin), UI lanjut ke step OTP.
 */
export type LoginOutcome =
  | { status: 'success'; user: AuthUser }
  | { status: 'otp_required'; message: string };

export const useAuthStore = defineStore('auth', () => {
  // === State ===
  const user = ref<AuthUser | null>(null);
  const token = ref<string | null>(localStorage.getItem('access_token'));
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'));
  const loading = ref(false);
  const error = ref<string | null>(null);

  // === Getters ===
  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(
    () => user.value?.role === 'ADMIN' || user.value?.role === 'SUPER_ADMIN',
  );
  const isKasir = computed(
    () => user.value?.role === 'KASIR' || user.value?.role === 'CASHIER_SUPERVISOR',
  );
  const userRole = computed(() => user.value?.role);
  const fullName = computed(() => user.value?.username || user.value?.email || '');

  // === Actions ===

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
  }

  /**
   * Login. Mengembalikan outcome supaya UI tahu apakah harus minta OTP.
   * Throw `Error` kalau credential salah atau request gagal.
   */
  async function login(payload: LoginPayload): Promise<LoginOutcome> {
    loading.value = true;
    error.value = null;

    try {
      const response: LoginResponse = await authService.login(payload);

      // Backend butuh OTP (admin step 1). Tidak ada token, JANGAN set apa-apa.
      if (response.success === false) {
        return {
          status: 'otp_required',
          message: response.message || 'Kode OTP telah dikirim ke email Anda.',
        };
      }

      // Login sukses — token tersedia.
      setTokens(response.token, response.refreshToken);
      user.value = response.user;
      return { status: 'success', user: response.user };
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
      const userData = await authService.getMe();
      user.value = userData;
    } catch {
      // Token invalid, clear auth
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
    isKasir,
    userRole,
    fullName,
    // Actions
    login,
    logout,
    fetchUser,
    clearAuth,
    clearError,
    setTokens,
  };
});
