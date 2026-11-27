-- =============================================================================
-- DAMA-CRM: Idempotent Migration for Multi-Channel Connections, Definitions,
-- Synchronization Tasks, Execution History, and Operation State Machine
-- =============================================================================

CREATE TABLE IF NOT EXISTS "sync_channel_types" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL DEFAULT 'master',
  "name" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL DEFAULT 'B2C',
  "capabilities" TEXT DEFAULT '{}',
  "connectorKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sync_channel_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "sync_channel_types_tenantId_name_key" ON "sync_channel_types"("tenantId", "name");
CREATE INDEX IF NOT EXISTS "sync_channel_types_tenantId_idx" ON "sync_channel_types"("tenantId");

CREATE TABLE IF NOT EXISTS "sync_channel_version_types" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL DEFAULT 'master',
  "version" TEXT NOT NULL,
  "description" TEXT,
  "typeId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sync_channel_version_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "sync_channel_version_types_typeId_version_key" ON "sync_channel_version_types"("typeId", "version");
CREATE INDEX IF NOT EXISTS "sync_channel_version_types_tenantId_typeId_idx" ON "sync_channel_version_types"("tenantId", "typeId");

CREATE TABLE IF NOT EXISTS "sync_environments" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL DEFAULT 'master',
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "url" TEXT,
  "version" TEXT,
  "health" TEXT NOT NULL DEFAULT 'healthy',
  "uptime" TEXT,
  "lastDeploy" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sync_environments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "sync_environments_tenantId_name_key" ON "sync_environments"("tenantId", "name");
CREATE INDEX IF NOT EXISTS "sync_environments_tenantId_idx" ON "sync_environments"("tenantId");

CREATE TABLE IF NOT EXISTS "sync_channels" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL DEFAULT 'master',
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "typeId" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sync_channels_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "sync_channels_tenantId_name_key" ON "sync_channels"("tenantId", "name");
CREATE INDEX IF NOT EXISTS "sync_channels_tenantId_typeId_idx" ON "sync_channels"("tenantId", "typeId");

CREATE TABLE IF NOT EXISTS "sync_connections" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL DEFAULT 'master',
  "endpoint" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'api',
  "status" TEXT NOT NULL DEFAULT 'disconnected',
  "lastTest" TIMESTAMP(3),
  "credentials" TEXT,
  "config" TEXT DEFAULT '{}',
  "channelId" TEXT NOT NULL,
  "environmentId" TEXT NOT NULL,
  "rateLimitUsed" INTEGER NOT NULL DEFAULT 0,
  "rateLimitMax" INTEGER NOT NULL DEFAULT 1000,
  "rateLimitResetAt" TIMESTAMP(3),
  "avgResponseTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lastResponseTime" INTEGER,
  "healthChecksOk" INTEGER NOT NULL DEFAULT 0,
  "healthChecksTotal" INTEGER NOT NULL DEFAULT 0,
  "lastErrorMessage" TEXT,
  "lastErrorAt" TIMESTAMP(3),
  "warningMessage" TEXT,
  "licenseExpiresAt" TIMESTAMP(3),
  "licenseCheckedAt" TIMESTAMP(3),
  "licenseAlertLevel" TEXT,
  "reportedVersion" TEXT,
  "oauthState" TEXT,
  "oauthStateExpiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sync_connections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "sync_connections_channelId_environmentId_key" ON "sync_connections"("channelId", "environmentId");
CREATE INDEX IF NOT EXISTS "sync_connections_tenantId_status_idx" ON "sync_connections"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "sync_connections_tenantId_environmentId_idx" ON "sync_connections"("tenantId", "environmentId");

CREATE TABLE IF NOT EXISTS "sync_api_keys" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL DEFAULT 'master',
  "name" TEXT NOT NULL,
  "keyValue" TEXT NOT NULL,
  "keyMask" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'api_key',
  "permissions" TEXT NOT NULL DEFAULT '[]',
  "status" TEXT NOT NULL DEFAULT 'active',
  "expiresAt" TIMESTAMP(3),
  "lastUsedAt" TIMESTAMP(3),
  "connectionId" TEXT,
  "environmentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sync_api_keys_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "sync_api_keys_tenantId_status_idx" ON "sync_api_keys"("tenantId", "status");

