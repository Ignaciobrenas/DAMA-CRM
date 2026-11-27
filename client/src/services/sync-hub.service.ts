import { api, ApiResponse } from './api';

export interface CapabilityConfigFieldDto {
  path: string;
  type: 'select' | 'boolean' | 'number' | 'string';
  label: string;
  description: string;
  options?: Array<{ value: string; label: string }>;
  default: string | boolean | number;
  readBy: 'backend' | 'orchestrator';
}

export interface ChannelCapabilitiesDto {
  products: boolean;
  prices: boolean;
  tariffs: boolean;
  stock: boolean;
  orders: boolean;
  categories: boolean;
  shipments: boolean;
  returns: boolean;
  delivery_notes: boolean;
  customers: boolean;
  companies: boolean;
  contacts: boolean;
  deals: boolean;
  invoices: boolean;
  credit_notes: boolean;
  discounts: boolean;
  [key: string]: boolean;
}

export interface SyncEnvironmentDto {
  id: string;
  name: string;
  description?: string | null;
  status: 'active' | 'inactive' | 'maintenance';
  url?: string | null;
  version?: string | null;
  health: 'healthy' | 'degraded' | 'unhealthy' | 'maintenance';
  uptime?: string | null;
  lastDeploy?: string | null;
  connectionCount?: number;
  connectedCount?: number;
  apiKeyCount?: number;
  createdAt: string;
}

export interface SyncChannelVersionDto {
  id: string;
  version: string;
  description?: string | null;
  typeId: string;
  channelType?: { id: string; name: string; type: string };
}

export interface SyncChannelTypeDto {
  id: string;
  name: string;
  description?: string | null;
  type: 'B2B' | 'B2C' | 'ERP' | '3PL' | 'CRM';
  capabilities: ChannelCapabilitiesDto;
  connectorKey?: string | null;
  versions: SyncChannelVersionDto[];
  channelCount?: number;
}

export interface SyncChannelDto {
  id: string;
  name: string;
  description?: string | null;
  status: 'active' | 'inactive' | 'maintenance';
  typeId: string;
  versionId: string;
  channelType: SyncChannelTypeDto;
  versionType: SyncChannelVersionDto;
  connections?: Array<{ id: string; status: string; environment?: { id: string; name: string } }>;
  metadataCount?: number;
}

export interface SyncConnectionDto {
  id: string;
  endpoint: string;
  type: 'api' | 'database' | 'ftp' | 'sftp' | 'webhook' | 'file';
  status: 'connected' | 'disconnected' | 'error' | 'warning' | 'maintenance' | 'testing';
  lastTest?: string | null;
  credentials: Record<string, any>;
  hasCredentials: boolean;
  config: Record<string, any>;
  channelId: string;
  environmentId: string;
  channel?: SyncChannelDto;
  environment?: SyncEnvironmentDto;
  rateLimitUsed: number;
  rateLimitMax: number;
  avgResponseTime: number;
  lastResponseTime?: number | null;
  healthChecksOk: number;
  healthChecksTotal: number;
  uptimePercentage?: number | null;
  lastErrorMessage?: string | null;
  warningMessage?: string | null;
  licenseExpiresAt?: string | null;
  licenseAlertLevel?: string | null;
  reportedVersion?: string | null;
  createdAt: string;
}

export interface SyncApiKeyDto {
  id: string;
  name: string;
  keyValue: string;
  keyMask: string;
  type: 'api_key' | 'oauth' | 'bearer' | 'basic_auth' | 'custom' | 'webhook';
  permissions: Array<{ category: string; resource: string; action: string; granted: boolean }>;
  status: 'active' | 'inactive' | 'expiring' | 'expired';
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  connectionId?: string | null;
  environmentId?: string | null;
  environment?: { id: string; name: string } | null;
  connection?: { id: string; endpoint: string; channel?: { id: string; name: string } } | null;
  createdAt: string;
}

