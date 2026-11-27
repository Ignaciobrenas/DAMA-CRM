import { Request, Response, NextFunction } from 'express';
import { taskTypesService } from '../services/task-types.service';

function getTenantId(req: Request): string {
  return req.user?.tenantId || 'master';
}

export async function listTaskCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await taskTypesService.listCategories(getTenantId(req));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createTaskCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await taskTypesService.createCategory(getTenantId(req), req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function updateTaskCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await taskTypesService.updateCategory(
      getTenantId(req),
      req.params.id,
      req.body
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function deleteTaskCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await taskTypesService.deleteCategory(getTenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function listTaskTypes(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await taskTypesService.listTaskTypes(getTenantId(req), {
      categoryId: typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined,
      categoryKey: typeof req.query.categoryKey === 'string' ? req.query.categoryKey : undefined,
      dataEntityType:
        typeof req.query.dataEntityType === 'string' ? req.query.dataEntityType : undefined,
      operationType:
        typeof req.query.operationType === 'string' ? req.query.operationType : undefined,
      isActive:
        req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getTaskTypeById(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await taskTypesService.getTaskTypeById(getTenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createTaskType(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await taskTypesService.createTaskType(getTenantId(req), {
      ...req.body,
      createdById: req.user?.id,
    });
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function updateTaskType(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await taskTypesService.updateTaskType(getTenantId(req), req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function duplicateTaskType(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await taskTypesService.duplicateTaskType(
      getTenantId(req),
      req.params.id,
      req.body?.name
    );
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function toggleTaskType(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await taskTypesService.toggleTaskType(
      getTenantId(req),
      req.params.id,
      req.body?.isActive
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function deleteTaskType(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await taskTypesService.deleteTaskType(getTenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getTaskTypeSupportedChannels(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await taskTypesService.getSupportedChannels(getTenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
