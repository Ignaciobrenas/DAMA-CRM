import crypto from 'crypto';
import { prisma } from '../../../prisma';
import {
  safeJsonParse,
  SyncHttpError,
  SyncOperationEntityStatus,
  SyncOperationStatus,
  SyncOperationType,
} from '../types/sync.types';

const ACTIVE_OPERATION_STATUSES: readonly SyncOperationStatus[] = [
  'blocked',
  'queued',
  'submitted',
  'processing',
];

const TERMINAL_OPERATION_STATUSES = new Set<SyncOperationStatus>([
  'completed',
  'failed',
  'timeout',
  'cancelled',
]);

const ALLOWED_TRANSITIONS: Record<SyncOperationStatus, readonly SyncOperationStatus[]> = {
  blocked: ['queued', 'cancelled'],
  queued: ['submitted', 'processing', 'cancelled', 'failed'],
  submitted: ['processing', 'completed', 'failed', 'timeout', 'cancelled'],
  processing: ['completed', 'failed', 'timeout', 'cancelled'],
  completed: [],
  failed: [],
  timeout: [],
  cancelled: [],
};

export interface CreateSyncOperationInput {
  operation: SyncOperationType;
  entityType: string;
  connectionId: string;
  syncTaskId?: string | null;
  entities: Array<{
    entityId: string;
    externalId?: string | null;
    payload?: Record<string, unknown>;
  }>;
  dependsOnIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface BulkEntityUpdateItem {
  entityId: string;
  status: SyncOperationEntityStatus;
  externalId?: string | null;
  errorMessage?: string | null;
  result?: Record<string, unknown>;
}

function formatOperation(op: any) {
  return {
    ...op,
    metadata: safeJsonParse<Record<string, unknown>>(op.metadata, {}),
    entities: (op.entities || []).map((e: any) => ({
      ...e,
      payload: safeJsonParse<Record<string, unknown>>(e.payload, {}),
      result: safeJsonParse<Record<string, unknown>>(e.result, {}),
    })),
    dependsOnIds: (op.dependencies || []).map((d: any) => d.dependsOnId),
    dependentIds: (op.dependents || []).map((d: any) => d.operationId),
  };
}

export class SyncOperationsService {
  public computePayloadHash(
    operation: string,
    connectionId: string,
    entityIds: string[]
  ): string {
    const normalized = JSON.stringify({
      operation,
      connectionId,
      entities: [...entityIds].sort(),
    });
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  public async listOperations(
    tenantId: string,
    filters: {
      status?: string;
      connectionId?: string;
      syncTaskId?: string;
      entityType?: string;
      limit?: number;
    } = {}
  ) {
    const rows = await prisma.syncOperation.findMany({
      where: {
        tenantId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.connectionId ? { connectionId: filters.connectionId } : {}),
        ...(filters.syncTaskId ? { syncTaskId: filters.syncTaskId } : {}),
        ...(filters.entityType ? { entityType: filters.entityType } : {}),
      },
      include: {
        connection: {
          select: {
            id: true,
            endpoint: true,
            status: true,
            channel: { select: { id: true, name: true } },
          },
        },
        syncTask: { select: { id: true, name: true } },
        entities: true,
        dependencies: true,
        dependents: true,
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 50,
    });

    return rows.map(formatOperation);
  }

  public async getOperationById(tenantId: string, id: string) {
    const op = await prisma.syncOperation.findFirst({
      where: { id, tenantId },
      include: {
        connection: {
          select: {
            id: true,
            endpoint: true,
            status: true,
            channel: { select: { id: true, name: true } },
          },
        },
        syncTask: { select: { id: true, name: true } },
        entities: true,
        dependencies: true,
        dependents: true,
      },
    });
    if (!op) {
      throw new SyncHttpError(404, `Sync operation "${id}" not found`);
    }
    return formatOperation(op);
  }

  public async createOperation(tenantId: string, input: CreateSyncOperationInput) {
    if (!input.connectionId || !input.operation || !input.entityType) {
      throw new SyncHttpError(400, 'connectionId, operation, and entityType are required');
    }
    if (!Array.isArray(input.entities) || input.entities.length === 0) {
      throw new SyncHttpError(400, 'At least one entity is required to create a sync operation');
    }

    const connection = await prisma.syncConnection.findFirst({
      where: { id: input.connectionId, tenantId },
    });
    if (!connection) {
      throw new SyncHttpError(404, `Connection "${input.connectionId}" not found`);
    }

    const entityIds = input.entities.map((e) => e.entityId);
    const payloadHash = this.computePayloadHash(input.operation, input.connectionId, entityIds);

    // Single-operation idempotency guard: reject duplicate active operation with identical payloadHash
    const activeDuplicate = await prisma.syncOperation.findFirst({
      where: {
        tenantId,
        connectionId: input.connectionId,
        payloadHash,
        status: { in: [...ACTIVE_OPERATION_STATUSES] },
      },
    });
    if (activeDuplicate) {
      throw new SyncHttpError(
        409,
        `An active sync operation already exists for this exact payload`,
        { existingOperationId: activeDuplicate.id, status: activeDuplicate.status }
      );
    }

    const dependsOnIds = Array.from(new Set(input.dependsOnIds || []));
    let initialStatus: SyncOperationStatus = 'queued';

    if (dependsOnIds.length > 0) {
      const prerequisites = await prisma.syncOperation.findMany({
        where: { id: { in: dependsOnIds }, tenantId },
      });
      if (prerequisites.length !== dependsOnIds.length) {
        throw new SyncHttpError(400, 'One or more prerequisite operations do not exist');
      }

      const failedPrereq = prerequisites.find((p) =>
        ['failed', 'timeout', 'cancelled'].includes(p.status)
      );
      if (failedPrereq) {
        throw new SyncHttpError(
          400,
          `Cannot depend on operation "${failedPrereq.id}" because its status is "${failedPrereq.status}"`
        );
      }

      const hasPendingPrereq = prerequisites.some((p) => p.status !== 'completed');
      if (hasPendingPrereq) {
        initialStatus = 'blocked';
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const op = await tx.syncOperation.create({
        data: {
          tenantId,
          operation: input.operation,
          entityType: input.entityType,
          status: initialStatus,
          connectionId: input.connectionId,
          syncTaskId: input.syncTaskId || null,
          payloadHash,
          totalEntities: input.entities.length,
          metadata: JSON.stringify(input.metadata || {}),
        },
      });

      for (const item of input.entities) {
        await tx.syncOperationEntity.create({
          data: {
            operationId: op.id,
            entityId: item.entityId,
            externalId: item.externalId || null,
            status: 'pending',
            payload: JSON.stringify(item.payload || {}),
          },
        });
      }

      for (const depId of dependsOnIds) {
        await tx.syncOperationDependency.create({
          data: {
            operationId: op.id,
            dependsOnId: depId,
          },
        });
      }

      return tx.syncOperation.findUniqueOrThrow({
        where: { id: op.id },
        include: { entities: true, dependencies: true, dependents: true },
      });
    });

    return formatOperation(created);
  }

  /**
   * Adds a dependency edge between two existing operations with cycle detection.
   */
  public async addDependency(tenantId: string, operationId: string, dependsOnId: string) {
    if (operationId === dependsOnId) {
      throw new SyncHttpError(400, 'An operation cannot depend on itself');
    }

    const [op, prereq] = await Promise.all([
      prisma.syncOperation.findFirst({ where: { id: operationId, tenantId } }),
      prisma.syncOperation.findFirst({ where: { id: dependsOnId, tenantId } }),
    ]);
    if (!op || !prereq) {
      throw new SyncHttpError(404, 'Operation or prerequisite not found');
    }

    // DFS cycle detection: ensure operationId is not reachable from dependsOnId
    const visited = new Set<string>();
    const stack = [dependsOnId];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === operationId) {
        throw new SyncHttpError(
          400,
          'Adding this dependency would introduce a cycle in the operation graph'
        );
      }
      if (visited.has(current)) continue;
      visited.add(current);
      const upstream = await prisma.syncOperationDependency.findMany({
        where: { operationId: current },
        select: { dependsOnId: true },
      });
      for (const edge of upstream) {
        stack.push(edge.dependsOnId);
      }
    }

