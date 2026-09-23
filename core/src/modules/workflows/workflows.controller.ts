import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { dispatchWorkflowEvent } from './workflow.runner';
import { logAudit } from '../../middlewares/audit.middleware';

export async function listWorkflows(req: Request, res: Response): Promise<void> {
  try {
    const workflows = await prisma.workflow.findMany({
      include: {
        _count: { select: { logs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: workflows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createWorkflow(req: Request, res: Response): Promise<void> {
  try {
    const { name, description, trigger, triggerConfig, action, actionConfig } = req.body;

    if (!name || !trigger || !action) {
      res.status(400).json({ success: false, message: 'Nombre, disparador y acción son obligatorios' });
      return;
    }

    const workflow = await prisma.workflow.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        trigger,
        triggerConfig: triggerConfig ? JSON.stringify(triggerConfig) : null,
        action,
        actionConfig: actionConfig ? JSON.stringify(actionConfig) : null,
        isActive: true,
      },
    });

    await logAudit((req as any).user?.id || null, 'CREATE', 'Workflow', workflow.id, { name: workflow.name }, req.ip);

    res.status(201).json({ success: true, data: workflow });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateWorkflow(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, description, trigger, action, isActive } = req.body;

    const existing = await prisma.workflow.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Workflow no encontrado' });
      return;
    }

    const updated = await prisma.workflow.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        description: description !== undefined ? description?.trim() : undefined,
        trigger: trigger || undefined,
        action: action || undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    await logAudit(
      (req as any).user?.id || null,
      'UPDATE',
      'Workflow',
      updated.id,
      { name: updated.name },
      req.ip
    );

    res.json({ success: true, data: updated, message: 'Workflow actualizado correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteWorkflow(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await prisma.workflow.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Workflow no encontrado' });
      return;
    }

    // Cascade delete execution logs
    await prisma.workflowLog.deleteMany({ where: { workflowId: id } });
    await prisma.workflow.delete({ where: { id } });

    await logAudit(
      (req as any).user?.id || null,
      'DELETE',
      'Workflow',
      id,
      { name: existing.name },
      req.ip
    );

    res.json({ success: true, message: `Workflow "${existing.name}" eliminado correctamente` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function toggleWorkflow(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const updated = await prisma.workflow.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function triggerTestWorkflow(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const workflow = await prisma.workflow.findUnique({ where: { id } });

    if (!workflow) {
      res.status(404).json({ success: false, message: 'Workflow no encontrado' });
      return;
    }

    // Trigger test event
    await dispatchWorkflowEvent({
      trigger: workflow.trigger,
      data: {
        test: true,
        title: 'Oportunidad de Prueba Automática',
        email: 'test@cliente.com',
        value: 12500,
        timestamp: new Date().toISOString(),
      },
    });

    res.json({
      success: true,
      message: `Disparo de prueba lanzado para el workflow '${workflow.name}'. Verifique los registros en unos instantes.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getWorkflowLogs(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const logs = await prisma.workflowLog.findMany({
      where: id ? { workflowId: id } : {},
      include: {
        workflow: { select: { id: true, name: true } },
      },
      orderBy: { executedAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
