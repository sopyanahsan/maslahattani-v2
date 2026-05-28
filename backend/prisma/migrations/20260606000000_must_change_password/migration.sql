-- AlterTable: Add mustChangePassword flag to users
ALTER TABLE "users" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- Set mustChangePassword = true for all users that never logged in (fresh accounts)
UPDATE "users" SET "mustChangePassword" = true WHERE "lastLogin" IS NULL AND "role" IN ('KASIR', 'ADMIN');
