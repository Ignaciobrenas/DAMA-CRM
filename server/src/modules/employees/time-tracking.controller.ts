import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { wsService } from '../../services/websocket.service';
import { isSuperAdminUser, hasEmployeePermission } from './employees.controller';

/**
 * Compute exact elapsed seconds for a TimeRecord from PostgreSQL server timestamps.
 * Because clockIn, lastResumedAt, accumulatedSeconds, and isPaused are stored in PostgreSQL,
 * this calculation survives browser close, logout, or PC power-off/shutdown.
 */
export function computeRecordElapsedSeconds(rec: {
  clockIn: Date | string;
  clockOut?: Date | string | null;
  isPaused?: boolean | null;
  lastResumedAt?: Date | string | null;
  accumulatedSeconds?: number | null;
  durationMinutes?: number | null;
}): number {
  const accumulated = rec.accumulatedSeconds || 0;
  if (rec.clockOut) {
    if (accumulated > 0) return accumulated;
    const diff = Math.floor((new Date(rec.clockOut).getTime() - new Date(rec.clockIn).getTime()) / 1000);
    return Math.max(diff, (rec.durationMinutes || 0) * 60, 0);
  }
  if (rec.isPaused) {
    return Math.max(0, accumulated);
  }
  const segmentStart = new Date(rec.lastResumedAt || rec.clockIn).getTime();
  const runningSeconds = Math.max(0, Math.floor((Date.now() - segmentStart) / 1000));
  return accumulated + runningSeconds;
}

/**
 * Ensure an Employee profile exists for the authenticated user
 */
async function ensureEmployeeForUser(user: any) {
  let employee = await prisma.employee.findUnique({ where: { userId: user.id } });
  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        userId: user.id,
        tenantId: user.tenantId || 'master',
        firstName: user.name?.split(' ')[0] || 'Empleado',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email,
        status: 'ACTIVE',
      },
    });
  }
  return employee;
}

/**
 * Resolve Project & Task names if only IDs were passed
 */
async function resolveProjectAndTaskMetadata(params: {
  projectId?: string | null;
  projectName?: string | null;
  taskId?: string | null;
  taskTitle?: string | null;
}) {
  let { projectId, projectName, taskId, taskTitle } = params;

  if (taskId && (!taskTitle || !projectId || !projectName)) {
    const agileTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { id: true, name: true } } },
    });
    if (agileTask) {
      taskTitle = taskTitle || agileTask.title;
      projectId = projectId || agileTask.projectId;
      projectName = projectName || agileTask.project?.name || null;
    } else {
      const boardTask = await prisma.boardTask.findUnique({
        where: { id: taskId },
        include: { board: { select: { id: true, name: true } } },
      });
      if (boardTask) {
        taskTitle = taskTitle || `[${boardTask.key}] ${boardTask.title}`;
        projectId = projectId || boardTask.boardId;
        projectName = projectName || boardTask.board?.name || null;
      }
    }
  }

  if (projectId && !projectName) {
    const proj = await prisma.project.findUnique({ where: { id: projectId }, select: { name: true } });
    if (proj) {
      projectName = proj.name;
    } else {
      const board = await prisma.board.findUnique({ where: { id: projectId }, select: { name: true } });
      if (board) projectName = board.name;
    }
  }

  return {
    projectId: projectId || null,
    projectName: projectName || null,
    taskId: taskId || null,
    taskTitle: taskTitle || null,
  };
}

/**
 * Helper to finalize an active TimeRecord and auto-log TaskWorkLog if linked to a task
 */
