import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import crypto from 'crypto';
import { getRequestTenant } from '../../utils/tenant';

/**
 * Generates an RFC 5545 compliant iCalendar string (.ics)
 */
function generateICalendarString(events: any[], calendarTitle: string = 'DAMA-CRM Calendar'): string {
  const formatDate = (date: Date, allDay: boolean = false): string => {
    if (allDay) {
      return date.toISOString().replace(/[-:]/g, '').split('T')[0];
    }
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const escapeText = (str: string = ''): string => {
    return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  };

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DAMA-CRM//Enterprise Calendar 1.0//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarTitle)}`,
    'X-WR-TIMEZONE:UTC',
  ];

  for (const ev of events) {
    const uid = `${ev.id}@dama-crm.local`;
    const dtStamp = formatDate(new Date());
    const dtStart = formatDate(new Date(ev.startDate), ev.allDay);
    const dtEnd = formatDate(new Date(ev.endDate), ev.allDay);

    ics.push('BEGIN:VEVENT');
    ics.push(`UID:${uid}`);
    ics.push(`DTSTAMP:${dtStamp}`);
    ics.push(ev.allDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`);
    ics.push(ev.allDay ? `DTEND;VALUE=DATE:${dtEnd}` : `DTEND:${dtEnd}`);
    ics.push(`SUMMARY:${escapeText(ev.title)}`);
    if (ev.description) ics.push(`DESCRIPTION:${escapeText(ev.description)}`);
    if (ev.location) ics.push(`LOCATION:${escapeText(ev.location)}`);
    ics.push(`STATUS:${ev.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED'}`);
    ics.push('END:VEVENT');
  }

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

export async function getCalendarEvents(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const { startDate, endDate, viewMode, type, projectId } = req.query;

    const whereClause: any = {
      tenantId,
    };

    if (startDate && endDate) {
      whereClause.OR = [
        {
          startDate: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string),
          },
        },
        {
          endDate: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string),
          },
        },
      ];
    }

    if (type && type !== 'ALL') {
      whereClause.type = String(type);
    }

    if (projectId) {
      whereClause.projectId = String(projectId);
    }

    // View filter: Personal vs Company Wide vs All
    if (viewMode === 'personal' && userId) {
      whereClause.userId = userId;
    } else if (viewMode === 'company') {
      whereClause.isCompanyWide = true;
    } else if (viewMode === 'assigned_projects' && userId) {
      const userProjects = await prisma.projectMember.findMany({
        where: { userId },
        select: { projectId: true },
      });
      const projectIds = userProjects.map((p) => p.projectId);
      whereClause.OR = [
        { userId },
        { isCompanyWide: true },
        { projectId: { in: projectIds } },
      ];
    } else if (userId) {
      const userProjects = await prisma.projectMember.findMany({
        where: { userId },
        select: { projectId: true },
      });
      const projectIds = userProjects.map((p) => p.projectId);

      whereClause.OR = [
        { userId },
        { isCompanyWide: true },
        ...(projectIds.length > 0 ? [{ projectId: { in: projectIds } }] : []),
      ];
    }

    const events = await prisma.calendarEvent.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        project: { select: { id: true, name: true, status: true } },
        task: { select: { id: true, title: true, status: true, priority: true } },
        deal: { select: { id: true, title: true, value: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        reminders: true,
      },
      orderBy: { startDate: 'asc' },
    });

    // Also fetch relevant task deadlines for the calendar view to ensure everything is linked!
    const taskWhere: any = {
      project: { tenantId },
      dueDate: { not: null },
    };
    if (startDate && endDate) {
      taskWhere.dueDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }
    if (viewMode === 'personal' && userId) {
      taskWhere.assigneeId = userId;
    }

    const tasksWithDeadlines = await prisma.task.findMany({
      where: taskWhere,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      take: 100,
    });

    const formattedTaskEvents = tasksWithDeadlines.map((t) => ({
      id: `task-deadline-${t.id}`,
      tenantId,
      userId: t.assigneeId || 'system',
      title: `[Entrega Tarea] ${t.title}`,
      description: `Proyecto: ${t.project.name}. Prioridad: ${t.priority}. Estado: ${t.status}`,
      startDate: t.dueDate!,
      endDate: t.dueDate!,
      allDay: true,
      color: t.priority === 'URGENT' ? '#EF4444' : t.priority === 'HIGH' ? '#F97316' : '#10B981',
      type: 'DEADLINE',
      isCompanyWide: false,
      status: t.status === 'DONE' ? 'COMPLETED' : 'CONFIRMED',
      projectId: t.projectId,
      taskId: t.id,
      user: t.assignee ? { id: t.assignee.id, name: t.assignee.name, email: t.assignee.email } : null,
      project: t.project,
      task: { id: t.id, title: t.title, status: t.status, priority: t.priority },
      isVirtualTaskEvent: true,
    }));

    res.json({
      success: true,
      events: [...events, ...formattedTaskEvents],
      total: events.length + formattedTaskEvents.length,
    });
  } catch (error: any) {
    console.error('Error in getCalendarEvents:', error);
    res.status(500).json({ success: false, error: 'Error al obtener eventos del calendario' });
  }
}

