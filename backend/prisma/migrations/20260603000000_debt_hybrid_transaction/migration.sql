-- AlterTable: Make productId optional (nullable)
ALTER TABLE "debts" ALTER COLUMN "productId" DROP NOT NULL;

-- AlterTable: Make quantity and unitPrice have defaults
ALTER TABLE "debts" ALTER COLUMN "quantity" SET DEFAULT 1;
ALTER TABLE "debts" ALTER COLUMN "unitPrice" SET DEFAULT 0;

-- AlterTable: Add transactionId and manualItems
ALTER TABLE "debts" ADD COLUMN "transactionId" TEXT;
ALTER TABLE "debts" ADD COLUMN "manualItems" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "debts_transactionId_key" ON "debts"("transactionId");
CREATE INDEX "debts_transactionId_idx" ON "debts"("transactionId");

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
