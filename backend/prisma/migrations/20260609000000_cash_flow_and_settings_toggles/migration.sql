-- Add toggle fields to shop_settings
ALTER TABLE "shop_settings" ADD COLUMN "brilinkEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "shop_settings" ADD COLUMN "shiftMode" TEXT NOT NULL DEFAULT 'FLOWING';
ALTER TABLE "shop_settings" ADD COLUMN "shiftForceCloseOnSwitch" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "shop_settings" ADD COLUMN "shiftCorrectionRequired" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "shop_settings" ADD COLUMN "shiftPhysicalCountRequired" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "shop_settings" ADD COLUMN "shiftGuardEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "shop_settings" ADD COLUMN "cashOutApprovalEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "shop_settings" ADD COLUMN "paymentCashEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "shop_settings" ADD COLUMN "paymentQrisEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "shop_settings" ADD COLUMN "paymentHutangEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "shop_settings" ADD COLUMN "saveBillEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "shop_settings" ADD COLUMN "discountPerItemEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "shop_settings" ADD COLUMN "discountTotalEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "shop_settings" ADD COLUMN "notePerItemEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable: cash_flow_categories
CREATE TABLE "cash_flow_categories" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_flow_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: cash_flows
CREATE TABLE "cash_flows" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shiftId" TEXT,
    "categoryId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_flows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cash_flow_categories_shopId_name_type_key" ON "cash_flow_categories"("shopId", "name", "type");
CREATE INDEX "cash_flow_categories_shopId_type_isActive_idx" ON "cash_flow_categories"("shopId", "type", "isActive");
CREATE INDEX "cash_flows_shopId_createdAt_idx" ON "cash_flows"("shopId", "createdAt");
CREATE INDEX "cash_flows_shiftId_idx" ON "cash_flows"("shiftId");
CREATE INDEX "cash_flows_status_idx" ON "cash_flows"("status");

-- AddForeignKey
ALTER TABLE "cash_flow_categories" ADD CONSTRAINT "cash_flow_categories_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cash_flows" ADD CONSTRAINT "cash_flows_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cash_flows" ADD CONSTRAINT "cash_flows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cash_flows" ADD CONSTRAINT "cash_flows_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cash_flows" ADD CONSTRAINT "cash_flows_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "cash_flow_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
