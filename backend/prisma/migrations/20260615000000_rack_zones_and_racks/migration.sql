-- CreateTable
CREATE TABLE "rack_zones" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rack_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "racks" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "racks_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add rackId to stocks
ALTER TABLE "stocks" ADD COLUMN "rackId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "rack_zones_shopId_name_key" ON "rack_zones"("shopId", "name");
CREATE INDEX "rack_zones_shopId_idx" ON "rack_zones"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "racks_shopId_code_key" ON "racks"("shopId", "code");
CREATE INDEX "racks_shopId_idx" ON "racks"("shopId");
CREATE INDEX "racks_zoneId_idx" ON "racks"("zoneId");

-- CreateIndex
CREATE INDEX "stocks_rackId_idx" ON "stocks"("rackId");

-- AddForeignKey
ALTER TABLE "rack_zones" ADD CONSTRAINT "rack_zones_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "racks" ADD CONSTRAINT "racks_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "racks" ADD CONSTRAINT "racks_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "rack_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_rackId_fkey" FOREIGN KEY ("rackId") REFERENCES "racks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
