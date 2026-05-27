-- ============================================================================
-- Migration: BrilinkAccount & BrilinkMutation models
-- ============================================================================
--
-- BrilinkAccount: Rekening/akun BRI yang dimiliki agen untuk keperluan BRILink.
--   Satu toko bisa punya beberapa rekening (misal: rekening operasional + tabungan).
--
-- BrilinkMutation: Riwayat mutasi saldo rekening BRILink (masuk/keluar).
--   Digunakan untuk laporan kas BRILink dan rekonsiliasi.
--
-- BrilinkTransaction: Transaksi layanan BRILink (transfer, tarik tunai, top-up).
--   Setiap transaksi ke nasabah tercatat di sini dengan fee & status.
--
-- BrilinkFee: Pengaturan fee per kategori & range nominal.
--   Admin dapat atur margin fee yang dikenakan ke nasabah.
-- ============================================================================

-- ============================================
-- ENUM: BrilinkTransactionCategory
-- ============================================
CREATE TYPE "BrilinkTransactionCategory" AS ENUM (
  'TRANSFER_BRI',
  'TRANSFER_OTHER',
  'TARIK_TUNAI',
  'TOPUP_PULSA',
  'TOPUP_DATA',
  'TOPUP_EWALLET',
  'TOPUP_PLN'
);

-- ============================================
-- ENUM: BrilinkTransactionStatus
-- ============================================
CREATE TYPE "BrilinkTransactionStatus" AS ENUM (
  'SUCCESS',
  'PENDING',
  'FAILED',
  'CANCELLED'
);

-- ============================================
-- ENUM: BrilinkMutationType
-- ============================================
CREATE TYPE "BrilinkMutationType" AS ENUM (
  'CREDIT',   -- uang masuk
  'DEBIT'     -- uang keluar
);

-- ============================================
-- ENUM: BrilinkFeeType
-- ============================================
CREATE TYPE "BrilinkFeeType" AS ENUM (
  'FLAT',
  'PERCENT'
);

-- ============================================
-- TABLE: brilink_accounts
-- ============================================
-- Rekening BRI milik agen. Bisa lebih dari 1 per toko.
CREATE TABLE "brilink_accounts" (
  "id"            TEXT NOT NULL,
  "shopId"        TEXT NOT NULL,
  "accountNumber" TEXT NOT NULL,
  "accountName"   TEXT NOT NULL,
  "bankName"      TEXT NOT NULL DEFAULT 'BRI',
  "balance"       INTEGER NOT NULL DEFAULT 0,
  "isActive"      BOOLEAN NOT NULL DEFAULT true,
  "isPrimary"     BOOLEAN NOT NULL DEFAULT false,
  "notes"         TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "brilink_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "brilink_accounts_shopId_accountNumber_key"
  ON "brilink_accounts"("shopId", "accountNumber");

CREATE INDEX "brilink_accounts_shopId_idx"
  ON "brilink_accounts"("shopId");

ALTER TABLE "brilink_accounts"
  ADD CONSTRAINT "brilink_accounts_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE;

-- ============================================
-- TABLE: brilink_mutations
-- ============================================
-- Mutasi saldo rekening BRILink (kredit/debit manual maupun dari transaksi).
CREATE TABLE "brilink_mutations" (
  "id"              TEXT NOT NULL,
  "accountId"       TEXT NOT NULL,
  "shopId"          TEXT NOT NULL,
  "type"            "BrilinkMutationType" NOT NULL,
  "amount"          INTEGER NOT NULL,
  "balanceBefore"   INTEGER NOT NULL,
  "balanceAfter"    INTEGER NOT NULL,
  "description"     TEXT NOT NULL,
  "reference"       TEXT,       -- brilinkTransactionId atau manual ref
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "brilink_mutations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "brilink_mutations_accountId_idx"
  ON "brilink_mutations"("accountId");

CREATE INDEX "brilink_mutations_shopId_idx"
  ON "brilink_mutations"("shopId");

CREATE INDEX "brilink_mutations_createdAt_idx"
  ON "brilink_mutations"("createdAt");

ALTER TABLE "brilink_mutations"
  ADD CONSTRAINT "brilink_mutations_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "brilink_accounts"("id") ON DELETE CASCADE;

ALTER TABLE "brilink_mutations"
  ADD CONSTRAINT "brilink_mutations_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE;

-- ============================================
-- TABLE: brilink_transactions
-- ============================================
-- Transaksi layanan BRILink kepada nasabah.
CREATE TABLE "brilink_transactions" (
  "id"            TEXT NOT NULL,
  "shopId"        TEXT NOT NULL,
  "accountId"     TEXT,         -- rekening BRILink yang digunakan (nullable untuk backward compat)
  "refNumber"     TEXT NOT NULL,
  "category"      "BrilinkTransactionCategory" NOT NULL,
  "customerName"  TEXT NOT NULL,
  "destination"   TEXT NOT NULL, -- nomor rekening/HP tujuan
  "amount"        INTEGER NOT NULL,
  "fee"           INTEGER NOT NULL DEFAULT 0,
  "total"         INTEGER NOT NULL, -- amount + fee
  "status"        "BrilinkTransactionStatus" NOT NULL DEFAULT 'PENDING',
  "notes"         TEXT,
  "processedBy"   TEXT,         -- userId kasir
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "brilink_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "brilink_transactions_refNumber_key"
  ON "brilink_transactions"("refNumber");

CREATE INDEX "brilink_transactions_shopId_idx"
  ON "brilink_transactions"("shopId");

CREATE INDEX "brilink_transactions_createdAt_idx"
  ON "brilink_transactions"("createdAt");

CREATE INDEX "brilink_transactions_category_idx"
  ON "brilink_transactions"("category");

ALTER TABLE "brilink_transactions"
  ADD CONSTRAINT "brilink_transactions_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE;

-- ============================================
-- TABLE: brilink_fees
-- ============================================
-- Pengaturan fee per kategori & range nominal.
CREATE TABLE "brilink_fees" (
  "id"          TEXT NOT NULL,
  "shopId"      TEXT NOT NULL,
  "category"    "BrilinkTransactionCategory" NOT NULL,
  "label"       TEXT NOT NULL,
  "minAmount"   INTEGER NOT NULL DEFAULT 0,
  "maxAmount"   INTEGER NOT NULL DEFAULT 999999999,
  "feeType"     "BrilinkFeeType" NOT NULL DEFAULT 'FLAT',
  "feeAmount"   INTEGER NOT NULL DEFAULT 0,
  "feePercent"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "brilink_fees_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "brilink_fees_shopId_idx"
  ON "brilink_fees"("shopId");

CREATE INDEX "brilink_fees_category_idx"
  ON "brilink_fees"("category");

ALTER TABLE "brilink_fees"
  ADD CONSTRAINT "brilink_fees_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE;
