import { Request, Response, NextFunction } from 'express';
import { syncOperationsService } from '../services/sync-operations.service';

function getTenantId(req: Request): string {
  return req.user?.tenantId || 'master';
}

export async function listSyncOperations(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await syncOperationsService.listOperations(getTenantId(req), {
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      connectionId:
        typeof req.query.connectionId === 'string' ? req.query.connectionId : undefined,
      syncTaskId: typeof req.query.syncTaskId === 'string' ? req.query.syncTaskId : undefined,
      entityType: typeof req.query.entityType === 'string' ? req.query.entityType : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 50,
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getSyncOperationById(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await syncOperationsService.getOperationById(getTenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createSyncOperation(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await syncOperationsService.createOperation(getTenantId(req), req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function transitionSyncOperation(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await syncOperationsService.transitionStatus(
      getTenantId(req),
      req.params.id,
      req.body.status,
      {
        externalJobId: req.body.externalJobId,
        errorMessage: req.body.errorMessage,
      }
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function addSyncOperationDependency(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await syncOperationsService.addDependency(
      getTenantId(req),
      req.params.id,
      req.body.dependsOnId
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function bulkUpdateSyncOperationEntities(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await syncOperationsService.bulkUpdateEntities(
      getTenantId(req),
      req.params.id,
      req.body.entities || []
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
