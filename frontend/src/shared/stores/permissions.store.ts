import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import permissionsService from '@/shared/services/permissions.service';

/**
 * Pinia store for current user's permissions.
 * Fetched once on app init (after login), cached in memory.
 * Used by sidebar, buttons, and page-level guards.
 */
export const usePermissionsStore = defineStore('permissions', () => {
  const permissions = ref<Record<string, boolean>>({});
  const role = ref<string>('');
  const loaded = ref(false);
  const loading = ref(false);

  // ============================================
  // Computed helpers
  // ============================================

  const isSuperAdmin = computed(() => role.value === 'SUPER_ADMIN');
  const isAdmin = computed(() => role.value === 'ADMIN');
  const isKasir = computed(() => role.value === 'KASIR');

  // ============================================
  // Actions
  // ============================================

  /**
   * Fetch permissions from backend. Called once after login.
   */
  async function fetchPermissions() {
    if (loading.value) return;
    loading.value = true;
    try {
      const res = await permissionsService.getMyPermissions();
      permissions.value = res.permissions;
      role.value = res.role;
      loaded.value = true;
    } catch {
      // If fetch fails (e.g. offline), use empty permissions (deny all for safety)
      // Super Admin detected from auth store as fallback
    } finally {
      loading.value = false;
    }
  }

  /**
   * Check if current user has a specific permission.
   * SUPER_ADMIN always returns true.
   * If permissions not loaded yet, defaults to false (safe deny).
   */
  function can(permission: string): boolean {
    if (role.value === 'SUPER_ADMIN') return true;
    if (role.value === 'KASIR') return false;
    return permissions.value[permission] ?? false;
  }

  /**
   * Check if current user has ANY of the given permissions.
   */
  function canAny(...perms: string[]): boolean {
    if (role.value === 'SUPER_ADMIN') return true;
    return perms.some((p) => can(p));
  }

  /**
   * Check if current user has ALL of the given permissions.
   */
  function canAll(...perms: string[]): boolean {
    if (role.value === 'SUPER_ADMIN') return true;
    return perms.every((p) => can(p));
  }

  /**
   * Clear permissions (on logout)
   */
  function clear() {
    permissions.value = {};
    role.value = '';
    loaded.value = false;
  }

  return {
    // State
    permissions,
    role,
    loaded,
    loading,

    // Computed
    isSuperAdmin,
    isAdmin,
    isKasir,

    // Actions
    fetchPermissions,
    can,
    canAny,
    canAll,
    clear,
  };
});