export interface SyncMetadataDefinitionDto {
  id: string;
  channelId: string;
  entityType: string;
  key: string;
  label: string;
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'date' | 'select';
  required: boolean;
  defaultValue?: string | null;
  description?: string | null;
  namespace?: string | null;
  mappingPath?: string | null;
  isActive: boolean;
  channel?: { id: string; name: string };
}

export interface SyncTaskCategoryDto {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  icon: string;
  color: string;
  order: number;
  isActive: boolean;
  taskTypeCount?: number;
}

export interface SyncTaskParameterDto {
  id?: string;
  name: string;
  key: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'json';
  description?: string | null;
  required: boolean;
  defaultValue?: any;
  options?: Array<{ value: string; label: string }>;
  validation?: Record<string, any>;
  order?: number;
}

export interface SyncTaskTypeDto {
  id: string;
  name: string;
  description?: string | null;
  categoryId: string;
  category?: SyncTaskCategoryDto;
  icon: string;
  color: string;
  isActive: boolean;
  isSystem: boolean;
  workflowConfig: {
    mode: 'connector' | 'webhook';
    connectorKey?: string;
    operation?: string;
    webhookUrl?: string;
    authToken?: string;
    version?: string;
  };
  supportedChannelTypeIds: string[];
  supportedChannelVersionIds: string[];
  dataEntityType: string;
  operationType: string;
  direction: 'import' | 'export' | 'bidirectional';
  requiresFile: boolean;
  executionConfig: Record<string, any>;
  monitoringConfig: Record<string, any>;
  version: string;
  lastUsed?: string | null;
  usageCount: number;
  taskCount?: number;
  parameters: SyncTaskParameterDto[];
}

export interface SyncTaskDto {
  id: string;
  name: string;
  description?: string | null;
  schedule: string;
  scheduleDisplay?: string | null;
  status: string;
  executionType: 'cron' | 'quick' | 'webhook' | 'manual';
  lastRun?: string | null;
  nextRun?: string | null;
  successCount: number;
  errorCount: number;
  enabled: boolean;
  taskTypeId: string;
  taskType?: SyncTaskTypeDto;
  configuration: Record<string, any>;
  sourceChannelId?: string | null;
  targetChannelId?: string | null;
  sourceConnectionId?: string | null;
  targetConnectionId?: string | null;
  sourceChannel?: SyncChannelDto | null;
  targetChannel?: SyncChannelDto | null;
  sourceConnection?: SyncConnectionDto | null;
  targetConnection?: SyncConnectionDto | null;
  executionProgress?: Record<string, any>;
  executionSummary?: Record<string, any>;
  executionCount?: number;
  createdAt: string;
}

export interface SyncTaskExecutionDto {
  id: string;
  taskId: string;
  status: string;
  triggerType: string;
  startedAt: string;
  completedAt?: string | null;
  durationMs?: number | null;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  summary?: string | null;
  errorMessage?: string | null;
  details?: Record<string, any>;
}

export interface SyncOperationDto {
  id: string;
  operation: string;
  entityType: string;
  status: 'blocked' | 'queued' | 'submitted' | 'processing' | 'completed' | 'failed' | 'timeout' | 'cancelled';
  connectionId: string;
  connection?: { id: string; endpoint: string; channel?: { id: string; name: string } };
  syncTaskId?: string | null;
  syncTask?: { id: string; name: string } | null;
  externalJobId?: string | null;
  payloadHash: string;
  totalEntities: number;
  succeededEntities: number;
  failedEntities: number;
  skippedEntities: number;
  errorMessage?: string | null;
  dependsOnIds: string[];
  dependentIds: string[];
  entities: Array<{
    id: string;
    entityId: string;
    externalId?: string | null;
    status: string;
    errorMessage?: string | null;
  }>;
  createdAt: string;
  completedAt?: string | null;
}

export interface SyncHubStatsDto {
  totalTasks: number;
  activeTasks: number;
  runningTasks: number;
  errorTasks: number;
  totalExecutions: number;
  successfulExecutions: number;
  successRate: number;
  totalConnections: number;
  connectedConnections: number;
  activeOperations: number;
}

