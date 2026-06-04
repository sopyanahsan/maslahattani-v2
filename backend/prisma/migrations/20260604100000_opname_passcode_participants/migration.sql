-- AlterTable: Add passcode to opname_sessions
ALTER TABLE "opname_sessions" ADD COLUMN "passcode" TEXT;

-- Backfill existing sessions with a generated passcode (6-char random)
UPDATE "opname_sessions"
SET "passcode" = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))
WHERE "passcode" IS NULL;

-- Now make it NOT NULL and UNIQUE
ALTER TABLE "opname_sessions" ALTER COLUMN "passcode" SET NOT NULL;
CREATE UNIQUE INDEX "opname_sessions_passcode_key" ON "opname_sessions"("passcode");

-- AlterTable: Add countedById to opname_items
ALTER TABLE "opname_items" ADD COLUMN "countedById" TEXT;

-- CreateTable: opname_participants
CREATE TABLE "opname_participants" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT,
    "deviceId" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opname_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "opname_participants_sessionId_idx" ON "opname_participants"("sessionId");

-- AddForeignKey
ALTER TABLE "opname_participants" ADD CONSTRAINT "opname_participants_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "opname_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
