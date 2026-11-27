process.env.NODE_ENV = 'test';

import { after, describe, it } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/prisma';
import '../src/modules/integrations/connectors';
import { SecretCipher } from '../src/modules/sync/crypto/secret-cipher';
import { assertSafeOutboundUrl } from '../src/modules/sync/validators/ssrf-guard';
import { validateConnectionCredentials } from '../src/modules/sync/validators/credentials.validator';
import {
  CAPABILITY_CONFIG_SCHEMA,
  getDefaultCapabilities,
} from '../src/modules/sync/config-schema/capability-config.schema';
import {
  readCapabilityValue,
  validateCapabilityConfig,
} from '../src/modules/sync/config-schema/capability-config.util';
import { resetSeededTenantsCache } from '../src/modules/sync/seeds/sync-defaults.seed';
import { environmentsService } from '../src/modules/sync/services/environments.service';
import { channelsService } from '../src/modules/sync/services/channels.service';
import { connectionsService } from '../src/modules/sync/services/connections.service';
import { apiKeysService } from '../src/modules/sync/services/api-keys.service';
import { taskTypesService } from '../src/modules/sync/services/task-types.service';
import { syncTasksService } from '../src/modules/sync/services/sync-tasks.service';
import { syncOperationsService } from '../src/modules/sync/services/sync-operations.service';

const TEST_TENANT = `sync-test-${Date.now()}`;

