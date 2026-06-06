-- AlterEnum: Add VOIDED to BrilinkTransactionStatus
ALTER TYPE "BrilinkTransactionStatus" ADD VALUE 'VOIDED';

-- CreateEnum
CREATE TYPE "BrilinkCashMutationType" AS ENUM ('TRX_IN', 'TRX_OUT', 'SETOR', 'TARIK', 'ADJUSTMENT', 'VOID_REVERSE');

-- AlterTable: Add new fields to brilink_transactions
ALTER TABLE "brilink_transactions" ADD COLUMN "flowDirection" TEXT;
ALTER TABLE "brilink_transactions" ADD COLUMN "accountImpact" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "brilink_transactions" ADD COLUMN "cashImpact" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "brilink_transactions" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "brilink_transactions" ADD COLUMN "clientCreatedAt" TIMESTAMP(3);
ALTER TABLE "brilink_transactions" ADD COLUMN "voidedAt" TIMESTAMP(3);
ALTER TABLE "brilink_transactions" ADD COLUMN "voidedBy" TEXT;
ALTER TABLE "brilink_transactions" ADD COLUMN "voidReason" TEXT;
ALTER TABLE "brilink_transactions" ADD COLUMN "cashMutationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "brilink_transactions_idempotencyKey_key" ON "brilink_transactions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "brilink_transactions_status_idx" ON "brilink_transactions"("status");

-- AlterTable: Add brilinkKpiConfig to shop_settings
ALTER TABLE "shop_settings" ADD COLUMN "brilinkKpiConfig" JSONB;

-- CreateTable: brilink_cash_boxes
CREATE TABLE "brilink_cash_boxes" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "lowBalanceThreshold" INTEGER NOT NULL DEFAULT 2000000,
    "lastAudit" TIMESTAMP(3),
    "lastAuditBalance" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brilink_cash_boxes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brilink_cash_boxes_shopId_key" ON "brilink_cash_boxes"("shopId");

-- CreateTable: brilink_cash_mutations
CREATE TABLE "brilink_cash_mutations" (
    "id" TEXT NOT NULL,
    "cashBoxId" TEXT NOT NULL,
    "type" "BrilinkCashMutationType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reference" TEXT,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brilink_cash_mutations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "brilink_cash_mutations_cashBoxId_idx" ON "brilink_cash_mutations"("cashBoxId");

-- CreateIndex
CREATE INDEX "brilink_cash_mutations_createdAt_idx" ON "brilink_cash_mutations"("createdAt");

-- CreateTable: brilink_reconciliations
CREATE TABLE "brilink_reconciliations" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetLabel" TEXT NOT NULL,
    "balanceApp" INTEGER NOT NULL,
    "balanceReal" INTEGER NOT NULL,
    "adjustment" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brilink_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "brilink_reconciliations_shopId_idx" ON "brilink_reconciliations"("shopId");

-- CreateIndex
CREATE INDEX "brilink_reconciliations_createdAt_idx" ON "brilink_reconciliations"("createdAt");

-- AddForeignKey
ALTER TABLE "brilink_cash_boxes" ADD CONSTRAINT "brilink_cash_boxes_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brilink_cash_mutations" ADD CONSTRAINT "brilink_cash_mutations_cashBoxId_fkey" FOREIGN KEY ("cashBoxId") REFERENCES "brilink_cash_boxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brilink_reconciliations" ADD CONSTRAINT "brilink_reconciliations_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
