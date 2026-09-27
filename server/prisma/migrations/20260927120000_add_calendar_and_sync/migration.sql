-- Migration: Add Calendar Events, Reminders and Integrations (Idempotent)

CREATE TABLE IF NOT EXISTS "calendar_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT DEFAULT 'master',
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "color" TEXT DEFAULT '#3B82F6',
    "type" TEXT NOT NULL DEFAULT 'EVENT',
    "isCompanyWide" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "projectId" TEXT,
    "taskId" TEXT,
    "dealId" TEXT,
    "contactId" TEXT,
    "externalSyncId" TEXT,
    "externalProvider" TEXT,
    "recurrence" TEXT DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "calendar_reminders" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "tenantId" TEXT DEFAULT 'master',
    "userId" TEXT NOT NULL,
    "minutesBefore" INTEGER NOT NULL DEFAULT 15,
    "method" TEXT NOT NULL DEFAULT 'NOTIFICATION',
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_reminders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "calendar_integrations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT DEFAULT 'master',
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "syncToken" TEXT,
    "calendarId" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "config" TEXT DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_integrations_pkey" PRIMARY KEY ("id")
);

-- Foreign Keys (Safe addition)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'calendar_events_userId_fkey') THEN
        ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'calendar_events_projectId_fkey') THEN
        ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'calendar_events_taskId_fkey') THEN
        ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'calendar_events_dealId_fkey') THEN
        ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'calendar_events_contactId_fkey') THEN
        ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'calendar_reminders_eventId_fkey') THEN
        ALTER TABLE "calendar_reminders" ADD CONSTRAINT "calendar_reminders_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'calendar_reminders_userId_fkey') THEN
        ALTER TABLE "calendar_reminders" ADD CONSTRAINT "calendar_reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'calendar_integrations_userId_fkey') THEN
        ALTER TABLE "calendar_integrations" ADD CONSTRAINT "calendar_integrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "calendar_events_tenantId_startDate_idx" ON "calendar_events"("tenantId", "startDate");
CREATE INDEX IF NOT EXISTS "calendar_events_userId_startDate_idx" ON "calendar_events"("userId", "startDate");
CREATE INDEX IF NOT EXISTS "calendar_events_projectId_idx" ON "calendar_events"("projectId");
CREATE INDEX IF NOT EXISTS "calendar_events_isCompanyWide_idx" ON "calendar_events"("isCompanyWide");
CREATE INDEX IF NOT EXISTS "calendar_reminders_userId_remindAt_isDismissed_idx" ON "calendar_reminders"("userId", "remindAt", "isDismissed");
CREATE UNIQUE INDEX IF NOT EXISTS "calendar_integrations_userId_provider_key" ON "calendar_integrations"("userId", "provider");
