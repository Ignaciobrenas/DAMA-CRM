import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { logAudit } from '../../middlewares/audit.middleware';
import { getRequestTenant, isGodSuperAdmin } from '../../utils/tenant';

export async function listActivities(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);
    const { contactId, dealId, type } = req.query;

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    if (contactId) where.contactId = String(contactId);
    if (dealId) where.dealId = String(dealId);
    if (type) where.type = String(type);

    const rawActivities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const activities = rawActivities.map((act) => ({
      ...act,
      title: act.subject,
      isCompleted: Boolean(act.completedAt || act.outcome === 'COMPLETED'),
    }));

    res.json({ success: true, data: activities });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createActivity(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const { type, subject, title, description, durationMinutes, outcome, isCompleted, scheduledAt, contactId, dealId } = req.body;
    const finalSubject = subject || title;

    if (!type || !finalSubject) {
      res.status(400).json({ success: false, message: 'Tipo de actividad y asunto son obligatorios' });
      return;
    }

    const completed = isCompleted !== undefined ? Boolean(isCompleted) : Boolean(outcome);

    const activity = await prisma.activity.create({
      data: {
        type,
        subject: finalSubject.trim(),
        description: description?.trim() || null,
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 15,
        outcome: completed ? (outcome || 'COMPLETED') : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        completedAt: completed ? new Date() : null,
        contactId: contactId || null,
        dealId: dealId || null,
        userId: req.user?.id || null,
        tenantId,
      },
    });

    await logAudit(req.user?.id || null, 'CREATE', 'Activity', activity.id, { type: activity.type, subject: activity.subject, tenantId }, req.ip);

    const formatted = {
      ...activity,
      title: activity.subject,
      isCompleted: Boolean(activity.completedAt || activity.outcome === 'COMPLETED'),
    };

    res.status(201).json({ success: true, data: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateActivity(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const existing = await prisma.activity.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Actividad no encontrada' });
      return;
    }

    if (!isSuper && existing.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para modificar esta actividad' });
      return;
    }

    const { subject, title, description, durationMinutes, outcome, isCompleted, completedAt } = req.body;

    const data: any = {};
    if (subject || title) data.subject = (subject || title).trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (durationMinutes !== undefined) data.durationMinutes = parseInt(durationMinutes, 10);
    
    if (isCompleted !== undefined) {
      data.completedAt = isCompleted ? new Date() : null;
      data.outcome = isCompleted ? 'COMPLETED' : null;
    } else {
      if (outcome !== undefined) data.outcome = outcome;
      if (completedAt !== undefined) data.completedAt = completedAt ? new Date(completedAt) : null;
    }

    const updated = await prisma.activity.update({
      where: { id },
      data,
    });

    const formatted = {
      ...updated,
      title: updated.subject,
      isCompleted: Boolean(updated.completedAt || updated.outcome === 'COMPLETED'),
    };

    res.json({ success: true, data: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
