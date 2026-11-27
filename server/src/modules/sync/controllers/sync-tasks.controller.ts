import { Request, Response, NextFunction } from 'express';
import { syncTasksService } from '../services/sync-tasks.service';

function getTenantId(req: Request): string {
  return req.user?.tenantId || 'master';
}

export async function getSyncStats(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await syncTasksService.getStats(getTenantId(req));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function listSyncTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await syncTasksService.listTasks(getTenantId(req), {
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      taskTypeId: typeof req.query.taskTypeId === 'string' ? req.query.taskTypeId : undefined,
      executionType:
        typeof req.query.executionType === 'string' ? req.query.executionType : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getActiveSyncTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await syncTasksService.getActiveTasks(getTenantId(req));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getSyncTaskById(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await syncTasksService.getTaskById(getTenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createSyncTask(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await syncTasksService.createTask(getTenantId(req), req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function updateSyncTask(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await syncTasksService.updateTask(getTenantId(req), req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function toggleSyncTask(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await syncTasksService.toggleTask(
      getTenantId(req),
      req.params.id,
      req.body?.enabled
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function duplicateSyncTask(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await syncTasksService.duplicateTask(getTenantId(req), req.params.id);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function deleteSyncTask(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await syncTasksService.deleteTask(getTenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function runSyncTask(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await syncTasksService.runTask(getTenantId(req), req.params.id, {
      triggeredById: req.user?.id,
      triggerType: req.body?.triggerType || 'manual',
      overrideConfig: req.body?.configuration || req.body?.overrideConfig,
    });
    res.json({ success: data.success, data, message: data.message });
  } catch (error) {
    next(error);
  }
}

export async function quickExecuteSyncTask(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await syncTasksService.quickExecute(getTenantId(req), {
      ...req.body,
      triggeredById: req.user?.id,
    });
    res.status(201).json({ success: data.success, data, message: data.message });
  } catch (error) {
    next(error);
  }
}

export async function handleSyncTaskCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await syncTasksService.handleTaskCallback(
      getTenantId(req),
      req.params.id,
      req.body
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getSyncTaskHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? Math.min(100, Number(req.query.limit)) : 30;
    const data = await syncTasksService.getTaskExecutionHistory(
      getTenantId(req),
      req.params.id,
      Number.isFinite(limit) ? limit : 30
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
