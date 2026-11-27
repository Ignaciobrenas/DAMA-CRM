import { Request, Response, NextFunction } from 'express';
import { connectionsService } from '../services/connections.service';

function getTenantId(req: Request): string {
  return req.user?.tenantId || 'master';
}

export async function listConnections(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await connectionsService.listConnections(getTenantId(req), {
      environmentId:
        typeof req.query.environmentId === 'string' ? req.query.environmentId : undefined,
      channelId: typeof req.query.channelId === 'string' ? req.query.channelId : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      type: typeof req.query.type === 'string' ? req.query.type : undefined,
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getConnectionById(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await connectionsService.getConnectionById(getTenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createConnection(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await connectionsService.createConnection(getTenantId(req), req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function updateConnection(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await connectionsService.updateConnection(
      getTenantId(req),
      req.params.id,
      req.body
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function deleteConnection(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await connectionsService.deleteConnection(getTenantId(req), req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function testConnection(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await connectionsService.testConnection(getTenantId(req), req.params.id);
    res.json({ success: data.success, data, message: data.message });
  } catch (error) {
    next(error);
  }
}

export async function testDraftConnection(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await connectionsService.testDraftConnection(req.body);
    res.json({ success: data.success, data, message: data.message });
  } catch (error) {
    next(error);
  }
}

export async function getConnectionSyncHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? Math.min(100, Number(req.query.limit)) : 25;
    const data = await connectionsService.getConnectionSyncHistory(
      getTenantId(req),
      req.params.id,
      Number.isFinite(limit) ? limit : 25
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
