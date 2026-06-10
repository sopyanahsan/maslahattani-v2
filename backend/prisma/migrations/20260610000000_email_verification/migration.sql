-- Add email verification fields to users table
ALTER TABLE "users" ADD COLUMN "email_verified_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "email_verification_code" VARCHAR(6);
ALTER TABLE "users" ADD COLUMN "email_code_expires_at" TIMESTAMP(3);
