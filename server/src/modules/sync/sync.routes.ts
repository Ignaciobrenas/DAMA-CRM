import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import {
  listEnvironments,
  getEnvironmentById,
  createEnvironment,
  updateEnvironment,
  deleteEnvironment,
  checkEnvironmentHealth,
} from './controllers/environments.controller';
import {
  getCapabilityConfigSchema,
  listChannelTypes,
  getChannelTypeById,
  createChannelType,
  updateChannelType,
  deleteChannelType,
  listChannelVersions,
  createChannelVersion,
  updateChannelVersion,
  deleteChannelVersion,
  listChannels,
  getChannelById,
  createChannel,
  updateChannel,
  deleteChannel,
  listMetadataDefinitions,
  createMetadataDefinition,
  updateMetadataDefinition,
  deleteMetadataDefinition,
} from './controllers/definitions.controller';
import {
  listConnections,
  getConnectionById,
  createConnection,
  updateConnection,
  deleteConnection,
  testConnection,
  testDraftConnection,
  getConnectionSyncHistory,
} from './controllers/connections.controller';
import {
  listApiKeys,
  getApiKeyById,
  createApiKey,
  updateApiKey,
  renewApiKey,
  testApiKey,
  deleteApiKey,
} from './controllers/api-keys.controller';
import {
  listTaskCategories,
  createTaskCategory,
  updateTaskCategory,
  deleteTaskCategory,
  listTaskTypes,
  getTaskTypeById,
  createTaskType,
  updateTaskType,
  duplicateTaskType,
  toggleTaskType,
  deleteTaskType,
  getTaskTypeSupportedChannels,
} from './controllers/task-types.controller';
import {
  getSyncStats,
  listSyncTasks,
  getActiveSyncTasks,
  getSyncTaskById,
  createSyncTask,
  updateSyncTask,
  toggleSyncTask,
  duplicateSyncTask,
  deleteSyncTask,
  runSyncTask,
  quickExecuteSyncTask,
  handleSyncTaskCallback,
  getSyncTaskHistory,
} from './controllers/sync-tasks.controller';
import {
  listSyncOperations,
  getSyncOperationById,
  createSyncOperation,
  transitionSyncOperation,
  addSyncOperationDependency,
  bulkUpdateSyncOperationEntities,
} from './controllers/sync-operations.controller';

const router = Router();

router.use(authMiddleware);

// Overview metrics
router.get('/stats', getSyncStats);

// Environments
router.get('/environments', listEnvironments);
router.get('/environments/:id', getEnvironmentById);
router.post('/environments', requirePermission('integrations', 'manage'), createEnvironment);
router.put('/environments/:id', requirePermission('integrations', 'manage'), updateEnvironment);
router.delete('/environments/:id', requirePermission('integrations', 'manage'), deleteEnvironment);
router.post(
  '/environments/:id/health',
  requirePermission('integrations', 'manage'),
  checkEnvironmentHealth
);

// Channel Types, Capability Config Schema & Channel Versions
router.get('/channel-types/config-schema', getCapabilityConfigSchema);
router.get('/channel-types', listChannelTypes);
router.get('/channel-types/:id', getChannelTypeById);
router.post('/channel-types', requirePermission('integrations', 'manage'), createChannelType);
router.put('/channel-types/:id', requirePermission('integrations', 'manage'), updateChannelType);
router.delete('/channel-types/:id', requirePermission('integrations', 'manage'), deleteChannelType);

router.get('/channel-versions', listChannelVersions);
router.post('/channel-versions', requirePermission('integrations', 'manage'), createChannelVersion);
router.put(
  '/channel-versions/:id',
  requirePermission('integrations', 'manage'),
  updateChannelVersion
);
router.delete(
  '/channel-versions/:id',
  requirePermission('integrations', 'manage'),
  deleteChannelVersion
);

// Channels
router.get('/channels', listChannels);
router.get('/channels/:id', getChannelById);
router.post('/channels', requirePermission('integrations', 'manage'), createChannel);
router.put('/channels/:id', requirePermission('integrations', 'manage'), updateChannel);
router.delete('/channels/:id', requirePermission('integrations', 'manage'), deleteChannel);