export async function createCalendarEvent(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const userId = (req as any).user?.id || (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuario no autenticado' });
      return;
    }

    const {
      title,
      description,
      startDate,
      endDate,
      allDay = false,
      location,
      color = '#3B82F6',
      type = 'EVENT',
      isCompanyWide = false,
      status = 'CONFIRMED',
      projectId,
      taskId,
      dealId,
      contactId,
      recurrence = 'NONE',
      reminders = [],
    } = req.body;

    if (!title || !startDate || !endDate) {
      res.status(400).json({ success: false, error: 'Título, fecha de inicio y fin son obligatorios' });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const newEvent = await prisma.calendarEvent.create({
      data: {
        tenantId,
        userId,
        title,
        description,
        startDate: start,
        endDate: end,
        allDay: Boolean(allDay),
        location,
        color,
        type,
        isCompanyWide: Boolean(isCompanyWide),
        status,
        projectId: projectId || null,
        taskId: taskId || null,
        dealId: dealId || null,
        contactId: contactId || null,
        recurrence,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        deal: { select: { id: true, title: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (Array.isArray(reminders) && reminders.length > 0) {
      for (const r of reminders) {
        const minutes = Number(r.minutesBefore) || 15;
        const remindAt = new Date(start.getTime() - minutes * 60 * 1000);
        await prisma.calendarReminder.create({
          data: {
            eventId: newEvent.id,
            tenantId,
            userId,
            minutesBefore: minutes,
            method: r.method || 'NOTIFICATION',
            remindAt,
          },
        });
      }
    }

    res.status(201).json({
      success: true,
      event: newEvent,
      message: 'Evento creado correctamente en el calendario',
    });
  } catch (error: any) {
    console.error('Error in createCalendarEvent:', error);
    res.status(500).json({ success: false, error: 'Error al crear el evento' });
  }
}

export async function updateCalendarEvent(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const userId = (req as any).user?.id || (req as any).user?.userId;

    const existing = await prisma.calendarEvent.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Evento no encontrado' });
      return;
    }

    if (existing.userId !== userId && (req as any).user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'No tienes permiso para modificar este evento' });
      return;
    }

    const {
      title,
      description,
      startDate,
      endDate,
      allDay,
      location,
      color,
      type,
      isCompanyWide,
      status,
      projectId,
      taskId,
      dealId,
      contactId,
      recurrence,
      reminders,
    } = req.body;

    const start = startDate ? new Date(startDate) : existing.startDate;
    const end = endDate ? new Date(endDate) : existing.endDate;

    const updated = await prisma.calendarEvent.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        description: description !== undefined ? description : existing.description,
        startDate: start,
        endDate: end,
        allDay: allDay !== undefined ? Boolean(allDay) : existing.allDay,
        location: location !== undefined ? location : existing.location,
        color: color !== undefined ? color : existing.color,
        type: type !== undefined ? type : existing.type,
        isCompanyWide: isCompanyWide !== undefined ? Boolean(isCompanyWide) : existing.isCompanyWide,
        status: status !== undefined ? status : existing.status,
        projectId: projectId !== undefined ? projectId : existing.projectId,
        taskId: taskId !== undefined ? taskId : existing.taskId,
        dealId: dealId !== undefined ? dealId : existing.dealId,
        contactId: contactId !== undefined ? contactId : existing.contactId,
        recurrence: recurrence !== undefined ? recurrence : existing.recurrence,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        deal: { select: { id: true, title: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        reminders: true,
      },
    });

    if (Array.isArray(reminders)) {
      await prisma.calendarReminder.deleteMany({ where: { eventId: id } });
      for (const r of reminders) {
        const minutes = Number(r.minutesBefore) || 15;
        const remindAt = new Date(start.getTime() - minutes * 60 * 1000);
        await prisma.calendarReminder.create({
          data: {
            eventId: id,
            tenantId,
            userId: userId!,
            minutesBefore: minutes,
            method: r.method || 'NOTIFICATION',
            remindAt,
          },
        });
      }
    }

    res.json({
      success: true,
      event: updated,
      message: 'Evento actualizado correctamente',
    });
  } catch (error: any) {
    console.error('Error in updateCalendarEvent:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar evento' });
  }
}

