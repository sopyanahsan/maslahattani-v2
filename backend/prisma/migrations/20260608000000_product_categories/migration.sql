-- CreateTable: product_categories
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- Add category fields to products
ALTER TABLE "products" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "products" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "products" ADD COLUMN "unit" TEXT;
ALTER TABLE "products" ADD COLUMN "description" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_shopId_name_key" ON "product_categories"("shopId", "name");
CREATE INDEX "product_categories_shopId_isActive_idx" ON "product_categories"("shopId", "isActive");
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