    await prisma.syncOperationDependency.upsert({
      where: { operationId_dependsOnId: { operationId, dependsOnId } },
      update: {},
      create: { operationId, dependsOnId },
    });

    if (prereq.status !== 'completed' && op.status === 'queued') {
      await prisma.syncOperation.update({
        where: { id: operationId },
        data: { status: 'blocked' },
      });
    }

    return this.getOperationById(tenantId, operationId);
  }

  public async transitionStatus(
    tenantId: string,
    id: string,
    nextStatus: SyncOperationStatus,
    details: { externalJobId?: string; errorMessage?: string } = {}
  ) {
    const existing = await prisma.syncOperation.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new SyncHttpError(404, `Sync operation "${id}" not found`);
    }

    const currentStatus = existing.status as SyncOperationStatus;
    if (currentStatus === nextStatus) {
      return this.getOperationById(tenantId, id);
    }

    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new SyncHttpError(
        400,
        `Illegal sync operation transition from "${currentStatus}" to "${nextStatus}"`
      );
    }

    const now = new Date();
    await prisma.syncOperation.update({
      where: { id },
      data: {
        status: nextStatus,
        ...(details.externalJobId !== undefined ? { externalJobId: details.externalJobId } : {}),
        ...(details.errorMessage !== undefined ? { errorMessage: details.errorMessage } : {}),
        ...(nextStatus === 'submitted' ? { submittedAt: now } : {}),
        ...(TERMINAL_OPERATION_STATUSES.has(nextStatus) ? { completedAt: now } : {}),
      },
    });

    if (nextStatus === 'completed') {
      await this.resolveDependents(id);
    } else if (nextStatus === 'failed' || nextStatus === 'timeout' || nextStatus === 'cancelled') {
      await this.cascadeCancel(
        id,
        `Cancelled because prerequisite operation "${id}" ended with status "${nextStatus}"`
      );
    }

    return this.getOperationById(tenantId, id);
  }

  /**
   * Unblocks downstream operations whose prerequisites have all reached "completed".
   */
  private async resolveDependents(completedOperationId: string): Promise<string[]> {
    const edges = await prisma.syncOperationDependency.findMany({
      where: { dependsOnId: completedOperationId },
      select: { operationId: true },
    });

    const unblockedIds: string[] = [];
    for (const edge of edges) {
      const candidate = await prisma.syncOperation.findUnique({
        where: { id: edge.operationId },
        include: { dependencies: { include: { dependsOn: true } } },
      });
      if (!candidate || candidate.status !== 'blocked') continue;

      const allCompleted = candidate.dependencies.every(
        (d) => d.dependsOn.status === 'completed'
      );
      if (allCompleted) {
        await prisma.syncOperation.update({
          where: { id: candidate.id },
          data: { status: 'queued' },
        });
        unblockedIds.push(candidate.id);
      }
    }

    return unblockedIds;
  }

  /**
   * Recursively cancels every non-terminal transitive dependent of a failed/timed-out operation.
   */
  private async cascadeCancel(failedOperationId: string, reason: string): Promise<string[]> {
    const cancelledIds: string[] = [];
    const queue = [failedOperationId];
    const visited = new Set<string>([failedOperationId]);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const downstream = await prisma.syncOperationDependency.findMany({
        where: { dependsOnId: current },
        include: { operation: true },
      });

      for (const edge of downstream) {
        const depOp = edge.operation;
        if (visited.has(depOp.id)) continue;
        visited.add(depOp.id);

        if (!TERMINAL_OPERATION_STATUSES.has(depOp.status as SyncOperationStatus)) {
          await prisma.syncOperation.update({
            where: { id: depOp.id },
            data: {
              status: 'cancelled',
              errorMessage: reason,
              completedAt: new Date(),
            },
          });
          cancelledIds.push(depOp.id);
        }
        queue.push(depOp.id);
      }
    }

    return cancelledIds;
  }

  /**
   * Updates multiple entities belonging to an operation and atomically recomputes
   * succeeded/failed/skipped counters on the parent SyncOperation.
   */
  public async bulkUpdateEntities(
    tenantId: string,
    operationId: string,
    updates: BulkEntityUpdateItem[]
  ) {
    const op = await prisma.syncOperation.findFirst({ where: { id: operationId, tenantId } });
    if (!op) {
      throw new SyncHttpError(404, `Sync operation "${operationId}" not found`);
    }

    for (const item of updates) {
      await prisma.syncOperationEntity.updateMany({
        where: { operationId, entityId: item.entityId },
        data: {
          status: item.status,
          ...(item.externalId !== undefined ? { externalId: item.externalId } : {}),
          ...(item.errorMessage !== undefined ? { errorMessage: item.errorMessage } : {}),
          ...(item.result !== undefined ? { result: JSON.stringify(item.result) } : {}),
        },
      });
    }

    const allEntities = await prisma.syncOperationEntity.findMany({
      where: { operationId },
      select: { status: true },
    });

    const succeeded = allEntities.filter((e) => e.status === 'completed').length;
    const failed = allEntities.filter((e) => e.status === 'failed').length;
    const skipped = allEntities.filter((e) => e.status === 'skipped').length;

    await prisma.syncOperation.update({
      where: { id: operationId },
      data: {
        totalEntities: allEntities.length,
        succeededEntities: succeeded,
        failedEntities: failed,
        skippedEntities: skipped,
      },
    });

    return this.getOperationById(tenantId, operationId);
  }
}

export const syncOperationsService = new SyncOperationsService();