describe('Enterprise Sync Hub: Connections, Definitions, Tasks & Operations DAG', () => {
  after(async () => {
    // Clean up all records created for the isolated test tenant
    await prisma.syncOperationDependency.deleteMany({
      where: { operation: { tenantId: TEST_TENANT } },
    });
    await prisma.syncOperationEntity.deleteMany({
      where: { operation: { tenantId: TEST_TENANT } },
    });
    await prisma.syncOperation.deleteMany({ where: { tenantId: TEST_TENANT } });
    await prisma.syncTaskExecution.deleteMany({ where: { tenantId: TEST_TENANT } });
    await prisma.syncTask.deleteMany({ where: { tenantId: TEST_TENANT } });
    await prisma.syncTaskTypeParameter.deleteMany({
      where: { taskType: { tenantId: TEST_TENANT } },
    });
    await prisma.syncTaskType.deleteMany({ where: { tenantId: TEST_TENANT } });
    await prisma.syncTaskTypeCategory.deleteMany({ where: { tenantId: TEST_TENANT } });
    await prisma.syncApiKey.deleteMany({ where: { tenantId: TEST_TENANT } });
    await prisma.syncChannelMetadataDefinition.deleteMany({ where: { tenantId: TEST_TENANT } });
    await prisma.syncConnection.deleteMany({ where: { tenantId: TEST_TENANT } });
    await prisma.syncChannel.deleteMany({ where: { tenantId: TEST_TENANT } });
    await prisma.syncChannelVersionType.deleteMany({ where: { tenantId: TEST_TENANT } });
    await prisma.syncChannelType.deleteMany({ where: { tenantId: TEST_TENANT } });
    await prisma.syncEnvironment.deleteMany({ where: { tenantId: TEST_TENANT } });
    resetSeededTenantsCache();
    await prisma.$disconnect();
  });

  describe('SecretCipher, SSRF Guard & Credential Validation', () => {
    it('should encrypt/decrypt AES-256-GCM credentials, mask secrets via allowlist, and preserve secrets on update', () => {
      const original = {
        auth_type: 'oauth_client_credentials',
        client_id: 'erp-client-01',
        client_secret: 'super-secret-value-999',
        token_url: 'https://auth.erp.local/token',
        headers: { 'X-Custom-Secret': 'abc123' },
      };

      const encrypted = SecretCipher.encryptCredentials(original);
      assert.ok(encrypted && encrypted.startsWith('gcmv1:'), 'Expected gcmv1 encrypted payload');
      assert.ok(!encrypted.includes('super-secret-value-999'), 'Plaintext secret must not appear in ciphertext');

      const decrypted = SecretCipher.decryptCredentials(encrypted);
      assert.deepStrictEqual(decrypted, original);

      const sanitized = SecretCipher.sanitizeCredentials(decrypted);
      assert.strictEqual(sanitized.client_id, 'erp-client-01');
      assert.strictEqual(sanitized.auth_type, 'oauth_client_credentials');
      assert.strictEqual(sanitized.client_secret, '***');
      assert.deepStrictEqual(sanitized.headers, { 'X-Custom-Secret': '***' });

      const merged = SecretCipher.mergeCredentialsPreservingSecrets(decrypted, {
        auth_type: 'oauth_client_credentials',
        client_id: 'erp-client-02',
        client_secret: '***',
        headers: { 'X-Custom-Secret': '***' },
      });
      assert.strictEqual(merged.client_id, 'erp-client-02');
      assert.strictEqual(merged.client_secret, 'super-secret-value-999');
      assert.deepStrictEqual(merged.headers, { 'X-Custom-Secret': 'abc123' });
    });

    it('should block cloud metadata SSRF targets while allowing private LAN/loopback ERP servers', () => {
      assert.throws(() => assertSafeOutboundUrl('http://169.254.169.254/latest/meta-data'), /Blocked outbound/);
      assert.throws(() => assertSafeOutboundUrl('http://metadata.google.internal/computeMetadata/v1'), /Blocked outbound/);
      assert.throws(() => assertSafeOutboundUrl('http://0.0.0.0:8080'), /Blocked outbound/);
      assert.throws(() => assertSafeOutboundUrl('file:///etc/passwd'), /Disallowed URL protocol/);

      assert.doesNotThrow(() => assertSafeOutboundUrl('https://erp.company.example/api'));
      assert.doesNotThrow(() => assertSafeOutboundUrl('http://192.168.1.50:8443/api/v1'));
      assert.doesNotThrow(() => assertSafeOutboundUrl('http://localhost:9000/webhook'));
    });

    it('should validate transport credentials and capability configurations', () => {
      const badDb = validateConnectionCredentials('database', {
        host: 'db.internal',
        port: 99999,
        username: 'admin',
        database: 'erp',
      });
      assert.strictEqual(badDb.valid, false);

      const okDb = validateConnectionCredentials('database', {
        host: 'db.internal',
        port: 5432,
        username: 'admin',
        password: 'secret',
        database: 'erp',
      });
      assert.strictEqual(okDb.valid, true);

      const b2cCaps = getDefaultCapabilities('B2C');
      assert.strictEqual(b2cCaps.orders, true);
      assert.strictEqual(getDefaultCapabilities('3PL').shipments, true);

      const validCapCfg = validateCapabilityConfig(b2cCaps, {
        orders: { readiness: { releaseStatus: 'confirmed' } },
        stock: { syncMode: 'absolute', safetyBuffer: 5 },
      });
      assert.strictEqual(validCapCfg.valid, true);

      const invalidCapCfg = validateCapabilityConfig(b2cCaps, {
        orders: { readiness: { releaseStatus: 'nonexistent_status' } },
        stock: { safetyBuffer: -10 },
      });
      assert.strictEqual(invalidCapCfg.valid, false);
      assert.strictEqual(invalidCapCfg.errors.length, 2);

      const resolvedDefault = readCapabilityValue({}, CAPABILITY_CONFIG_SCHEMA.orders[0]);
      assert.strictEqual(resolvedDefault, 'confirmed');
    });
  });

  describe('Definitions, Atomic Connections, API Keys, Sync Tasks & Operations DAG', () => {
    let prodEnvId = '';
    let shopifyTypeId = '';
    let shopifyVersionId = '';
    let a3erpTypeId = '';
    let a3erpVersionId = '';
    let connectionId = '';
    let channelId = '';

    it('should idempotently bootstrap defaults and enforce channel version-type integrity', async () => {
      const envs = await environmentsService.listEnvironments(TEST_TENANT);
      assert.ok(envs.some((e) => e.name === 'Production'));
      assert.ok(envs.some((e) => e.name === 'Staging'));
      prodEnvId = envs.find((e) => e.name === 'Production')!.id;

      const types = await channelsService.listChannelTypes(TEST_TENANT);
      const shopify = types.find((t) => t.name === 'Shopify')!;
      const a3erp = types.find((t) => t.name === 'a3ERP')!;
      assert.ok(shopify && a3erp);
      shopifyTypeId = shopify.id;
      shopifyVersionId = shopify.versions[0].id;
      a3erpTypeId = a3erp.id;
      a3erpVersionId = a3erp.versions[0].id;

      // Reject mismatched versionId belonging to another channel type
      await assert.rejects(
        () =>
          channelsService.createChannel(TEST_TENANT, {
            name: 'Invalid Mismatch Channel',
            typeId: shopifyTypeId,
            versionId: a3erpVersionId,
          }),
        /does not belong/
      );
    });

    it('should atomically create Channel + Connection, encrypt credentials, preserve secrets, and probe health', async () => {
      const created = await connectionsService.createConnection(TEST_TENANT, {
        endpoint: 'https://demo-store.myshopify.com',
        type: 'api',
        environmentId: prodEnvId,
        channel: {
          name: 'Shopify Spain Storefront',
          description: 'Primary B2C storefront',
          typeId: shopifyTypeId,
          versionId: shopifyVersionId,
        },
        credentials: {
          auth_type: 'bearer',
          token: 'shpat_secret_live_token_12345',
        },
        config: {
          orders: { readiness: { releaseStatus: 'processing' } },
          stock: { syncMode: 'absolute', safetyBuffer: 2 },
        },
      });

      connectionId = created.id;
      channelId = created.channelId;
      assert.strictEqual(created.credentials.token, '***');
      assert.strictEqual(created.credentials.auth_type, 'bearer');
      assert.strictEqual(created.hasCredentials, true);

      // Verify encrypted ciphertext in DB
      const rawDbConn = await prisma.syncConnection.findUniqueOrThrow({ where: { id: connectionId } });
      assert.ok(rawDbConn.credentials?.startsWith('gcmv1:'));

      // Update passing '***' preserves original secret
      await connectionsService.updateConnection(TEST_TENANT, connectionId, {
        credentials: { auth_type: 'bearer', token: '***' },
        rateLimitMax: 2500,
      });
      const decryptedAfterUpdate = await connectionsService.getDecryptedConnectionForExecution(
        TEST_TENANT,
        connectionId
      );
      assert.strictEqual(decryptedAfterUpdate.decryptedCredentials.token, 'shpat_secret_live_token_12345');

      // Duplicate (channelId, environmentId) rejected with 409
      await assert.rejects(
        () =>
          connectionsService.createConnection(TEST_TENANT, {
            endpoint: 'https://demo-store.myshopify.com',
            type: 'api',
            environmentId: prodEnvId,
            channelId,
          }),
        (err: any) => err.statusCode === 409
      );

      // Metadata definition on created channel
      const meta = await channelsService.createMetadataDefinition(TEST_TENANT, {
        channelId,
        entityType: 'company',
        key: 'sage.customer_code',
        label: 'Sage Customer Code',
        dataType: 'string',
        namespace: 'sage',
      });
      assert.strictEqual(meta.key, 'sage.customer_code');

      // Probe connection health
      const testRes = await connectionsService.testConnection(TEST_TENANT, connectionId);
      assert.ok(typeof testRes.latencyMs === 'number');
      const afterProbe = await connectionsService.getConnectionById(TEST_TENANT, connectionId);
      assert.strictEqual(afterProbe.healthChecksTotal, 1);

      // Inbound API key lifecycle: create (reveal once), mask on read, test, renew
      const createdKey = await apiKeysService.createApiKey(TEST_TENANT, {
        name: 'Inbound Sync Webhook Key',
        environmentId: prodEnvId,
        connectionId,
        permissions: [{ category: 'sync', resource: 'tasks', action: 'execute', granted: true }],
      });
      assert.ok(createdKey.keyValue.startsWith('dama_'));
      const fetchedKey = await apiKeysService.getApiKeyById(TEST_TENANT, createdKey.id);
      assert.strictEqual(fetchedKey.keyValue, createdKey.keyMask);
      assert.ok(fetchedKey.keyValue.includes('***'));

      const keyCheck = await apiKeysService.testApiKey(TEST_TENANT, createdKey.id);
      assert.strictEqual(keyCheck.valid, true);

      const renewed = await apiKeysService.renewApiKey(TEST_TENANT, createdKey.id, {
        regenerateKey: true,
      });
      assert.notStrictEqual(renewed.keyValue, createdKey.keyValue);
    });

    it('should protect system task types, duplicate into custom templates, execute sync tasks, and persist real history', async () => {
      const taskTypes = await taskTypesService.listTaskTypes(TEST_TENANT);
      const systemType = taskTypes.find((tt) => tt.isSystem)!;
      assert.ok(systemType, 'Expected seeded system task type');

      // System task type cannot be modified or deleted
      await assert.rejects(
        () => taskTypesService.updateTaskType(TEST_TENANT, systemType.id, { name: 'Hacked' }),
        /System task types cannot be modified/
      );
      await assert.rejects(
        () => taskTypesService.deleteTaskType(TEST_TENANT, systemType.id),
        /System task types cannot be deleted/
      );

      // Duplicate into editable custom template
      const customType = await taskTypesService.duplicateTaskType(
        TEST_TENANT,
        systemType.id,
        'Custom a3ERP Customer Sync'
      );
      assert.strictEqual(customType.isSystem, false);

      // Bind to real a3ERP connector operation
      const updatedType = await taskTypesService.updateTaskType(TEST_TENANT, customType.id, {
        workflowConfig: {
          mode: 'connector',
          connectorKey: 'a3erp',
          operation: 'ensure_customer',
        },
      });
      assert.strictEqual(updatedType.workflowConfig.connectorKey, 'a3erp');

      // Create and run SyncTask
      const task = await syncTasksService.createTask(TEST_TENANT, {
        name: 'Hourly a3ERP Customer Reconciliation',
        taskTypeId: customType.id,
        executionType: 'cron',
        schedule: '0 * * * *',
        targetChannelId: channelId,
        targetConnectionId: connectionId,
        configuration: {
          nifCif: 'B12345678',
          firstName: 'Empresa',
          lastName: 'Demo SL',
          postalCode: '28001',
        },
      });

      const runResult = await syncTasksService.runTask(TEST_TENANT, task.id, {
        triggerType: 'manual',
      });
      assert.strictEqual(runResult.success, true);
      assert.strictEqual(runResult.execution.status, 'completed');

      // Real execution history persisted
      const history = await syncTasksService.getTaskExecutionHistory(TEST_TENANT, task.id);
      assert.strictEqual(history.executions.length, 1);
      assert.strictEqual(history.executions[0].id, runResult.execution.id);

      // Quick execute creates temporary quick task & executes immediately
      const quickRes = await syncTasksService.quickExecute(TEST_TENANT, {
        taskTypeId: systemType.id,
        configuration: { batchSize: 15 },
      });
      assert.strictEqual(quickRes.success, true);
      assert.strictEqual(quickRes.task.executionType, 'quick');
      assert.strictEqual(quickRes.execution.recordsProcessed, 15);
    });

    it('should enforce SyncOperation DAG dependencies, 409 idempotency, cycle detection, entity counters, and cascade cancel', async () => {
      // 1. Root operation opA (queued)
      const opA = await syncOperationsService.createOperation(TEST_TENANT, {
        operation: 'bulk_create',
        entityType: 'product',
        connectionId,
        entities: [{ entityId: 'prod-1' }, { entityId: 'prod-2' }, { entityId: 'prod-3' }],
      });
      assert.strictEqual(opA.status, 'queued');

      // 2. Active single-operation idempotency guard (same payloadHash -> 409)
      await assert.rejects(
        () =>
          syncOperationsService.createOperation(TEST_TENANT, {
            operation: 'bulk_create',
            entityType: 'product',
            connectionId,
            entities: [{ entityId: 'prod-3' }, { entityId: 'prod-1' }, { entityId: 'prod-2' }],
          }),
        (err: any) => err.statusCode === 409 && err.details?.existingOperationId === opA.id
      );

      // 3. Dependent operation opB starts as blocked
      const opB = await syncOperationsService.createOperation(TEST_TENANT, {
        operation: 'bulk_update',
        entityType: 'stock',
        connectionId,
        entities: [{ entityId: 'prod-1' }],
        dependsOnIds: [opA.id],
      });
      assert.strictEqual(opB.status, 'blocked');

      // 4. Cycle detection rejects opA depending on opB
      await assert.rejects(
        () => syncOperationsService.addDependency(TEST_TENANT, opA.id, opB.id),
        /cycle/
      );

      // 5. Bulk entity updates recompute operation counters
      const updatedA = await syncOperationsService.bulkUpdateEntities(TEST_TENANT, opA.id, [
        { entityId: 'prod-1', status: 'completed', externalId: 'ext-1' },
        { entityId: 'prod-2', status: 'failed', errorMessage: 'Missing SKU' },
        { entityId: 'prod-3', status: 'skipped' },
      ]);
      assert.strictEqual(updatedA.succeededEntities, 1);
      assert.strictEqual(updatedA.failedEntities, 1);
      assert.strictEqual(updatedA.skippedEntities, 1);

      // 6. Completing opA automatically unblocks opB (blocked -> queued)
      await syncOperationsService.transitionStatus(TEST_TENANT, opA.id, 'processing');
      await syncOperationsService.transitionStatus(TEST_TENANT, opA.id, 'completed');
      const opBAfter = await syncOperationsService.getOperationById(TEST_TENANT, opB.id);
      assert.strictEqual(opBAfter.status, 'queued');

      // 7. Failure cascade cancels transitive dependents (opC -> opD -> opE)
      const opC = await syncOperationsService.createOperation(TEST_TENANT, {
        operation: 'create',
        entityType: 'customer',
        connectionId,
        entities: [{ entityId: 'cust-100' }],
      });
      const opD = await syncOperationsService.createOperation(TEST_TENANT, {
        operation: 'create',
        entityType: 'order',
        connectionId,
        entities: [{ entityId: 'ord-200' }],
        dependsOnIds: [opC.id],
      });
      const opE = await syncOperationsService.createOperation(TEST_TENANT, {
        operation: 'create',
        entityType: 'invoice',
        connectionId,
        entities: [{ entityId: 'inv-300' }],
        dependsOnIds: [opD.id],
      });

      assert.strictEqual(opD.status, 'blocked');
      assert.strictEqual(opE.status, 'blocked');

      await syncOperationsService.transitionStatus(TEST_TENANT, opC.id, 'failed', {
        errorMessage: 'ERP customer creation rejected',
      });

      const [opDAfter, opEAfter] = await Promise.all([
        syncOperationsService.getOperationById(TEST_TENANT, opD.id),
        syncOperationsService.getOperationById(TEST_TENANT, opE.id),
      ]);
      assert.strictEqual(opDAfter.status, 'cancelled');
      assert.strictEqual(opEAfter.status, 'cancelled');
      assert.ok(opEAfter.errorMessage?.includes(opC.id));
    });
  });
});