function unwrap<T>(res: ApiResponse<T>, fallback: T): T {
  if (res && res.success && res.data !== undefined) {
    return res.data;
  }
  return fallback;
}

export const syncHubService = {
  // Stats
  async getStats(): Promise<SyncHubStatsDto> {
    const res = await api.get('/sync/stats', { useCache: false });
    return unwrap(res, {
      totalTasks: 0,
      activeTasks: 0,
      runningTasks: 0,
      errorTasks: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      successRate: 100,
      totalConnections: 0,
      connectedConnections: 0,
      activeOperations: 0,
    });
  },

  // Environments
  async listEnvironments(): Promise<SyncEnvironmentDto[]> {
    const res = await api.get('/sync/environments', { useCache: false });
    return unwrap(res, []);
  },
  async createEnvironment(payload: Partial<SyncEnvironmentDto>) {
    return api.post('/sync/environments', payload);
  },
  async updateEnvironment(id: string, payload: Partial<SyncEnvironmentDto>) {
    return api.put(`/sync/environments/${id}`, payload);
  },
  async deleteEnvironment(id: string) {
    return api.delete(`/sync/environments/${id}`);
  },
  async checkEnvironmentHealth(id: string) {
    return api.post(`/sync/environments/${id}/health`);
  },

  // Channel Types & Versions
  async getCapabilityConfigSchema(): Promise<Record<string, CapabilityConfigFieldDto[]>> {
    const res = await api.get('/sync/channel-types/config-schema', { useCache: false });
    return unwrap(res, {});
  },
  async listChannelTypes(): Promise<SyncChannelTypeDto[]> {
    const res = await api.get('/sync/channel-types', { useCache: false });
    return unwrap(res, []);
  },
  async createChannelType(payload: Record<string, any>) {
    return api.post('/sync/channel-types', payload);
  },
  async updateChannelType(id: string, payload: Record<string, any>) {
    return api.put(`/sync/channel-types/${id}`, payload);
  },
  async deleteChannelType(id: string) {
    return api.delete(`/sync/channel-types/${id}`);
  },
  async createChannelVersion(payload: { typeId: string; version: string; description?: string }) {
    return api.post('/sync/channel-versions', payload);
  },
  async deleteChannelVersion(id: string) {
    return api.delete(`/sync/channel-versions/${id}`);
  },

  // Channels & Metadata Definitions
  async listChannels(): Promise<SyncChannelDto[]> {
    const res = await api.get('/sync/channels', { useCache: false });
    return unwrap(res, []);
  },
  async createChannel(payload: Record<string, any>) {
    return api.post('/sync/channels', payload);
  },
  async deleteChannel(id: string) {
    return api.delete(`/sync/channels/${id}`);
  },
  async listMetadataDefinitions(channelId?: string): Promise<SyncMetadataDefinitionDto[]> {
    const res = await api.get('/sync/metadata-definitions', {
      params: channelId ? { channelId } : undefined,
      useCache: false,
    });
    return unwrap(res, []);
  },
  async createMetadataDefinition(payload: Record<string, any>) {
    return api.post('/sync/metadata-definitions', payload);
  },
  async deleteMetadataDefinition(id: string) {
    return api.delete(`/sync/metadata-definitions/${id}`);
  },

  // Connections
  async listConnections(filters?: { environmentId?: string; status?: string }): Promise<SyncConnectionDto[]> {
    const res = await api.get('/sync/connections', { params: filters, useCache: false });
    return unwrap(res, []);
  },
  async createConnection(payload: Record<string, any>) {
    return api.post('/sync/connections', payload);
  },
  async updateConnection(id: string, payload: Record<string, any>) {
    return api.put(`/sync/connections/${id}`, payload);
  },
  async deleteConnection(id: string) {
    return api.delete(`/sync/connections/${id}`);
  },
  async testConnection(id: string) {
    return api.post(`/sync/connections/${id}/test`);
  },
  async testDraftConnection(payload: Record<string, any>) {
    return api.post('/sync/connections/test-draft', payload);
  },

  // API Keys
  async listApiKeys(): Promise<SyncApiKeyDto[]> {
    const res = await api.get('/sync/api-keys', { useCache: false });
    return unwrap(res, []);
  },
  async createApiKey(payload: Record<string, any>) {
    return api.post('/sync/api-keys', payload);
  },
  async renewApiKey(id: string, payload: { regenerateKey?: boolean; expiresAt?: string }) {
    return api.post(`/sync/api-keys/${id}/renew`, payload);
  },
  async testApiKey(id: string) {
    return api.post(`/sync/api-keys/${id}/test`);
  },
  async deleteApiKey(id: string) {
    return api.delete(`/sync/api-keys/${id}`);
  },

  // Task Categories & Task Types
  async listTaskCategories(): Promise<SyncTaskCategoryDto[]> {
    const res = await api.get('/sync/task-categories', { useCache: false });
    return unwrap(res, []);
  },
  async createTaskCategory(payload: Record<string, any>) {
    return api.post('/sync/task-categories', payload);
  },
  async deleteTaskCategory(id: string) {
    return api.delete(`/sync/task-categories/${id}`);
  },
  async listTaskTypes(filters?: { categoryId?: string; search?: string }): Promise<SyncTaskTypeDto[]> {
    const res = await api.get('/sync/task-types', { params: filters, useCache: false });
    return unwrap(res, []);
  },
  async createTaskType(payload: Record<string, any>) {
    return api.post('/sync/task-types', payload);
  },
  async updateTaskType(id: string, payload: Record<string, any>) {
    return api.put(`/sync/task-types/${id}`, payload);
  },
  async duplicateTaskType(id: string) {
    return api.post(`/sync/task-types/${id}/duplicate`);
  },
  async toggleTaskType(id: string) {
    return api.patch(`/sync/task-types/${id}/toggle`);
  },
  async deleteTaskType(id: string) {
    return api.delete(`/sync/task-types/${id}`);
  },

  // Sync Tasks
  async listTasks(params?: {
    search?: string;
    executionType?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tasks: SyncTaskDto[]; total: number; page: number; limit: number; pages: number }> {
    const res = await api.get('/sync/tasks', { params, useCache: false });
    return unwrap(res, { tasks: [], total: 0, page: 1, limit: 20, pages: 1 });
  },
  async createTask(payload: Record<string, any>) {
    return api.post('/sync/tasks', payload);
  },
  async updateTask(id: string, payload: Record<string, any>) {
    return api.put(`/sync/tasks/${id}`, payload);
  },
  async toggleTask(id: string) {
    return api.patch(`/sync/tasks/${id}/toggle`);
  },
  async duplicateTask(id: string) {
    return api.post(`/sync/tasks/${id}/duplicate`);
  },
  async deleteTask(id: string) {
    return api.delete(`/sync/tasks/${id}`);
  },
  async runTask(id: string, overrideConfig?: Record<string, any>) {
    return api.post(`/sync/tasks/${id}/run`, overrideConfig ? { overrideConfig } : {});
  },
  async quickExecuteTask(payload: Record<string, any>) {
    return api.post('/sync/tasks/quick-execute', payload);
  },
  async getTaskHistory(id: string): Promise<{
    taskId: string;
    taskName: string;
    executions: SyncTaskExecutionDto[];
    operations: SyncOperationDto[];
  }> {
    const res = await api.get(`/sync/tasks/${id}/history`, { useCache: false });
    return unwrap(res, { taskId: id, taskName: '', executions: [], operations: [] });
  },

  // Sync Operations (DAG State Machine)
  async listOperations(filters?: { status?: string; connectionId?: string }): Promise<SyncOperationDto[]> {
    const res = await api.get('/sync/operations', { params: filters, useCache: false });
    return unwrap(res, []);
  },
  async createOperation(payload: Record<string, any>) {
    return api.post('/sync/operations', payload);
  },
  async transitionOperationStatus(id: string, status: string, errorMessage?: string) {
    return api.patch(`/sync/operations/${id}/status`, { status, errorMessage });
  },
};
