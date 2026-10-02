-- Migration: Enhance Agile Planner Models
-- Adds boards, board_columns, board_sprints, board_tasks, task_links, board_task_assignees, board_task_watchers,
-- board_task_activities, board_task_attachments, board_task_comments, board_task_pull_requests, board_task_branches,
-- github_accounts, github_repositories, github_branches, github_commits, github_pull_requests,
-- forgejo_accounts, forgejo_repositories, forgejo_branches, forgejo_commits, forgejo_pull_requests,
-- planner_reminders, user_notes, push_subscriptions, task_templates, changelog_releases, changelog_release_entries,
-- harvest_report_configs, project_budget_alert_configs, project_budget_alert_statuses, fuel_rates, expense_receipts, expense_reminder_configs.

CREATE TABLE IF NOT EXISTS "boards" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT NOT NULL DEFAULT 'gradient-primary',
  "methodology" TEXT NOT NULL DEFAULT 'scrum',
  "boardType" TEXT NOT NULL DEFAULT 'individual',
  "parentBoardId" TEXT REFERENCES "boards"("id") ON DELETE SET NULL,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "archived" BOOLEAN NOT NULL DEFAULT false,
  "budgetedHours" DOUBLE PRECISION,
  "settings" TEXT DEFAULT '{}',
  "tenantId" TEXT DEFAULT 'master',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "board_members" (
  "id" TEXT PRIMARY KEY,
  "boardId" TEXT NOT NULL REFERENCES "boards"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL DEFAULT 'member',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("boardId", "userId")
);

CREATE TABLE IF NOT EXISTS "board_columns" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "status" TEXT,
  "position" INTEGER NOT NULL,
  "wipLimit" INTEGER,
  "allowedRoles" TEXT DEFAULT '[]',
  "blockedUserIds" TEXT DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "boardId" TEXT NOT NULL REFERENCES "boards"("id") ON DELETE CASCADE,
  UNIQUE("boardId", "position")
);

CREATE TABLE IF NOT EXISTS "board_sprints" (
  "id" TEXT PRIMARY KEY,
  "boardId" TEXT NOT NULL REFERENCES "boards"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "goal" TEXT,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'planned',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "board_tasks" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT UNIQUE NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL DEFAULT 'task',
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "status" TEXT NOT NULL DEFAULT 'todo',
  "dueDate" TIMESTAMP(3),
  "wasOverdueWhenClosed" BOOLEAN,
  "githubIssueNumber" INTEGER,
  "githubIssueUrl" TEXT,
  "forgejoIssueNumber" INTEGER,
  "forgejoIssueUrl" TEXT,
  "harvestConfig" TEXT DEFAULT '{}',
  "labels" TEXT DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "boardId" TEXT NOT NULL REFERENCES "boards"("id") ON DELETE CASCADE,
  "columnId" TEXT REFERENCES "board_columns"("id"),
  "assigneeId" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  "supervisorId" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP(3),
  "sprintId" TEXT REFERENCES "board_sprints"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "task_links" (
  "id" TEXT PRIMARY KEY,
  "taskAId" TEXT NOT NULL REFERENCES "board_tasks"("id") ON DELETE CASCADE,
  "taskBId" TEXT NOT NULL REFERENCES "board_tasks"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  UNIQUE("taskAId", "taskBId")
);

CREATE TABLE IF NOT EXISTS "board_task_assignees" (
  "id" TEXT PRIMARY KEY,
  "taskId" TEXT NOT NULL REFERENCES "board_tasks"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("taskId", "userId")
);

CREATE TABLE IF NOT EXISTS "board_task_watchers" (
  "id" TEXT PRIMARY KEY,
  "taskId" TEXT NOT NULL REFERENCES "board_tasks"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("taskId", "userId")
);

CREATE TABLE IF NOT EXISTS "board_task_activities" (
  "id" TEXT PRIMARY KEY,
  "type" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" TEXT DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "taskId" TEXT REFERENCES "board_tasks"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "board_task_attachments" (
  "id" TEXT PRIMARY KEY,
  "filename" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "mimetype" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "taskId" TEXT NOT NULL REFERENCES "board_tasks"("id") ON DELETE CASCADE,
  "commentId" TEXT
);

CREATE TABLE IF NOT EXISTS "board_task_comments" (
  "id" TEXT PRIMARY KEY,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "taskId" TEXT NOT NULL REFERENCES "board_tasks"("id") ON DELETE CASCADE,
  "userId" TEXT REFERENCES "users"("id") ON DELETE SET NULL
);

ALTER TABLE "board_task_attachments" ADD CONSTRAINT "board_task_attachments_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "board_task_comments"("id") ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS "board_task_pull_requests" (
  "id" TEXT PRIMARY KEY,
  "url" TEXT NOT NULL,
  "title" TEXT,
  "taskId" TEXT NOT NULL REFERENCES "board_tasks"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "board_task_branches" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "url" TEXT,
  "taskId" TEXT NOT NULL REFERENCES "board_tasks"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "github_accounts" (
  "id" TEXT PRIMARY KEY,
  "username" TEXT NOT NULL,
  "email" TEXT,
  "avatarUrl" TEXT,
  "encryptedToken" TEXT NOT NULL,
  "tokenIv" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT REFERENCES "users"("id") ON DELETE CASCADE,
  UNIQUE("username", "userId")
);

CREATE TABLE IF NOT EXISTS "github_repositories" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "defaultBranch" TEXT NOT NULL DEFAULT 'main',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastSyncAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "boardId" TEXT NOT NULL REFERENCES "boards"("id") ON DELETE CASCADE,
  "githubAccountId" TEXT REFERENCES "github_accounts"("id"),
  UNIQUE("boardId", "name")
);

