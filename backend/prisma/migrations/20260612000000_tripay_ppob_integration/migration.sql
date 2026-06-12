-- CreateTable
CREATE TABLE "tripay_configs" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "merchantCode" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'sandbox',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tripay_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppob_transactions" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "cashierId" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "tripayRef" TEXT,
    "productCode" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "tripayStatus" TEXT,
    "serialNumber" TEXT,
    "rawResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppob_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tripay_configs_shopId_key" ON "tripay_configs"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "ppob_transactions_refId_key" ON "ppob_transactions"("refId");

-- CreateIndex
CREATE INDEX "ppob_transactions_shopId_createdAt_idx" ON "ppob_transactions"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "ppob_transactions_shopId_status_idx" ON "ppob_transactions"("shopId", "status");

-- CreateIndex
CREATE INDEX "ppob_transactions_refId_idx" ON "ppob_transactions"("refId");

-- AddForeignKey
ALTER TABLE "tripay_configs" ADD CONSTRAINT "tripay_configs_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppob_transactions" ADD CONSTRAINT "ppob_transactions_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
