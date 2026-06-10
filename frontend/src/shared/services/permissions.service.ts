import api from './api';

// ============================================
// Types
// ============================================

export interface PermissionGroup {
  group: string;
  permissions: Array<{
    key: string;
    label: string;
    defaultAdmin: boolean;
  }>;
}

export interface MyPermissionsResponse {
  role: string;
  permissions: Record<string, boolean>;
}

export interface RolePermissionsResponse {
  role: string;
  permissions: Record<string, boolean>;
}

export interface PermissionGroupsResponse {
  groups: PermissionGroup[];
}

// ============================================
// Service
// ============================================

const permissionsService = {
  /**
   * Get current user's permissions (called on login / app init)
   */
  async getMyPermissions(): Promise<MyPermissionsResponse> {
    const { data } = await api.get<MyPermissionsResponse>('/permissions/me');
    return data;
  },

  /**
   * Get permissions for a specific role (Super Admin only)
   */
  async getRolePermissions(role: string): Promise<RolePermissionsResponse> {
    const { data } = await api.get<RolePermissionsResponse>('/permissions/role', {
      params: { role },
    });
    return data;
  },

  /**
   * Get permission groups structure for UI (Super Admin only)
   */
  async getPermissionGroups(): Promise<PermissionGroupsResponse> {
    const { data } = await api.get<PermissionGroupsResponse>('/permissions/groups');
    return data;
  },

  /**
   * Update permissions for a role (Super Admin only)
   */
  async updateRolePermissions(
    role: string,
    permissions: Array<{ permission: string; enabled: boolean }>,
  ): Promise<{ success: boolean; updated?: number }> {
    const { data } = await api.put('/permissions/role', { role, permissions });
    return data;
  },

  /**
   * Seed default permissions (Super Admin only, idempotent)
   */
  async seedDefaults(): Promise<{ seeded: boolean }> {
    const { data } = await api.post('/permissions/seed');
    return data;
  },
};

export default permissionsService;
