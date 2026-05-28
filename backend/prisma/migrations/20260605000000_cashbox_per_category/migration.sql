-- Step 1: Drop ALL unique constraints/indexes on shopId column
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop unique indexes
  FOR r IN (
    SELECT indexname FROM pg_indexes
    WHERE tablename = 'cash_boxes' AND indexdef LIKE '%UNIQUE%' AND indexdef LIKE '%shopId%'
  ) LOOP
    EXECUTE 'DROP INDEX IF EXISTS "' || r.indexname || '"';
  END LOOP;
  
  -- Drop unique constraints
  FOR r IN (
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'cash_boxes' AND tc.constraint_type = 'UNIQUE' AND ccu.column_name = 'shopId'
  ) LOOP
    EXECUTE 'ALTER TABLE "cash_boxes" DROP CONSTRAINT IF EXISTS "' || r.constraint_name || '"';
  END LOOP;
END $$;

-- Step 2: Add new columns
ALTER TABLE "cash_boxes" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
ALTER TABLE "cash_boxes" ADD COLUMN IF NOT EXISTS "label" TEXT NOT NULL DEFAULT 'Kas Utama';

-- Step 3: Create new compound unique index
CREATE UNIQUE INDEX IF NOT EXISTS "cash_boxes_shopId_categoryId_key" ON "cash_boxes"("shopId", "categoryId");
CREATE INDEX IF NOT EXISTS "cash_boxes_shopId_idx" ON "cash_boxes"("shopId");
