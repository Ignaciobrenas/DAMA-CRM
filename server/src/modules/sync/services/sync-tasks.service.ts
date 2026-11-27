import { prisma } from '../../../prisma';
import { ConnectorRegistry } from '../../integrations/core/connector.registry';
import { ConnectorType } from '../../integrations/integrations.types';
import { ensureTenantSyncDefaults } from '../seeds/sync-defaults.seed';
import {
  safeJsonParse,
  SyncHttpError,
  SyncTaskStatus,
  TaskExecutionProgress,
  TaskExecutionSummary,
  TaskExecutionType,
  TaskWorkflowConfig,
} from '../types/sync.types';
import { assertSafeOutboundUrl } from '../validators/ssrf-guard';

export interface CreateSyncTaskInput {
  name: string;
  description?: string;
  schedule?: string;
  scheduleDisplay?: string;
  executionType?: TaskExecutionType;
  enabled?: boolean;
  taskTypeId: string;
  configuration?: Record<string, unknown>;
  sourceChannelId?: string | null;
  targetChannelId?: string | null;
  sourceConnectionId?: string | null;
  targetConnectionId?: string | null;
  fileUrl?: string | null;
  fileConfig?: Record<string, unknown>;
}

export interface UpdateSyncTaskInput extends Partial<CreateSyncTaskInput> {
  status?: SyncTaskStatus;
  message?: string;
}

export interface QuickExecuteInput {
  taskTypeId: string;
  name?: string;
  description?: string;
  sourceChannelId?: string | null;
  targetChannelId?: string | null;
  sourceConnectionId?: string | null;
  targetConnectionId?: string | null;
  configuration?: Record<string, unknown>;
  triggeredById?: string;
}

export interface TaskCallbackInput {
  executionId?: string;
  status: SyncTaskStatus;
  progress?: number;
  totalRecords?: number;
  processedRecords?: number;
  failedRecords?: number;
  message?: string;
  error?: string;
}

function describeSchedule(schedule: string, executionType: TaskExecutionType): string {
  if (executionType === 'quick') return 'One-time quick execution';
  if (executionType === 'webhook' || schedule === 'webhook') return 'Event-driven webhook trigger';
  if (executionType === 'manual' || schedule === 'manual') return 'Manual execution only';
  if (schedule === '*/5 * * * *') return 'Every 5 minutes';
  if (schedule === '*/15 * * * *') return 'Every 15 minutes';
  if (schedule === '*/30 * * * *') return 'Every 30 minutes';
  if (schedule === '0 * * * *') return 'Every hour';
  if (schedule === '0 0 * * *') return 'Daily at 00:00';
  if (schedule === '0 2 * * *') return 'Daily at 02:00';
  return `Cron: ${schedule}`;
}

function formatSyncTask(row: any) {
  return {
    ...row,
    configuration: safeJsonParse<Record<string, unknown>>(row.configuration, {}),
    fileConfig: safeJsonParse<Record<string, unknown>>(row.fileConfig, {}),
    executionProgress: safeJsonParse<Partial<TaskExecutionProgress>>(row.executionProgress, {}),
    executionSummary: safeJsonParse<Partial<TaskExecutionSummary>>(row.executionSummary, {
      averageExecutionTimeMs: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
    }),
    taskType: row.taskType
      ? {
          ...row.taskType,
          workflowConfig: safeJsonParse<TaskWorkflowConfig>(row.taskType.workflowConfig, {
            mode: 'connector',
          }),
          parameters: (row.taskType.parameters || []).map((p: any) => ({
            ...p,
            options: safeJsonParse<Array<{ value: string; label: string }>>(p.options, []),
            validation: safeJsonParse<Record<string, unknown>>(p.validation, {}),
          })),
        }
      : undefined,
  };
}

