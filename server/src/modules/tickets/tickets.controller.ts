import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { wsService } from '../../services/websocket.service';
import { NotificationService } from '../notifications/notifications.service';
import { getRequestTenant, isGodSuperAdmin } from '../../utils/tenant';

function calculateSlaDeadline(priority: string): Date {
  const now = Date.now();
  switch (priority?.toUpperCase()) {
    case 'URGENT':
      return new Date(now + 4 * 3600 * 1000); // 4 Hours SLA
    case 'HIGH':
      return new Date(now + 8 * 3600 * 1000); // 8 Hours SLA
    case 'MEDIUM':
      return new Date(now + 24 * 3600 * 1000); // 24 Hours SLA
    case 'LOW':
    default:
      return new Date(now + 72 * 3600 * 1000); // 72 Hours SLA
  }
}

// 1. GET /api/tickets - List tickets with filtering & search
export async function getTickets(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);
    const { status, priority, category, search, contactId, companyId } = req.query;

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    if (status) {
      where.status = status as string;
    }
    if (priority) {
      where.priority = priority as string;
    }
    if (category) {
      where.category = category as string;
    }
    if (contactId) {
      where.contactId = contactId as string;
    }
    if (companyId) {
      where.companyId = companyId as string;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { ticketNumber: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        contact: true,
        company: true,
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: tickets,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener tickets de soporte', error: error.message });
  }
}

// 2. GET /api/tickets/:id - Get ticket by ID
export async function getTicketById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        contact: true,
        company: true,
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket no encontrado' });
      return;
    }

    if (!isSuper && ticket.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes acceso a este ticket' });
      return;
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener ticket', error: error.message });
  }
}

// 3. POST /api/tickets - Create new ticket
export async function createTicket(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const {
      title,
      description,
      priority = 'MEDIUM',
      category = 'GENERAL',
      channel = 'PORTAL',
      contactId,
      companyId,
      assignedToId,
      initialMessage,
    } = req.body;

    if (!title || !description) {
      res.status(400).json({ success: false, message: 'El título y descripción del ticket son obligatorios' });
      return;
    }

    // Verify company/contact belongs to tenant
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

    // Generate sequential ticket number scoped per tenant
    const count = await prisma.ticket.count({ where: { tenantId } });
    const year = new Date().getFullYear();
    const seq = String(count + 1).padStart(4, '0');
    const ticketNumber = `TCK-${year}-${seq}`;

    const slaDueAt = calculateSlaDeadline(priority);

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title: title.trim(),
        description: description.trim(),
        priority: priority.toUpperCase(),
        category: category.toUpperCase(),
        channel: channel.toUpperCase(),
        status: 'OPEN',
        contactId: contactId || null,
        companyId: companyId || null,
        assignedToId: assignedToId || null,
        slaDueAt,
        tenantId,
        messages: initialMessage
          ? {
              create: {
                senderType: req.user ? 'AGENT' : 'CUSTOMER',
                senderId: req.user?.id || null,
                senderName: req.user?.name || 'Cliente',
                message: initialMessage.trim(),
                isInternal: false,
              },
            }
          : undefined,
      },
      include: {
        contact: true,
        company: true,
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        messages: true,
      },
    });

    // Broadcast live WebSocket event and persist real-time notification
    wsService.broadcastToTenant(tenantId, 'ticket:created', ticket);
    await NotificationService.notifyTicketCreated({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      priority: ticket.priority,
      tenantId: ticket.tenantId,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'CREATE_TICKET',
        entity: 'Ticket',
        entityId: ticket.id,
        tenantId,
        details: JSON.stringify({ ticketNumber: ticket.ticketNumber, title: ticket.title, priority: ticket.priority }),
      },
    });

    res.status(201).json({
      success: true,
      data: ticket,
      message: 'Ticket de soporte creado correctamente',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al crear ticket', error: error.message });
  }
}

