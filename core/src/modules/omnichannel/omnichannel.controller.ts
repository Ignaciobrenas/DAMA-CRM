import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { config } from '../../config';
import { logAudit } from '../../middlewares/audit.middleware';

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

    // Check if it is a WhatsApp entry message
    if (body.object === 'whatsapp_business_account' || body.entry) {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (value?.messages?.length > 0) {
            const msg = value.messages[0];
            const senderPhone = msg.from; // e.g. "34655778899"
            const textBody = msg.text?.body || '[Mensaje multimedia o interactivo]';

            // Find or match contact by phone/mobile
            let contact = await prisma.contact.findFirst({
              where: {
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
              },
            });

            console.log(`💬 [WhatsApp Inbound] Mensaje de ${contact.firstName} (${senderPhone}): "${textBody}"`);
          }
        }
      }
    }

    // Always respond 200 OK immediately as required by Meta API
    res.status(200).send('EVENT_RECEIVED');
  } catch (error: any) {
    console.error('Error in WhatsApp webhook:', error);
    res.status(500).send(error.message);
  }
}

export async function listMessages(req: Request, res: Response): Promise<void> {
  try {
    const { contactId, channel } = req.query;
    const where: any = {};
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

    const msg = await prisma.omniMessage.create({
      data: {
        contactId,
        channel: channel || 'WHATSAPP',
        direction: 'OUTBOUND',
        sender: req.user?.name || 'Soporte DAMA-CRM',
        recipient: contact.phone || contact.email,
        content,
        timestamp: new Date(),
        isRead: true,
      },
    });

    console.log(`📤 [Outbound ${msg.channel}] Enviado a ${contact.firstName} (${msg.recipient}): "${msg.content}"`);

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