CREATE TABLE IF NOT EXISTS "sync_channel_metadata_definitions" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL DEFAULT 'master',
  "channelId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "dataType" TEXT NOT NULL DEFAULT 'string',
  "required" BOOLEAN NOT NULL DEFAULT false,
  "defaultValue" TEXT,
  "description" TEXT,
  "namespace" TEXT,
  "mappingPath" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sync_channel_metadata_definitions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "sync_channel_metadata_definitions_channelId_entityType_key_key" ON "sync_channel_metadata_definitions"("channelId", "entityType", "key");
CREATE INDEX IF NOT EXISTS "sync_channel_metadata_definitions_tenantId_channelId_idx" ON "sync_channel_metadata_definitions"("tenantId", "channelId");

CREATE TABLE IF NOT EXISTS "sync_task_type_categories" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL DEFAULT 'master',
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT NOT NULL DEFAULT 'sync',
  "color" TEXT NOT NULL DEFAULT '#3b82f6',
  "order" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "metadata" TEXT DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sync_task_type_categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "sync_task_type_categories_tenantId_key_key" ON "sync_task_type_categories"("tenantId", "key");
CREATE INDEX IF NOT EXISTS "sync_task_type_categories_tenantId_order_idx" ON "sync_task_type_categories"("tenantId", "order");

CREATE TABLE IF NOT EXISTS "sync_task_types" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL DEFAULT 'master',
  "name" TEXT NOT NULL,
  "description" TEXT,
  "categoryId" TEXT NOT NULL,
  "icon" TEXT NOT NULL DEFAULT 'refresh-cw',
  "color" TEXT NOT NULL DEFAULT '#3b82f6',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "workflowConfig" TEXT DEFAULT '{}',
  "supportedChannelTypeIds" TEXT NOT NULL DEFAULT '[]',
  "supportedChannelVersionIds" TEXT NOT NULL DEFAULT '[]',
  "dataEntityType" TEXT NOT NULL DEFAULT 'products',
  "operationType" TEXT NOT NULL DEFAULT 'incremental',
  "direction" TEXT NOT NULL DEFAULT 'bidirectional',
  "requiresFile" BOOLEAN NOT NULL DEFAULT false,
  "scheduleConstraints" TEXT DEFAULT '{}',
  "executionConfig" TEXT DEFAULT '{}',
  "monitoringConfig" TEXT DEFAULT '{}',
  "documentation" TEXT DEFAULT '{}',
  "version" TEXT NOT NULL DEFAULT '1.0.0',
  "lastUsed" TIMESTAMP(3),
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sync_task_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "sync_task_types_tenantId_name_key" ON "sync_task_types"("tenantId", "name");
CREATE INDEX IF NOT EXISTS "sync_task_types_tenantId_categoryId_idx" ON "sync_task_types"("tenantId", "categoryId");
CREATE INDEX IF NOT EXISTS "sync_task_types_tenantId_dataEntityType_idx" ON "sync_task_types"("tenantId", "dataEntityType");

