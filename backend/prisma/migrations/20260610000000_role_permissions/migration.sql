-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "permission" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "role_permissions_role_idx" ON "role_permissions"("role");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "role_permissions_role_permission_key" ON "role_permissions"("role", "permission");

-- Seed default permissions for ADMIN role
INSERT INTO "role_permissions" ("id", "role", "permission", "enabled", "createdAt", "updatedAt") VALUES
  -- Transactions
  (gen_random_uuid()::text, 'ADMIN', 'transactions.view', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ADMIN', 'transactions.void', false, NOW(), NOW()),
  (gen_random_uuid()::text, 'ADMIN', 'transactions.export', false, NOW(), NOW()),
  -- Products
  (gen_random_uuid()::text, 'ADMIN', 'products.view', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ADMIN', 'products.create', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ADMIN', 'products.update', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ADMIN', 'products.delete', false, NOW(), NOW()),
  -- Debts
  (gen_random_uuid()::text, 'ADMIN', 'debts.view', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ADMIN', 'debts.create', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ADMIN', 'debts.pay', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ADMIN', 'debts.delete', false, NOW(), NOW()),
  -- BRILink
  (gen_random_uuid()::text, 'ADMIN', 'brilink.view', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ADMIN', 'brilink.create', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ADMIN', 'brilink.void', false, NOW(), NOW()),
  (gen_random_uuid()::text, 'ADMIN', 'brilink.fee', true, NOW(), NOW()),
  -- Reports
  (gen_random_uuid()::text, 'ADMIN', 'reports.view', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ADMIN', 'reports.export', false, NOW(), NOW()),
  -- Shifts
  (gen_random_uuid()::text, 'ADMIN', 'shifts.view', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ADMIN', 'shifts.finalize', true, NOW(), NOW()),
  -- Users
  (gen_random_uuid()::text, 'ADMIN', 'users.view', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ADMIN', 'users.manage', false, NOW(), NOW()),
  -- Inventory
  (gen_random_uuid()::text, 'ADMIN', 'inventory.opname', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ADMIN', 'inventory.suppliers', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ADMIN', 'inventory.transfers', true, NOW(), NOW()),
  -- Settings
  (gen_random_uuid()::text, 'ADMIN', 'settings.shop', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ADMIN', 'settings.system', false, NOW(), NOW()),
  -- Shops
  (gen_random_uuid()::text, 'ADMIN', 'shops.view', false, NOW(), NOW()),
  (gen_random_uuid()::text, 'ADMIN', 'shops.manage', false, NOW(), NOW());
