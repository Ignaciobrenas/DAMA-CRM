import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { config } from '../../config';
import { logAudit } from '../../middlewares/audit.middleware';
import { wsService } from '../../services/websocket.service';
import { getRequestTenant, isGodSuperAdmin } from '../../utils/tenant';

/**
 * Meta WhatsApp Cloud API Webhook Verification (GET)
 */
export function verifyWhatsAppWebhook(req: Request, res: Response): void {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.webhooks.whatsappVerifyToken) {
    console.log('✅ [WhatsApp Webhook] Meta challenge verificado con éxito');
    res.status(200).send(challenge);
    return;
  }

  res.status(403).send('Forbidden: Token mismatch');
}

/**
 * Meta WhatsApp Cloud API Message Receiver (POST)
 */
export async function receiveWhatsAppWebhook(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body;
    const targetTenant = (req.headers['x-tenant-id'] as string) || 'master';

    // Check if it is a WhatsApp entry message
    if (body.object === 'whatsapp_business_account' || body.entry) {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (value?.messages?.length > 0) {
            const msg = value.messages[0];
            const senderPhone = msg.from; // e.g. "34655778899"
            const textBody = msg.text?.body || '[Mensaje multimedia o interactivo]';

            // Find or match contact by phone/mobile in target tenant
            let contact = await prisma.contact.findFirst({
              where: {
                tenantId: targetTenant,
                OR: [
                  { phone: { contains: senderPhone } },
                  { mobile: { contains: senderPhone } },
                ],
              },
            });

            // If contact doesn't exist, create an inbound Lead contact!
            if (!contact) {
              const nameProfile = value.contacts?.[0]?.profile?.name || 'Cliente WhatsApp';
              contact = await prisma.contact.create({
                data: {
                  firstName: nameProfile,
                  lastName: `(${senderPhone})`,
                  email: `lead.${senderPhone}@whatsapp.dama`,
                  phone: `+${senderPhone}`,
                  mobile: `+${senderPhone}`,
                  isLead: true,
                  notes: 'Lead creado automáticamente vía webhook de WhatsApp Meta API',
                  tenantId: targetTenant,
                },
              });
            }

            // Save message into OmniMessage timeline
            const savedMsg = await prisma.omniMessage.create({
              data: {
                contactId: contact.id,
                channel: 'WHATSAPP',
                direction: 'INBOUND',
                sender: senderPhone,
                recipient: 'DAMA-CRM',
                content: textBody,
                rawPayload: JSON.stringify(msg),
                isRead: false,
                tenantId: targetTenant,
              },
            });

            console.log(`💬 [WhatsApp Inbound] Mensaje de ${contact.firstName} (${senderPhone}): "${textBody}"`);

            // Broadcast real-time WebSocket events to tenant
            wsService.broadcastToTenant(targetTenant, 'omnichannel:message', savedMsg);
            wsService.broadcastToTenant(targetTenant, 'notification:new', {
              title: 'Nuevo WhatsApp recibido',
              desc: `${contact.firstName}: "${textBody.slice(0, 45)}..."`,
              type: 'chat',
              tenantId: targetTenant,
            });
          }
        }
      }
    }

    res.status(200).send('EVENT_RECEIVED');
  } catch (error: any) {
    console.error('Error in WhatsApp webhook:', error);
    res.status(500).send(error.message);
  }
}

