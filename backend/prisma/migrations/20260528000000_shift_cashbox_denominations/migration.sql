-- ============================================================================
-- Migration: Add cashDenominations JSON to ShiftCashBox
-- ============================================================================
--
-- Stores the physical cash count breakdown per denomination when a shift is
-- closed. Format:
--   {
--     "100000": 5,    -- 5 lembar Rp 100.000
--     "50000": 3,     -- 3 lembar Rp 50.000
--     ...
--     "100": 0,
--     "lainnya": 5000 -- raw rupiah (koin/recehan)
--   }
--
-- Nullable: kasir lama / shift yang sudah ditutup tanpa denominasi tetap
-- valid, hanya pakai actualCash sebagai source of truth.
-- ============================================================================

ALTER TABLE "shift_cash_boxes"
  ADD COLUMN "cashDenominations" JSONB;
