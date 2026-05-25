-- AlterTable: tambah idempotencyKey + clientCreatedAt ke Transaction
-- Untuk support offline-first POS:
--   idempotencyKey: client UUID, dedup retry akibat network glitch
--   clientCreatedAt: waktu transaksi sebenarnya di kasir (vs server createdAt)
ALTER TABLE "transactions" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "transactions" ADD COLUMN "clientCreatedAt" TIMESTAMP(3);

-- CreateIndex: idempotencyKey harus unique supaya dedup berfungsi
CREATE UNIQUE INDEX "transactions_idempotencyKey_key" ON "transactions"("idempotencyKey");
