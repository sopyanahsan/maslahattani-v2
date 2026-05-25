import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import authService, { type AuthResponse, type LoginPayload } from '@/services/auth.service';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'KASIR' | 'CASHIER_SUPERVISOR';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  shopId?: string;
}

export const useAuthStore = defineStore('auth', () => {
  // === State ===
  const user = ref<AuthUser | null>(null);
  const token = ref<string | null>(localStorage.getItem('access_token'));
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'));
  const loading = ref(false);
  const error = ref<string | null>(null);

  // === Getters ===
  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() =>
    user.value?.role === 'ADMIN' || user.value?.role === 'SUPER_ADMIN',
  );
  const isKasir = computed(() => user.value?.role === 'KASIR');
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

  async function login(payload: LoginPayload): Promise<AuthResponse> {
    loading.value = true;
    error.value = null;

    try {
      const response = await authService.login(payload);
      setTokens(response.token, response.refreshToken);
      user.value = response.user;
      return response;
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Login gagal. Periksa email dan password Anda.';
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
