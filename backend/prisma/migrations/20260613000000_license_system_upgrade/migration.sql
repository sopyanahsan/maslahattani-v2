-- License System Upgrade: new tiers, DEVELOPER role, extended feature flags

-- Add DEVELOPER role
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DEVELOPER' BEFORE 'SUPER_ADMIN';

-- Add new plan types
ALTER TYPE "PlanType" ADD VALUE IF NOT EXISTS 'STARTER' AFTER 'TRIAL';
ALTER TYPE "PlanType" ADD VALUE IF NOT EXISTS 'BRILINK' AFTER 'STARTER';
ALTER TYPE "PlanType" ADD VALUE IF NOT EXISTS 'BUSINESS' AFTER 'PRO';

-- Rename BASIC → STARTER (for existing data)
UPDATE "subscriptions" SET "plan" = 'STARTER' WHERE "plan" = 'BASIC';

-- Add new feature flag columns to subscriptions
ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "ppobEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "shiftEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "multiUserEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "labelPrintEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "rackEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "apiIntegrationEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Remove old BASIC enum value (PostgreSQL doesn't support removing enum values directly)
-- It will remain but unused. New code only uses STARTER/BRILINK/PRO/BUSINESS.

-- Update trial duration default: was 14 days, now conceptually 30 days
-- (actual logic is in plan-config.ts, no DB change needed)
