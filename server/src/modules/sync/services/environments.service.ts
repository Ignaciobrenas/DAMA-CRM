import { prisma } from '../../../prisma';
import { ensureTenantSyncDefaults } from '../seeds/sync-defaults.seed';
import {
  EnvironmentHealth,
  EnvironmentStatus,
  SyncHttpError,
} from '../types/sync.types';
import { assertSafeOutboundUrl } from '../validators/ssrf-guard';

export interface CreateEnvironmentInput {
  name: string;
  description?: string;
  status?: EnvironmentStatus;
  url?: string;
  version?: string;
  health?: EnvironmentHealth;
  uptime?: string;
}

export interface UpdateEnvironmentInput extends Partial<CreateEnvironmentInput> {
  lastDeploy?: string | Date | null;
}

export class EnvironmentsService {
  public async listEnvironments(tenantId: string) {
    await ensureTenantSyncDefaults(tenantId);

    const environments = await prisma.syncEnvironment.findMany({
      where: { tenantId },
      include: {
        connections: {
          include: {
            channel: {
              include: {
                channelType: true,
                versionType: true,
              },
            },
          },
        },
        _count: {
          select: { connections: true, apiKeys: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return environments.map((env) => ({
      ...env,
      connectionCount: env._count.connections,
      apiKeyCount: env._count.apiKeys,
      connectedCount: env.connections.filter((c) => c.status === 'connected').length,
    }));
  }

  public async getEnvironmentById(tenantId: string, id: string) {
    const env = await prisma.syncEnvironment.findFirst({
      where: { id, tenantId },
      include: {
        connections: {
          include: {
            channel: {
              include: { channelType: true, versionType: true },
            },
          },
        },
        apiKeys: {
          select: {
            id: true,
            name: true,
            keyMask: true,
            type: true,
            status: true,
            expiresAt: true,
          },
        },
      },
    });

    if (!env) {
      throw new SyncHttpError(404, `Environment "${id}" not found`);
    }
    return env;
  }

  public async createEnvironment(tenantId: string, input: CreateEnvironmentInput) {
    if (!input.name?.trim()) {
      throw new SyncHttpError(400, 'Environment name is required');
    }
    if (input.url) {
      assertSafeOutboundUrl(input.url);
    }

    const existing = await prisma.syncEnvironment.findUnique({
      where: { tenantId_name: { tenantId, name: input.name.trim() } },
    });
    if (existing) {
      throw new SyncHttpError(409, `Environment "${input.name.trim()}" already exists`);
    }

    return prisma.syncEnvironment.create({
      data: {
        tenantId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        status: input.status || 'active',
        url: input.url?.trim() || null,
        version: input.version?.trim() || null,
        health: input.health || 'healthy',
        uptime: input.uptime || '100%',
      },
    });
  }

  public async updateEnvironment(tenantId: string, id: string, input: UpdateEnvironmentInput) {
    const existing = await prisma.syncEnvironment.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new SyncHttpError(404, `Environment "${id}" not found`);
    }
    if (input.url) {
      assertSafeOutboundUrl(input.url);
    }

    return prisma.syncEnvironment.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.url !== undefined ? { url: input.url || null } : {}),
        ...(input.version !== undefined ? { version: input.version || null } : {}),
        ...(input.health !== undefined ? { health: input.health } : {}),
        ...(input.uptime !== undefined ? { uptime: input.uptime } : {}),
        ...(input.lastDeploy !== undefined
          ? { lastDeploy: input.lastDeploy ? new Date(input.lastDeploy) : null }
          : {}),
      },
    });
  }

  public async deleteEnvironment(tenantId: string, id: string) {
    const existing = await prisma.syncEnvironment.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { connections: true } } },
    });
    if (!existing) {
      throw new SyncHttpError(404, `Environment "${id}" not found`);
    }
    if (existing._count.connections > 0) {
      throw new SyncHttpError(
        400,
        `Cannot delete environment "${existing.name}" while ${existing._count.connections} connection(s) are assigned to it`
      );
    }

    await prisma.syncEnvironment.delete({ where: { id } });
    return { deleted: true, id };
  }

  public async checkEnvironmentHealth(tenantId: string, id: string) {
    const env = await this.getEnvironmentById(tenantId, id);
    const total = env.connections.length;
    const connected = env.connections.filter((c) => c.status === 'connected').length;
    const errored = env.connections.filter((c) => c.status === 'error').length;

    let health: EnvironmentHealth = 'healthy';
    if (env.status === 'maintenance') {
      health = 'maintenance';
    } else if (total > 0 && errored === total) {
      health = 'unhealthy';
    } else if (errored > 0) {
      health = 'degraded';
    }

    const uptimePct =
      total === 0 ? '100%' : `${Math.round(((total - errored) / total) * 10000) / 100}%`;

    const updated = await prisma.syncEnvironment.update({
      where: { id: env.id },
      data: {
        health,
        uptime: uptimePct,
      },
    });

    return {
      environment: updated,
      summary: { totalConnections: total, connected, errored, health, uptime: uptimePct },
    };
  }
}

export const environmentsService = new EnvironmentsService();
