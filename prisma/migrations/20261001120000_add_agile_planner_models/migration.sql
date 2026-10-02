-- Migration to add Agile Planner models (Board, BoardColumn, BoardTask)
CREATE TABLE "Board" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" TEXT UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT NOT NULL DEFAULT 'gradient-primary',
  "methodology" TEXT NOT NULL DEFAULT 'scrum',
  "boardType" TEXT NOT NULL DEFAULT 'individual',
  "parentBoardId" UUID REFERENCES "Board"("id") ON DELETE SET NULL,
  "startDate" TIMESTAMP,
  "endDate" TIMESTAMP,
  "archived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "BoardColumn" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "status" TEXT,
  "position" INTEGER NOT NULL,
  "wipLimit" INTEGER,
  "allowedRoles" JSON NOT NULL,
  "blockedUserIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "boardId" UUID NOT NULL REFERENCES "Board"("id") ON DELETE CASCADE
);

CREATE TABLE "BoardTask" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" TEXT UNIQUE NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL DEFAULT 'task',
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "status" TEXT NOT NULL DEFAULT 'todo',
  "dueDate" TIMESTAMP,
  "labels" JSON NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "boardId" UUID NOT NULL REFERENCES "Board"("id") ON DELETE CASCADE,
  "columnId" UUID REFERENCES "BoardColumn"("id"),
  "assigneeId" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "supervisorId" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP
);

-- Indexes
CREATE INDEX "Board_idx_boardId_columnId" ON "BoardTask" ("boardId", "columnId");
CREATE INDEX "BoardTask_idx_assigneeId" ON "BoardTask" ("assigneeId");
CREATE INDEX "BoardTask_idx_supervisorId" ON "BoardTask" ("supervisorId");
