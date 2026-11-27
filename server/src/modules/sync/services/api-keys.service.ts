import { prisma } from '../../../prisma';
import { SecretCipher } from '../crypto/secret-cipher';
import {
  ApiKeyPermissionRule,
  ApiKeyStatus,
  ApiKeyType,
  safeJsonParse,
  SyncHttpError,
} from '../types/sync.types';

export interface CreateApiKeyInput {
  name: string;
  type?: ApiKeyType;
  permissions?: ApiKeyPermissionRule[];
  expiresAt?: string | Date | null;
  connectionId?: string | null;
  environmentId?: string | null;
  customKey?: string;
}

export interface UpdateApiKeyInput {
  name?: string;
  type?: ApiKeyType;
  permissions?: ApiKeyPermissionRule[];
  status?: ApiKeyStatus;
  expiresAt?: string | Date | null;
  connectionId?: string | null;
  environmentId?: string | null;
}

function resolveKeyStatus(currentStatus: string, expiresAt: Date | null): ApiKeyStatus {
  if (currentStatus === 'inactive') return 'inactive';
  if (!expiresAt) return 'active';
  const diffDays = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'expired';
  if (diffDays <= 14) return 'expiring';
  return 'active';
}

function formatApiKey(row: any, plainKey?: string) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    keyValue: plainKey ?? row.keyMask,
    keyMask: row.keyMask,
    type: row.type,
    permissions: safeJsonParse<ApiKeyPermissionRule[]>(row.permissions, []),
    status: resolveKeyStatus(row.status, row.expiresAt),
    expiresAt: row.expiresAt,
    lastUsedAt: row.lastUsedAt,
    connectionId: row.connectionId,
    environmentId: row.environmentId,
    connection: row.connection,
    environment: row.environment,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class ApiKeysService {
  public async listApiKeys(tenantId: string) {
    const keys = await prisma.syncApiKey.findMany({
      where: { tenantId },
      include: {
        environment: { select: { id: true, name: true } },
        connection: {
          select: {
            id: true,
            endpoint: true,
            channel: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return keys.map((k) => formatApiKey(k));
  }

  public async getApiKeyById(tenantId: string, id: string) {
    const key = await prisma.syncApiKey.findFirst({
      where: { id, tenantId },
      include: {
        environment: { select: { id: true, name: true } },
        connection: { select: { id: true, endpoint: true } },
      },
    });
    if (!key) {
      throw new SyncHttpError(404, `API key "${id}" not found`);
    }
    return formatApiKey(key);
  }

  public async createApiKey(tenantId: string, input: CreateApiKeyInput) {
    if (!input.name?.trim()) {
      throw new SyncHttpError(400, 'API key name is required');
    }

    const generated = input.customKey?.trim()
      ? {
          plainKey: input.customKey.trim(),
          maskedKey: SecretCipher.maskKeyValue(input.customKey.trim()),
        }
      : SecretCipher.generateApiKey('dama');

    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    const encryptedValue = SecretCipher.encryptString(generated.plainKey);

    const created = await prisma.syncApiKey.create({
      data: {
        tenantId,
        name: input.name.trim(),
        keyValue: encryptedValue,
        keyMask: generated.maskedKey,
        type: input.type || 'api_key',
        permissions: JSON.stringify(input.permissions || []),
        status: resolveKeyStatus('active', expiresAt),
        expiresAt,
        connectionId: input.connectionId || null,
        environmentId: input.environmentId || null,
      },
      include: {
        environment: { select: { id: true, name: true } },
        connection: { select: { id: true, endpoint: true } },
      },
    });

    // Return plaintext key exactly once upon creation
    return formatApiKey(created, generated.plainKey);
  }

  public async updateApiKey(tenantId: string, id: string, input: UpdateApiKeyInput) {
    const existing = await prisma.syncApiKey.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new SyncHttpError(404, `API key "${id}" not found`);
    }

    const nextExpires =
      input.expiresAt !== undefined
        ? input.expiresAt
          ? new Date(input.expiresAt)
          : null
        : existing.expiresAt;

    const updated = await prisma.syncApiKey.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.permissions !== undefined
          ? { permissions: JSON.stringify(input.permissions) }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.connectionId !== undefined ? { connectionId: input.connectionId } : {}),
        ...(input.environmentId !== undefined ? { environmentId: input.environmentId } : {}),
        expiresAt: nextExpires,
      },
      include: {
        environment: { select: { id: true, name: true } },
        connection: { select: { id: true, endpoint: true } },
      },
    });

    return formatApiKey(updated);
  }

  public async renewApiKey(
    tenantId: string,
    id: string,
    options: { regenerateKey?: boolean; expiresAt?: string | Date | null } = {}
  ) {
    const existing = await prisma.syncApiKey.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new SyncHttpError(404, `API key "${id}" not found`);
    }

    const defaultExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const nextExpires = options.expiresAt ? new Date(options.expiresAt) : defaultExpiry;

    let plainKey: string | undefined;
    let encryptedKey = existing.keyValue;
    let keyMask = existing.keyMask;

    if (options.regenerateKey) {
      const generated = SecretCipher.generateApiKey('dama');
      plainKey = generated.plainKey;
      encryptedKey = SecretCipher.encryptString(generated.plainKey);
      keyMask = generated.maskedKey;
    }

    const updated = await prisma.syncApiKey.update({
      where: { id },
      data: {
        keyValue: encryptedKey,
        keyMask,
        expiresAt: nextExpires,
        status: resolveKeyStatus('active', nextExpires),
      },
    });

    return formatApiKey(updated, plainKey);
  }

  public async testApiKey(tenantId: string, id: string) {
    const existing = await prisma.syncApiKey.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new SyncHttpError(404, `API key "${id}" not found`);
    }
    const status = resolveKeyStatus(existing.status, existing.expiresAt);
    const valid = status === 'active' || status === 'expiring';

    if (valid) {
      await prisma.syncApiKey.update({
        where: { id },
        data: { lastUsedAt: new Date() },
      });
    }

    return {
      valid,
      status,
      keyMask: existing.keyMask,
      expiresAt: existing.expiresAt,
      message: valid
        ? `API key "${existing.name}" is active and valid`
        : `API key "${existing.name}" is ${status}`,
    };
  }

  public async deleteApiKey(tenantId: string, id: string) {
    const existing = await prisma.syncApiKey.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new SyncHttpError(404, `API key "${id}" not found`);
    }
    await prisma.syncApiKey.delete({ where: { id } });
    return { deleted: true, id };
  }
}

export const apiKeysService = new ApiKeysService();
