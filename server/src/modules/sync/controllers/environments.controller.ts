import { Request, Response, NextFunction } from 'express';
import { environmentsService } from '../services/environments.service';

function getTenantId(req: Request): string {
  return req.user?.tenantId || 'master';
}

export async function listEnvironments(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await environmentsService.listEnvironments(getTenantId(req));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getEnvironmentById(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await environmentsService.getEnvironmentById(getTenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createEnvironment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await environmentsService.createEnvironment(getTenantId(req), req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function updateEnvironment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await environmentsService.updateEnvironment(
      getTenantId(req),
      req.params.id,
      req.body
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function deleteEnvironment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await environmentsService.deleteEnvironment(getTenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function checkEnvironmentHealth(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await environmentsService.checkEnvironmentHealth(
      getTenantId(req),
      req.params.id
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
