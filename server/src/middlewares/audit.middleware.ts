import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { maskSensitiveData } from '../utils/sanitizer';

export async function logAudit(
  userId: string | null,
  action: string,
  entity: string,
  entityId?: string,
  details?: Record<string, any>,
  ipAddress?: string
): Promise<void> {
  try {
    const sanitizedDetails = details ? maskSensitiveData(details) : null;
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: sanitizedDetails ? JSON.stringify(sanitizedDetails) : null,
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

