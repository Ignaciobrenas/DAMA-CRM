import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { logAudit } from '../../middlewares/audit.middleware';

export async function listProjects(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = String(status);

    const projects = await prisma.project.findMany({
      where,
      include: {
        deal: { select: { id: true, title: true } },
        sprints: { select: { id: true, name: true, status: true } },
        tasks: { select: { id: true, status: true, storyPoints: true, estimatedHours: true, loggedHours: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = projects.map((p) => {
      const totalTasks = p.tasks.length;
      const completedTasks = p.tasks.filter((t) => t.status === 'DONE').length;
      const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const totalStoryPoints = p.tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      const totalEstimatedHours = p.tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
      const totalLoggedHours = p.tasks.reduce((sum, t) => sum + (t.loggedHours || 0), 0);

      return {
        ...p,
        metrics: {
          totalTasks,
          completedTasks,
          progressPercent,
          totalStoryPoints,
          totalEstimatedHours,
          totalLoggedHours,
        },
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getProject(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        deal: true,
        sprints: { orderBy: { createdAt: 'desc' } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true, avatar: true } },
            sprint: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
      return;
    }

    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createProject(req: Request, res: Response): Promise<void> {
  try {
    const { name, description, status, priority, dealId, startDate, endDate, budget } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'El nombre del proyecto es obligatorio' });
      return;
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        status: status || 'ACTIVE',
        priority: priority || 'MEDIUM',
        dealId: dealId || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? parseFloat(budget) : null,
      },
    });

    await logAudit((req as any).user?.id || null, 'CREATE', 'Project', project.id, { name: project.name }, req.ip);

    res.status(201).json({ success: true, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, description, status, priority, dealId, startDate, endDate, budget } = req.body;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
      return;
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        description: description !== undefined ? description?.trim() : undefined,
        status: status || undefined,
        priority: priority || undefined,
        dealId: dealId !== undefined ? (dealId || null) : undefined,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        budget: budget !== undefined ? (budget ? parseFloat(budget) : null) : undefined,
      },
    });

    await logAudit(
      (req as any).user?.id || null,
      'UPDATE',
      'Project',
      updated.id,
      { name: updated.name },
      req.ip
    );

    res.json({ success: true, data: updated, message: 'Proyecto actualizado con éxito' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
      return;
    }

    // Cascade delete tasks and sprints first
    await prisma.task.deleteMany({ where: { projectId: id } });
    await prisma.sprint.deleteMany({ where: { projectId: id } });
    await prisma.project.delete({ where: { id } });

    await logAudit(
      (req as any).user?.id || null,
      'DELETE',
      'Project',
      id,
      { name: existing.name },
      req.ip
    );

    res.json({ success: true, message: `Proyecto "${existing.name}" eliminado correctamente` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createSprint(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const { name, goal, startDate, endDate } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'El nombre del sprint es obligatorio' });
      return;
    }

    const sprint = await prisma.sprint.create({
      data: {
        projectId,
        name: name.trim(),
        goal: goal ? goal.trim() : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: 'ACTIVE',
      },
    });

    res.status(201).json({ success: true, data: sprint });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function listTasks(req: Request, res: Response): Promise<void> {
  try {
    const { projectId, sprintId, assigneeId, status } = req.query;
    const where: any = {};
    if (projectId) where.projectId = String(projectId);
    if (sprintId) where.sprintId = String(sprintId);
    if (assigneeId) where.assigneeId = String(assigneeId);
    if (status) where.status = String(status);

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        project: { select: { id: true, name: true } },
        sprint: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createTask(req: Request, res: Response): Promise<void> {
  try {
    const { projectId, sprintId, title, description, status, priority, storyPoints, estimatedHours, assigneeId, dueDate } = req.body;

    if (!projectId || !title) {
      res.status(400).json({ success: false, message: 'Proyecto y título son obligatorios' });
      return;
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        sprintId: sprintId || null,
        title: title.trim(),
        description: description ? description.trim() : null,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        storyPoints: storyPoints ? parseInt(storyPoints, 10) : 1,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : 0,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    await logAudit((req as any).user?.id || null, 'CREATE', 'Task', task.id, { title: task.title }, req.ip);

    res.status(201).json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function patchTask(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, priority, storyPoints, estimatedHours, loggedHours, assigneeId, sprintId, dueDate, title, description } = req.body;

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (storyPoints !== undefined) data.storyPoints = parseInt(storyPoints, 10);
    if (estimatedHours !== undefined) data.estimatedHours = parseFloat(estimatedHours);
    if (loggedHours !== undefined) data.loggedHours = parseFloat(loggedHours);
    if (assigneeId !== undefined) data.assigneeId = assigneeId || null;
    if (sprintId !== undefined) data.sprintId = sprintId || null;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description ? description.trim() : null;

    const updated = await prisma.task.update({
      where: { id },
      data,
      include: {
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        project: { select: { id: true, name: true } },
        sprint: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, data: updated, message: 'Tarea actualizada' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Tarea no encontrada' });
      return;
    }

    await prisma.task.delete({ where: { id } });

    await logAudit(
      (req as any).user?.id || null,
      'DELETE',
      'Task',
      id,
      { title: existing.title },
      req.ip
    );

    res.json({ success: true, message: `Tarea "${existing.title}" eliminada correctamente` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getMyTasks(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    const myTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { not: 'DONE' },
      },
      include: {
        project: { select: { id: true, name: true } },
        sprint: { select: { id: true, name: true } },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: myTasks,
      count: myTasks.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
