-- Add mustChangePin flag for forced PIN change on first login
ALTER TABLE "users" ADD COLUMN "mustChangePin" BOOLEAN NOT NULL DEFAULT false;
