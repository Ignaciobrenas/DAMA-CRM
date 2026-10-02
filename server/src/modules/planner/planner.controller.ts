import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { getRequestTenant, isGodSuperAdmin } from '../../utils/tenant';

// -----------------------------------------------------------------------------
// Boards (Agile Projects / Kanban Boards)
// -----------------------------------------------------------------------------

export async function getBoards(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    const boards = await prisma.board.findMany({
      where,
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              include: {
                assignee: { select: { id: true, name: true, email: true, avatar: true } },
                supervisor: { select: { id: true, name: true, email: true, avatar: true } },
                assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } },
                watchers: { select: { userId: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        sprints: { orderBy: { createdAt: 'desc' } },
        members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: boards });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getBoardById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              include: {
                assignee: { select: { id: true, name: true, email: true, avatar: true } },
                supervisor: { select: { id: true, name: true, email: true, avatar: true } },
                assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } },
                watchers: { select: { userId: true } },
                comments: {
                  include: { user: { select: { id: true, name: true, avatar: true } }, attachments: true },
                  orderBy: { createdAt: 'asc' },
                },
                activities: {
                  include: { user: { select: { id: true, name: true, avatar: true } } },
                  orderBy: { createdAt: 'desc' },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        sprints: { orderBy: { createdAt: 'desc' } },
        members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
        githubRepos: true,
        forgejoRepos: true,
      },
    });

    if (!board) {
      res.status(404).json({ success: false, message: 'Tablero no encontrado' });
      return;
    }

    if (!isSuper && board.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'Acceso denegado a este tablero' });
      return;
    }

    res.json({ success: true, data: board });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createBoard(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const { name, description, color, methodology, boardType, budgetedHours } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'El nombre del tablero es obligatorio' });
      return;
    }

    const key = name.trim().slice(0, 4).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);

    const board = await prisma.board.create({
      data: {
        key,
        name: name.trim(),
        description: description ? description.trim() : null,
        color: color || 'gradient-primary',
        methodology: methodology || 'scrum',
        boardType: boardType || 'individual',
        budgetedHours: budgetedHours ? parseFloat(budgetedHours) : null,
        tenantId,
        columns: {
          create: [
            { title: 'Por Hacer', status: 'todo', position: 0 },
            { title: 'En Progreso', status: 'in_progress', position: 1 },
            { title: 'En Revisión', status: 'review', position: 2 },
            { title: 'Completado', status: 'done', position: 3 },
          ],
        },
      },
      include: {
        columns: { orderBy: { position: 'asc' }, include: { tasks: true } },
      },
    });

    res.status(201).json({ success: true, data: board, message: 'Tablero creado con éxito' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateBoard(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, description, color, methodology, archived, budgetedHours } = req.body;

    const board = await prisma.board.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        description: description !== undefined ? (description ? description.trim() : null) : undefined,
        color: color || undefined,
        methodology: methodology || undefined,
        archived: archived !== undefined ? Boolean(archived) : undefined,
        budgetedHours: budgetedHours !== undefined ? (budgetedHours ? parseFloat(budgetedHours) : null) : undefined,
      },
      include: {
        columns: { orderBy: { position: 'asc' } },
      },
    });

    res.json({ success: true, data: board, message: 'Tablero actualizado' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteBoard(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.board.delete({ where: { id } });
    res.json({ success: true, message: 'Tablero eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// -----------------------------------------------------------------------------
// Columns
// -----------------------------------------------------------------------------

export async function createColumn(req: Request, res: Response): Promise<void> {
  try {
    const { boardId, title, wipLimit, allowedRoles } = req.body;

    if (!boardId || !title) {
      res.status(400).json({ success: false, message: 'Se requiere boardId y título' });
      return;
    }

    const existingCount = await prisma.boardColumn.count({ where: { boardId } });

    const column = await prisma.boardColumn.create({
      data: {
        boardId,
        title: title.trim(),
        position: existingCount,
        wipLimit: wipLimit ? parseInt(wipLimit, 10) : null,
        allowedRoles: allowedRoles ? JSON.stringify(allowedRoles) : '[]',
      },
    });

    res.status(201).json({ success: true, data: column });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateColumn(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, position, wipLimit, allowedRoles, blockedUserIds } = req.body;

    const column = await prisma.boardColumn.update({
      where: { id },
      data: {
        title: title ? title.trim() : undefined,
        position: position !== undefined ? parseInt(position, 10) : undefined,
        wipLimit: wipLimit !== undefined ? (wipLimit ? parseInt(wipLimit, 10) : null) : undefined,
        allowedRoles: allowedRoles !== undefined ? JSON.stringify(allowedRoles) : undefined,
        blockedUserIds: blockedUserIds !== undefined ? JSON.stringify(blockedUserIds) : undefined,
      },
    });

    res.json({ success: true, data: column });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteColumn(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.boardColumn.delete({ where: { id } });
    res.json({ success: true, message: 'Columna eliminada' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// -----------------------------------------------------------------------------
// Board Tasks
// -----------------------------------------------------------------------------

export async function createBoardTask(req: Request, res: Response): Promise<void> {
  try {
    const { boardId, columnId, title, description, priority, type, dueDate, assigneeId, supervisorId, labels } = req.body;

    if (!boardId || !title) {
      res.status(400).json({ success: false, message: 'Tablero y título son obligatorios' });
      return;
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { columns: { orderBy: { position: 'asc' }, take: 1 } },
    });

    if (!board) {
      res.status(404).json({ success: false, message: 'Tablero no encontrado' });
      return;
    }

    const targetColumnId = columnId || (board.columns[0] ? board.columns[0].id : null);
    const key = (board.key || 'TASK') + '-' + Math.floor(1000 + Math.random() * 9000);

    const task = await prisma.boardTask.create({
      data: {
        boardId,
        columnId: targetColumnId,
        key,
        title: title.trim(),
        description: description ? description.trim() : null,
        priority: priority || 'medium',
        type: type || 'task',
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
        supervisorId: supervisorId || null,
        labels: labels ? (typeof labels === 'string' ? labels : JSON.stringify(labels)) : '[]',
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        column: { select: { id: true, title: true } },
      },
    });

    res.status(201).json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateBoardTask(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, description, columnId, status, priority, type, dueDate, assigneeId, supervisorId, labels, verified } = req.body;

    const data: any = {};
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description ? description.trim() : null;
    if (columnId !== undefined) data.columnId = columnId;
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (type !== undefined) data.type = type;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) data.assigneeId = assigneeId || null;
    if (supervisorId !== undefined) data.supervisorId = supervisorId || null;
    if (labels !== undefined) data.labels = typeof labels === 'string' ? labels : JSON.stringify(labels);
    if (verified !== undefined) {
      data.verified = Boolean(verified);
      data.verifiedAt = verified ? new Date() : null;
    }

    const updated = await prisma.boardTask.update({
      where: { id },
      data,
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        supervisor: { select: { id: true, name: true, avatar: true } },
        column: { select: { id: true, title: true } },
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteBoardTask(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.boardTask.delete({ where: { id } });
    res.json({ success: true, message: 'Tarea eliminada correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// -----------------------------------------------------------------------------
// Reminders, Notes, Templates & Changelog Releases
// -----------------------------------------------------------------------------

export async function getReminders(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'No autenticado' });
      return;
    }

    const reminders = await prisma.plannerReminder.findMany({
      where: { assignedToId: userId },
      orderBy: { scheduledAt: 'asc' },
    });

    res.json({ success: true, data: reminders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createReminder(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { title, description, scheduledAt, priority, relatedTaskId } = req.body;

    if (!userId || !title || !scheduledAt) {
      res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
      return;
    }

    const reminder = await prisma.plannerReminder.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        scheduledAt: new Date(scheduledAt),
        priority: priority || 'medium',
        createdById: userId,
        assignedToId: userId,
        relatedTaskId: relatedTaskId || null,
      },
    });

    res.status(201).json({ success: true, data: reminder });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getUserNotes(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'No autenticado' });
      return;
    }

    const notes = await prisma.userNote.findMany({
      where: { userId },
      orderBy: [{ pinned: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
    });

    res.json({ success: true, data: notes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createUserNote(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { title, content, color, pinned } = req.body;

    if (!userId || !content) {
      res.status(400).json({ success: false, message: 'El contenido es obligatorio' });
      return;
    }

    const note = await prisma.userNote.create({
      data: {
        userId,
        title: title ? title.trim() : null,
        content: content.trim(),
        color: color || 'yellow',
        pinned: Boolean(pinned),
      },
    });

    res.status(201).json({ success: true, data: note });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getTaskTemplates(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const templates = await prisma.taskTemplate.findMany({
      where: {
        OR: [
          { scope: 'general' },
          { createdById: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: templates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getChangelogReleases(req: Request, res: Response): Promise<void> {
  try {
    const releases = await prisma.changelogRelease.findMany({
      include: {
        entries: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { releasedAt: 'desc' },
    });

    res.json({ success: true, data: releases });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// -----------------------------------------------------------------------------
// Sprints Management
// -----------------------------------------------------------------------------

export async function getSprints(req: Request, res: Response): Promise<void> {
  try {
    const { boardId, status } = req.query;
    const where: any = {};
    if (boardId) where.boardId = boardId as string;
    if (status) where.status = status as string;

    const sprints = await prisma.boardSprint.findMany({
      where,
      include: {
        board: { select: { id: true, name: true, key: true } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
            column: { select: { id: true, title: true, status: true } },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    res.json({ success: true, data: sprints });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createSprint(req: Request, res: Response): Promise<void> {
  try {
    const { boardId, name, goal, startDate, endDate, status } = req.body;
    if (!boardId || !name || !startDate || !endDate) {
      res.status(400).json({ success: false, message: 'Faltan campos obligatorios para el sprint' });
      return;
    }

    const sprint = await prisma.boardSprint.create({
      data: {
        boardId,
        name: name.trim(),
        goal: goal ? goal.trim() : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status || 'planned',
      },
      include: {
        board: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ success: true, data: sprint, message: 'Sprint creado correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateSprint(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, goal, startDate, endDate, status } = req.body;

    const sprint = await prisma.boardSprint.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        goal: goal !== undefined ? (goal ? goal.trim() : null) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status: status || undefined,
      },
    });

    res.json({ success: true, data: sprint, message: 'Sprint actualizado' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteSprint(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.boardSprint.delete({ where: { id } });
    res.json({ success: true, message: 'Sprint eliminado' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// -----------------------------------------------------------------------------
// Comments & Worklogs
// -----------------------------------------------------------------------------

export async function getTaskComments(req: Request, res: Response): Promise<void> {
  try {
    const { taskId } = req.params;
    const comments = await prisma.boardTaskComment.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        attachments: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ success: true, data: comments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createTaskComment(req: Request, res: Response): Promise<void> {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ success: false, message: 'El contenido del comentario es obligatorio' });
      return;
    }

    const comment = await prisma.boardTaskComment.create({
      data: {
        taskId,
        userId: userId || null,
        content: content.trim(),
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        attachments: true,
      },
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteTaskComment(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.boardTaskComment.delete({ where: { id } });
    res.json({ success: true, message: 'Comentario eliminado' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// -----------------------------------------------------------------------------
// Reminders & User Notes Mutations
// -----------------------------------------------------------------------------

export async function updateReminder(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, snoozedUntil, priority, title, description, scheduledAt } = req.body;

    const reminder = await prisma.plannerReminder.update({
      where: { id },
      data: {
        status: status || undefined,
        snoozedUntil: snoozedUntil ? new Date(snoozedUntil) : undefined,
        priority: priority || undefined,
        title: title ? title.trim() : undefined,
        description: description !== undefined ? (description ? description.trim() : null) : undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      },
    });

    res.json({ success: true, data: reminder });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteReminder(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.plannerReminder.delete({ where: { id } });
    res.json({ success: true, message: 'Recordatorio eliminado' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateUserNote(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, content, color, pinned, order } = req.body;

    const note = await prisma.userNote.update({
      where: { id },
      data: {
        title: title !== undefined ? (title ? title.trim() : null) : undefined,
        content: content ? content.trim() : undefined,
        color: color || undefined,
        pinned: pinned !== undefined ? Boolean(pinned) : undefined,
        order: order !== undefined ? parseInt(order, 10) : undefined,
      },
    });

    res.json({ success: true, data: note });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteUserNote(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.userNote.delete({ where: { id } });
    res.json({ success: true, message: 'Nota eliminada' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createTaskTemplate(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { name, description, content, scope } = req.body;

    if (!name || !content) {
      res.status(400).json({ success: false, message: 'Se requiere nombre y contenido para la plantilla' });
      return;
    }

    const template = await prisma.taskTemplate.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        content: content.trim(),
        scope: scope || 'personal',
        createdById: userId || null,
      },
    });

    res.status(201).json({ success: true, data: template });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteTaskTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.taskTemplate.delete({ where: { id } });
    res.json({ success: true, message: 'Plantilla eliminada' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createChangelogRelease(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { version, title, entries } = req.body;

    if (!version) {
      res.status(400).json({ success: false, message: 'La versión es obligatoria' });
      return;
    }

    const release = await prisma.changelogRelease.create({
      data: {
        version: version.trim(),
        title: title ? title.trim() : null,
        createdById: userId || null,
        entries: {
          create: Array.isArray(entries)
            ? entries.map((e: any, idx: number) => ({
                category: e.category || 'feature',
                description: e.description,
                issueNumber: e.issueNumber ? parseInt(e.issueNumber, 10) : null,
                issueUrl: e.issueUrl || null,
                order: idx,
              }))
            : [],
        },
      },
      include: { entries: true },
    });

    res.status(201).json({ success: true, data: release });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// -----------------------------------------------------------------------------
// Odoo ERP Integration for Agile Planner
// -----------------------------------------------------------------------------

import { IntegrationsService } from '../integrations/integrations.service';

export async function getOdooStatus(req: Request, res: Response): Promise<void> {
  try {
    const config = IntegrationsService.loadConfig().odoo;
    res.json({
      success: true,
      data: {
        enabled: config.enabled,
        status: config.status,
        url: config.url,
        db: config.db,
        username: config.username,
        lastSyncAt: config.lastSyncAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function syncOdoo(req: Request, res: Response): Promise<void> {
  try {
    const result = await IntegrationsService.syncOdooAgilePlanner();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}


