import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { ALL_PERMISSIONS, getDefaultAdminPermissions } from './permissions.constants';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all permissions for a role.
   * SUPER_ADMIN → all enabled (bypass).
   * KASIR → all disabled (no admin access).
   * ADMIN → from DB, fallback to defaults if not seeded.
   */
  async getPermissionsForRole(role: Role): Promise<Record<string, boolean>> {
    // Super Admin = semua true
    if (role === Role.SUPER_ADMIN) {
      const result: Record<string, boolean> = {};
      ALL_PERMISSIONS.forEach((p) => (result[p] = true));
      return result;
    }

    // Kasir = semua false (tidak boleh akses admin panel)
    if (role === Role.KASIR) {
      const result: Record<string, boolean> = {};
      ALL_PERMISSIONS.forEach((p) => (result[p] = false));
      return result;
    }

    // ADMIN / CASHIER_SUPERVISOR → cek DB
    const dbPermissions = await this.prisma.rolePermission.findMany({
      where: { role },
    });

    // Build result: DB value or default
    const defaults = getDefaultAdminPermissions();
    const dbMap = new Map(dbPermissions.map((p) => [p.permission, p.enabled]));

    const result: Record<string, boolean> = {};
    for (const def of defaults) {
      result[def.permission] = dbMap.has(def.permission)
        ? dbMap.get(def.permission)!
        : def.enabled;
    }

    return result;
  }

  /**
   * Check if a specific role has a specific permission.
   */
  async hasPermission(role: Role, permission: string): Promise<boolean> {
    if (role === Role.SUPER_ADMIN) return true;
    if (role === Role.KASIR) return false;

    const dbPerm = await this.prisma.rolePermission.findUnique({
      where: { role_permission: { role, permission } },
    });

    if (dbPerm) return dbPerm.enabled;

    // Fallback to default
    const defaults = getDefaultAdminPermissions();
    const def = defaults.find((d) => d.permission === permission);
    return def?.enabled ?? false;
  }

  /**
   * Update permission for a role (Super Admin only).
   * Creates or updates the row.
   */
  async updatePermission(role: Role, permission: string, enabled: boolean) {
    // Don't allow modifying SUPER_ADMIN or KASIR
    if (role === Role.SUPER_ADMIN || role === Role.KASIR) {
      return { success: false, message: 'Cannot modify this role.' };
    }

    // Validate permission key exists
    if (!ALL_PERMISSIONS.includes(permission)) {
      return { success: false, message: `Permission "${permission}" tidak valid.` };
    }

    await this.prisma.rolePermission.upsert({
      where: { role_permission: { role, permission } },
      create: { role, permission, enabled },
      update: { enabled },
    });

    return { success: true };
  }

  /**
   * Bulk update permissions for a role.
   */
  async bulkUpdatePermissions(
    role: Role,
    updates: Array<{ permission: string; enabled: boolean }>,
  ) {
    if (role === Role.SUPER_ADMIN || role === Role.KASIR) {
      return { success: false, message: 'Cannot modify this role.' };
    }

    const validUpdates = updates.filter((u) => ALL_PERMISSIONS.includes(u.permission));

    await this.prisma.$transaction(
      validUpdates.map((u) =>
        this.prisma.rolePermission.upsert({
          where: { role_permission: { role, permission: u.permission } },
          create: { role, permission: u.permission, enabled: u.enabled },
          update: { enabled: u.enabled },
        }),
      ),
    );

    return { success: true, updated: validUpdates.length };
  }

  /**
   * Seed default permissions for ADMIN role (if not exists).
   * Called on app bootstrap or manually.
   */
  async seedDefaults() {
    const existing = await this.prisma.rolePermission.count({
      where: { role: Role.ADMIN },
    });

    if (existing > 0) return { seeded: false, message: 'Already seeded.' };

    const defaults = getDefaultAdminPermissions();
    await this.prisma.rolePermission.createMany({
      data: defaults.map((d) => ({
        role: Role.ADMIN,
        permission: d.permission,
        enabled: d.enabled,
      })),
      skipDuplicates: true,
    });

    return { seeded: true, count: defaults.length };
  }
}
