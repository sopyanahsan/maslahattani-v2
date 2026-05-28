-- CreateEnum
CREATE TYPE "BrilinkCategory" AS ENUM ('TRANSFER_BRI', 'TRANSFER_OTHER', 'TARIK_TUNAI', 'TOPUP_PULSA', 'TOPUP_DATA', 'TOPUP_EWALLET', 'TOPUP_PLN');

-- CreateEnum
CREATE TYPE "BrilinkTransactionStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING');

-- CreateEnum
CREATE TYPE "BrilinkFeeType" AS ENUM ('FLAT', 'PERCENT');

-- CreateTable
CREATE TABLE "brilink_transactions" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "cashierId" TEXT NOT NULL,
    "refNumber" TEXT NOT NULL,
    "category" "BrilinkCategory" NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "destination" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "fee" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "status" "BrilinkTransactionStatus" NOT NULL DEFAULT 'SUCCESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brilink_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brilink_fees" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "category" "BrilinkCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "minAmount" INTEGER NOT NULL DEFAULT 0,
    "maxAmount" INTEGER NOT NULL DEFAULT 999999999,
    "feeType" "BrilinkFeeType" NOT NULL DEFAULT 'FLAT',
    "feeAmount" INTEGER NOT NULL DEFAULT 0,
    "feePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brilink_fees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brilink_transactions_refNumber_key" ON "brilink_transactions"("refNumber");

-- CreateIndex
CREATE INDEX "brilink_transactions_shopId_idx" ON "brilink_transactions"("shopId");

-- CreateIndex
CREATE INDEX "brilink_transactions_cashierId_idx" ON "brilink_transactions"("cashierId");

-- CreateIndex
CREATE INDEX "brilink_transactions_category_idx" ON "brilink_transactions"("category");

-- CreateIndex
CREATE INDEX "brilink_transactions_createdAt_idx" ON "brilink_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "brilink_fees_shopId_category_isActive_idx" ON "brilink_fees"("shopId", "category", "isActive");

-- AddForeignKey
ALTER TABLE "brilink_transactions" ADD CONSTRAINT "brilink_transactions_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brilink_transactions" ADD CONSTRAINT "brilink_transactions_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brilink_fees" ADD CONSTRAINT "brilink_fees_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
