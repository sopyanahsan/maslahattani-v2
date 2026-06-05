-- Add profile fields to users
ALTER TABLE "users" ADD COLUMN "fullName" TEXT;
ALTER TABLE "users" ADD COLUMN "phone" TEXT;
ALTER TABLE "users" ADD COLUMN "address" TEXT;
ALTER TABLE "users" ADD COLUMN "avatarUrl" TEXT;
