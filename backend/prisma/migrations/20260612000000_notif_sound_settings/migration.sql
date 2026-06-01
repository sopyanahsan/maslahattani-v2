-- Add notification settings to shop_settings
ALTER TABLE "shop_settings" ADD COLUMN "notifSoundEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "shop_settings" ADD COLUMN "notifSoundTone" TEXT NOT NULL DEFAULT 'chime';