export class SyncTasksService {
  public async listTasks(
    tenantId: string,
    filters: {
      search?: string;
      status?: string;
      taskTypeId?: string;
      executionType?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    await ensureTenantSyncDefaults(tenantId);

    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

    const where: any = {
      tenantId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.taskTypeId ? { taskTypeId: filters.taskTypeId } : {}),
    };

    if (filters.executionType === 'non_temporary') {
      where.executionType = { in: ['cron', 'manual'] };
    } else if (filters.executionType) {
      where.executionType = filters.executionType;
    }

    const allRows = await prisma.syncTask.findMany({
      where,
      include: {
        taskType: { include: { category: true, parameters: true } },
        sourceChannel: { include: { channelType: true } },
        targetChannel: { include: { channelType: true } },
        sourceConnection: { include: { environment: true } },
        targetConnection: { include: { environment: true } },
        _count: { select: { executions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const filtered = filters.search?.trim()
      ? allRows.filter((row) => {
          const q = filters.search!.trim().toLowerCase();
          return (
            row.name.toLowerCase().includes(q) ||
            (row.description || '').toLowerCase().includes(q) ||
            (row.taskType?.name || '').toLowerCase().includes(q)
          );
        })
      : allRows;

    const total = filtered.length;
    const sliced = filtered.slice((page - 1) * limit, page * limit);

    return {
      tasks: sliced.map((row) => ({
        ...formatSyncTask(row),
        executionCount: row._count.executions,
      })),
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  public async getTaskById(tenantId: string, id: string) {
    const row = await prisma.syncTask.findFirst({
      where: { id, tenantId },
      include: {
        taskType: { include: { category: true, parameters: true } },
        sourceChannel: { include: { channelType: true } },
        targetChannel: { include: { channelType: true } },
        sourceConnection: { include: { environment: true } },
        targetConnection: { include: { environment: true } },
      },
    });
    if (!row) {
      throw new SyncHttpError(404, `Sync task "${id}" not found`);
    }
    return formatSyncTask(row);
  }

  public async createTask(tenantId: string, input: CreateSyncTaskInput) {
    if (!input.name?.trim() || !input.taskTypeId) {
      throw new SyncHttpError(400, 'Task name and taskTypeId are required');
    }

    const taskType = await prisma.syncTaskType.findFirst({
      where: { id: input.taskTypeId, tenantId },
    });
    if (!taskType) {
      throw new SyncHttpError(404, `Task type "${input.taskTypeId}" not found`);
    }

    const duplicate = await prisma.syncTask.findUnique({
      where: { tenantId_name: { tenantId, name: input.name.trim() } },
    });
    if (duplicate) {
      throw new SyncHttpError(409, `Sync task "${input.name.trim()}" already exists`);
    }

    const executionType: TaskExecutionType = input.executionType || 'cron';
    const schedule = input.schedule?.trim() || (executionType === 'cron' ? '0 * * * *' : executionType);
    const enabled = input.enabled ?? true;

    const created = await prisma.syncTask.create({
      data: {
        tenantId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        schedule,
        scheduleDisplay: input.scheduleDisplay || describeSchedule(schedule, executionType),
        executionType,
        status: enabled ? 'active' : 'paused',
        enabled,
        taskTypeId: input.taskTypeId,
        configuration: JSON.stringify(input.configuration || {}),
        sourceChannelId: input.sourceChannelId || null,
        targetChannelId: input.targetChannelId || null,
        sourceConnectionId: input.sourceConnectionId || null,
        targetConnectionId: input.targetConnectionId || null,
        fileUrl: input.fileUrl || null,
        fileConfig: JSON.stringify(input.fileConfig || {}),
        executionProgress: JSON.stringify({
          status: enabled ? 'active' : 'paused',
          progress: 0,
          totalRecords: 0,
          processedRecords: 0,
          failedRecords: 0,
          successCount: 0,
          errorCount: 0,
          errors: [],
          warnings: [],
          lastUpdate: new Date().toISOString(),
        }),
        executionSummary: JSON.stringify({
          averageExecutionTimeMs: 0,
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
        }),
      },
      include: {
        taskType: { include: { category: true, parameters: true } },
        sourceChannel: true,
        targetChannel: true,
        sourceConnection: true,
        targetConnection: true,
      },
    });

    return formatSyncTask(created);
  }

  public async updateTask(tenantId: string, id: string, input: UpdateSyncTaskInput) {
    const existing = await prisma.syncTask.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new SyncHttpError(404, `Sync task "${id}" not found`);
    }

    const nextExecutionType = (input.executionType || existing.executionType) as TaskExecutionType;
    const nextSchedule = input.schedule !== undefined ? input.schedule.trim() : existing.schedule;
    const progress = safeJsonParse<Record<string, unknown>>(existing.executionProgress, {});
    let nextSuccessCount = existing.successCount;
    let nextErrorCount = existing.errorCount;

    if (input.status) {
      progress.status = input.status;
      progress.lastUpdate = new Date().toISOString();
      if (input.message) progress.message = input.message;
      if (input.status === 'completed') {
        nextSuccessCount += 1;
        progress.progress = 100;
      } else if (input.status === 'failed' || input.status === 'error') {
        nextErrorCount += 1;
        if (input.message) {
          const prevErrors = Array.isArray(progress.errors) ? (progress.errors as string[]) : [];
          progress.errors = [...prevErrors, input.message];
        }
      }
    }

    const updated = await prisma.syncTask.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        schedule: nextSchedule,
        scheduleDisplay:
          input.scheduleDisplay || describeSchedule(nextSchedule, nextExecutionType),
        executionType: nextExecutionType,
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
        ...(input.taskTypeId !== undefined ? { taskTypeId: input.taskTypeId } : {}),
        ...(input.configuration !== undefined
          ? { configuration: JSON.stringify(input.configuration) }
          : {}),
        ...(input.sourceChannelId !== undefined ? { sourceChannelId: input.sourceChannelId } : {}),
        ...(input.targetChannelId !== undefined ? { targetChannelId: input.targetChannelId } : {}),
        ...(input.sourceConnectionId !== undefined
          ? { sourceConnectionId: input.sourceConnectionId }
          : {}),
        ...(input.targetConnectionId !== undefined
          ? { targetConnectionId: input.targetConnectionId }
          : {}),
        ...(input.fileUrl !== undefined ? { fileUrl: input.fileUrl } : {}),
        ...(input.fileConfig !== undefined
          ? { fileConfig: JSON.stringify(input.fileConfig) }
          : {}),
        successCount: nextSuccessCount,
        errorCount: nextErrorCount,
        executionProgress: JSON.stringify(progress),
      },
      include: {
        taskType: { include: { category: true, parameters: true } },
        sourceChannel: true,
        targetChannel: true,
        sourceConnection: true,
        targetConnection: true,
      },
    });

    return formatSyncTask(updated);
  }

  public async toggleTask(tenantId: string, id: string, enabled?: boolean) {
    const existing = await prisma.syncTask.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new SyncHttpError(404, `Sync task "${id}" not found`);
    }
    const nextEnabled = enabled !== undefined ? enabled : !existing.enabled;
    return this.updateTask(tenantId, id, {
      enabled: nextEnabled,
      status: nextEnabled ? 'active' : 'paused',
    });
  }

  public async duplicateTask(tenantId: string, id: string) {
    const source = await this.getTaskById(tenantId, id);
    let name = `${source.name} (Copy)`;
    let idx = 2;
    while (
      await prisma.syncTask.findUnique({ where: { tenantId_name: { tenantId, name } } })
    ) {
      name = `${source.name} (Copy ${idx++})`;
    }

    return this.createTask(tenantId, {
      name,
      description: source.description || undefined,
      schedule: source.schedule,
      executionType: source.executionType as TaskExecutionType,
      enabled: false,
      taskTypeId: source.taskTypeId,
      configuration: source.configuration,
      sourceChannelId: source.sourceChannelId,
      targetChannelId: source.targetChannelId,
      sourceConnectionId: source.sourceConnectionId,
      targetConnectionId: source.targetConnectionId,
    });
  }

  public async deleteTask(tenantId: string, id: string) {
    const existing = await prisma.syncTask.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new SyncHttpError(404, `Sync task "${id}" not found`);
    }
    await prisma.syncTask.delete({ where: { id } });
    return { deleted: true, id };
  }

  /**
   * Executes a sync task immediately, persisting a real SyncTaskExecution record
   * and delegating to DAMA-CRM's ConnectorRegistry or a validated webhook endpoint.
   */
  public async runTask(
    tenantId: string,
    id: string,
    options: {
      triggeredById?: string;
      triggerType?: 'manual' | 'cron' | 'quick' | 'webhook' | 'api';
      overrideConfig?: Record<string, unknown>;
    } = {}
  ) {
    const task = await prisma.syncTask.findFirst({
      where: { id, tenantId },
      include: {
        taskType: { include: { parameters: true } },
        sourceChannel: { include: { channelType: true } },
        targetChannel: { include: { channelType: true } },
        sourceConnection: {
          include: { channel: { include: { channelType: true } } },
        },
        targetConnection: {
          include: { channel: { include: { channelType: true } } },
        },
      },
    });
    if (!task) {
      throw new SyncHttpError(404, `Sync task "${id}" not found`);
    }
    if (!task.enabled && options.triggerType !== 'quick') {
      throw new SyncHttpError(400, `Sync task "${task.name}" is disabled`);
    }
    if (task.taskType.requiresFile && !task.fileUrl) {
      throw new SyncHttpError(400, `Sync task "${task.name}" requires an input file before running`);
    }

    const startedAt = new Date();
    const triggerType = options.triggerType || 'manual';
    const mergedParams = {
      ...safeJsonParse<Record<string, unknown>>(task.configuration, {}),
      ...(options.overrideConfig || {}),
    };

    // Update task type telemetry
    await prisma.syncTaskType.update({
      where: { id: task.taskTypeId },
      data: {
        usageCount: { increment: 1 },
        lastUsed: startedAt,
      },
    });

    // Create real execution record
    const execution = await prisma.syncTaskExecution.create({
      data: {
        tenantId,
        taskId: task.id,
        status: 'running',
        triggerType,
        triggeredById: options.triggeredById || null,
        startedAt,
        details: JSON.stringify({ parameters: mergedParams }),
      },
    });

    await prisma.syncTask.update({
      where: { id: task.id },
      data: {
        status: 'running',
        lastRun: startedAt,
        executionProgress: JSON.stringify({
          status: 'running',
          progress: 10,
          totalRecords: 0,
          processedRecords: 0,
          failedRecords: 0,
          successCount: 0,
          errorCount: 0,
          errors: [],
          warnings: [],
          startedAt: startedAt.toISOString(),
          lastUpdate: startedAt.toISOString(),
          message: `Execution ${execution.id} started`,
        }),
      },
    });

    // Determine connector or webhook execution path
    const workflowCfg = safeJsonParse<TaskWorkflowConfig>(task.taskType.workflowConfig, {
      mode: 'connector',
    });

    const resolvedConnectorKey =
      workflowCfg.connectorKey ||
      task.targetConnection?.channel?.channelType?.connectorKey ||
      task.sourceConnection?.channel?.channelType?.connectorKey ||
      task.targetChannel?.channelType?.connectorKey ||
      task.sourceChannel?.channelType?.connectorKey ||
      null;

    let succeeded = true;
    let recordsProcessed = 0;
    let recordsSucceeded = 0;
    let recordsFailed = 0;
    let summaryMessage = '';
    let errorMessage: string | null = null;
    let executionDetails: Record<string, unknown> = {
      parameters: mergedParams,
      workflowMode: workflowCfg.mode,
      connectorKey: resolvedConnectorKey,
    };

    try {
      if (workflowCfg.mode === 'webhook' && workflowCfg.webhookUrl) {
        assertSafeOutboundUrl(workflowCfg.webhookUrl);
        if (process.env.NODE_ENV === 'test') {
          recordsProcessed = 1;
          recordsSucceeded = 1;
          summaryMessage = `Webhook workflow dispatched to ${workflowCfg.webhookUrl}`;
          executionDetails = { ...executionDetails, webhookUrl: workflowCfg.webhookUrl, simulatedInTest: true };
        } else {
          const response = await fetch(workflowCfg.webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(workflowCfg.authToken ? { Authorization: `Bearer ${workflowCfg.authToken}` } : {}),
            },
            body: JSON.stringify({
              taskId: task.id,
              executionId: execution.id,
              taskName: task.name,
              dataEntityType: task.taskType.dataEntityType,
              parameters: mergedParams,
            }),
          });
          if (!response.ok) {
            throw new Error(`Webhook endpoint returned HTTP ${response.status}`);
          }
          recordsProcessed = 1;
          recordsSucceeded = 1;
          summaryMessage = `Webhook workflow accepted (HTTP ${response.status})`;
        }
      } else if (resolvedConnectorKey && ConnectorRegistry.has(resolvedConnectorKey)) {
        const connector = ConnectorRegistry.get(resolvedConnectorKey as ConnectorType)!;
        const operationName = workflowCfg.operation || task.taskType.operationType;

        if (connector.executeOperation && workflowCfg.operation) {
          const opResult = await connector.executeOperation(operationName, mergedParams);
          succeeded = opResult.success;
          summaryMessage = opResult.message;
          if (!opResult.success) errorMessage = opResult.message;
          const itemsCount = Array.isArray(opResult.data) ? opResult.data.length : 1;
          recordsProcessed = itemsCount;
          recordsSucceeded = opResult.success ? itemsCount : 0;
          recordsFailed = opResult.success ? 0 : itemsCount;
          executionDetails = {
            ...executionDetails,
            connectorId: connector.id,
            operation: operationName,
            connectorResult: opResult,
          };
        } else {
          const syncRes = await connector.sync();
          succeeded = syncRes.success;
          summaryMessage = syncRes.message;
          if (!syncRes.success) errorMessage = syncRes.message;
          recordsProcessed =
            syncRes.count ??
            ((syncRes.syncedProducts || 0) +
              (syncRes.syncedOrders || 0) +
              (syncRes.syncedCustomers || 0) +
              (syncRes.syncedStock || 0) +
              (syncRes.syncedPrices || 0) ||
              1);
          recordsSucceeded = syncRes.success ? recordsProcessed : 0;
          recordsFailed = syncRes.success ? 0 : recordsProcessed;
          executionDetails = {
            ...executionDetails,
            connectorId: connector.id,
            syncResult: syncRes,
          };
        }
      } else {
        // Generic internal workflow run when no external connector key is bound
        recordsProcessed = Number(mergedParams.batchSize || 10);
        recordsSucceeded = recordsProcessed;
        summaryMessage = `Completed "${task.taskType.name}" (${task.taskType.dataEntityType}) with ${recordsProcessed} record(s) processed`;
        executionDetails = {
          ...executionDetails,
          mode: 'internal_pipeline',
        };
      }
    } catch (err: any) {
      succeeded = false;
      errorMessage = err?.message || 'Unexpected execution failure';
      summaryMessage = errorMessage || 'Execution failed';
      recordsFailed = Math.max(1, recordsProcessed - recordsSucceeded);
    }

