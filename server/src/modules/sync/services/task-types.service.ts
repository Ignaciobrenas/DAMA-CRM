import { prisma } from '../../../prisma';
import { getRequiredPermissions } from '../constants/entity-permissions';
import { ensureTenantSyncDefaults } from '../seeds/sync-defaults.seed';
import {
  safeJsonParse,
  SyncHttpError,
  TaskDirection,
  TaskOperationType,
  TaskParameterType,
  TaskWorkflowConfig,
} from '../types/sync.types';
import { assertSafeOutboundUrl } from '../validators/ssrf-guard';

export interface TaskTypeParameterInput {
  name: string;
  key: string;
  type?: TaskParameterType;
  description?: string | null;
  required?: boolean;
  defaultValue?: unknown;
  options?: Array<{ value: string; label: string }>;
  validation?: Record<string, unknown>;
  order?: number;
}

export interface CreateTaskCategoryInput {
  key: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  order?: number;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreateTaskTypeInput {
  name: string;
  description?: string;
  categoryId: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  isSystem?: boolean;
  workflowConfig?: TaskWorkflowConfig;
  supportedChannelTypeIds?: string[];
  supportedChannelVersionIds?: string[];
  dataEntityType?: string;
  operationType?: TaskOperationType;
  direction?: TaskDirection;
  requiresFile?: boolean;
  scheduleConstraints?: Record<string, unknown>;
  executionConfig?: Record<string, unknown>;
  monitoringConfig?: Record<string, unknown>;
  documentation?: Record<string, unknown>;
  version?: string;
  createdById?: string;
  parameters?: TaskTypeParameterInput[];
}

function formatTaskType(row: any) {
  return {
    ...row,
    workflowConfig: safeJsonParse<TaskWorkflowConfig>(row.workflowConfig, { mode: 'connector' }),
    supportedChannelTypeIds: safeJsonParse<string[]>(row.supportedChannelTypeIds, []),
    supportedChannelVersionIds: safeJsonParse<string[]>(row.supportedChannelVersionIds, []),
    scheduleConstraints: safeJsonParse<Record<string, unknown>>(row.scheduleConstraints, {}),
    executionConfig: safeJsonParse<Record<string, unknown>>(row.executionConfig, {}),
    monitoringConfig: safeJsonParse<Record<string, unknown>>(row.monitoringConfig, {}),
    documentation: safeJsonParse<Record<string, unknown>>(row.documentation, {}),
    requiredPermissions: getRequiredPermissions(row.dataEntityType, row.direction),
    parameters: (row.parameters || [])
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      .map((p: any) => ({
        ...p,
        defaultValue: p.defaultValue !== null && p.defaultValue !== undefined
          ? safeJsonParse<unknown>(p.defaultValue, p.defaultValue)
          : undefined,
        options: safeJsonParse<Array<{ value: string; label: string }>>(p.options, []),
        validation: safeJsonParse<Record<string, unknown>>(p.validation, {}),
      })),
  };
}

export class TaskTypesService {
  // ---------------------------------------------------------------------------
  // Task Type Categories
  // ---------------------------------------------------------------------------

