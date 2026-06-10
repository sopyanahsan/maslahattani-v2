/**
 * All available permissions in the system.
 * Grouped by module for UI display.
 *
 * SUPER_ADMIN always has ALL permissions (bypass check).
 * KASIR has NO admin panel permissions (only webapp POS).
 * ADMIN permissions are configurable by Super Admin via role_permissions table.
 */

export const PERMISSION_GROUPS = [
  {
    group: 'Transaksi',
    permissions: [
      { key: 'transactions.view', label: 'Lihat transaksi', defaultAdmin: true },
      { key: 'transactions.void', label: 'Void transaksi', defaultAdmin: false },
      { key: 'transactions.export', label: 'Export transaksi', defaultAdmin: false },
    ],
  },
  {
    group: 'Produk',
    permissions: [
      { key: 'products.view', label: 'Lihat produk', defaultAdmin: true },
      { key: 'products.create', label: 'Tambah produk', defaultAdmin: true },
      { key: 'products.update', label: 'Edit produk', defaultAdmin: true },
      { key: 'products.delete', label: 'Hapus produk', defaultAdmin: false },
    ],
  },
  {
    group: 'Hutang',
    permissions: [
      { key: 'debts.view', label: 'Lihat hutang', defaultAdmin: true },
      { key: 'debts.create', label: 'Buat hutang', defaultAdmin: true },
      { key: 'debts.pay', label: 'Bayar hutang', defaultAdmin: true },
      { key: 'debts.delete', label: 'Hapus hutang', defaultAdmin: false },
    ],
  },
  {
    group: 'BRILink',
    permissions: [
      { key: 'brilink.view', label: 'Lihat BRILink', defaultAdmin: true },
      { key: 'brilink.create', label: 'Buat transaksi BRILink', defaultAdmin: true },
      { key: 'brilink.void', label: 'Void transaksi BRILink', defaultAdmin: false },
      { key: 'brilink.fee', label: 'Atur fee BRILink', defaultAdmin: true },
    ],
  },
  {
    group: 'Laporan',
    permissions: [
      { key: 'reports.view', label: 'Lihat laporan', defaultAdmin: true },
      { key: 'reports.export', label: 'Export laporan (PDF/Excel)', defaultAdmin: false },
    ],
  },
  {
    group: 'Shift',
    permissions: [
      { key: 'shifts.view', label: 'Lihat shift', defaultAdmin: true },
      { key: 'shifts.finalize', label: 'Finalisasi shift', defaultAdmin: true },
    ],
  },
  {
    group: 'User & Akun',
    permissions: [
      { key: 'users.view', label: 'Lihat daftar user', defaultAdmin: true },
      { key: 'users.manage', label: 'Kelola user (tambah/edit/nonaktifkan)', defaultAdmin: false },
    ],
  },
  {
    group: 'Inventaris',
    permissions: [
      { key: 'inventory.opname', label: 'Stock Opname', defaultAdmin: true },
      { key: 'inventory.suppliers', label: 'Supplier & PO', defaultAdmin: true },
      { key: 'inventory.transfers', label: 'Transfer Stok', defaultAdmin: true },
    ],
  },
  {
    group: 'Pengaturan',
    permissions: [
      { key: 'settings.shop', label: 'Pengaturan toko (fee, struk, toggle)', defaultAdmin: true },
      { key: 'settings.system', label: 'System settings (Super Admin only)', defaultAdmin: false },
    ],
  },
  {
    group: 'Cabang',
    permissions: [
      { key: 'shops.view', label: 'Lihat daftar cabang', defaultAdmin: false },
      { key: 'shops.manage', label: 'Kelola cabang (tambah/edit/hapus)', defaultAdmin: false },
    ],
  },
] as const;

/** Flat list of all permission keys */
export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key),
);

/** Get default admin permissions (enabled=true by default) */
export function getDefaultAdminPermissions(): Array<{ permission: string; enabled: boolean }> {
  return PERMISSION_GROUPS.flatMap((g) =>
    g.permissions.map((p) => ({
      permission: p.key,
      enabled: p.defaultAdmin,
    })),
  );
}
