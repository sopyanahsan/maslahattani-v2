-- AddBarcode to Product
ALTER TABLE "products" ADD COLUMN "barcode" TEXT;
CREATE INDEX "products_shopId_barcode_idx" ON "products"("shopId", "barcode");

-- StockHistorySource enum
CREATE TYPE "StockHistorySource" AS ENUM (
  'INITIAL',
  'BULK_UPLOAD',
  'SEED',
  'STOCK_IN',
  'SALE',
  'SALE_VOID',
  'OPNAME_INLINE',
  'OPNAME_SESSION',
  'TRANSFER_OUT',
  'TRANSFER_IN',
  'PURCHASE_ORDER',
  'ADJUSTMENT'
);

-- Add source + paymentMethod to StockHistory
ALTER TABLE "stock_histories" ADD COLUMN "source" "StockHistorySource";
ALTER TABLE "stock_histories" ADD COLUMN "paymentMethod" "PaymentMethod";
CREATE INDEX "stock_histories_source_idx" ON "stock_histories"("source");
