-- Make email nullable on users table
-- Kasir accounts using PIN auth don't require email at creation.
-- Email becomes opt-in via the kasir profile page (with OTP verification).

ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;


-- Clean up legacy placeholder emails created by earlier kasir creation flow
-- (auto-generated `{username}@ngalir.local` emails). They get nulled out so
-- the UI shows "Belum ada email" instead.
UPDATE "users" SET "email" = NULL WHERE "email" LIKE '%@ngalir.local';