  public async listCategories(tenantId: string) {
    await ensureTenantSyncDefaults(tenantId);
    const rows = await prisma.syncTaskTypeCategory.findMany({
      where: { tenantId },
      include: { _count: { select: { taskTypes: true } } },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
    return rows.map((row) => ({
      ...row,
      metadata: safeJsonParse<Record<string, unknown>>(row.metadata, {}),
      taskTypeCount: row._count.taskTypes,
    }));
  }

  public async createCategory(tenantId: string, input: CreateTaskCategoryInput) {
    if (!input.key?.trim() || !input.name?.trim()) {
      throw new SyncHttpError(400, 'Category key and name are required');
    }
    const normalizedKey = input.key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const existing = await prisma.syncTaskTypeCategory.findUnique({
      where: { tenantId_key: { tenantId, key: normalizedKey } },
    });
    if (existing) {
      throw new SyncHttpError(409, `Task category with key "${normalizedKey}" already exists`);
    }

    const created = await prisma.syncTaskTypeCategory.create({
      data: {
        tenantId,
        key: normalizedKey,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        icon: input.icon || 'sync',
        color: input.color || '#2563eb',
        order: input.order ?? 0,
        isActive: input.isActive ?? true,
        metadata: JSON.stringify(input.metadata || {}),
      },
    });
    return { ...created, metadata: input.metadata || {} };
  }

  public async updateCategory(
    tenantId: string,
    id: string,
    input: Partial<CreateTaskCategoryInput>
  ) {
    const existing = await prisma.syncTaskTypeCategory.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new SyncHttpError(404, `Task category "${id}" not found`);
    }

    const updated = await prisma.syncTaskTypeCategory.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.icon !== undefined ? { icon: input.icon } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.metadata !== undefined ? { metadata: JSON.stringify(input.metadata) } : {}),
      },
    });
    return { ...updated, metadata: safeJsonParse<Record<string, unknown>>(updated.metadata, {}) };
  }

  public async deleteCategory(tenantId: string, id: string) {
    const existing = await prisma.syncTaskTypeCategory.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { taskTypes: true } } },
    });
    if (!existing) {
      throw new SyncHttpError(404, `Task category "${id}" not found`);
    }
    if (existing._count.taskTypes > 0) {
      throw new SyncHttpError(
        400,
        `Cannot delete category "${existing.name}" because ${existing._count.taskTypes} task type(s) belong to it`
      );
    }
    await prisma.syncTaskTypeCategory.delete({ where: { id } });
    return { deleted: true, id };
  }

  // ---------------------------------------------------------------------------
  // Task Types
  // ---------------------------------------------------------------------------

  public async listTaskTypes(
    tenantId: string,
    filters: {
      categoryId?: string;
      categoryKey?: string;
      dataEntityType?: string;
      operationType?: string;
      isActive?: boolean;
      search?: string;
    } = {}
  ) {
    await ensureTenantSyncDefaults(tenantId);

    const rows = await prisma.syncTaskType.findMany({
      where: {
        tenantId,
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(filters.categoryKey ? { category: { key: filters.categoryKey } } : {}),
        ...(filters.dataEntityType ? { dataEntityType: filters.dataEntityType } : {}),
        ...(filters.operationType ? { operationType: filters.operationType } : {}),
        ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
      },
      include: {
        category: true,
        parameters: { orderBy: { order: 'asc' } },
        _count: { select: { tasks: true } },
      },
      orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
    });

    let results = rows.map((row) => ({
      ...formatTaskType(row),
      taskCount: row._count.tasks,
    }));

    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      results = results.filter(
        (tt) =>
          tt.name.toLowerCase().includes(q) ||
          (tt.description || '').toLowerCase().includes(q) ||
          tt.dataEntityType.toLowerCase().includes(q)
      );
    }

    return results;
  }

  public async getTaskTypeById(tenantId: string, id: string) {
    const row = await prisma.syncTaskType.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        parameters: { orderBy: { order: 'asc' } },
        _count: { select: { tasks: true } },
      },
    });
    if (!row) {
      throw new SyncHttpError(404, `Task type "${id}" not found`);
    }
    return { ...formatTaskType(row), taskCount: row._count.tasks };
  }

  private async validateTaskTypeRelations(
    tenantId: string,
    input: Partial<CreateTaskTypeInput>
  ): Promise<void> {
    if (input.categoryId) {
      const cat = await prisma.syncTaskTypeCategory.findFirst({
        where: { id: input.categoryId, tenantId },
      });
      if (!cat) {
        throw new SyncHttpError(400, `Task category "${input.categoryId}" does not exist`);
      }
    }

    if (input.workflowConfig?.mode === 'webhook' && input.workflowConfig.webhookUrl) {
      assertSafeOutboundUrl(input.workflowConfig.webhookUrl);
    }

    if (input.supportedChannelTypeIds && input.supportedChannelTypeIds.length > 0) {
      const found = await prisma.syncChannelType.findMany({
        where: { id: { in: input.supportedChannelTypeIds }, tenantId },
        select: { id: true },
      });
      const foundSet = new Set(found.map((c) => c.id));
      const missing = input.supportedChannelTypeIds.filter((id) => !foundSet.has(id));
      if (missing.length > 0) {
        throw new SyncHttpError(400, `Unknown channel type ID(s): ${missing.join(', ')}`);
      }
    }

    if (input.supportedChannelVersionIds && input.supportedChannelVersionIds.length > 0) {
      const found = await prisma.syncChannelVersionType.findMany({
        where: { id: { in: input.supportedChannelVersionIds }, tenantId },
        select: { id: true },
      });
      const foundSet = new Set(found.map((v) => v.id));
      const missing = input.supportedChannelVersionIds.filter((id) => !foundSet.has(id));
      if (missing.length > 0) {
        throw new SyncHttpError(400, `Unknown channel version ID(s): ${missing.join(', ')}`);
      }
    }
  }

  public async createTaskType(tenantId: string, input: CreateTaskTypeInput) {
    if (!input.name?.trim() || !input.categoryId) {
      throw new SyncHttpError(400, 'Task type name and categoryId are required');
    }
    await this.validateTaskTypeRelations(tenantId, input);

    const existing = await prisma.syncTaskType.findUnique({
      where: { tenantId_name: { tenantId, name: input.name.trim() } },
    });
    if (existing) {
      throw new SyncHttpError(409, `Task type "${input.name.trim()}" already exists`);
    }

    const created = await prisma.$transaction(async (tx) => {
      const taskType = await tx.syncTaskType.create({
        data: {
          tenantId,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          categoryId: input.categoryId,
          icon: input.icon || 'refresh-cw',
          color: input.color || '#2563eb',
          isActive: input.isActive ?? true,
          isSystem: Boolean(input.isSystem),
          workflowConfig: JSON.stringify(input.workflowConfig || { mode: 'connector' }),
          supportedChannelTypeIds: JSON.stringify(input.supportedChannelTypeIds || []),
          supportedChannelVersionIds: JSON.stringify(input.supportedChannelVersionIds || []),
          dataEntityType: input.dataEntityType || 'products',
          operationType: input.operationType || 'incremental',
          direction: input.direction || 'bidirectional',
          requiresFile: Boolean(input.requiresFile),
          scheduleConstraints: JSON.stringify(input.scheduleConstraints || {}),
          executionConfig: JSON.stringify(
            input.executionConfig || {
              timeoutMinutes: 15,
              retryAttempts: 3,
              retryDelayMinutes: 2,
              concurrentExecutions: 1,
              priority: 'normal',
            }
          ),
          monitoringConfig: JSON.stringify(
            input.monitoringConfig || {
              successThreshold: 95,
              errorThreshold: 5,
              enableAlerts: true,
            }
          ),
          documentation: JSON.stringify(input.documentation || {}),
          version: input.version || '1.0.0',
          createdById: input.createdById || null,
        },
      });

      if (input.parameters && input.parameters.length > 0) {
        for (let idx = 0; idx < input.parameters.length; idx++) {
          const p = input.parameters[idx];
          if (!p.key?.trim() || !p.name?.trim()) continue;
          await tx.syncTaskTypeParameter.create({
            data: {
              taskTypeId: taskType.id,
              name: p.name.trim(),
              key: p.key.trim(),
              type: p.type || 'string',
              description: p.description ?? null,
              required: Boolean(p.required),
              defaultValue:
                p.defaultValue !== undefined ? JSON.stringify(p.defaultValue) : null,
              options: JSON.stringify(p.options || []),
              validation: JSON.stringify(p.validation || {}),
              order: p.order ?? idx + 1,
            },
          });
        }
      }

      return tx.syncTaskType.findUniqueOrThrow({
        where: { id: taskType.id },
        include: { category: true, parameters: { orderBy: { order: 'asc' } } },
      });
    });

    return formatTaskType(created);
  }

  public async updateTaskType(
    tenantId: string,
    id: string,
    input: Partial<CreateTaskTypeInput>
  ) {
    const existing = await prisma.syncTaskType.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new SyncHttpError(404, `Task type "${id}" not found`);
    }
    if (existing.isSystem) {
      throw new SyncHttpError(
        400,
        'System task types cannot be modified directly. Duplicate the template to customize it'
      );
    }

    await this.validateTaskTypeRelations(tenantId, input);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.syncTaskType.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
          ...(input.icon !== undefined ? { icon: input.icon } : {}),
          ...(input.color !== undefined ? { color: input.color } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          ...(input.workflowConfig !== undefined
            ? { workflowConfig: JSON.stringify(input.workflowConfig) }
            : {}),
          ...(input.supportedChannelTypeIds !== undefined
            ? { supportedChannelTypeIds: JSON.stringify(input.supportedChannelTypeIds) }
            : {}),
          ...(input.supportedChannelVersionIds !== undefined
            ? { supportedChannelVersionIds: JSON.stringify(input.supportedChannelVersionIds) }
            : {}),
          ...(input.dataEntityType !== undefined ? { dataEntityType: input.dataEntityType } : {}),
          ...(input.operationType !== undefined ? { operationType: input.operationType } : {}),
          ...(input.direction !== undefined ? { direction: input.direction } : {}),
          ...(input.requiresFile !== undefined ? { requiresFile: input.requiresFile } : {}),
          ...(input.scheduleConstraints !== undefined
            ? { scheduleConstraints: JSON.stringify(input.scheduleConstraints) }
            : {}),
          ...(input.executionConfig !== undefined
            ? { executionConfig: JSON.stringify(input.executionConfig) }
            : {}),
          ...(input.monitoringConfig !== undefined
            ? { monitoringConfig: JSON.stringify(input.monitoringConfig) }
            : {}),
          ...(input.documentation !== undefined
            ? { documentation: JSON.stringify(input.documentation) }
            : {}),
          ...(input.version !== undefined ? { version: input.version } : {}),
        },
      });

      if (input.parameters !== undefined) {
        await tx.syncTaskTypeParameter.deleteMany({ where: { taskTypeId: id } });
        for (let idx = 0; idx < input.parameters.length; idx++) {
          const p = input.parameters[idx];
          if (!p.key?.trim() || !p.name?.trim()) continue;
          await tx.syncTaskTypeParameter.create({
            data: {
              taskTypeId: id,
              name: p.name.trim(),
              key: p.key.trim(),
              type: p.type || 'string',
              description: p.description ?? null,
              required: Boolean(p.required),
              defaultValue:
                p.defaultValue !== undefined ? JSON.stringify(p.defaultValue) : null,
              options: JSON.stringify(p.options || []),
              validation: JSON.stringify(p.validation || {}),
              order: p.order ?? idx + 1,
            },
          });
        }
      }

      return tx.syncTaskType.findUniqueOrThrow({
        where: { id },
        include: { category: true, parameters: { orderBy: { order: 'asc' } } },
      });
    });

    return formatTaskType(updated);
  }

  public async duplicateTaskType(tenantId: string, id: string, customName?: string) {
    const source = await this.getTaskTypeById(tenantId, id);
    const baseName = customName?.trim() || `${source.name} (Copy)`;
    let candidateName = baseName;
    let suffix = 2;

    while (
      await prisma.syncTaskType.findUnique({
        where: { tenantId_name: { tenantId, name: candidateName } },
      })
    ) {
      candidateName = `${baseName} ${suffix++}`;
    }

    return this.createTaskType(tenantId, {
      name: candidateName,
      description: source.description || undefined,
      categoryId: source.categoryId,
      icon: source.icon,
      color: source.color,
      isActive: true,
      isSystem: false,
      workflowConfig: source.workflowConfig,
      supportedChannelTypeIds: source.supportedChannelTypeIds,
      supportedChannelVersionIds: source.supportedChannelVersionIds,
      dataEntityType: source.dataEntityType,
      operationType: source.operationType as TaskOperationType,
      direction: source.direction as TaskDirection,
      requiresFile: source.requiresFile,
      scheduleConstraints: source.scheduleConstraints,
      executionConfig: source.executionConfig,
      monitoringConfig: source.monitoringConfig,
      documentation: source.documentation,
      version: source.version,
      parameters: source.parameters.map((p: any) => ({
        name: p.name,
        key: p.key,
        type: p.type,
        description: p.description,
        required: p.required,
        defaultValue: p.defaultValue,
        options: p.options,
        validation: p.validation,
        order: p.order,
      })),
    });
  }

  public async toggleTaskType(tenantId: string, id: string, isActive?: boolean) {
    const existing = await prisma.syncTaskType.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new SyncHttpError(404, `Task type "${id}" not found`);
    }
    const updated = await prisma.syncTaskType.update({
      where: { id },
      data: { isActive: isActive !== undefined ? isActive : !existing.isActive },
      include: { category: true, parameters: { orderBy: { order: 'asc' } } },
    });
    return formatTaskType(updated);
  }

  public async deleteTaskType(tenantId: string, id: string) {
    const existing = await prisma.syncTaskType.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { tasks: true } } },
    });
    if (!existing) {
      throw new SyncHttpError(404, `Task type "${id}" not found`);
    }
    if (existing.isSystem) {
      throw new SyncHttpError(400, 'System task types cannot be deleted');
    }
    if (existing._count.tasks > 0) {
      throw new SyncHttpError(
        400,
        `Cannot delete task type "${existing.name}" because ${existing._count.tasks} sync task(s) use it`
      );
    }
    await prisma.syncTaskType.delete({ where: { id } });
    return { deleted: true, id };
  }

  public async getSupportedChannels(tenantId: string, taskTypeId: string) {
    const taskType = await this.getTaskTypeById(tenantId, taskTypeId);
    const typeIds: string[] = taskType.supportedChannelTypeIds || [];

    const channels = await prisma.syncChannel.findMany({
      where: {
        tenantId,
        ...(typeIds.length > 0 ? { typeId: { in: typeIds } } : {}),
      },
      include: {
        channelType: true,
        connections: {
          include: { environment: { select: { id: true, name: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      taskTypeId: taskType.id,
      channels: channels
        .map((ch) => {
          const preferredConnection =
            ch.connections.find((c) => c.status === 'connected') || ch.connections[0];
          if (!preferredConnection) return null;
          return {
            channelId: ch.id,
            channelName: ch.name,
            channelTypeName: ch.channelType.name,
            connectionId: preferredConnection.id,
            connectionStatus: preferredConnection.status,
            environmentName: preferredConnection.environment.name,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
    };
  }
}

export const taskTypesService = new TaskTypesService();