CREATE TABLE IF NOT EXISTS "sync_task_type_parameters" (
  "id" TEXT NOT NULL,
  "taskTypeId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'string',
  "description" TEXT,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "defaultValue" TEXT,
  "options" TEXT DEFAULT '[]',
  "validation" TEXT DEFAULT '{}',
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sync_task_type_parameters_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "sync_task_type_parameters_taskTypeId_key_key" ON "sync_task_type_parameters"("taskTypeId", "key");
CREATE INDEX IF NOT EXISTS "sync_task_type_parameters_taskTypeId_idx" ON "sync_task_type_parameters"("taskTypeId");

CREATE TABLE IF NOT EXISTS "sync_tasks" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL DEFAULT 'master',
  "name" TEXT NOT NULL,
  "description" TEXT,
  "schedule" TEXT NOT NULL DEFAULT 'manual',
  "scheduleDisplay" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "executionType" TEXT NOT NULL DEFAULT 'cron',
  "lastRun" TIMESTAMP(3),
  "nextRun" TIMESTAMP(3),
  "successCount" INTEGER NOT NULL DEFAULT 0,
  "errorCount" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "taskTypeId" TEXT NOT NULL,
  "configuration" TEXT DEFAULT '{}',
  "sourceChannelId" TEXT,
  "targetChannelId" TEXT,
  "sourceConnectionId" TEXT,
  "targetConnectionId" TEXT,
  "fileUrl" TEXT,
  "fileConfig" TEXT DEFAULT '{}',
  "executionProgress" TEXT DEFAULT '{}',
  "executionSummary" TEXT DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sync_tasks_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "sync_tasks_tenantId_name_key" ON "sync_tasks"("tenantId", "name");
CREATE INDEX IF NOT EXISTS "sync_tasks_tenantId_status_idx" ON "sync_tasks"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "sync_tasks_tenantId_executionType_idx" ON "sync_tasks"("tenantId", "executionType");
CREATE INDEX IF NOT EXISTS "sync_tasks_tenantId_taskTypeId_idx" ON "sync_tasks"("tenantId", "taskTypeId");

CREATE TABLE IF NOT EXISTS "sync_task_executions" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL DEFAULT 'master',
  "taskId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'running',
  "triggerType" TEXT NOT NULL DEFAULT 'manual',
  "triggeredById" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "durationMs" INTEGER,
  "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
  "recordsSucceeded" INTEGER NOT NULL DEFAULT 0,
  "recordsFailed" INTEGER NOT NULL DEFAULT 0,
  "summary" TEXT,
  "errorMessage" TEXT,
  "details" TEXT DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sync_task_executions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "sync_task_executions_tenantId_taskId_startedAt_idx" ON "sync_task_executions"("tenantId", "taskId", "startedAt");

CREATE TABLE IF NOT EXISTS "sync_operations" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL DEFAULT 'master',
  "operation" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "connectionId" TEXT NOT NULL,
  "syncTaskId" TEXT,
  "externalJobId" TEXT,
  "payloadHash" TEXT NOT NULL,
  "totalEntities" INTEGER NOT NULL DEFAULT 0,
  "succeededEntities" INTEGER NOT NULL DEFAULT 0,
  "failedEntities" INTEGER NOT NULL DEFAULT 0,
  "skippedEntities" INTEGER NOT NULL DEFAULT 0,
  "metadata" TEXT DEFAULT '{}',
  "errorMessage" TEXT,
  "submittedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sync_operations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "sync_operations_tenantId_status_idx" ON "sync_operations"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "sync_operations_tenantId_connectionId_payloadHash_idx" ON "sync_operations"("tenantId", "connectionId", "payloadHash");

CREATE TABLE IF NOT EXISTS "sync_operation_entities" (
  "id" TEXT NOT NULL,
  "operationId" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "externalId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "errorMessage" TEXT,
  "payload" TEXT DEFAULT '{}',
  "result" TEXT DEFAULT '{}',
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sync_operation_entities_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "sync_operation_entities_operationId_entityId_key" ON "sync_operation_entities"("operationId", "entityId");
CREATE INDEX IF NOT EXISTS "sync_operation_entities_operationId_status_idx" ON "sync_operation_entities"("operationId", "status");

CREATE TABLE IF NOT EXISTS "sync_operation_dependencies" (
  "id" TEXT NOT NULL,
  "operationId" TEXT NOT NULL,
  "dependsOnId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sync_operation_dependencies_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "sync_operation_dependencies_operationId_dependsOnId_key" ON "sync_operation_dependencies"("operationId", "dependsOnId");
CREATE INDEX IF NOT EXISTS "sync_operation_dependencies_dependsOnId_idx" ON "sync_operation_dependencies"("dependsOnId");

-- Idempotent foreign key constraints
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sync_channel_version_types_typeId_fkey') THEN
    ALTER TABLE "sync_channel_version_types" ADD CONSTRAINT "sync_channel_version_types_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "sync_channel_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sync_channels_typeId_fkey') THEN
    ALTER TABLE "sync_channels" ADD CONSTRAINT "sync_channels_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "sync_channel_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sync_channels_versionId_fkey') THEN
    ALTER TABLE "sync_channels" ADD CONSTRAINT "sync_channels_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "sync_channel_version_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sync_connections_channelId_fkey') THEN
    ALTER TABLE "sync_connections" ADD CONSTRAINT "sync_connections_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "sync_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sync_connections_environmentId_fkey') THEN
    ALTER TABLE "sync_connections" ADD CONSTRAINT "sync_connections_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "sync_environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sync_api_keys_connectionId_fkey') THEN
    ALTER TABLE "sync_api_keys" ADD CONSTRAINT "sync_api_keys_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "sync_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sync_api_keys_environmentId_fkey') THEN
    ALTER TABLE "sync_api_keys" ADD CONSTRAINT "sync_api_keys_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "sync_environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sync_channel_metadata_definitions_channelId_fkey') THEN
    ALTER TABLE "sync_channel_metadata_definitions" ADD CONSTRAINT "sync_channel_metadata_definitions_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "sync_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sync_task_types_categoryId_fkey') THEN
    ALTER TABLE "sync_task_types" ADD CONSTRAINT "sync_task_types_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "sync_task_type_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sync_task_type_parameters_taskTypeId_fkey') THEN
    ALTER TABLE "sync_task_type_parameters" ADD CONSTRAINT "sync_task_type_parameters_taskTypeId_fkey" FOREIGN KEY ("taskTypeId") REFERENCES "sync_task_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sync_tasks_taskTypeId_fkey') THEN
    ALTER TABLE "sync_tasks" ADD CONSTRAINT "sync_tasks_taskTypeId_fkey" FOREIGN KEY ("taskTypeId") REFERENCES "sync_task_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sync_tasks_sourceChannelId_fkey') THEN
    ALTER TABLE "sync_tasks" ADD CONSTRAINT "sync_tasks_sourceChannelId_fkey" FOREIGN KEY ("sourceChannelId") REFERENCES "sync_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sync_tasks_targetChannelId_fkey') THEN
    ALTER TABLE "sync_tasks" ADD CONSTRAINT "sync_tasks_targetChannelId_fkey" FOREIGN KEY ("targetChannelId") REFERENCES "sync_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sync_tasks_sourceConnectionId_fkey') THEN
    ALTER TABLE "sync_tasks" ADD CONSTRAINT "sync_tasks_sourceConnectionId_fkey" FOREIGN KEY ("sourceConnectionId") REFERENCES "sync_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sync_tasks_targetConnectionId_fkey') THEN
    ALTER TABLE "sync_tasks" ADD CONSTRAINT "sync_tasks_targetConnectionId_fkey" FOREIGN KEY ("targetConnectionId") REFERENCES "sync_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sync_task_executions_taskId_fkey') THEN
    ALTER TABLE "sync_task_executions" ADD CONSTRAINT "sync_task_executions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "sync_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sync_operations_connectionId_fkey') THEN
    ALTER TABLE "sync_operations" ADD CONSTRAINT "sync_operations_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "sync_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sync_operations_syncTaskId_fkey') THEN
    ALTER TABLE "sync_operations" ADD CONSTRAINT "sync_operations_syncTaskId_fkey" FOREIGN KEY ("syncTaskId") REFERENCES "sync_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sync_operation_entities_operationId_fkey') THEN
    ALTER TABLE "sync_operation_entities" ADD CONSTRAINT "sync_operation_entities_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "sync_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sync_operation_dependencies_operationId_fkey') THEN
    ALTER TABLE "sync_operation_dependencies" ADD CONSTRAINT "sync_operation_dependencies_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "sync_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sync_operation_dependencies_dependsOnId_fkey') THEN
    ALTER TABLE "sync_operation_dependencies" ADD CONSTRAINT "sync_operation_dependencies_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "sync_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
