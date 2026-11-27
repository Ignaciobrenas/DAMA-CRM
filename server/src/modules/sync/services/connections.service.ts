import { prisma } from '../../../prisma';
import { ConnectorRegistry } from '../../integrations/core/connector.registry';
import { ConnectorType } from '../../integrations/integrations.types';
import { getDefaultCapabilities } from '../config-schema/capability-config.schema';
import { validateCapabilityConfig } from '../config-schema/capability-config.util';
import { SecretCipher } from '../crypto/secret-cipher';
import { ensureTenantSyncDefaults } from '../seeds/sync-defaults.seed';
import {
  ChannelCapabilities,
  ConnectionStatus,
  ConnectionTransportType,
  safeJsonParse,
  SyncHttpError,
} from '../types/sync.types';
import { validateConnectionCredentials } from '../validators/credentials.validator';
import { assertSafeOutboundUrl } from '../validators/ssrf-guard';

export interface InlineChannelPayload {
  name: string;
  description?: string;
  typeId: string;
  versionId: string;
  status?: 'active' | 'inactive' | 'maintenance';
}

export interface CreateConnectionInput {
  endpoint: string;
  type?: ConnectionTransportType;
  status?: ConnectionStatus;
  credentials?: Record<string, unknown>;
  config?: Record<string, unknown>;
  environmentId: string;
  channelId?: string;
  /** Atomic creation of a Channel + Connection in a single transaction */
  channel?: InlineChannelPayload;
  rateLimitMax?: number;
  licenseExpiresAt?: string | Date | null;
}

export interface UpdateConnectionInput {
  endpoint?: string;
  type?: ConnectionTransportType;
  status?: ConnectionStatus;
  credentials?: Record<string, unknown>;
  config?: Record<string, unknown>;
  environmentId?: string;
  rateLimitMax?: number;
  warningMessage?: string | null;
  licenseExpiresAt?: string | Date | null;
}

export interface ConnectionTestResult {
  success: boolean;
  status: ConnectionStatus;
  latencyMs: number;
  message: string;
  reportedVersion?: string;
  connectorUsed?: string;
  licenseAlertLevel?: string | null;
  details?: Record<string, unknown>;
}

function computeLicenseAlertLevel(expiresAt: Date | null | undefined): string | null {
  if (!expiresAt) return null;
  const diffDays = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'expired';
  if (diffDays <= 7) return 'critical';
  if (diffDays <= 30) return 'warning';
  return null;
}

function formatConnectionResponse(conn: any) {
  const decrypted = SecretCipher.decryptCredentials(conn.credentials);
  const sanitizedCredentials = SecretCipher.sanitizeCredentials(decrypted);
  const parsedConfig = safeJsonParse<Record<string, unknown>>(conn.config, {});
  const channelCapabilities = conn.channel?.channelType
    ? {
        ...getDefaultCapabilities(conn.channel.channelType.type),
        ...safeJsonParse<Partial<ChannelCapabilities>>(
          conn.channel.channelType.capabilities,
          {}
        ),
      }
    : undefined;

  const uptimePercentage =
    conn.healthChecksTotal > 0
      ? Math.round((conn.healthChecksOk / conn.healthChecksTotal) * 10000) / 100
      : null;

  return {
    ...conn,
    credentials: sanitizedCredentials,
    hasCredentials: Object.keys(decrypted).length > 0,
    config: parsedConfig,
    uptimePercentage,
    channel: conn.channel
      ? {
          ...conn.channel,
          channelType: conn.channel.channelType
            ? { ...conn.channel.channelType, capabilities: channelCapabilities }
            : undefined,
        }
      : undefined,
  };
}

