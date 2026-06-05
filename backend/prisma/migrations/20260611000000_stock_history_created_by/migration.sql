-- Add createdById to stock_histories (tracks who performed the action)
ALTER TABLE "stock_histories" ADD COLUMN "createdById" TEXT;

-- Add foreign key
ALTER TABLE "stock_histories" ADD CONSTRAINT "stock_histories_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Index
CREATE INDEX "stock_histories_createdById_idx" ON "stock_histories"("createdById");
