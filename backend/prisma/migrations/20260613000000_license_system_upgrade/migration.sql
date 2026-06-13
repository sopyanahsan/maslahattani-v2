-- License System Upgrade: new tiers, DEVELOPER role, extended feature flags
-- NOTE: PostgreSQL requires enum ADD VALUE to be committed BEFORE they can be used.
-- So this migration ONLY adds new enum values and columns.
-- The data migration (UPDATE plan = 'STARTER') is in the next migration.

-- Add DEVELOPER role
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DEVELOPER' BEFORE 'SUPER_ADMIN';

-- Add new plan types
ALTER TYPE "PlanType" ADD VALUE IF NOT EXISTS 'STARTER' AFTER 'TRIAL';
ALTER TYPE "PlanType" ADD VALUE IF NOT EXISTS 'BRILINK' AFTER 'STARTER';
ALTER TYPE "PlanType" ADD VALUE IF NOT EXISTS 'BUSINESS' AFTER 'PRO';

-- Add new feature flag columns to subscriptions
ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "ppobEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "shiftEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "multiUserEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "labelPrintEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "rackEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "apiIntegrationEnabled" BOOLEAN NOT NULL DEFAULT false;