CREATE TABLE IF NOT EXISTS "github_branches" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "sha" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "repositoryId" TEXT NOT NULL REFERENCES "github_repositories"("id") ON DELETE CASCADE,
  "taskId" TEXT REFERENCES "board_tasks"("id"),
  UNIQUE("repositoryId", "name")
);

CREATE TABLE IF NOT EXISTS "github_commits" (
  "id" TEXT PRIMARY KEY,
  "sha" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "author" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "repositoryId" TEXT NOT NULL REFERENCES "github_repositories"("id") ON DELETE CASCADE,
  "taskId" TEXT REFERENCES "board_tasks"("id"),
  UNIQUE("repositoryId", "sha")
);

CREATE TABLE IF NOT EXISTS "github_pull_requests" (
  "id" TEXT PRIMARY KEY,
  "number" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "state" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "mergedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "repositoryId" TEXT NOT NULL REFERENCES "github_repositories"("id") ON DELETE CASCADE,
  "taskId" TEXT REFERENCES "board_tasks"("id"),
  UNIQUE("repositoryId", "number")
);

CREATE TABLE IF NOT EXISTS "forgejo_accounts" (
  "id" TEXT PRIMARY KEY,
  "username" TEXT NOT NULL,
  "email" TEXT,
  "avatarUrl" TEXT,
  "encryptedToken" TEXT NOT NULL,
  "tokenIv" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT REFERENCES "users"("id") ON DELETE CASCADE,
  UNIQUE("username", "userId")
);

CREATE TABLE IF NOT EXISTS "forgejo_repositories" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "defaultBranch" TEXT NOT NULL DEFAULT 'main',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastSyncAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "boardId" TEXT NOT NULL REFERENCES "boards"("id") ON DELETE CASCADE,
  "accountId" TEXT REFERENCES "forgejo_accounts"("id"),
  UNIQUE("boardId", "name")
);

CREATE TABLE IF NOT EXISTS "forgejo_branches" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "sha" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "repositoryId" TEXT NOT NULL REFERENCES "forgejo_repositories"("id") ON DELETE CASCADE,
  "taskId" TEXT REFERENCES "board_tasks"("id"),
  UNIQUE("repositoryId", "name")
);

CREATE TABLE IF NOT EXISTS "forgejo_commits" (
  "id" TEXT PRIMARY KEY,
  "sha" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "author" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "repositoryId" TEXT NOT NULL REFERENCES "forgejo_repositories"("id") ON DELETE CASCADE,
  "taskId" TEXT REFERENCES "board_tasks"("id"),
  UNIQUE("repositoryId", "sha")
);

CREATE TABLE IF NOT EXISTS "forgejo_pull_requests" (
  "id" TEXT PRIMARY KEY,
  "number" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "state" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "mergedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "repositoryId" TEXT NOT NULL REFERENCES "forgejo_repositories"("id") ON DELETE CASCADE,
  "taskId" TEXT REFERENCES "board_tasks"("id"),
  UNIQUE("repositoryId", "number")
);