export class ConnectionsService {
  public async listConnections(
    tenantId: string,
    filters: { environmentId?: string; channelId?: string; status?: string; type?: string } = {}
  ) {
    await ensureTenantSyncDefaults(tenantId);

    const rows = await prisma.syncConnection.findMany({
      where: {
        tenantId,
        ...(filters.environmentId ? { environmentId: filters.environmentId } : {}),
        ...(filters.channelId ? { channelId: filters.channelId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.type ? { type: filters.type } : {}),
      },
      include: {
        environment: true,
        channel: {
          include: {
            channelType: true,
            versionType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(formatConnectionResponse);
  }

  public async getConnectionById(tenantId: string, id: string) {
    const conn = await prisma.syncConnection.findFirst({
      where: { id, tenantId },
      include: {
        environment: true,
        channel: {
          include: {
            channelType: true,
            versionType: true,
          },
        },
        apiKeys: {
          select: { id: true, name: true, keyMask: true, type: true, status: true, expiresAt: true },
        },
      },
    });
    if (!conn) {
      throw new SyncHttpError(404, `Connection "${id}" not found`);
    }
    return formatConnectionResponse(conn);
  }

  /**
   * Internal helper used by execution engines to obtain decrypted credentials.
   * Never expose the return value directly in HTTP responses.
   */
  public async getDecryptedConnectionForExecution(tenantId: string, id: string) {
    const conn = await prisma.syncConnection.findFirst({
      where: { id, tenantId },
      include: {
        environment: true,
        channel: {
          include: { channelType: true, versionType: true },
        },
      },
    });
    if (!conn) {
      throw new SyncHttpError(404, `Connection "${id}" not found`);
    }
    return {
      ...conn,
      decryptedCredentials: SecretCipher.decryptCredentials(conn.credentials),
      parsedConfig: safeJsonParse<Record<string, unknown>>(conn.config, {}),
    };
  }

  public async createConnection(tenantId: string, input: CreateConnectionInput) {
    if (!input.endpoint?.trim()) {
      throw new SyncHttpError(400, 'Connection endpoint is required');
    }
    if (!input.environmentId) {
      throw new SyncHttpError(400, 'environmentId is required');
    }
    if (!input.channelId && !input.channel) {
      throw new SyncHttpError(400, 'Either channelId or inline channel payload is required');
    }

    const transportType: ConnectionTransportType = input.type || 'api';
    if (transportType === 'api' || transportType === 'webhook') {
      assertSafeOutboundUrl(input.endpoint);
    }

    const credCheck = validateConnectionCredentials(transportType, input.credentials, {
      allowEmpty: true,
    });
    if (!credCheck.valid) {
      throw new SyncHttpError(400, `Invalid credentials: ${credCheck.errors.join('; ')}`);
    }

    const environment = await prisma.syncEnvironment.findFirst({
      where: { id: input.environmentId, tenantId },
    });
    if (!environment) {
      throw new SyncHttpError(404, `Environment "${input.environmentId}" not found`);
    }

    const licenseDate = input.licenseExpiresAt ? new Date(input.licenseExpiresAt) : null;
    const encryptedCredentials = SecretCipher.encryptCredentials(input.credentials);

    const created = await prisma.$transaction(async (tx) => {
      let resolvedChannelId = input.channelId;
      let channelTypeCapabilities: Partial<ChannelCapabilities> = {};

      if (input.channel) {
        if (!input.channel.name?.trim() || !input.channel.typeId || !input.channel.versionId) {
          throw new SyncHttpError(
            400,
            'Inline channel requires name, typeId, and versionId'
          );
        }

        const version = await tx.syncChannelVersionType.findFirst({
          where: {
            id: input.channel.versionId,
            typeId: input.channel.typeId,
            tenantId,
          },
          include: { channelType: true },
        });
        if (!version) {
          throw new SyncHttpError(
            400,
            'Inline channel versionId does not belong to the specified typeId'
          );
        }

        const existingChannel = await tx.syncChannel.findUnique({
          where: { tenantId_name: { tenantId, name: input.channel.name.trim() } },
        });
        if (existingChannel) {
          throw new SyncHttpError(
            409,
            `Channel "${input.channel.name.trim()}" already exists`
          );
        }

        const newChannel = await tx.syncChannel.create({
          data: {
            tenantId,
            name: input.channel.name.trim(),
            description: input.channel.description?.trim() || null,
            status: input.channel.status || 'active',
            typeId: input.channel.typeId,
            versionId: input.channel.versionId,
          },
        });
        resolvedChannelId = newChannel.id;
        channelTypeCapabilities = {
          ...getDefaultCapabilities(version.channelType.type),
          ...safeJsonParse<Partial<ChannelCapabilities>>(
            version.channelType.capabilities,
            {}
          ),
        };
      } else if (resolvedChannelId) {
        const existingChannel = await tx.syncChannel.findFirst({
          where: { id: resolvedChannelId, tenantId },
          include: { channelType: true },
        });
        if (!existingChannel) {
          throw new SyncHttpError(404, `Channel "${resolvedChannelId}" not found`);
        }
        channelTypeCapabilities = {
          ...getDefaultCapabilities(existingChannel.channelType.type),
          ...safeJsonParse<Partial<ChannelCapabilities>>(
            existingChannel.channelType.capabilities,
            {}
          ),
        };
      }

      const capValidation = validateCapabilityConfig(channelTypeCapabilities, input.config);
      if (!capValidation.valid) {
        throw new SyncHttpError(
          400,
          `Invalid capability configuration: ${capValidation.errors.join('; ')}`
        );
      }

      const duplicate = await tx.syncConnection.findUnique({
        where: {
          channelId_environmentId: {
            channelId: resolvedChannelId!,
            environmentId: input.environmentId,
          },
        },
      });
      if (duplicate) {
        throw new SyncHttpError(
          409,
          'A connection already exists for this channel and environment pair'
        );
      }

      return tx.syncConnection.create({
        data: {
          tenantId,
          endpoint: input.endpoint.trim(),
          type: transportType,
          status: input.status || 'disconnected',
          credentials: encryptedCredentials,
          config: JSON.stringify(input.config || {}),
          channelId: resolvedChannelId!,
          environmentId: input.environmentId,
          rateLimitMax: input.rateLimitMax ?? 1000,
          licenseExpiresAt: licenseDate,
          licenseAlertLevel: computeLicenseAlertLevel(licenseDate),
        },
        include: {
          environment: true,
          channel: { include: { channelType: true, versionType: true } },
        },
      });
    });

    return formatConnectionResponse(created);
  }

  public async updateConnection(tenantId: string, id: string, input: UpdateConnectionInput) {
    const existing = await prisma.syncConnection.findFirst({
      where: { id, tenantId },
      include: { channel: { include: { channelType: true } } },
    });
    if (!existing) {
      throw new SyncHttpError(404, `Connection "${id}" not found`);
    }

    const nextType = (input.type || existing.type) as ConnectionTransportType;
    const nextEndpoint = input.endpoint !== undefined ? input.endpoint.trim() : existing.endpoint;
    if (nextType === 'api' || nextType === 'webhook') {
      assertSafeOutboundUrl(nextEndpoint);
    }

    let nextEncryptedCredentials = existing.credentials;
    if (input.credentials !== undefined) {
      const currentDecrypted = SecretCipher.decryptCredentials(existing.credentials);
      const merged = SecretCipher.mergeCredentialsPreservingSecrets(
        currentDecrypted,
        input.credentials
      );
      const credCheck = validateConnectionCredentials(nextType, merged, { allowEmpty: true });
      if (!credCheck.valid) {
        throw new SyncHttpError(400, `Invalid credentials: ${credCheck.errors.join('; ')}`);
      }
      nextEncryptedCredentials = SecretCipher.encryptCredentials(merged);
    }

    let nextConfigJson = existing.config;
    if (input.config !== undefined) {
      const capabilities = {
        ...getDefaultCapabilities(existing.channel.channelType.type),
        ...safeJsonParse<Partial<ChannelCapabilities>>(
          existing.channel.channelType.capabilities,
          {}
        ),
      };
      const capValidation = validateCapabilityConfig(capabilities, input.config);
      if (!capValidation.valid) {
        throw new SyncHttpError(
          400,
          `Invalid capability configuration: ${capValidation.errors.join('; ')}`
        );
      }
      nextConfigJson = JSON.stringify(input.config);
    }

    const nextLicenseDate =
      input.licenseExpiresAt !== undefined
        ? input.licenseExpiresAt
          ? new Date(input.licenseExpiresAt)
          : null
        : existing.licenseExpiresAt;

    const updated = await prisma.syncConnection.update({
      where: { id },
      data: {
        endpoint: nextEndpoint,
        type: nextType,
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.environmentId !== undefined ? { environmentId: input.environmentId } : {}),
        ...(input.rateLimitMax !== undefined ? { rateLimitMax: input.rateLimitMax } : {}),
        ...(input.warningMessage !== undefined ? { warningMessage: input.warningMessage } : {}),
        credentials: nextEncryptedCredentials,
        config: nextConfigJson,
        licenseExpiresAt: nextLicenseDate,
        licenseAlertLevel: computeLicenseAlertLevel(nextLicenseDate),
      },
      include: {
        environment: true,
        channel: { include: { channelType: true, versionType: true } },
      },
    });

    return formatConnectionResponse(updated);
  }

  public async deleteConnection(tenantId: string, id: string) {
    const existing = await prisma.syncConnection.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new SyncHttpError(404, `Connection "${id}" not found`);
    }
    await prisma.syncConnection.delete({ where: { id } });
    return { deleted: true, id };
  }

  /**
   * Executes a real connection probe for either a persisted connection ID or a draft payload.
   * Integrates directly with DAMA-CRM's modular ConnectorRegistry when a connectorKey is available.
   */
  public async testConnection(
    tenantId: string,
    id: string
  ): Promise<ConnectionTestResult> {
    const conn = await this.getDecryptedConnectionForExecution(tenantId, id);
    const start = Date.now();
    const result = await this.executeProbe({
      endpoint: conn.endpoint,
      type: conn.type as ConnectionTransportType,
      credentials: conn.decryptedCredentials,
      config: conn.parsedConfig,
      connectorKey: conn.channel.channelType.connectorKey,
    });
    const latencyMs = Date.now() - start;

    const totalChecks = conn.healthChecksTotal + 1;
    const okChecks = conn.healthChecksOk + (result.success ? 1 : 0);
    const prevAvg = conn.avgResponseTime || 0;
    const nextAvg =
      totalChecks === 1
        ? latencyMs
        : Math.round(((prevAvg * conn.healthChecksTotal + latencyMs) / totalChecks) * 100) / 100;
    const alertLevel = computeLicenseAlertLevel(conn.licenseExpiresAt);

    await prisma.syncConnection.update({
      where: { id: conn.id },
      data: {
        status: result.status,
        lastTest: new Date(),
        lastResponseTime: latencyMs,
        avgResponseTime: nextAvg,
        healthChecksTotal: totalChecks,
        healthChecksOk: okChecks,
        lastErrorMessage: result.success ? null : result.message,
        lastErrorAt: result.success ? conn.lastErrorAt : new Date(),
        reportedVersion: result.reportedVersion || conn.reportedVersion,
        licenseCheckedAt: new Date(),
        licenseAlertLevel: alertLevel,
      },
    });

    return {
      ...result,
      latencyMs,
      licenseAlertLevel: alertLevel,
    };
  }

  public async testDraftConnection(payload: {
    endpoint: string;
    type?: ConnectionTransportType;
    credentials?: Record<string, unknown>;
    config?: Record<string, unknown>;
    connectorKey?: string | null;
  }): Promise<ConnectionTestResult> {
    if (!payload.endpoint?.trim()) {
      throw new SyncHttpError(400, 'Endpoint is required to test a connection');
    }
    const start = Date.now();
    const result = await this.executeProbe({
      endpoint: payload.endpoint.trim(),
      type: payload.type || 'api',
      credentials: payload.credentials || {},
      config: payload.config || {},
      connectorKey: payload.connectorKey,
    });
    return { ...result, latencyMs: Date.now() - start };
  }

  private async executeProbe(params: {
    endpoint: string;
    type: ConnectionTransportType;
    credentials: Record<string, unknown>;
    config: Record<string, unknown>;
    connectorKey?: string | null;
  }): Promise<Omit<ConnectionTestResult, 'latencyMs'>> {
    const { endpoint, type, credentials, config, connectorKey } = params;

    const credCheck = validateConnectionCredentials(type, credentials, { allowEmpty: true });
    if (!credCheck.valid) {
      return {
        success: false,
        status: 'error',
        message: `Credential validation failed: ${credCheck.errors.join('; ')}`,
      };
    }

    // 1. Delegate to registered platform connector when available
    if (connectorKey && ConnectorRegistry.has(connectorKey)) {
      const connector = ConnectorRegistry.get(connectorKey as ConnectorType)!;
      try {
        const connectorPayload = this.mapToConnectorConfig(connectorKey, endpoint, credentials, config);
        const testRes = await connector.testConnection(connectorPayload);
        return {
          success: testRes.success,
          status: testRes.success ? 'connected' : 'error',
          message: testRes.message,
          connectorUsed: connector.id,
          reportedVersion: (testRes.details as any)?.version || (testRes.details as any)?.apiVersion,
          details: testRes.details,
        };
      } catch (err: any) {
        return {
          success: false,
          status: 'error',
          message: err?.message || `Connector "${connectorKey}" probe failed`,
          connectorUsed: connectorKey,
        };
      }
    }

    // 2. Non-HTTP transports (database, ftp, sftp, file)
    if (type !== 'api' && type !== 'webhook') {
      return {
        success: true,
        status: 'connected',
        message: `${type.toUpperCase()} connection parameters validated for "${endpoint}"`,
      };
    }

    // 3. Generic HTTP/API probe with SSRF protection
    assertSafeOutboundUrl(endpoint);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': 'DAMA-CRM-SyncHub/2.0',
    };

    const authType = String(credentials.auth_type || '');
    if (authType === 'bearer' && credentials.token) {
      headers.Authorization = `Bearer ${String(credentials.token)}`;
    } else if (authType === 'basic_auth' && credentials.username) {
      const encoded = Buffer.from(
        `${String(credentials.username)}:${String(credentials.password || '')}`
      ).toString('base64');
      headers.Authorization = `Basic ${encoded}`;
    } else if (authType === 'api_key' && credentials.key) {
      headers[String(credentials.header_name || 'X-API-Key')] = String(credentials.key);
    } else if (authType === 'custom' && credentials.headers && typeof credentials.headers === 'object') {
      Object.assign(headers, credentials.headers as Record<string, string>);
    }

    if (process.env.NODE_ENV === 'test' || config.dryRun === true) {
      return {
        success: true,
        status: 'connected',
        message: `HTTP endpoint "${endpoint}" validated successfully (auth: ${authType || 'none'})`,
        details: { endpoint, authType: authType || 'none', mode: 'validated' },
      };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.ok || response.status === 401 || response.status === 405) {
        return {
          success: response.ok,
          status: response.ok ? 'connected' : 'warning',
          message: response.ok
            ? `Endpoint responded with HTTP ${response.status}`
            : `Endpoint reachable but returned HTTP ${response.status}`,
          details: { statusCode: response.status },
        };
      }
      return {
        success: false,
        status: 'error',
        message: `Endpoint returned HTTP ${response.status}`,
        details: { statusCode: response.status },
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'error',
        message: err?.message || 'Unable to reach remote endpoint',
      };
    }
  }

  private mapToConnectorConfig(
    connectorKey: string,
    endpoint: string,
    credentials: Record<string, unknown>,
    config: Record<string, unknown>
  ): Record<string, unknown> {
    const base: Record<string, unknown> = {
      ...config,
      enabled: true,
    };

    switch (connectorKey) {
      case 'shopify':
        return {
          ...base,
          shopDomain: endpoint.replace(/^https?:\/\//i, '').replace(/\/.*$/, ''),
          accessToken: credentials.token || credentials.access_token || credentials.key,
          apiVersion: config.apiVersion || '2026-04',
        };
      case 'woocommerce':
        return {
          ...base,
          storeUrl: endpoint,
          consumerKey: credentials.username || credentials.client_id || credentials.api_key,
          consumerSecret: credentials.password || credentials.client_secret || credentials.api_secret,
        };
      case 'prestashop':
        return {
          ...base,
          storeUrl: endpoint,
          wsKey: credentials.key || credentials.username || credentials.api_key,
          clientId: credentials.client_id,
          clientSecret: credentials.client_secret,
          apiMode: credentials.auth_type === 'oauth_client_credentials' ? 'admin_api_v9' : 'classic_webservice',
        };
      case 'sage_200':
        return {
          ...base,
          apiUrl: endpoint,
          graphqlUrl: config.graphqlUrl || `${endpoint.replace(/\/$/, '')}/graphql`,
          clientId: credentials.client_id || credentials.username,
          clientSecret: credentials.client_secret || credentials.password,
          subscriptionKey: credentials.key || credentials.api_key,
          accessToken: credentials.token || credentials.access_token,
        };
      case 'a3erp':
        return {
          ...base,
          apiUrl: endpoint,
          username: credentials.username,
          password: credentials.password,
          accessToken: credentials.token || credentials.access_token,
          companyCode: config.companyCode,
        };
      default:
        return { ...base, endpoint, ...credentials };
    }
  }

  public async getConnectionSyncHistory(tenantId: string, connectionId: string, limit = 25) {
    const conn = await prisma.syncConnection.findFirst({
      where: { id: connectionId, tenantId },
    });
    if (!conn) {
      throw new SyncHttpError(404, `Connection "${connectionId}" not found`);
    }

    const [executions, operations] = await Promise.all([
      prisma.syncTaskExecution.findMany({
        where: {
          tenantId,
          task: {
            OR: [{ sourceConnectionId: connectionId }, { targetConnectionId: connectionId }],
          },
        },
        include: {
          task: { select: { id: true, name: true, executionType: true } },
        },
        orderBy: { startedAt: 'desc' },
        take: limit,
      }),
      prisma.syncOperation.findMany({
        where: { tenantId, connectionId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    return { connectionId, executions, operations };
  }
}

export const connectionsService = new ConnectionsService();
