-- AlterTable: Add systemFee to brilink_fees
ALTER TABLE "brilink_fees" ADD COLUMN "systemFee" INTEGER NOT NULL DEFAULT 0;