async function finalizeTimeRecord(activeClock: any, user: any, extraNotes?: string) {
  const now = new Date();
  const totalSeconds = computeRecordElapsedSeconds(activeClock);
  const durationMinutes = Math.max(1, Math.round(totalSeconds / 60));
  const decimalHours = Math.max(0.02, Math.round((totalSeconds / 3600) * 100) / 100);

  const combinedNotes = extraNotes
    ? `${activeClock.notes ? activeClock.notes + ' — ' : ''}${extraNotes}`
    : activeClock.notes;

  const updated = await prisma.timeRecord.update({
    where: { id: activeClock.id },
    data: {
      clockOut: now,
      durationMinutes,
      accumulatedSeconds: totalSeconds,
      isPaused: false,
      pausedAt: null,
      notes: combinedNotes,
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  // Automatically create TaskWorkLog if linked to an Agile Task
  let createdWorkLog = null;
  if (activeClock.taskId) {
    const existingAgileTask = await prisma.task.findUnique({ where: { id: activeClock.taskId } });
    if (existingAgileTask) {
      createdWorkLog = await prisma.taskWorkLog.create({
        data: {
          taskId: activeClock.taskId,
          userId: user?.id || activeClock.userId || null,
          userName: user?.name || 'Empleado',
          hours: decimalHours,
          description: combinedNotes || activeClock.reason || `Timer Harvest (${activeClock.taskTitle || existingAgileTask.title})`,
          isBillable: activeClock.isBillable ?? true,
          timeRecordId: activeClock.id,
          date: now,
        },
      });

      const allLogs = await prisma.taskWorkLog.findMany({ where: { taskId: activeClock.taskId } });
      const totalLogged = allLogs.reduce((sum, log) => sum + log.hours, 0);
      await prisma.task.update({
        where: { id: activeClock.taskId },
        data: { loggedHours: Math.round(totalLogged * 100) / 100 },
      });
    } else if (user?.id) {
      const existingBoardTask = await prisma.boardTask.findUnique({ where: { id: activeClock.taskId } });
      if (existingBoardTask) {
        await prisma.boardTaskActivity.create({
          data: {
            taskId: existingBoardTask.id,
            userId: user.id,
            type: 'time_logged',
            content: `Tiempo registrado en Harvest Timer: ${decimalHours}h`,
            metadata: JSON.stringify({
              hours: decimalHours,
              seconds: totalSeconds,
              isBillable: activeClock.isBillable ?? true,
              notes: combinedNotes,
            }),
          },
        });
      }
    }
  }

  return { updated, totalSeconds, durationMinutes, decimalHours, createdWorkLog };
}

export const clockIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const {
      type = 'WORK',
      reason = 'Oficina Central',
      notes,
      location,
      projectId,
      projectName,
      taskId,
      taskTitle,
      isBillable = true,
      switchTask = false,
    } = req.body;

    const employee = await ensureEmployeeForUser(user);
    const resolvedMeta = await resolveProjectAndTaskMetadata({ projectId, projectName, taskId, taskTitle });

    // Check if there is already an active (unclosed) clock-in record
    const activeClock = await prisma.timeRecord.findFirst({
      where: {
        employeeId: employee.id,
        clockOut: null,
      },
      orderBy: { clockIn: 'desc' },
    });

    if (activeClock) {
      // Harvest-style seamless task switching: if switching to a different task or switchTask=true, close previous and start new
      const isDifferentTask =
        switchTask ||
        (resolvedMeta.taskId && resolvedMeta.taskId !== activeClock.taskId) ||
        (resolvedMeta.projectId && resolvedMeta.projectId !== activeClock.projectId);

      if (isDifferentTask) {
        await finalizeTimeRecord(activeClock, user);
      } else {
        // Update metadata on active timer and return it
        const updatedActive = await prisma.timeRecord.update({
          where: { id: activeClock.id },
          data: {
            reason: reason || activeClock.reason,
            notes: notes !== undefined ? notes : activeClock.notes,
            projectId: resolvedMeta.projectId ?? activeClock.projectId,
            projectName: resolvedMeta.projectName ?? activeClock.projectName,
            taskId: resolvedMeta.taskId ?? activeClock.taskId,
            taskTitle: resolvedMeta.taskTitle ?? activeClock.taskTitle,
            isBillable: isBillable !== undefined ? Boolean(isBillable) : activeClock.isBillable,
          },
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        });

        const elapsedSeconds = computeRecordElapsedSeconds(updatedActive);
        res.json({
          success: true,
          data: { ...updatedActive, elapsedSeconds },
          message: 'Timer activo sincronizado correctamente',
        });
        return;
      }
    }

    const now = new Date();
    const newRecord = await prisma.timeRecord.create({
      data: {
        employeeId: employee.id,
        userId: user.id,
        tenantId: employee.tenantId || user.tenantId || 'master',
        clockIn: now,
        lastResumedAt: now,
        accumulatedSeconds: 0,
        isPaused: false,
        pausedAt: null,
        type,
        reason,
        notes: notes || null,
        location: location || null,
        ipAddress: req.ip,
        status: 'VALID',
        projectId: resolvedMeta.projectId,
        projectName: resolvedMeta.projectName,
        taskId: resolvedMeta.taskId,
        taskTitle: resolvedMeta.taskTitle,
        isBillable: Boolean(isBillable),
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    const payload = { ...newRecord, elapsedSeconds: 0 };

    // Real-time broadcast for web tabs & browser extensions
    wsService.broadcast('attendance:clock_in', {
      employeeId: employee.id,
      userId: user.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      clockIn: newRecord.clockIn,
      reason: newRecord.reason,
      projectId: newRecord.projectId,
      projectName: newRecord.projectName,
      taskId: newRecord.taskId,
      taskTitle: newRecord.taskTitle,
      isBillable: newRecord.isBillable,
    });
    wsService.broadcast('timer:updated', { userId: user.id, activeRecord: payload, isClockedIn: true });

    res.status(201).json({
      success: true,
      data: payload,
      message: resolvedMeta.taskTitle
        ? `Timer iniciado en "${resolvedMeta.taskTitle}"`
        : '¡Fichaje de entrada registrado correctamente!',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al registrar fichaje de entrada', error: error.message });
  }
};

export const pauseTimer = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const employee = await ensureEmployeeForUser(user);

    const activeClock = await prisma.timeRecord.findFirst({
      where: { employeeId: employee.id, clockOut: null },
      orderBy: { clockIn: 'desc' },
    });

    if (!activeClock) {
      res.status(400).json({ success: false, message: 'No tienes ningún timer activo para pausar' });
      return;
    }

    if (activeClock.isPaused) {
      const elapsedSeconds = computeRecordElapsedSeconds(activeClock);
      res.json({
        success: true,
        data: { ...activeClock, elapsedSeconds },
        message: 'El timer ya se encuentra en pausa',
      });
      return;
    }

    const now = new Date();
    const totalElapsed = computeRecordElapsedSeconds(activeClock);

    const updated = await prisma.timeRecord.update({
      where: { id: activeClock.id },
      data: {
        isPaused: true,
        pausedAt: now,
        accumulatedSeconds: totalElapsed,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    const payload = { ...updated, elapsedSeconds: totalElapsed };
    wsService.broadcast('timer:updated', { userId: user.id, activeRecord: payload, isClockedIn: true });

    res.json({
      success: true,
      data: payload,
      message: 'Timer pausado. El tiempo acumulado ha quedado guardado en el servidor.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al pausar el timer', error: error.message });
  }
};

export const resumeTimer = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const employee = await ensureEmployeeForUser(user);

    const activeClock = await prisma.timeRecord.findFirst({
      where: { employeeId: employee.id, clockOut: null },
      orderBy: { clockIn: 'desc' },
    });

    if (!activeClock) {
      res.status(400).json({ success: false, message: 'No tienes ningún timer activo para reanudar' });
      return;
    }

    if (!activeClock.isPaused) {
      const elapsedSeconds = computeRecordElapsedSeconds(activeClock);
      res.json({
        success: true,
        data: { ...activeClock, elapsedSeconds },
        message: 'El timer ya está en curso',
      });
      return;
    }

    const now = new Date();
    const updated = await prisma.timeRecord.update({
      where: { id: activeClock.id },
      data: {
        isPaused: false,
        pausedAt: null,
        lastResumedAt: now,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    const elapsedSeconds = computeRecordElapsedSeconds(updated);
    const payload = { ...updated, elapsedSeconds };
    wsService.broadcast('timer:updated', { userId: user.id, activeRecord: payload, isClockedIn: true });

    res.json({
      success: true,
      data: payload,
      message: 'Timer reanudado correctamente',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al reanudar el timer', error: error.message });
  }
};

export const updateActiveTimer = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const employee = await ensureEmployeeForUser(user);
    const { projectId, projectName, taskId, taskTitle, reason, notes, isBillable } = req.body;

    const activeClock = await prisma.timeRecord.findFirst({
      where: { employeeId: employee.id, clockOut: null },
      orderBy: { clockIn: 'desc' },
    });

    if (!activeClock) {
      res.status(404).json({ success: false, message: 'No hay ningún timer activo para actualizar' });
      return;
    }

    const resolvedMeta = await resolveProjectAndTaskMetadata({
      projectId: projectId !== undefined ? projectId : activeClock.projectId,
      projectName: projectName !== undefined ? projectName : undefined,
      taskId: taskId !== undefined ? taskId : activeClock.taskId,
      taskTitle: taskTitle !== undefined ? taskTitle : undefined,
    });

    const updated = await prisma.timeRecord.update({
      where: { id: activeClock.id },
      data: {
        projectId: projectId !== undefined ? resolvedMeta.projectId : activeClock.projectId,
        projectName: projectId !== undefined || taskId !== undefined ? resolvedMeta.projectName : activeClock.projectName,
        taskId: taskId !== undefined ? resolvedMeta.taskId : activeClock.taskId,
        taskTitle: taskId !== undefined ? resolvedMeta.taskTitle : activeClock.taskTitle,
        reason: reason !== undefined ? reason : activeClock.reason,
        notes: notes !== undefined ? notes : activeClock.notes,
        isBillable: isBillable !== undefined ? Boolean(isBillable) : activeClock.isBillable,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    const elapsedSeconds = computeRecordElapsedSeconds(updated);
    const payload = { ...updated, elapsedSeconds };
    wsService.broadcast('timer:updated', { userId: user.id, activeRecord: payload, isClockedIn: true });

    res.json({
      success: true,
      data: payload,
      message: 'Tarea y detalles del timer actualizados',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al actualizar el timer activo', error: error.message });
  }
};

export const clockOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { notes, taskId, projectId, isBillable } = req.body;

    const employee = await prisma.employee.findUnique({ where: { userId: user.id } });
    if (!employee) {
      res.status(404).json({ success: false, message: 'Empleado no encontrado' });
      return;
    }

    let activeClock = await prisma.timeRecord.findFirst({
      where: {
        employeeId: employee.id,
        clockOut: null,
      },
      orderBy: { clockIn: 'desc' },
    });

    if (!activeClock) {
      res.status(400).json({ success: false, message: 'No tienes ningún fichaje o timer activo abierto' });
      return;
    }

    // Allow attaching task/project/billable at stop time if provided
    if (taskId !== undefined || projectId !== undefined || isBillable !== undefined) {
      const resolvedMeta = await resolveProjectAndTaskMetadata({
        projectId: projectId ?? activeClock.projectId,
        taskId: taskId ?? activeClock.taskId,
      });
      activeClock = await prisma.timeRecord.update({
        where: { id: activeClock.id },
        data: {
          projectId: resolvedMeta.projectId,
          projectName: resolvedMeta.projectName,
          taskId: resolvedMeta.taskId,
          taskTitle: resolvedMeta.taskTitle,
          isBillable: isBillable !== undefined ? Boolean(isBillable) : activeClock.isBillable,
        },
      });
    }

    const { updated, totalSeconds, durationMinutes, decimalHours, createdWorkLog } = await finalizeTimeRecord(
      activeClock,
      user,
      notes
    );

    // Real-time broadcast
    wsService.broadcast('attendance:clock_out', {
      employeeId: employee.id,
      userId: user.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      clockOut: updated.clockOut,
      durationMinutes,
      totalSeconds,
    });
    wsService.broadcast('timer:updated', { userId: user.id, activeRecord: null, isClockedIn: false });

    res.json({
      success: true,
      data: {
        ...updated,
        elapsedSeconds: totalSeconds,
        decimalHours,
        workLog: createdWorkLog,
      },
      message: `¡Tiempo registrado! Total: ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m${
        updated.taskTitle ? ` imputados a "${updated.taskTitle}"` : ' trabajados'
      }`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al registrar fichaje de salida', error: error.message });
  }
};

export const getClockStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const employee = await prisma.employee.findUnique({ where: { userId: user.id } });

    if (!employee) {
      res.json({
        success: true,
        data: {
          isClockedIn: false,
          activeRecord: null,
          todayMinutes: 0,
          todaySeconds: 0,
          todayRecordCount: 0,
          todayRecords: [],
          weekMinutes: 0,
          serverTimestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const activeRecord = await prisma.timeRecord.findFirst({
      where: { employeeId: employee.id, clockOut: null },
      orderBy: { clockIn: 'desc' },
    });

    // Calculate today's total worked minutes & seconds
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayRecords = await prisma.timeRecord.findMany({
      where: {
        employeeId: employee.id,
        clockIn: { gte: startOfToday },
      },
      orderBy: { clockIn: 'desc' },
    });

    let todaySeconds = 0;
    const enrichedTodayRecords = todayRecords.map((rec) => {
      const recSeconds = computeRecordElapsedSeconds(rec);
      todaySeconds += recSeconds;
      return {
        ...rec,
        elapsedSeconds: recSeconds,
      };
    });

    const todayMinutes = Math.round(todaySeconds / 60);
    const activeElapsedSeconds = activeRecord ? computeRecordElapsedSeconds(activeRecord) : 0;

    res.json({
      success: true,
      data: {
        isClockedIn: !!activeRecord,
        activeRecord: activeRecord
          ? {
              ...activeRecord,
              elapsedSeconds: activeElapsedSeconds,
            }
          : null,
        todayMinutes,
        todaySeconds,
        todayRecordCount: todayRecords.length,
        todayRecords: enrichedTodayRecords,
        employee,
        serverTimestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al consultar estado de fichaje', error: error.message });
  }
};

/**
 * GET /api/employees/time-tracking/tasks
 * Returns unified list of Projects and Tasks (from both Agile Projects and Planner Boards)
 * for Harvest-style task & project selection in Topbar Popup, MyTime, and Browser Extensions.
 */
export const getTrackableTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const isSuper = isSuperAdminUser(user);
    const tenantId = user?.tenantId || 'master';

    const [agileProjects, agileTasks, boards, boardTasks] = await Promise.all([
      prisma.project.findMany({
        where: isSuper ? undefined : { tenantId },
        select: { id: true, name: true, status: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.findMany({
        where: isSuper ? undefined : { project: { tenantId } },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          projectId: true,
          loggedHours: true,
          estimatedHours: true,
          project: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 150,
      }),
      prisma.board.findMany({
        where: isSuper ? { archived: false } : { tenantId, archived: false },
        select: { id: true, key: true, name: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.boardTask.findMany({
        where: isSuper ? undefined : { board: { tenantId } },
        select: {
          id: true,
          key: true,
          title: true,
          status: true,
          priority: true,
          boardId: true,
          board: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 150,
      }),
    ]);

    const projects = [
      ...agileProjects.map((p) => ({ id: p.id, name: p.name, source: 'agile' })),
      ...boards.map((b) => ({ id: b.id, name: b.name, key: b.key, source: 'planner' })),
    ];

    const tasks = [
      ...agileTasks.map((t) => ({
        id: t.id,
        key: `AGL-${t.id.slice(0, 4).toUpperCase()}`,
        title: t.title,
        status: t.status,
        priority: t.priority,
        projectId: t.projectId,
        projectName: t.project?.name || 'Proyecto Ágil',
        loggedHours: t.loggedHours || 0,
        estimatedHours: t.estimatedHours || 0,
        source: 'agile',
      })),
      ...boardTasks.map((bt) => ({
        id: bt.id,
        key: bt.key,
        title: bt.title,
        status: bt.status,
        priority: bt.priority,
        projectId: bt.boardId,
        projectName: bt.board?.name || 'Tablero Planner',
        loggedHours: 0,
        estimatedHours: 0,
        source: 'planner',
      })),
    ];

    res.json({
      success: true,
      data: {
        projects,
        tasks,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener tareas para fichaje', error: error.message });
  }
};

export const getTimeHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const isSuper = isSuperAdminUser(user);
    const isHrOrAdmin = hasEmployeePermission(user, 'read');
    const { employeeId, startDate, endDate, limit = 50 } = req.query;

    const where: any = {};

    if (!isHrOrAdmin) {
      const myEmployee = await prisma.employee.findUnique({ where: { userId: user.id } });
      if (!myEmployee) {
        res.json({ success: true, data: [] });
        return;
      }
      where.employeeId = myEmployee.id;
    } else {
      if (!isSuper) {
        where.tenantId = user?.tenantId || 'master';
      }
      if (employeeId) {
        where.employeeId = String(employeeId);
      }
    }

    if (startDate || endDate) {
      where.clockIn = {
        ...(startDate ? { gte: new Date(String(startDate)) } : {}),
        ...(endDate ? { lte: new Date(String(endDate)) } : {}),
      };
    }

    const records = await prisma.timeRecord.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, jobTitle: true, department: true } },
      },
      orderBy: { clockIn: 'desc' },
      take: Math.min(Number(limit) || 50, 100),
    });

    const enriched = records.map((r) => ({
      ...r,
      elapsedSeconds: computeRecordElapsedSeconds(r),
    }));

    res.json({ success: true, data: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al consultar histórico de fichajes', error: error.message });
  }
};

export const syncWithOdooAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const isSuper = isSuperAdminUser(user);
    const isHrOrAdmin = user?.role === 'ADMIN' || user?.role === 'HR' || isSuper;

    if (!isHrOrAdmin) {
      res.status(403).json({ success: false, message: 'Permisos insuficientes para sincronizar con Odoo' });
      return;
    }

    const { IntegrationsService } = require('../integrations/integrations.service');
    const result = await IntegrationsService.syncConnector('odoo');

    res.json({
      success: true,
      data: result,
      message: 'Fichajes y asistencias sincronizados bidireccionalmente con Odoo HR (hr.attendance)',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al sincronizar con Odoo', error: error.message });
  }
};

/**
 * GET /api/employees/time-tracking/export/csv
 * Export labor time records / fichajes to CSV / Excel
 */
export const exportTimeRecordsCsv = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const isSuper = isSuperAdminUser(user);
    const isHrOrAdmin = user?.role === 'ADMIN' || user?.role === 'HR' || isSuper;
    const { generateCsvBuffer } = await import('../../services/report-exporter.service');

    const where: any = {};
    if (!isHrOrAdmin) {
      const myEmployee = await prisma.employee.findUnique({ where: { userId: user.id } });
      if (!myEmployee) {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=registro_jornada_${Date.now()}.csv`);
        res.send(generateCsvBuffer(['Empleado', 'Fecha', 'Entrada', 'Salida', 'Horas', 'Proyecto', 'Tarea', 'Tipo'], []));
        return;
      }
      where.employeeId = myEmployee.id;
    } else {
      if (!isSuper) {
        where.tenantId = user?.tenantId || 'master';
      }
    }

    const records = await prisma.timeRecord.findMany({
      where,
      include: {
        employee: { select: { firstName: true, lastName: true, email: true, jobTitle: true } },
      },
      orderBy: { clockIn: 'desc' },
      take: 1000,
    });

    const headers = [
      'Empleado',
      'Puesto / Cargo',
      'Fecha',
      'Hora Entrada',
      'Hora Salida',
      'Duración (Minutos)',
      'Total Horas',
      'Proyecto',
      'Tarea',
      'Facturable',
      'Tipo Jornada',
      'Motivo / Justificación',
      'Ubicación / IP',
      'Estado',
    ];

    const rows = records.map((r) => {
      const cIn = new Date(r.clockIn);
      const cOut = r.clockOut ? new Date(r.clockOut) : null;
      const hours = r.durationMinutes ? (r.durationMinutes / 60).toFixed(2) : 'En curso';
      return [
        r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : 'Empleado',
        r.employee?.jobTitle || '',
        cIn.toLocaleDateString('es-ES'),
        cIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cOut ? cOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'En curso',
        r.durationMinutes || 0,
        hours,
        r.projectName || '',
        r.taskTitle || '',
        r.isBillable ? 'Sí' : 'No',
        r.type,
        r.reason || '',
        r.location || r.ipAddress || 'Oficina',
        r.status,
      ];
    });

    const csvBuf = generateCsvBuffer(headers, rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=registro_jornada_${user?.tenantId || 'empresa'}_${Date.now()}.csv`);
    res.send(csvBuf);
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al exportar registro de jornada', error: error.message });
  }
};

/**
 * GET /api/employees/time-tracking/export/pdf
 * Export official Spanish Labor Law (Estatuto de los Trabajadores art. 34.9) Workday PDF Report
 */
export const exportTimeRecordsPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const isSuper = isSuperAdminUser(user);
    const isHrOrAdmin = user?.role === 'ADMIN' || user?.role === 'HR' || isSuper;
    const { generateReportPdf } = await import('../../services/report-exporter.service');

    const where: any = {};
    if (!isHrOrAdmin) {
      const myEmployee = await prisma.employee.findUnique({ where: { userId: user.id } });
      if (!myEmployee) {
        res.status(404).json({ success: false, message: 'Perfil de empleado no encontrado' });
        return;
      }
      where.employeeId = myEmployee.id;
    } else {
      if (!isSuper) {
        where.tenantId = user?.tenantId || 'master';
      }
    }

    const records = await prisma.timeRecord.findMany({
      where,
      include: {
        employee: { select: { firstName: true, lastName: true, jobTitle: true } },
      },
      orderBy: { clockIn: 'desc' },
      take: 50,
    });

    const totalMinutes = records.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    const tableHeaders = ['Empleado', 'Fecha', 'Entrada', 'Salida', 'Horas', 'Tarea / Tipo'];
    const tableRows = records.map((r) => [
      r.employee ? `${r.employee.firstName} ${r.employee.lastName.charAt(0)}.` : 'Empleado',
      new Date(r.clockIn).toLocaleDateString('es-ES'),
      new Date(r.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      r.clockOut ? new Date(r.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'En curso',
      r.durationMinutes ? `${(r.durationMinutes / 60).toFixed(1)}h` : '0h',
      r.taskTitle || r.type,
    ]);

    const pdfBuf = await generateReportPdf({
      title: 'Registro de Jornada Laboral Oficial (Art. 34.9 ET)',
      subtitle: 'Certificado de fichajes, horas ordinarias, imputación por tarea y cumplimiento laboral',
      companyName: 'DAMA-CRM Recursos Humanos',
      dateRange: `Mes en curso - ${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
      kpis: [
        { label: 'Total Fichajes', value: records.length, color: '#2563EB' },
        { label: 'Horas Trabajadas', value: `${totalHours}h`, color: '#10B981' },
        { label: 'Jornadas Ordinarias', value: records.filter((r) => r.type === 'WORK').length, color: '#3B82F6' },
        { label: 'Guardias / Extras', value: records.filter((r) => r.type === 'OVERTIME').length, color: '#F59E0B' },
      ],
      tableHeaders,
      tableRows,
      summaryNotes: [
        'Certificado oficial emitido conforme al Art. 34.9 del Estatuto de los Trabajadores (Real Decreto-ley 8/2019).',
        'Los registros horarios incluyen marca temporal UTC inmutable de entrada, pausas y salida verificada en servidor.',
      ],
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=informe_fichajes_oficial_${Date.now()}.pdf`);
    res.send(pdfBuf);
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al generar PDF de registro horario', error: error.message });
  }
};