CREATE TABLE IF NOT EXISTS "planner_reminders" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "recurrenceType" TEXT NOT NULL DEFAULT 'none',
  "recurrenceDays" TEXT DEFAULT '[]',
  "recurrenceEndDate" TIMESTAMP(3),
  "snoozedUntil" TIMESTAMP(3),
  "lastNotifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "assignedToId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "relatedTaskId" TEXT REFERENCES "board_tasks"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "user_notes" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT,
  "content" TEXT NOT NULL,
  "color" TEXT DEFAULT 'yellow',
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" TEXT PRIMARY KEY,
  "endpoint" TEXT UNIQUE NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "task_templates" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "content" TEXT NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'personal',
  "departmentId" TEXT,
  "memberIds" TEXT DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" TEXT REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "changelog_releases" (
  "id" TEXT PRIMARY KEY,
  "version" TEXT NOT NULL,
  "title" TEXT,
  "releasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "changelog_release_entries" (
  "id" TEXT PRIMARY KEY,
  "releaseId" TEXT NOT NULL REFERENCES "changelog_releases"("id") ON DELETE CASCADE,
  "category" TEXT NOT NULL DEFAULT 'feature',
  "description" TEXT NOT NULL,
  "issueNumber" INTEGER,
  "issueUrl" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "harvest_report_configs" (
  "id" TEXT PRIMARY KEY,
  "emails" TEXT NOT NULL DEFAULT '[]',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "scheduleTime" TEXT NOT NULL DEFAULT '18:00',
  "timezone" TEXT NOT NULL DEFAULT 'Europe/Madrid',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "project_budget_alert_configs" (
  "id" TEXT PRIMARY KEY,
  "emails" TEXT NOT NULL DEFAULT '[]',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "scheduleTime" TEXT NOT NULL DEFAULT '09:00',
  "timezone" TEXT NOT NULL DEFAULT 'Europe/Madrid',
  "alert90Enabled" BOOLEAN NOT NULL DEFAULT true,
  "alert100Enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "project_budget_alert_statuses" (
  "id" TEXT PRIMARY KEY,
  "boardId" TEXT UNIQUE NOT NULL,
  "lastAlertSent90" TIMESTAMP(3),
  "lastAlertSent100" TIMESTAMP(3),
  "lastDailyReminder" TIMESTAMP(3),
  "currentStatus" TEXT NOT NULL DEFAULT 'under_budget',
  "lastPercentage" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "fuel_rates" (
  "id" TEXT PRIMARY KEY,
  "ratePerKm" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "effectiveFrom" TIMESTAMP(3) UNIQUE NOT NULL,
  "note" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "expense_receipts" (
  "id" TEXT PRIMARY KEY,
  "filename" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "mimetype" TEXT NOT NULL,
  "expenseId" TEXT NOT NULL,
  "uploadedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "expense_reminder_configs" (
  "id" TEXT PRIMARY KEY,
  "emails" TEXT NOT NULL DEFAULT '[]',
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "frequency" TEXT NOT NULL DEFAULT 'weekly',
  "dayOfWeek" INTEGER NOT NULL DEFAULT 1,
  "dayOfMonth" INTEGER NOT NULL DEFAULT 1,
  "scheduleTime" TEXT NOT NULL DEFAULT '09:00',
  "timezone" TEXT NOT NULL DEFAULT 'Europe/Madrid',
  "includePendingApproval" BOOLEAN NOT NULL DEFAULT true,
  "includePendingPayment" BOOLEAN NOT NULL DEFAULT true,
  "sendWhenEmpty" BOOLEAN NOT NULL DEFAULT false,
  "lastSentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "boards_tenantId_idx" ON "boards"("tenantId");
CREATE INDEX IF NOT EXISTS "board_tasks_boardId_columnId_idx" ON "board_tasks"("boardId", "columnId");
CREATE INDEX IF NOT EXISTS "board_tasks_assigneeId_idx" ON "board_tasks"("assigneeId");
CREATE INDEX IF NOT EXISTS "board_tasks_supervisorId_idx" ON "board_tasks"("supervisorId");
CREATE INDEX IF NOT EXISTS "planner_reminders_assignedToId_idx" ON "planner_reminders"("assignedToId");
CREATE INDEX IF NOT EXISTS "planner_reminders_status_idx" ON "planner_reminders"("status");
CREATE INDEX IF NOT EXISTS "planner_reminders_scheduledAt_idx" ON "planner_reminders"("scheduledAt");
CREATE INDEX IF NOT EXISTS "user_notes_userId_idx" ON "user_notes"("userId");
CREATE INDEX IF NOT EXISTS "user_notes_pinned_idx" ON "user_notes"("pinned");
