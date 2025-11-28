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
