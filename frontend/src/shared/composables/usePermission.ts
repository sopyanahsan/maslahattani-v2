import { computed } from 'vue';
import { usePermissionsStore } from '@/shared/stores/permissions.store';

/**
 * usePermission — composable untuk cek permission di component.
 *
 * Contoh:
 * ```ts
 * const { can, canAny, isSuperAdmin } = usePermission();
 *
 * // Di template:
 * // v-if="can('transactions.void')"
 * // v-if="canAny('reports.view', 'reports.export')"
 * ```
 */
export function usePermission() {
  const store = usePermissionsStore();

  return {
    /** Check single permission */
    can: (permission: string) => computed(() => store.can(permission)),

    /** Check any of multiple permissions */
    canAny: (...perms: string[]) => computed(() => store.canAny(...perms)),

    /** Check all of multiple permissions */
    canAll: (...perms: string[]) => computed(() => store.canAll(...perms)),

    /** Is Super Admin (bypass all) */
    isSuperAdmin: computed(() => store.isSuperAdmin),

    /** Is Admin Cabang */
    isAdmin: computed(() => store.isAdmin),

    /** Current role */
    role: computed(() => store.role),

    /** Permissions loaded? */
    loaded: computed(() => store.loaded),
  };
}
