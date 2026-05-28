-- AlterTable: Remove unique constraint on shopId (allow multiple cash boxes per shop)
ALTER TABLE "cash_boxes" DROP CONSTRAINT IF EXISTS "cash_boxes_shopId_key";

-- AlterTable: Add categoryId and label columns
ALTER TABLE "cash_boxes" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
ALTER TABLE "cash_boxes" ADD COLUMN IF NOT EXISTS "label" TEXT NOT NULL DEFAULT 'Kas Utama';

-- CreateIndex: unique per shop + category
CREATE UNIQUE INDEX "cash_boxes_shopId_categoryId_key" ON "cash_boxes"("shopId", "categoryId");
CREATE INDEX "cash_boxes_shopId_idx" ON "cash_boxes"("shopId");
