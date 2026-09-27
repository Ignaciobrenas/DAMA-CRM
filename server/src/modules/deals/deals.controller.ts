import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { logAudit } from '../../middlewares/audit.middleware';
import { wsService } from '../../services/websocket.service';
import { getRequestTenant, isGodSuperAdmin } from '../../utils/tenant';
import { NotificationService } from '../notifications/notifications.service';

export async function getPipeline(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const stages = await prisma.dealStage.findMany({
      orderBy: { order: 'asc' },
      include: {
        deals: {
          where: (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) ? { tenantId } : undefined,
          include: {
            contact: { select: { id: true, firstName: true, lastName: true, email: true } },
            company: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    let totalValue = 0;
    let weightedValue = 0;
    let totalDeals = 0;
    let wonValue = 0;

    const stagesWithMetrics = stages.map((stage) => {
      const stageTotal = stage.deals.reduce((acc, deal) => acc + (deal.value || 0), 0);
      const stageWeighted = stageTotal * (stage.probability / 100);

      totalValue += stageTotal;
      weightedValue += stageWeighted;
      totalDeals += stage.deals.length;

      if (stage.name.toLowerCase().includes('ganada')) {
        wonValue += stageTotal;
      }

      return {
        ...stage,
        metrics: {
          count: stage.deals.length,
          totalValue: stageTotal,
          weightedValue: stageWeighted,
        },
      };
    });

    res.json({
      success: true,
      data: {
        stages: stagesWithMetrics,
        summary: {
          totalDeals,
          totalValue,
          weightedValue,
          wonValue,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function listDeals(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);
    const { search, stageId, status, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { company: { name: { contains: String(search), mode: 'insensitive' } } },
      ];
    }
    if (stageId) where.stageId = String(stageId);
    if (status) where.status = String(status);

    const [total, deals] = await Promise.all([
      prisma.deal.count({ where }),
      prisma.deal.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          stage: true,
          company: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: deals,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getDeal(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        stage: true,
        company: true,
        contact: true,
        projects: {
          where: isSuper ? undefined : { tenantId },
        },
      },
    });

    if (!deal) {
      res.status(404).json({ success: false, message: 'Oportunidad no encontrada' });
      return;
    }

    if (!isSuper && deal.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes acceso a esta oportunidad comercial' });
      return;
    }

    res.json({ success: true, data: deal });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createDeal(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const { title, value, currency, stageId, contactId, companyId, expectedCloseDate, notes } = req.body;

    if (!title || !stageId) {
      res.status(400).json({ success: false, message: 'El título y la etapa son obligatorios' });
      return;
    }

    // Verify company or contact belongs to same tenant
    if (companyId) {
      const comp = await prisma.company.findUnique({ where: { id: companyId } });
      if (!comp || (!isGodSuperAdmin(req) && comp.tenantId !== tenantId)) {
        res.status(400).json({ success: false, message: 'La empresa seleccionada no pertenece a su organización' });
        return;
      }
    }
    if (contactId) {
      const cont = await prisma.contact.findUnique({ where: { id: contactId } });
      if (!cont || (!isGodSuperAdmin(req) && cont.tenantId !== tenantId)) {
        res.status(400).json({ success: false, message: 'El contacto seleccionado no pertenece a su organización' });
        return;
      }
    }

    const deal = await prisma.deal.create({
      data: {
        title: title.trim(),
        value: value !== undefined && value !== '' ? parseFloat(value) : 0.0,
        currency: currency || 'EUR',
        stageId,
        contactId: contactId || null,
        companyId: companyId || null,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        notes: notes?.trim() || null,
        status: 'OPEN',
        tenantId,
      },
      include: { stage: true, company: true, contact: true },
    });

    await logAudit(req.user?.id || null, 'CREATE', 'Deal', deal.id, { title: deal.title, value: deal.value, tenantId }, req.ip);

    // Broadcast real-time WebSocket events to tenant
    wsService.broadcastToTenant(tenantId, 'deal:created', deal);

    res.status(201).json({ success: true, data: deal });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PATCH method specifically optimized for Kanban Drag & Drop.
 */
export async function patchDeal(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const currentDeal = await prisma.deal.findUnique({
      where: { id },
      include: { stage: true },
    });

    if (!currentDeal) {
      res.status(404).json({ success: false, message: 'Oportunidad no encontrada' });
      return;
    }

    if (!isSuper && currentDeal.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para modificar esta oportunidad' });
      return;
    }

    const { stageId, status, value, title, expectedCloseDate, notes, companyId, contactId } = req.body;

    const data: any = {};
    if (stageId !== undefined) data.stageId = stageId;
    if (status !== undefined) data.status = status;
    if (value !== undefined) data.value = parseFloat(value) || 0.0;
    if (title !== undefined) data.title = title.trim();
    if (expectedCloseDate !== undefined) data.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate) : null;
    if (notes !== undefined) data.notes = notes;
    if (companyId !== undefined) data.companyId = companyId || null;
    if (contactId !== undefined) data.contactId = contactId || null;

    // Check if new stage is WON / LOST
    let isWonTransition = false;
    if (stageId && stageId !== currentDeal.stageId) {
      const targetStage = await prisma.dealStage.findUnique({ where: { id: stageId } });
      if (targetStage) {
        if (targetStage.name.toLowerCase().includes('ganada')) {
          data.status = 'WON';
          isWonTransition = true;
        } else if (targetStage.name.toLowerCase().includes('perdida')) {
          data.status = 'LOST';
        }
      }
    }

    const updated = await prisma.deal.update({
      where: { id },
      data,
      include: { stage: true, company: true, contact: true },
    });

    await logAudit(
      req.user?.id || null,
      'PATCH',
      'Deal',
      id,
      { oldStageId: currentDeal.stageId, newStageId: updated.stageId, status: updated.status, tenantId },
      req.ip
    );

    // Broadcast real-time WebSocket events to tenant
    wsService.broadcastToTenant(tenantId, 'deal:updated', updated);

    if (isWonTransition) {
      await NotificationService.notifyDealWon({
        id: updated.id,
        title: updated.title,
        value: updated.value,
        currency: updated.currency,
        tenantId: updated.tenantId,
      });
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteDeal(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const existing = await prisma.deal.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Oportunidad no encontrada' });
      return;
    }

    if (!isSuper && existing.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para eliminar esta oportunidad' });
      return;
    }

    await prisma.deal.delete({ where: { id } });
    await logAudit(req.user?.id || null, 'DELETE', 'Deal', id, { title: existing.title, tenantId }, req.ip);
    res.json({ success: true, message: 'Oportunidad eliminada correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function listStages(req: Request, res: Response): Promise<void> {
  try {
    const stages = await prisma.dealStage.findMany({
      orderBy: { order: 'asc' },
    });
    res.json({ success: true, data: stages });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
