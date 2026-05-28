-- CreateTable
CREATE TABLE "cash_mutations" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "categoryId" TEXT,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "category" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_mutations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_mutations_shopId_idx" ON "cash_mutations"("shopId");
CREATE INDEX "cash_mutations_createdAt_idx" ON "cash_mutations"("createdAt");
CREATE INDEX "cash_mutations_categoryId_idx" ON "cash_mutations"("categoryId");

-- AddForeignKey
ALTER TABLE "cash_mutations" ADD CONSTRAINT "cash_mutations_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
