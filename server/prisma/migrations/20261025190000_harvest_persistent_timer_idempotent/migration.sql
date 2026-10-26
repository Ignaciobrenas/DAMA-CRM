-- =============================================================================
-- DAMA-CRM: Idempotent Migration for Harvest-Style Persistent Time Tracking
-- Survives browser close, crash, or PC shutdown via PostgreSQL server timestamps
-- =============================================================================

-- 1. Enrich time_records with Harvest persistent timer & task fields idempotently
ALTER TABLE "time_records" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
ALTER TABLE "time_records" ADD COLUMN IF NOT EXISTS "projectName" TEXT;
ALTER TABLE "time_records" ADD COLUMN IF NOT EXISTS "taskId" TEXT;
ALTER TABLE "time_records" ADD COLUMN IF NOT EXISTS "taskTitle" TEXT;
ALTER TABLE "time_records" ADD COLUMN IF NOT EXISTS "isBillable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "time_records" ADD COLUMN IF NOT EXISTS "isPaused" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "time_records" ADD COLUMN IF NOT EXISTS "pausedAt" TIMESTAMP(3);
ALTER TABLE "time_records" ADD COLUMN IF NOT EXISTS "lastResumedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "time_records" ADD COLUMN IF NOT EXISTS "accumulatedSeconds" INTEGER NOT NULL DEFAULT 0;

-- 2. Enrich task_work_logs with billable flag and linked timeRecordId idempotently
ALTER TABLE "task_work_logs" ADD COLUMN IF NOT EXISTS "isBillable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "task_work_logs" ADD COLUMN IF NOT EXISTS "timeRecordId" TEXT;

-- 3. Create composite index for active timer lookup idempotently
CREATE INDEX IF NOT EXISTS "time_records_userId_clockOut_idx" ON "time_records"("userId", "clockOut");
