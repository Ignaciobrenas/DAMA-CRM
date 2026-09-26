import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export async function logAudit(
  userId: string | null,
  action: string,
  entity: string,
  entityId?: string,
  details?: Record<string, any>,
  ipAddress?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

export function auditMiddleware(action: string, entity: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = (req as any).user?.id || null;
    const entityId = req.params?.id || undefined;
    const ipAddress = req.ip || (req.socket ? req.socket.remoteAddress : undefined);
    logAudit(userId, action, entity, entityId, req.body, ipAddress).catch(() => {});
    next();
  };
}