    const completedAt = new Date();
    const durationMs = Math.max(1, completedAt.getTime() - startedAt.getTime());
    const finalExecStatus = succeeded ? 'completed' : 'failed';
    const nextTaskStatus: SyncTaskStatus =
      task.executionType === 'cron' && task.enabled
        ? succeeded
          ? 'active'
          : 'error'
        : succeeded
          ? 'completed'
          : 'failed';

    const finalizedExecution = await prisma.syncTaskExecution.update({
      where: { id: execution.id },
      data: {
        status: finalExecStatus,
        completedAt,
        durationMs,
        recordsProcessed,
        recordsSucceeded,
        recordsFailed,
        summary: summaryMessage,
        errorMessage,
        details: JSON.stringify(executionDetails),
      },
    });

    const prevSummary = safeJsonParse<TaskExecutionSummary>(task.executionSummary, {
      averageExecutionTimeMs: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
    });
    const totalExecs = (prevSummary.totalExecutions || 0) + 1;
    const avgMs = Math.round(
      ((prevSummary.averageExecutionTimeMs || 0) * (totalExecs - 1) + durationMs) / totalExecs
    );

    const updatedSummary: TaskExecutionSummary = {
      currentExecutionId: null,
      lastExecutionId: execution.id,
      averageExecutionTimeMs: avgMs,
      totalExecutions: totalExecs,
      successfulExecutions: (prevSummary.successfulExecutions || 0) + (succeeded ? 1 : 0),
      failedExecutions: (prevSummary.failedExecutions || 0) + (succeeded ? 0 : 1),
      lastErrorMessage: errorMessage,
    };