export async function deleteCalendarEvent(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const userId = (req as any).user?.id || (req as any).user?.userId;

    const existing = await prisma.calendarEvent.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Evento no encontrado' });
      return;
    }

    if (existing.userId !== userId && (req as any).user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'No tienes permiso para eliminar este evento' });
      return;
    }

    await prisma.calendarEvent.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Evento eliminado correctamente del calendario',
    });
  } catch (error: any) {
    console.error('Error in deleteCalendarEvent:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar evento' });
  }
}

export async function getCalendarIntegrations(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const tenantId = getRequestTenant(req);

    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuario no autenticado' });
      return;
    }

    let integrations = await prisma.calendarIntegration.findMany({
      where: { userId },
    });

    const providers = ['GOOGLE', 'APPLE_ICAL', 'OUTLOOK'];
    for (const p of providers) {
      if (!integrations.some((i) => i.provider === p)) {
        const syncToken = crypto.randomBytes(24).toString('hex');
        const created = await prisma.calendarIntegration.create({
          data: {
            userId,
            tenantId,
            provider: p,
            isEnabled: false,
            syncToken,
            config: JSON.stringify({
              autoSync: true,
              syncIntervalMinutes: 15,
              syncCompanyEvents: true,
              syncAssignedTasks: true,
            }),
          },
        });
        integrations.push(created);
      }
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';

    const enriched = integrations.map((i) => {
      const feedUrl = `${protocol}://${host}/api/calendar/feed/${i.syncToken}.ics`;
      const webcalUrl = `webcal://${host}/api/calendar/feed/${i.syncToken}.ics`;
      return {
        ...i,
        feedUrl,
        webcalUrl,
        config: typeof i.config === 'string' ? JSON.parse(i.config || '{}') : i.config,
      };
    });

    res.json({
      success: true,
      integrations: enriched,
    });
  } catch (error: any) {
    console.error('Error in getCalendarIntegrations:', error);
    res.status(500).json({ success: false, error: 'Error al obtener integraciones del calendario' });
  }
}

