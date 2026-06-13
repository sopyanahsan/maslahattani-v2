-- Data migration: rename BASIC → STARTER for existing subscriptions/payments
-- This runs AFTER the enum values have been committed in previous migration.

UPDATE "subscriptions" SET "plan" = 'STARTER' WHERE "plan" = 'BASIC';
UPDATE "saas_payments" SET "plan" = 'STARTER' WHERE "plan" = 'BASIC';
