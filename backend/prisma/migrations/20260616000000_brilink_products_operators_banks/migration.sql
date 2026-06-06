-- CreateTable: operator_prefixes
CREATE TABLE "operator_prefixes" (
    "id" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GSM',

    CONSTRAINT "operator_prefixes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "operator_prefixes_prefix_key" ON "operator_prefixes"("prefix");
CREATE INDEX "operator_prefixes_prefix_idx" ON "operator_prefixes"("prefix");

-- CreateTable: brilink_products
CREATE TABLE "brilink_products" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "operator" TEXT,
    "provider" TEXT,
    "name" TEXT NOT NULL,
    "nominal" INTEGER,
    "buyPrice" INTEGER NOT NULL,
    "sellPrice" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brilink_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "brilink_products_shopId_category_operator_idx" ON "brilink_products"("shopId", "category", "operator");
CREATE INDEX "brilink_products_shopId_category_provider_idx" ON "brilink_products"("shopId", "category", "provider");

-- CreateTable: bank_list
CREATE TABLE "bank_list" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "bank_list_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bank_list_code_key" ON "bank_list"("code");
CREATE INDEX "bank_list_isActive_idx" ON "bank_list"("isActive");

-- CreateTable: ewallet_providers
CREATE TABLE "ewallet_providers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ewallet_providers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ewallet_providers_code_key" ON "ewallet_providers"("code");

-- AddForeignKey
ALTER TABLE "brilink_products" ADD CONSTRAINT "brilink_products_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- SEED: Operator Prefixes (57 entries)
-- ============================================
INSERT INTO "operator_prefixes" ("id", "prefix", "operator", "type") VALUES
-- Telkomsel
(gen_random_uuid()::text, '0811', 'TELKOMSEL', 'GSM'),
(gen_random_uuid()::text, '0812', 'TELKOMSEL', 'GSM'),
(gen_random_uuid()::text, '0813', 'TELKOMSEL', 'GSM'),
(gen_random_uuid()::text, '0821', 'TELKOMSEL', 'GSM'),
(gen_random_uuid()::text, '0822', 'TELKOMSEL', 'GSM'),
(gen_random_uuid()::text, '0823', 'TELKOMSEL', 'GSM'),
(gen_random_uuid()::text, '0851', 'TELKOMSEL', 'GSM'),
(gen_random_uuid()::text, '0852', 'TELKOMSEL', 'GSM'),
(gen_random_uuid()::text, '0853', 'TELKOMSEL', 'GSM'),
-- Indosat
(gen_random_uuid()::text, '0814', 'INDOSAT', 'GSM'),
(gen_random_uuid()::text, '0815', 'INDOSAT', 'GSM'),
(gen_random_uuid()::text, '0816', 'INDOSAT', 'GSM'),
(gen_random_uuid()::text, '0855', 'INDOSAT', 'GSM'),
(gen_random_uuid()::text, '0856', 'INDOSAT', 'GSM'),
(gen_random_uuid()::text, '0857', 'INDOSAT', 'GSM'),
(gen_random_uuid()::text, '0858', 'INDOSAT', 'GSM'),
-- XL
(gen_random_uuid()::text, '0817', 'XL', 'GSM'),
(gen_random_uuid()::text, '0818', 'XL', 'GSM'),
(gen_random_uuid()::text, '0819', 'XL', 'GSM'),
(gen_random_uuid()::text, '0859', 'XL', 'GSM'),
(gen_random_uuid()::text, '0877', 'XL', 'GSM'),
(gen_random_uuid()::text, '0878', 'XL', 'GSM'),
-- Axis
(gen_random_uuid()::text, '0831', 'AXIS', 'GSM'),
(gen_random_uuid()::text, '0832', 'AXIS', 'GSM'),
(gen_random_uuid()::text, '0833', 'AXIS', 'GSM'),
(gen_random_uuid()::text, '0834', 'AXIS', 'GSM'),
(gen_random_uuid()::text, '0838', 'AXIS', 'GSM'),
-- Three
(gen_random_uuid()::text, '0895', 'THREE', 'GSM'),
(gen_random_uuid()::text, '0896', 'THREE', 'GSM'),
(gen_random_uuid()::text, '0897', 'THREE', 'GSM'),
(gen_random_uuid()::text, '0898', 'THREE', 'GSM'),
(gen_random_uuid()::text, '0899', 'THREE', 'GSM'),
-- Smartfren
(gen_random_uuid()::text, '0881', 'SMARTFREN', 'GSM'),
(gen_random_uuid()::text, '0882', 'SMARTFREN', 'GSM'),
(gen_random_uuid()::text, '0883', 'SMARTFREN', 'GSM'),
(gen_random_uuid()::text, '0884', 'SMARTFREN', 'GSM'),
(gen_random_uuid()::text, '0885', 'SMARTFREN', 'GSM'),
(gen_random_uuid()::text, '0886', 'SMARTFREN', 'GSM'),
(gen_random_uuid()::text, '0887', 'SMARTFREN', 'GSM'),
(gen_random_uuid()::text, '0888', 'SMARTFREN', 'GSM'),
(gen_random_uuid()::text, '0889', 'SMARTFREN', 'GSM');

-- ============================================
-- SEED: Bank List (Top 30 banks)
-- ============================================
INSERT INTO "bank_list" ("id", "code", "name", "shortName", "isActive") VALUES
(gen_random_uuid()::text, '002', 'Bank Rakyat Indonesia', 'BRI', true),
(gen_random_uuid()::text, '008', 'Bank Mandiri', 'MANDIRI', true),
(gen_random_uuid()::text, '009', 'Bank Negara Indonesia', 'BNI', true),
(gen_random_uuid()::text, '014', 'Bank Central Asia', 'BCA', true),
(gen_random_uuid()::text, '427', 'Bank Syariah Indonesia', 'BSI', true),
(gen_random_uuid()::text, '022', 'CIMB Niaga', 'CIMB', true),
(gen_random_uuid()::text, '013', 'Bank Permata', 'PERMATA', true),
(gen_random_uuid()::text, '011', 'Bank Danamon', 'DANAMON', true),
(gen_random_uuid()::text, '016', 'Maybank Indonesia', 'MAYBANK', true),
(gen_random_uuid()::text, '028', 'OCBC NISP', 'OCBC', true),
(gen_random_uuid()::text, '019', 'Panin Bank', 'PANIN', true),
(gen_random_uuid()::text, '023', 'UOB Indonesia', 'UOB', true),
(gen_random_uuid()::text, '426', 'Bank Mega', 'MEGA', true),
(gen_random_uuid()::text, '200', 'Bank Tabungan Negara', 'BTN', true),
(gen_random_uuid()::text, '213', 'BTPN', 'BTPN', true),
(gen_random_uuid()::text, '451', 'Bank Syariah Mandiri', 'BSM', true),
(gen_random_uuid()::text, '110', 'Bank Jabar Banten', 'BJB', true),
(gen_random_uuid()::text, '111', 'Bank DKI', 'DKI', true),
(gen_random_uuid()::text, '112', 'BPD DIY', 'BPD_DIY', true),
(gen_random_uuid()::text, '113', 'Bank Jateng', 'JATENG', true),
(gen_random_uuid()::text, '114', 'Bank Jatim', 'JATIM', true),
(gen_random_uuid()::text, '120', 'Bank Kaltimtara', 'KALTIMTARA', true),
(gen_random_uuid()::text, '121', 'Bank Kalteng', 'KALTENG', true),
(gen_random_uuid()::text, '536', 'Bank BCA Syariah', 'BCA_SYARIAH', true),
(gen_random_uuid()::text, '542', 'Bank Jago', 'JAGO', true),
(gen_random_uuid()::text, '501', 'Bank Muamalat', 'MUAMALAT', true),
(gen_random_uuid()::text, '147', 'Bank Mutiara (Bukopin)', 'BUKOPIN', true),
(gen_random_uuid()::text, '153', 'Bank Sinarmas', 'SINARMAS', true),
(gen_random_uuid()::text, '494', 'Bank Raya (BRI Agro)', 'RAYA', true),
(gen_random_uuid()::text, '212', 'Bank Woori Saudara', 'WOORI', true);

-- ============================================
-- SEED: E-Wallet Providers (5 entries)
-- ============================================
INSERT INTO "ewallet_providers" ("id", "code", "name", "icon", "isActive") VALUES
(gen_random_uuid()::text, 'GOPAY', 'GoPay', '💚', true),
(gen_random_uuid()::text, 'OVO', 'OVO', '💜', true),
(gen_random_uuid()::text, 'DANA', 'Dana', '💙', true),
(gen_random_uuid()::text, 'SHOPEEPAY', 'ShopeePay', '🧡', true),
(gen_random_uuid()::text, 'LINKAJA', 'LinkAja', '❤️', true);
