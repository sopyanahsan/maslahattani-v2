-- AlterTable
ALTER TABLE "opname_sessions" ADD COLUMN "assigneeId" TEXT;

-- CreateIndex
CREATE INDEX "opname_sessions_assigneeId_idx" ON "opname_sessions"("assigneeId");

-- AddForeignKey
ALTER TABLE "opname_sessions" ADD CONSTRAINT "opname_sessions_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
