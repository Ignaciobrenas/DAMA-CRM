import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { logAudit } from '../../middlewares/audit.middleware';
import { wsService } from '../../services/websocket.service';

export async function getPipeline(req: Request, res: Response): Promise<void> {
  try {
    const stages = await prisma.dealStage.findMany({
      orderBy: { order: 'asc' },
      include: {
        deals: {
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
      const stageTotal = stage.deals.reduce((acc, deal) => acc + deal.value, 0);
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
    const { search, stageId, status, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
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
          contact: { select: { id: true, firstName: true, lastName: true } },
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
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getDeal(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        stage: true,
        company: true,
        contact: true,
        projects: true,
      },
    });

    if (!deal) {
      res.status(404).json({ success: false, message: 'Oportunidad no encontrada' });
      return;
    }

    res.json({ success: true, data: deal });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createDeal(req: Request, res: Response): Promise<void> {
  try {
    const { title, value, currency, stageId, contactId, companyId, expectedCloseDate, notes } = req.body;

    if (!title || !stageId) {
      res.status(400).json({ success: false, message: 'El título y la etapa son obligatorios' });
      return;
    }

    const deal = await prisma.deal.create({
      data: {
        title,
        value: value ? parseFloat(value) : 0.0,
        currency: currency || 'EUR',
        stageId,
        contactId: contactId || null,
        companyId: companyId || null,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        notes,
        status: 'OPEN',
      },
      include: { stage: true, company: true, contact: true },
    });

    await logAudit(req.user?.id || null, 'CREATE', 'Deal', deal.id, { title: deal.title, value: deal.value }, req.ip);

    // Broadcast real-time WebSocket events
    wsService.broadcast('deal:created', deal);
    wsService.broadcast('notification:new', {
      title: 'Nueva oportunidad',
      desc: `${deal.title} (€${deal.value}) creada`,
      type: 'deal',
    });

    res.status(201).json({ success: true, data: deal });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PATCH method specifically optimized for Kanban Drag & Drop.
 * Minimizes bandwidth and updates stage/status immediately.
 */
export async function patchDeal(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { stageId, status, value, title, expectedCloseDate, notes } = req.body;

    const currentDeal = await prisma.deal.findUnique({
      where: { id },
      include: { stage: true },
    });

    if (!currentDeal) {
      res.status(404).json({ success: false, message: 'Oportunidad no encontrada' });
      return;
    }

    const data: any = {};
    if (stageId !== undefined) data.stageId = stageId;
    if (status !== undefined) data.status = status;
    if (value !== undefined) data.value = parseFloat(value);
    if (title !== undefined) data.title = title;
    if (expectedCloseDate !== undefined) data.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate) : null;
    if (notes !== undefined) data.notes = notes;

    // Check if new stage is WON / LOST
    if (stageId && stageId !== currentDeal.stageId) {
      const targetStage = await prisma.dealStage.findUnique({ where: { id: stageId } });
      if (targetStage) {
        if (targetStage.name.toLowerCase().includes('ganada')) {
          data.status = 'WON';
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
      { oldStageId: currentDeal.stageId, newStageId: updated.stageId, status: updated.status },
      req.ip
    );

    // Broadcast real-time WebSocket events
    wsService.broadcast('deal:updated', updated);
    if (currentDeal.stageId !== updated.stageId) {
      wsService.broadcast('notification:new', {
        title: 'Fase de Negocio actualizada',
        desc: `${updated.title} avanza a "${updated.stage.name}" (€${updated.value})`,
        type: 'deal',
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
    await prisma.deal.delete({ where: { id } });
    await logAudit(req.user?.id || null, 'DELETE', 'Deal', id, {}, req.ip);
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
