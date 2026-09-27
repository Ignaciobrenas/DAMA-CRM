import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { executeWorkflow } from './workflow.runner';
import { logAudit } from '../../middlewares/audit.middleware';
import { getRequestTenant, isGodSuperAdmin } from '../../utils/tenant';

export async function listWorkflows(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    const workflows = await prisma.workflow.findMany({
      where,
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
    const tenantId = getRequestTenant(req);
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
        tenantId,
      },
    });

    await logAudit(req.user?.id || null, 'CREATE', 'Workflow', workflow.id, { name: workflow.name, tenantId }, req.ip);

    res.status(201).json({ success: true, data: workflow });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateWorkflow(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const existing = await prisma.workflow.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Workflow no encontrado' });
      return;
    }

    if (!isSuper && existing.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para modificar este flujo de trabajo' });
      return;
    }

    const { name, description, trigger, action, isActive } = req.body;

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
      req.user?.id || null,
      'UPDATE',
      'Workflow',
      updated.id,
      { name: updated.name, tenantId },
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
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const existing = await prisma.workflow.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Workflow no encontrado' });
      return;
    }

    if (!isSuper && existing.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para eliminar este flujo de trabajo' });
      return;
    }

    // Cascade delete execution logs
    await prisma.workflowLog.deleteMany({ where: { workflowId: id } });
    await prisma.workflow.delete({ where: { id } });

    await logAudit(
      req.user?.id || null,
      'DELETE',
      'Workflow',
      id,
      { name: existing.name, tenantId },
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
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const existing = await prisma.workflow.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Workflow no encontrado' });
      return;
    }

    if (!isSuper && existing.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para modificar este flujo de trabajo' });
      return;
    }

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
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const workflow = await prisma.workflow.findUnique({ where: { id } });

    if (!workflow) {
      res.status(404).json({ success: false, message: 'Workflow no encontrado' });
      return;
    }

    if (!isSuper && workflow.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes acceso a este flujo de trabajo' });
      return;
    }

    const testData: Record<string, any> = {
      test: true,
      title: `Prueba Automatizada: ${workflow.name}`,
      email: 'prueba@cliente.com',
      value: 12500,
      timestamp: new Date().toISOString(),
      tenantId,
    };

    const result = await executeWorkflow(workflow, testData);

    if (result.status === 'SUCCESS') {
      res.json({
        success: true,
        message: `Workflow '${workflow.name}' ejecutado con éxito. Estado: Completado.`,
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Error al ejecutar workflow '${workflow.name}': ${result.errorMessage}`,
        data: result,
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getWorkflowLogs(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const where: any = {};
    if (id) {
      where.workflowId = id;
    }
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.workflow = { tenantId };
    }

    const logs = await prisma.workflowLog.findMany({
      where,
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