// 4. PATCH /api/tickets/:id - Update ticket status / assignee / priority
export async function updateTicket(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Ticket no encontrado' });
      return;
    }

    if (!isSuper && existing.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para modificar este ticket' });
      return;
    }

    const { status, priority, category, assignedToId, title, description } = req.body;

    const data: any = {};
    if (status !== undefined) {
      data.status = status;
      if (['RESOLVED', 'CLOSED'].includes(status) && !existing.resolvedAt) {
        data.resolvedAt = new Date();
      } else if (['OPEN', 'IN_PROGRESS'].includes(status)) {
        data.resolvedAt = null;
      }
    }
    if (priority !== undefined) {
      data.priority = priority;
      data.slaDueAt = calculateSlaDeadline(priority);
    }
    if (category !== undefined) data.category = category;
    if (assignedToId !== undefined) data.assignedToId = assignedToId || null;
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description.trim();

    const updated = await prisma.ticket.update({
      where: { id },
      data,
      include: {
        contact: true,
        company: true,
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Broadcast live WebSocket event to tenant
    wsService.broadcastToTenant(tenantId, 'ticket:updated', updated);

    res.json({
      success: true,
      data: updated,
      message: 'Ticket actualizado correctamente',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al actualizar ticket', error: error.message });
  }
}

// 5. POST /api/tickets/:id/messages - Add public message or yellow confidential internal note
export async function addTicketMessage(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket no encontrado' });
      return;
    }

    if (!isSuper && ticket.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes acceso a este ticket' });
      return;
    }

    const { message, isInternal = false, attachments } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({ success: false, message: 'El contenido del mensaje no puede estar vacío' });
      return;
    }

    const senderType = req.user ? 'AGENT' : 'CUSTOMER';
    const senderName = req.user?.name || 'Agente DAMA';

    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderType,
        senderId: req.user?.id || null,
        senderName,
        message: message.trim(),
        isInternal: Boolean(isInternal),
        attachments: typeof attachments === 'string' ? attachments : attachments ? JSON.stringify(attachments) : null,
      },
    });

    // Update ticket's firstResponseAt if this is first agent reply
    if (senderType === 'AGENT' && !ticket.firstResponseAt && !isInternal) {
      await prisma.ticket.update({
        where: { id },
        data: { firstResponseAt: new Date() },
      });
    }

    // Broadcast live WebSocket event and persist real-time notification
    wsService.broadcastToTenant(tenantId, 'ticket:message', {
      ticketId: id,
      message: newMessage,
    });
    await NotificationService.notifyTicketReply({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      isInternal,
      senderName: newMessage.senderName,
      tenantId: ticket.tenantId,
    });

    res.status(201).json({
      success: true,
      data: newMessage,
      message: isInternal ? 'Nota interna confidencial guardada' : 'Mensaje enviado correctamente',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al registrar mensaje en el ticket', error: error.message });
  }
}