export async function listMessages(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);
    const { contactId, channel } = req.query;

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }
    if (contactId) where.contactId = String(contactId);
    if (channel) where.channel = String(channel);

    const messages = await prisma.omniMessage.findMany({
      where,
      include: {
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    res.json({ success: true, data: messages });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function sendOutboundMessage(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);
    const { contactId, channel, content } = req.body;

    if (!contactId || !content) {
      res.status(400).json({ success: false, message: 'Contacto y contenido del mensaje son obligatorios' });
      return;
    }

    const contact = await prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) {
      res.status(404).json({ success: false, message: 'Contacto no encontrado' });
      return;
    }

    if (!isSuper && contact.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes acceso a este contacto' });
      return;
    }

    const msg = await prisma.omniMessage.create({
      data: {
        contactId,
        channel: channel || 'WHATSAPP',
        direction: 'OUTBOUND',
        sender: req.user?.name || 'Soporte DAMA-CRM',
        recipient: contact.phone || contact.email,
        content: content.trim(),
        timestamp: new Date(),
        isRead: true,
        tenantId,
      },
    });

    // Broadcast real-time WebSocket events to tenant
    wsService.broadcastToTenant(tenantId, 'omnichannel:message', msg);

    res.status(201).json({ success: true, data: msg });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * B2B Client Self-Service Portal Endpoint (Public or Token Access)
 */
export async function getClientPortalData(req: Request, res: Response): Promise<void> {
  try {
    const { companyId } = req.params;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        invoices: {
          include: { items: true },
          orderBy: { issueDate: 'desc' },
        },
        quotes: {
          include: { items: true },
          orderBy: { issueDate: 'desc' },
        },
      },
    });

    if (!company) {
      res.status(404).json({ success: false, message: 'Portal corporativo no encontrado' });
      return;
    }

    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    if (req.user && !isSuper && company.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes acceso a los datos de esta organización' });
      return;
    }

    res.json({
      success: true,
      data: {
        company: {
          id: company.id,
          name: company.name,
          taxId: company.taxId,
          email: company.email,
        },
        invoices: company.invoices,
        quotes: company.quotes,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// -----------------------------------------------------------------------------
// Internal Team Chat & Direct Messaging
// -----------------------------------------------------------------------------

const DEFAULT_INTERNAL_CHANNELS = [
  { id: 'general', name: 'General', icon: 'Hash', description: 'Canal general de la empresa y coordinación del equipo' },
  { id: 'ventas', name: 'Ventas & Oportunidades', icon: 'TrendingUp', description: 'Pipeline comercial, tratos y prospección' },
  { id: 'soporte', name: 'Soporte & Helpdesk', icon: 'LifeBuoy', description: 'Atención a incidencias y tickets de clientes' },
  { id: 'proyectos', name: 'Proyectos & Tech', icon: 'Code', description: 'Desarrollo, entregables técnicos y arquitectura' },
  { id: 'anuncios', name: 'Anuncios Corporativos', icon: 'Megaphone', description: 'Comunicados y novedades de la dirección' },
];

export async function listInternalChannelsAndTeam(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const where: any = { isActive: true };
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    const teamMembers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: { select: { name: true } },
        tenantId: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      channels: DEFAULT_INTERNAL_CHANNELS,
      teamMembers: teamMembers.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        avatar: m.avatar,
        role: m.role.name,
        tenantId: m.tenantId,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function listInternalMessages(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const currentUserId = req.user!.id;
    const { channel, recipientId } = req.query;

    let where: any = {
      type: 'INTERNAL_CHAT',
      tenantId,
    };

    if (channel && typeof channel === 'string') {
      where.subject = channel;
    } else if (recipientId && typeof recipientId === 'string') {
      where.OR = [
        { userId: currentUserId, subject: `dm:${recipientId}` },
        { userId: recipientId, subject: `dm:${currentUserId}` },
      ];
    } else {
      where.subject = 'general';
    }

    const rawMessages = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    // Populate sender details
    const userIds = Array.from(new Set(rawMessages.map((m) => m.userId).filter(Boolean))) as string[];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true, role: { select: { name: true } } },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const formatted = rawMessages.map((m) => {
      const sender = m.userId ? userMap.get(m.userId) : null;
      return {
        id: m.id,
        channel: m.subject,
        content: m.description || '',
        senderId: m.userId,
        senderName: sender?.name || 'Compañero/a',
        senderRole: sender?.role.name || 'USER',
        senderAvatar: sender?.avatar,
        isSelf: m.userId === currentUserId,
        timestamp: m.createdAt,
      };
    });

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function sendInternalMessage(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const currentUserId = req.user!.id;
    const currentUserName = req.user!.name;
    const currentUserRole = req.user!.role;
    const { channel, recipientId, content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ success: false, message: 'El contenido del mensaje es obligatorio' });
      return;
    }

    const targetSubject = channel
      ? String(channel).trim()
      : recipientId
      ? `dm:${String(recipientId).trim()}`
      : 'general';

    const activity = await prisma.activity.create({
      data: {
        type: 'INTERNAL_CHAT',
        subject: targetSubject,
        description: content.trim(),
        userId: currentUserId,
        tenantId,
      },
    });

    const payload = {
      id: activity.id,
      channel: targetSubject,
      content: activity.description,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentUserRole,
      senderAvatar: (req.user as any)?.avatar,
      isSelf: false,
      timestamp: activity.createdAt,
      tenantId,
    };

    // Broadcast real-time internal message to all active tenant users
    wsService.broadcastToTenant(tenantId, 'internal_chat:message', payload);

    res.status(201).json({
      success: true,
      data: {
        ...payload,
        isSelf: true,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
