-- Add reason field to opname_items for loss categorization
ALTER TABLE "opname_items" ADD COLUMN "reason" TEXT;
