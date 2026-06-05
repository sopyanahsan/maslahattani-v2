-- AlterTable: Add otpEnabled to users
ALTER TABLE "users" ADD COLUMN "otpEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Set otpEnabled = true for existing SUPER_ADMIN users
UPDATE "users" SET "otpEnabled" = true WHERE "role" = 'SUPER_ADMIN';
