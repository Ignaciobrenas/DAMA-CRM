import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { wsService } from '../../services/websocket.service';
import { NotificationService } from '../notifications/notifications.service';

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
    const { status, priority, category, search, contactId, companyId } = req.query;

    const where: any = {};

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
        { ticketNumber: { contains: q } },
        { title: { contains: q } },
        { description: { contains: q } },
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
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener tickets de soporte', error });
  }
}

// 2. GET /api/tickets/:id - Get ticket by ID
export async function getTicketById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

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

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener ticket', error });
  }
}

// 3. POST /api/tickets - Create new ticket
export async function createTicket(req: Request, res: Response): Promise<void> {
  try {
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

    // Generate unique sequential ticket number
    const count = await prisma.ticket.count();
    const year = new Date().getFullYear();
    const seq = String(count + 1).padStart(4, '0');
    const ticketNumber = `TCK-${year}-${seq}`;

    const slaDueAt = calculateSlaDeadline(priority);

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title,
        description,
        priority: priority.toUpperCase(),
        category: category.toUpperCase(),
        channel: channel.toUpperCase(),
        status: 'OPEN',
        contactId: contactId || null,
        companyId: companyId || null,
        assignedToId: assignedToId || null,
        slaDueAt,
        messages: initialMessage
          ? {
              create: {
                senderType: req.user ? 'AGENT' : 'CUSTOMER',
                senderId: req.user?.id || null,
                senderName: req.user?.name || 'Cliente',
                message: initialMessage,
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
    wsService.broadcast('ticket:created', ticket);
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
        details: JSON.stringify({ ticketNumber: ticket.ticketNumber, title: ticket.title, priority: ticket.priority }),
      },
    });

    res.status(201).json({
      success: true,
      data: ticket,
      message: 'Ticket de soporte creado correctamente',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear ticket', error });
  }
}

// 4. PATCH /api/tickets/:id - Update ticket status / assignee / priority
export async function updateTicket(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, priority, category, assignedToId, title, description } = req.body;

    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Ticket no encontrado' });
      return;
    }

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
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;

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

    // Broadcast live WebSocket event
    wsService.broadcast('ticket:updated', updated);

    res.json({
      success: true,
      data: updated,
      message: 'Ticket actualizado correctamente',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar ticket', error });
  }
}

// 5. POST /api/tickets/:id/messages - Add public message or yellow confidential internal note
export async function addTicketMessage(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { message, isInternal = false, attachments } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({ success: false, message: 'El contenido del mensaje no puede estar vacío' });
      return;
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket no encontrado' });
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
    wsService.broadcast('ticket:message', {
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
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al registrar mensaje en el ticket', error });
  }
}

// 6. GET /api/tickets/stats/summary - Summary SLA & operational metrics
export async function getTicketStats(req: Request, res: Response): Promise<void> {
  try {
    const [total, open, inProgress, resolved, closed, urgent] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: 'OPEN' } }),
      prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.ticket.count({ where: { status: 'RESOLVED' } }),
      prisma.ticket.count({ where: { status: 'CLOSED' } }),
      prisma.ticket.count({ where: { priority: 'URGENT', status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    ]);

    // Calculate SLA breaches among active tickets
    const now = new Date();
    const breachedActiveTickets = await prisma.ticket.count({
      where: {
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
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener métricas de soporte', error });
  }
}
