-- Idempotent Migration for Invoicing, Agile Planner Comments/Worklogs, Project Members and Tenant Onboarding Invitations

-- 1. Invoices & Quotes Enrichment
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "discountPercent" DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "discountAmount" DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "irpfRate" DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "irpfAmount" DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "paymentTerms" TEXT DEFAULT 'IMMEDIATE';
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "isRectifying" BOOLEAN DEFAULT false;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "rectifiesInvoiceId" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "rectifyingReason" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "proforma" BOOLEAN DEFAULT false;

ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "discountPercent" DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "discountAmount" DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "irpfRate" DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "irpfAmount" DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "paymentTerms" TEXT DEFAULT 'IMMEDIATE';

ALTER TABLE "invoice_items" ADD COLUMN IF NOT EXISTS "discount" DOUBLE PRECISION DEFAULT 0.0;

-- 2. Project Members Table
CREATE TABLE IF NOT EXISTS "project_members" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- Unique Constraint and Foreign Keys for project_members
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'project_members_projectId_userId_key'
    ) THEN
        ALTER TABLE "project_members" ADD CONSTRAINT "project_members_projectId_userId_key" UNIQUE ("projectId", "userId");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'project_members_projectId_fkey'
    ) THEN
        ALTER TABLE "project_members" ADD CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'project_members_userId_fkey'
    ) THEN
        ALTER TABLE "project_members" ADD CONSTRAINT "project_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 3. Task Comments Table (Markdown & Image support)
CREATE TABLE IF NOT EXISTS "task_comments" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "task_comments_taskId_createdAt_idx" ON "task_comments"("taskId", "createdAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'task_comments_taskId_fkey'
    ) THEN
        ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'task_comments_userId_fkey'
    ) THEN
        ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- 4. Task Work Logs Table (Time reporting on tasks)
CREATE TABLE IF NOT EXISTS "task_work_logs" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "hours" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_work_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "task_work_logs_taskId_date_idx" ON "task_work_logs"("taskId", "date");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'task_work_logs_taskId_fkey'
    ) THEN
        ALTER TABLE "task_work_logs" ADD CONSTRAINT "task_work_logs_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'task_work_logs_userId_fkey'
    ) THEN
        ALTER TABLE "task_work_logs" ADD CONSTRAINT "task_work_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- 5. Tenant Onboarding Invitations Table
CREATE TABLE IF NOT EXISTS "tenant_invitations" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tenantSlug" TEXT,
    "companyName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "metadata" TEXT DEFAULT '{}',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_invitations_token_key" ON "tenant_invitations"("token");