// Channel Metadata Definitions
router.get('/metadata-definitions', listMetadataDefinitions);
router.post(
  '/metadata-definitions',
  requirePermission('integrations', 'manage'),
  createMetadataDefinition
);
router.put(
  '/metadata-definitions/:id',
  requirePermission('integrations', 'manage'),
  updateMetadataDefinition
);
router.delete(
  '/metadata-definitions/:id',
  requirePermission('integrations', 'manage'),
  deleteMetadataDefinition
);

// Connections (with atomic Channel+Connection creation & credential encryption)
router.get('/connections', listConnections);
router.post('/connections/test-draft', requirePermission('integrations', 'manage'), testDraftConnection);
router.get('/connections/:id', getConnectionById);
router.post('/connections', requirePermission('integrations', 'manage'), createConnection);
router.put('/connections/:id', requirePermission('integrations', 'manage'), updateConnection);
router.delete('/connections/:id', requirePermission('integrations', 'manage'), deleteConnection);
router.post('/connections/:id/test', requirePermission('integrations', 'manage'), testConnection);
router.get('/connections/:id/history', getConnectionSyncHistory);

// Inbound API Keys
router.get('/api-keys', listApiKeys);
router.get('/api-keys/:id', getApiKeyById);
router.post('/api-keys', requirePermission('integrations', 'manage'), createApiKey);
router.put('/api-keys/:id', requirePermission('integrations', 'manage'), updateApiKey);
router.post('/api-keys/:id/renew', requirePermission('integrations', 'manage'), renewApiKey);
router.post('/api-keys/:id/test', requirePermission('integrations', 'manage'), testApiKey);
router.delete('/api-keys/:id', requirePermission('integrations', 'manage'), deleteApiKey);

// Task Type Categories & Task Types (Definitions)
router.get('/task-categories', listTaskCategories);
router.post('/task-categories', requirePermission('integrations', 'manage'), createTaskCategory);
router.put('/task-categories/:id', requirePermission('integrations', 'manage'), updateTaskCategory);
router.delete(
  '/task-categories/:id',
  requirePermission('integrations', 'manage'),
  deleteTaskCategory
);

router.get('/task-types', listTaskTypes);
router.get('/task-types/:id', getTaskTypeById);
router.get('/task-types/:id/supported-channels', getTaskTypeSupportedChannels);
router.post('/task-types', requirePermission('integrations', 'manage'), createTaskType);
router.put('/task-types/:id', requirePermission('integrations', 'manage'), updateTaskType);
router.post(
  '/task-types/:id/duplicate',
  requirePermission('integrations', 'manage'),
  duplicateTaskType
);
router.patch('/task-types/:id/toggle', requirePermission('integrations', 'manage'), toggleTaskType);
router.delete('/task-types/:id', requirePermission('integrations', 'manage'), deleteTaskType);

// Synchronization Tasks
router.get('/tasks', listSyncTasks);
router.get('/tasks/active', getActiveSyncTasks);
router.post('/tasks/quick-execute', requirePermission('integrations', 'manage'), quickExecuteSyncTask);
router.get('/tasks/:id', getSyncTaskById);
router.post('/tasks', requirePermission('integrations', 'manage'), createSyncTask);
router.put('/tasks/:id', requirePermission('integrations', 'manage'), updateSyncTask);
router.patch('/tasks/:id/toggle', requirePermission('integrations', 'manage'), toggleSyncTask);
router.post('/tasks/:id/duplicate', requirePermission('integrations', 'manage'), duplicateSyncTask);
router.delete('/tasks/:id', requirePermission('integrations', 'manage'), deleteSyncTask);
router.post('/tasks/:id/run', requirePermission('integrations', 'manage'), runSyncTask);
router.post('/tasks/:id/callback', handleSyncTaskCallback);
router.get('/tasks/:id/history', getSyncTaskHistory);

// Asynchronous Sync Operations (DAG State Machine)
router.get('/operations', listSyncOperations);
router.get('/operations/:id', getSyncOperationById);
router.post('/operations', requirePermission('integrations', 'manage'), createSyncOperation);
router.patch(
  '/operations/:id/status',
  requirePermission('integrations', 'manage'),
  transitionSyncOperation
);
router.post(
  '/operations/:id/dependencies',
  requirePermission('integrations', 'manage'),
  addSyncOperationDependency
);
router.patch(
  '/operations/:id/entities',
  requirePermission('integrations', 'manage'),
  bulkUpdateSyncOperationEntities
);

export default router;
