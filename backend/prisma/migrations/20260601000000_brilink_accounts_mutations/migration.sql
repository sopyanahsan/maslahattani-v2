-- CreateEnum
CREATE TYPE "BrilinkMutationType" AS ENUM ('SETOR', 'TARIK', 'TRX_DEBIT', 'TRX_CREDIT', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "brilink_accounts" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountHolder" TEXT,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "lowBalanceThreshold" INTEGER NOT NULL DEFAULT 1000000,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brilink_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brilink_mutations" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "BrilinkMutationType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reference" TEXT,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brilink_mutations_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add accountId to brilink_transactions
ALTER TABLE "brilink_transactions" ADD COLUMN "accountId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "brilink_accounts_shopId_accountNumber_key" ON "brilink_accounts"("shopId", "accountNumber");

-- CreateIndex
CREATE INDEX "brilink_accounts_shopId_idx" ON "brilink_accounts"("shopId");

-- CreateIndex
CREATE INDEX "brilink_mutations_accountId_idx" ON "brilink_mutations"("accountId");

-- CreateIndex
CREATE INDEX "brilink_mutations_createdAt_idx" ON "brilink_mutations"("createdAt");

-- AddForeignKey
ALTER TABLE "brilink_accounts" ADD CONSTRAINT "brilink_accounts_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brilink_mutations" ADD CONSTRAINT "brilink_mutations_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "brilink_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brilink_mutations" ADD CONSTRAINT "brilink_mutations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brilink_transactions" ADD CONSTRAINT "brilink_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "brilink_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
