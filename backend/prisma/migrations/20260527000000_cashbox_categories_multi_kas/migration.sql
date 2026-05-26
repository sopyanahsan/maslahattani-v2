-- ============================================================================
-- Migration: Multi-CashBox per Shift
-- ============================================================================
--
-- Goals:
-- 1. Add `cash_box_categories` table — admin-managed categories
--    (RETAIL, SUBSIDI_PUPUK, ...). Single source of truth across shops.
-- 2. Add `shift_cash_boxes` table — per-category snapshot per shift
--    (startingCash, expectedCash/QRIS, actualCash/QRIS, variance).
-- 3. Migrate existing `shifts.expectedCash`, `expectedQRIS`, `actualCash`,
--    `actualQRIS`, `variance` columns into shift_cash_boxes (under default
--    RETAIL category), then drop old columns.
--
-- Safety:
-- - No existing shifts in production yet (per discussion), but migration
--   handles gracefully if any exist by creating ShiftCashBox rows under
--   RETAIL category with the old totals.
-- ============================================================================

-- 1. Create cash_box_categories table
CREATE TABLE "cash_box_categories" (
    "id"          TEXT NOT NULL,
    "code"        TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "color"       TEXT,
    "icon"        TEXT,
    "isDefault"   BOOLEAN NOT NULL DEFAULT false,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "sortOrder"   INTEGER NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_box_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cash_box_categories_code_key"
  ON "cash_box_categories"("code");

CREATE INDEX "cash_box_categories_isActive_sortOrder_idx"
  ON "cash_box_categories"("isActive", "sortOrder");

-- 2. Seed default RETAIL category (always present)
INSERT INTO "cash_box_categories" (
  "id", "code", "name", "description",
  "color", "icon", "isDefault", "isActive", "sortOrder",
  "createdAt", "updatedAt"
) VALUES (
  'cashbox-retail',
  'RETAIL',
  'Kas Retail',
  'Kas penjualan retail biasa (non-subsidi).',
  'blue',
  'shopping-cart',
  true,
  true,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- 3. Create shift_cash_boxes table
CREATE TABLE "shift_cash_boxes" (
    "id"            TEXT NOT NULL,
    "shiftId"       TEXT NOT NULL,
    "categoryId"    TEXT NOT NULL,
    "startingCash"  INTEGER NOT NULL DEFAULT 0,
    "expectedCash"  INTEGER NOT NULL DEFAULT 0,
    "actualCash"    INTEGER,
    "varianceCash"  INTEGER,
    "expectedQRIS"  INTEGER NOT NULL DEFAULT 0,
    "actualQRIS"    INTEGER,
    "varianceQRIS"  INTEGER,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_cash_boxes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "shift_cash_boxes_shiftId_categoryId_key"
  ON "shift_cash_boxes"("shiftId", "categoryId");

CREATE INDEX "shift_cash_boxes_shiftId_idx"
  ON "shift_cash_boxes"("shiftId");

CREATE INDEX "shift_cash_boxes_categoryId_idx"
  ON "shift_cash_boxes"("categoryId");

ALTER TABLE "shift_cash_boxes"
  ADD CONSTRAINT "shift_cash_boxes_shiftId_fkey"
  FOREIGN KEY ("shiftId") REFERENCES "shifts"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shift_cash_boxes"
  ADD CONSTRAINT "shift_cash_boxes_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "cash_box_categories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. Migrate existing shifts data into shift_cash_boxes (under RETAIL).
--    Setiap shift yang ada → 1 row ShiftCashBox dengan kategori RETAIL,
--    expected/actual/variance dipindah dari kolom shift lama.
INSERT INTO "shift_cash_boxes" (
  "id", "shiftId", "categoryId",
  "startingCash", "expectedCash", "actualCash", "varianceCash",
  "expectedQRIS", "actualQRIS", "varianceQRIS",
  "createdAt", "updatedAt"
)
SELECT
  -- Generate id from shift id + suffix (deterministic, no random)
  'scb-' || substr(s."id", 1, 20) || '-retail',
  s."id",
  'cashbox-retail',
  0, -- startingCash baru ada di skema baru, default 0 untuk shift lama
  COALESCE(s."expectedCash", 0),
  s."actualCash",
  s."variance",
  COALESCE(s."expectedQRIS", 0),
  s."actualQRIS",
  CASE
    WHEN s."actualQRIS" IS NOT NULL THEN s."actualQRIS" - COALESCE(s."expectedQRIS", 0)
    ELSE NULL
  END,
  s."createdAt",
  s."updatedAt"
FROM "shifts" s;

-- 5. Drop old per-shift cash columns now that data is migrated.
ALTER TABLE "shifts" DROP COLUMN "expectedCash";
ALTER TABLE "shifts" DROP COLUMN "actualCash";
ALTER TABLE "shifts" DROP COLUMN "expectedQRIS";
ALTER TABLE "shifts" DROP COLUMN "actualQRIS";
ALTER TABLE "shifts" DROP COLUMN "variance";
