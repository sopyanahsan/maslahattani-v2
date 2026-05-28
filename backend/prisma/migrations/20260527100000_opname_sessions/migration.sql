-- CreateEnum
CREATE TYPE "OpnameStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "opname_sessions" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "conductorId" TEXT NOT NULL,
    "sessionNumber" TEXT NOT NULL,
    "status" "OpnameStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "totalProducts" INTEGER NOT NULL DEFAULT 0,
    "totalMatched" INTEGER NOT NULL DEFAULT 0,
    "totalSurplus" INTEGER NOT NULL DEFAULT 0,
    "totalDeficit" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opname_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opname_items" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "systemQty" INTEGER NOT NULL,
    "actualQty" INTEGER,
    "variance" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opname_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "opname_sessions_sessionNumber_key" ON "opname_sessions"("sessionNumber");

-- CreateIndex
CREATE INDEX "opname_sessions_shopId_idx" ON "opname_sessions"("shopId");

-- CreateIndex
CREATE INDEX "opname_sessions_conductorId_idx" ON "opname_sessions"("conductorId");

-- CreateIndex
CREATE INDEX "opname_sessions_status_idx" ON "opname_sessions"("status");

-- CreateIndex
CREATE INDEX "opname_sessions_createdAt_idx" ON "opname_sessions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "opname_items_sessionId_productId_key" ON "opname_items"("sessionId", "productId");

-- CreateIndex
CREATE INDEX "opname_items_sessionId_idx" ON "opname_items"("sessionId");

-- CreateIndex
CREATE INDEX "opname_items_productId_idx" ON "opname_items"("productId");

-- AddForeignKey
ALTER TABLE "opname_sessions" ADD CONSTRAINT "opname_sessions_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opname_sessions" ADD CONSTRAINT "opname_sessions_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opname_items" ADD CONSTRAINT "opname_items_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "opname_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opname_items" ADD CONSTRAINT "opname_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
