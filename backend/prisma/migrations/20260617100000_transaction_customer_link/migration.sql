-- AlterTable: Add customer link to transactions (retail)
ALTER TABLE "transactions" ADD COLUMN "customerId" TEXT;
ALTER TABLE "transactions" ADD COLUMN "customerName" TEXT;
ALTER TABLE "transactions" ADD COLUMN "customerPhone" TEXT;

-- AlterTable: Add customer link to brilink_transactions
ALTER TABLE "brilink_transactions" ADD COLUMN "customerId" TEXT;

-- CreateIndex
CREATE INDEX "transactions_customerId_idx" ON "transactions"("customerId");
CREATE INDEX "brilink_transactions_customerId_idx" ON "brilink_transactions"("customerId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brilink_transactions" ADD CONSTRAINT "brilink_transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