// 6. GET /api/tickets/stats/summary - Summary SLA & operational metrics
export async function getTicketStats(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const baseWhere: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      baseWhere.tenantId = tenantId;
    }

    const [total, open, inProgress, resolved, closed, urgent] = await Promise.all([
      prisma.ticket.count({ where: baseWhere }),
      prisma.ticket.count({ where: { ...baseWhere, status: 'OPEN' } }),
      prisma.ticket.count({ where: { ...baseWhere, status: 'IN_PROGRESS' } }),
      prisma.ticket.count({ where: { ...baseWhere, status: 'RESOLVED' } }),
      prisma.ticket.count({ where: { ...baseWhere, status: 'CLOSED' } }),
      prisma.ticket.count({ where: { ...baseWhere, priority: 'URGENT', status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    ]);

    // Calculate SLA breaches among active tickets
    const now = new Date();
    const breachedActiveTickets = await prisma.ticket.count({
      where: {
        ...baseWhere,
        status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'] },
        slaDueAt: { lt: now },
      },
    });

    const complianceRate = total > 0 ? Math.round(((total - breachedActiveTickets) / total) * 100) : 100;

    res.json({
      success: true,
      data: {
        total,
        open,
        inProgress,
        resolved,
        closed,
        urgent,
        breachedActiveTickets,
        complianceRate,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener métricas de soporte', error: error.message });
  }
}

/**
 * GET /api/tickets/export/csv
 * Export helpdesk support tickets to CSV / Excel
 */
export async function exportTicketsCsv(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);
    const { generateCsvBuffer } = await import('../../services/report-exporter.service');

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        contact: { select: { firstName: true, lastName: true, email: true } },
        company: { select: { name: true } },
        assignedTo: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Nº Ticket',
      'Asunto / Título',
      'Estado',
      'Prioridad',
      'Categoría',
      'Canal Origen',
      'Cliente',
      'Empresa',
      'Agente Asignado',
      'Fecha Creación',
      'Vencimiento SLA',
      'Fecha Primera Respuesta',
      'Fecha Resolución',
    ];

    const rows = tickets.map((t) => [
      t.ticketNumber,
      t.title,
      t.status,
      t.priority,
      t.category,
      t.channel,
      t.contact ? `${t.contact.firstName} ${t.contact.lastName}` : '',
      t.company ? t.company.name : '',
      t.assignedTo ? t.assignedTo.name : 'Sin asignar',
      new Date(t.createdAt).toLocaleDateString('es-ES'),
      t.slaDueAt ? new Date(t.slaDueAt).toLocaleDateString('es-ES') : '',
      t.firstResponseAt ? new Date(t.firstResponseAt).toLocaleDateString('es-ES') : '',
      t.resolvedAt ? new Date(t.resolvedAt).toLocaleDateString('es-ES') : '',
    ]);

    const csvBuf = generateCsvBuffer(headers, rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=tickets_soporte_${tenantId}_${Date.now()}.csv`);
    res.send(csvBuf);
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al exportar tickets en CSV', error: error.message });
  }
}

/**
 * GET /api/tickets/export/pdf
 * Export official Helpdesk SLA Performance & Incident PDF Report
 */
export async function exportTicketsPdf(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);
    const { generateReportPdf } = await import('../../services/report-exporter.service');

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        contact: { select: { firstName: true, lastName: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const total = tickets.length;
    const resolved = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    const open = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 100;

    const tableHeaders = ['Nº Ticket', 'Asunto', 'Prioridad', 'Cliente', 'Agente', 'Estado'];
    const tableRows = tickets.map((t) => [
      t.ticketNumber,
      t.title.slice(0, 26),
      t.priority === 'URGENT' ? 'URGENTE' : t.priority,
      t.contact ? `${t.contact.firstName}` : '-',
      t.assignedTo ? t.assignedTo.name.split(' ')[0] : 'Sin Asignar',
      t.status === 'RESOLVED' ? 'Resuelto' : t.status === 'CLOSED' ? 'Cerrado' : t.status === 'IN_PROGRESS' ? 'En Curso' : 'Abierto',
    ]);

    const pdfBuf = await generateReportPdf({
      title: 'Informe de Soporte Helpdesk & Cumplimiento SLA',
      subtitle: 'Métricas de resolución de incidencias, tiempos de respuesta y atención al cliente',
      companyName: 'DAMA-CRM Helpdesk Hub',
      dateRange: `Informe generado a ${new Date().toLocaleDateString('es-ES')}`,
      kpis: [
        { label: 'Total Tickets', value: total, color: '#2563EB' },
        { label: 'Tickets Abiertos', value: open, color: '#F59E0B' },
        { label: 'Tickets Resueltos', value: resolved, color: '#10B981' },
        { label: 'Tasa Resolución', value: `${resolutionRate}%`, color: '#8B5CF6' },
      ],
      tableHeaders,
      tableRows,
      summaryNotes: [
        '* Métricas oficiales de calidad de servicio y tiempos de respuesta conforme a acuerdos de nivel de servicio (SLA).',
        '* Todas las incidencias registradas con trazabilidad por agente y canal de entrada.',
      ],
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=informe_soporte_sla_${tenantId}_${Date.now()}.pdf`);
    res.send(pdfBuf);
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al exportar informe de tickets en PDF', error: error.message });
  }
}