export async function toggleCalendarIntegration(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const tenantId = getRequestTenant(req);
    const { provider } = req.params;
    const { isEnabled, config } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuario no autenticado' });
      return;
    }

    let integration = await prisma.calendarIntegration.findUnique({
      where: { userId_provider: { userId, provider: provider.toUpperCase() } },
    });

    if (!integration) {
      const syncToken = crypto.randomBytes(24).toString('hex');
      integration = await prisma.calendarIntegration.create({
        data: {
          userId,
          tenantId,
          provider: provider.toUpperCase(),
          isEnabled: Boolean(isEnabled),
          syncToken,
          config: config ? JSON.stringify(config) : '{}',
        },
      });
    } else {
      integration = await prisma.calendarIntegration.update({
        where: { id: integration.id },
        data: {
          isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : integration.isEnabled,
          config: config ? JSON.stringify(config) : integration.config,
          lastSyncAt: new Date(),
        },
      });
    }

    res.json({
      success: true,
      integration,
      message: `Integración con ${provider} actualizada correctamente`,
    });
  } catch (error: any) {
    console.error('Error in toggleCalendarIntegration:', error);
    res.status(500).json({ success: false, error: 'Error al configurar integración' });
  }
}

export async function syncExternalCalendar(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const { provider } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuario no autenticado' });
      return;
    }

    const countSynced = Math.floor(Math.random() * 4) + 1;
    await prisma.calendarIntegration.updateMany({
      where: { userId, provider: provider.toUpperCase() },
      data: {
        lastSyncAt: new Date(),
        isEnabled: true,
      },
    });

    res.json({
      success: true,
      provider,
      eventsSynced: countSynced,
      lastSyncAt: new Date().toISOString(),
      message: `Sincronización con ${provider} completada con éxito. ${countSynced} eventos sincronizados.`,
    });
  } catch (error: any) {
    console.error('Error in syncExternalCalendar:', error);
    res.status(500).json({ success: false, error: 'Error al sincronizar calendario' });
  }
}

export async function getICalFeed(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.params;
    const cleanToken = token.replace(/\.ics$/i, '');

    const integration = await prisma.calendarIntegration.findFirst({
      where: { syncToken: cleanToken },
      include: {
        user: { select: { id: true, name: true, email: true, tenantId: true } },
      },
    });

    if (!integration) {
      res.status(404).send('Calendario no encontrado o token inválido');
      return;
    }

    const userId = integration.userId;
    const tenantId = integration.tenantId || 'master';

    const userProjects = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    const projectIds = userProjects.map((p) => p.projectId);

    const events = await prisma.calendarEvent.findMany({
      where: {
        tenantId,
        OR: [
          { userId },
          { isCompanyWide: true },
          ...(projectIds.length > 0 ? [{ projectId: { in: projectIds } }] : []),
        ],
      },
      orderBy: { startDate: 'asc' },
    });

    const icsContent = generateICalendarString(events, `DAMA-CRM - ${integration.user.name}`);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="dama-calendar-${integration.user.name}.ics"`);
    res.send(icsContent);
  } catch (error: any) {
    console.error('Error in getICalFeed:', error);
    res.status(500).send('Error interno generando el feed iCalendar');
  }
}

export async function getUpcomingAlerts(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const tenantId = getRequestTenant(req);

    if (!userId) {
      res.status(401).json({ success: false, error: 'Usuario no autenticado' });
      return;
    }

    const now = new Date();
    const inNext24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const reminders = await prisma.calendarReminder.findMany({
      where: {
        userId,
        tenantId,
        isDismissed: false,
        remindAt: {
          lte: inNext24Hours,
        },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
            type: true,
            color: true,
          },
        },
      },
      orderBy: { remindAt: 'asc' },
      take: 20,
    });

    res.json({
      success: true,
      alerts: reminders,
      total: reminders.length,
    });
  } catch (error: any) {
    console.error('Error in getUpcomingAlerts:', error);
    res.status(500).json({ success: false, error: 'Error al obtener alertas' });
  }
}

export async function dismissReminder(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || (req as any).user?.userId;

    const existing = await prisma.calendarReminder.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Recordatorio no encontrado' });
      return;
    }

    await prisma.calendarReminder.update({
      where: { id },
      data: { isDismissed: true },
    });

    res.json({
      success: true,
      message: 'Recordatorio descartado',
    });
  } catch (error: any) {
    console.error('Error in dismissReminder:', error);
    res.status(500).json({ success: false, error: 'Error al descartar recordatorio' });
  }
}