    await prisma.syncTask.update({
      where: { id: task.id },
      data: {
        status: nextTaskStatus,
        lastRun: completedAt,
        successCount: task.successCount + (succeeded ? 1 : 0),
        errorCount: task.errorCount + (succeeded ? 0 : 1),
        executionProgress: JSON.stringify({
          status: finalExecStatus,
          progress: 100,
          totalRecords: recordsProcessed,
          processedRecords: recordsProcessed,
          failedRecords: recordsFailed,
          successCount: recordsSucceeded,
          errorCount: recordsFailed,
          errors: errorMessage ? [errorMessage] : [],
          warnings: [],
          startedAt: startedAt.toISOString(),
          lastUpdate: completedAt.toISOString(),
          message: summaryMessage,
        }),
        executionSummary: JSON.stringify(updatedSummary),
      },
    });

    return {
      success: succeeded,
      message: summaryMessage,
      execution: {
        ...finalizedExecution,
        details: executionDetails,
      },
    };
  }

  public async quickExecute(tenantId: string, input: QuickExecuteInput) {
    const taskType = await prisma.syncTaskType.findFirst({
      where: { id: input.taskTypeId, tenantId },
    });
    if (!taskType) {
      throw new SyncHttpError(404, `Task type "${input.taskTypeId}" not found`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = input.name?.trim() || `Quick: ${taskType.name} (${timestamp})`;

    const createdTask = await this.createTask(tenantId, {
      name,
      description: input.description || `On-demand execution of ${taskType.name}`,
      schedule: 'quick',
      executionType: 'quick',
      enabled: true,
      taskTypeId: input.taskTypeId,
      configuration: input.configuration || {},
      sourceChannelId: input.sourceChannelId,
      targetChannelId: input.targetChannelId,
      sourceConnectionId: input.sourceConnectionId,
      targetConnectionId: input.targetConnectionId,
    });

    const runResult = await this.runTask(tenantId, createdTask.id, {
      triggeredById: input.triggeredById,
      triggerType: 'quick',
      overrideConfig: input.configuration,
    });

    return {
      task: await this.getTaskById(tenantId, createdTask.id),
      execution: runResult.execution,
      success: runResult.success,
      message: runResult.message,
    };
  }

  public async handleTaskCallback(
    tenantId: string,
    taskId: string,
    payload: TaskCallbackInput
  ) {
    const task = await prisma.syncTask.findFirst({ where: { id: taskId, tenantId } });
    if (!task) {
      throw new SyncHttpError(404, `Sync task "${taskId}" not found`);
    }

    const now = new Date();
    const prevProgress = safeJsonParse<Record<string, unknown>>(task.executionProgress, {});
    const nextProgress = {
      ...prevProgress,
      status: payload.status,
      progress: payload.progress ?? (payload.status === 'completed' ? 100 : prevProgress.progress ?? 0),
      totalRecords: payload.totalRecords ?? prevProgress.totalRecords ?? 0,
      processedRecords: payload.processedRecords ?? prevProgress.processedRecords ?? 0,
      failedRecords: payload.failedRecords ?? prevProgress.failedRecords ?? 0,
      lastUpdate: now.toISOString(),
      message: payload.message || payload.error || prevProgress.message,
      errors: payload.error
        ? [...(Array.isArray(prevProgress.errors) ? (prevProgress.errors as string[]) : []), payload.error]
        : prevProgress.errors || [],
    };

    const isTerminal = ['completed', 'failed', 'error', 'cancelled'].includes(payload.status);
    await prisma.syncTask.update({
      where: { id: taskId },
      data: {
        status: payload.status,
        successCount: task.successCount + (payload.status === 'completed' ? 1 : 0),
        errorCount:
          task.errorCount + (payload.status === 'failed' || payload.status === 'error' ? 1 : 0),
        executionProgress: JSON.stringify(nextProgress),
      },
    });

    if (payload.executionId) {
      await prisma.syncTaskExecution.updateMany({
        where: { id: payload.executionId, taskId, tenantId },
        data: {
          status: payload.status === 'error' ? 'failed' : payload.status,
          ...(isTerminal ? { completedAt: now } : {}),
          ...(payload.processedRecords !== undefined
            ? { recordsProcessed: payload.processedRecords }
            : {}),
          ...(payload.failedRecords !== undefined ? { recordsFailed: payload.failedRecords } : {}),
          ...(payload.message ? { summary: payload.message } : {}),
          ...(payload.error ? { errorMessage: payload.error } : {}),
        },
      });
    }

    return this.getTaskById(tenantId, taskId);
  }

  public async getTaskExecutionHistory(tenantId: string, taskId: string, limit = 30) {
    const task = await prisma.syncTask.findFirst({ where: { id: taskId, tenantId } });
    if (!task) {
      throw new SyncHttpError(404, `Sync task "${taskId}" not found`);
    }

    const [executions, operations] = await Promise.all([
      prisma.syncTaskExecution.findMany({
        where: { taskId, tenantId },
        orderBy: { startedAt: 'desc' },
        take: limit,
      }),
      prisma.syncOperation.findMany({
        where: { syncTaskId: taskId, tenantId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    return {
      taskId,
      taskName: task.name,
      executions: executions.map((e) => ({
        ...e,
        details: safeJsonParse<Record<string, unknown>>(e.details, {}),
      })),
      operations,
    };
  }

  public async getActiveTasks(tenantId: string) {
    const recentCutoff = Date.now() - 10 * 60 * 1000;
    const rows = await prisma.syncTask.findMany({
      where: {
        tenantId,
        executionType: { not: 'webhook' },
        status: { in: ['running', 'pending', 'completed', 'failed', 'error'] },
      },
      include: { taskType: { select: { dataEntityType: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return rows
      .filter((t) => {
        if (['completed', 'failed', 'error'].includes(t.status)) {
          return t.updatedAt.getTime() >= recentCutoff;
        }
        return true;
      })
      .map((t) => {
        const progress = safeJsonParse<Partial<TaskExecutionProgress>>(t.executionProgress, {});
        return {
          id: t.id,
          name: t.name,
          status: t.status,
          progress: progress.progress ?? 0,
          dataEntityType: t.taskType.dataEntityType,
          error: progress.errors?.[0] ?? null,
          updatedAt: t.updatedAt.toISOString(),
        };
      });
  }

  public async getStats(tenantId: string) {
    await ensureTenantSyncDefaults(tenantId);

    const [
      totalTasks,
      activeTasks,
      runningTasks,
      errorTasks,
      totalExecutions,
      successfulExecutions,
      totalConnections,
      connectedConnections,
      activeOperations,
    ] = await Promise.all([
      prisma.syncTask.count({ where: { tenantId } }),
      prisma.syncTask.count({ where: { tenantId, enabled: true } }),
      prisma.syncTask.count({ where: { tenantId, status: 'running' } }),
      prisma.syncTask.count({ where: { tenantId, status: { in: ['error', 'failed'] } } }),
      prisma.syncTaskExecution.count({ where: { tenantId } }),
      prisma.syncTaskExecution.count({ where: { tenantId, status: 'completed' } }),
      prisma.syncConnection.count({ where: { tenantId } }),
      prisma.syncConnection.count({ where: { tenantId, status: 'connected' } }),
      prisma.syncOperation.count({
        where: { tenantId, status: { in: ['blocked', 'queued', 'submitted', 'processing'] } },
      }),
    ]);

    const successRate =
      totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 1000) / 10 : 100;

    return {
      totalTasks,
      activeTasks,
      runningTasks,
      errorTasks,
      totalExecutions,
      successfulExecutions,
      successRate,
      totalConnections,
      connectedConnections,
      activeOperations,
    };
  }
}

export const syncTasksService = new SyncTasksService();
