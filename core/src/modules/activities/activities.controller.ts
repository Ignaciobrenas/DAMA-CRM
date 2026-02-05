import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { logAudit } from '../../middlewares/audit.middleware';

export async function listActivities(req: Request, res: Response): Promise<void> {
  try {
    const { contactId, dealId, type } = req.query;
    const where: any = {};
    if (contactId) where.contactId = String(contactId);
    if (dealId) where.dealId = String(dealId);
    if (type) where.type = String(type);

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ success: true, data: activities });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createActivity(req: Request, res: Response): Promise<void> {
  try {
    const { type, subject, description, durationMinutes, outcome, scheduledAt, contactId, dealId } = req.body;

    if (!type || !subject) {
      res.status(400).json({ success: false, message: 'Tipo de actividad y asunto son obligatorios' });
      return;
    }

    const activity = await prisma.activity.create({
      data: {
        type,
        subject,
        description,
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 15,
        outcome,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        completedAt: outcome ? new Date() : null,
        contactId: contactId || null,
        dealId: dealId || null,
        userId: req.user?.id || null,
      },
    });

    await logAudit(req.user?.id || null, 'CREATE', 'Activity', activity.id, { type: activity.type, subject: activity.subject }, req.ip);

    res.status(201).json({ success: true, data: activity });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateActivity(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { subject, description, durationMinutes, outcome, completedAt } = req.body;

    const updated = await prisma.activity.update({
      where: { id },
      data: {
        subject,
        description,
        durationMinutes: durationMinutes !== undefined ? parseInt(durationMinutes, 10) : undefined,
        outcome,
        completedAt: completedAt ? new Date(completedAt) : undefined,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
