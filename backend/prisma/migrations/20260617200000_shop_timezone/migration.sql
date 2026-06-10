-- AlterTable: Add timezone to shop_settings
ALTER TABLE "shop_settings" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta';
