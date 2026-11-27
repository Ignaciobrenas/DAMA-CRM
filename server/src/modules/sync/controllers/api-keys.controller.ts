import { Request, Response, NextFunction } from 'express';
import { apiKeysService } from '../services/api-keys.service';

function getTenantId(req: Request): string {
  return req.user?.tenantId || 'master';
}

export async function listApiKeys(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await apiKeysService.listApiKeys(getTenantId(req));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getApiKeyById(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await apiKeysService.getApiKeyById(getTenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await apiKeysService.createApiKey(getTenantId(req), req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function updateApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await apiKeysService.updateApiKey(getTenantId(req), req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function renewApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await apiKeysService.renewApiKey(getTenantId(req), req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function testApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await apiKeysService.testApiKey(getTenantId(req), req.params.id);
    res.json({ success: data.valid, data, message: data.message });
  } catch (error) {
    next(error);
  }
}

export async function deleteApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await apiKeysService.deleteApiKey(getTenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
