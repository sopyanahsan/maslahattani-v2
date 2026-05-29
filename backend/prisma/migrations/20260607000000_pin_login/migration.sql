-- Add PIN-based login fields to users table
ALTER TABLE "users" ADD COLUMN "pin" VARCHAR(255);
ALTER TABLE "users" ADD COLUMN "pin_changed_at" TIMESTAMP;
ALTER TABLE "users" ADD COLUMN "pin_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "pin_locked_until" TIMESTAMP;
ALTER TABLE "users" ADD COLUMN "mustChangePin" BOOLEAN NOT NULL DEFAULT false;
