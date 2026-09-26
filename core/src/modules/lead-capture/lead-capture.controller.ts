import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { wsService } from '../../services/websocket.service';
import { dispatchWorkflowEvent } from '../workflows/workflow.runner';

/**
 * Lead Capture & Webhook Engine for DAMA-CRM
 */

export const submitContactForm = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName = '',
      email,
      phone,
      companyName,
      message,
      utmSource = 'website',
      utmCampaign = 'direct',
      marketingConsent = false,
    } = req.body;

    if (!email || !firstName) {
      return res.status(400).json({ success: false, message: 'El nombre y el email son requeridos' });
    }

    // Check if contact already exists
    let contact = await prisma.contact.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { company: true },
    });

    let isNewLead = false;

    if (!contact) {
      isNewLead = true;

      // Handle or create company if provided
      let companyId: string | null = null;
      if (companyName) {
        let comp = await prisma.company.findFirst({
          where: { name: companyName.trim() },
        });
        if (!comp) {
          comp = await prisma.company.create({
            data: {
              name: companyName.trim(),
              notes: `Creada automáticamente desde Formulario Inteligente (${utmSource})`,
            },
          });
        }
        companyId = comp.id;
      }

      // Create contact as Lead
      contact = await prisma.contact.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim() || 'Lead',
          email: email.toLowerCase().trim(),
          phone: phone || null,
          isLead: true,
          companyId,
          notes: `[Lead Inteligente] Origen: ${utmSource} | Campaña: ${utmCampaign} | Consentimiento: ${
            marketingConsent ? 'Aceptado' : 'No marcado'
          }\n${message ? `Mensaje: ${message}` : ''}`,
        },
        include: { company: true },
      });

      // Automatically create a Deal in the first stage of the pipeline
      const firstStage = await prisma.dealStage.findFirst({
        orderBy: { order: 'asc' },
      });

      if (firstStage) {
        await prisma.deal.create({
          data: {
            title: `Prospecto Web: ${firstName} ${lastName || ''} - ${companyName || 'Lead'}`,
            value: 500,
            currency: 'EUR',
            stageId: firstStage.id,
            contactId: contact.id,
            companyId: companyId || undefined,
            status: 'OPEN',
            notes: `Creado automáticamente desde Formulario de Contacto Web.\nMensaje: ${message || 'Sin mensaje adicional'}`,
          },
        });
      }

      // Record Marketing Consent Log if granted
      if (marketingConsent) {
        await prisma.auditLog.create({
          data: {
            action: 'MARKETING_OPT_IN',
            entity: 'Contact',
            entityId: contact.id,
            details: JSON.stringify({
              ip: req.ip || req.headers['x-forwarded-for'],
              userAgent: req.headers['user-agent'],
              consentTimestamp: new Date().toISOString(),
              source: utmSource,
              version: 'RGPD-2026.1',
            }),
          },
        });
      }
    } else {
      // Existing contact - append interaction note
      const existingNotes = contact.notes || '';
      const updatedNotes = `${existingNotes}\n[${new Date().toLocaleDateString()}] Re-contacto web (${utmSource}): ${message || 'Sin mensaje'}`;

      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: {
          notes: updatedNotes,
          phone: phone || contact.phone,
        },
        include: { company: true },
      });
    }

    // Register activity
    await prisma.activity.create({
      data: {
        type: 'NOTE',
        subject: isNewLead ? 'Nuevo Lead capturado desde formulario web' : 'Formulario web recibido (Contacto existente)',
        description: `Origen: ${utmSource} | Campaña: ${utmCampaign}\nMensaje del cliente: ${message || 'N/A'}`,
        contactId: contact.id,
      },
    });

    // Notify CRM team via WebSockets
    wsService.broadcast('lead:captured', {
      contactId: contact.id,
      name: `${contact.firstName} ${contact.lastName}`,
      email: contact.email,
      isNew: isNewLead,
      source: utmSource,
    });

    // Fire automated workflows asynchronously
    dispatchWorkflowEvent({
      trigger: 'lead.captured',
      data: {
        contactId: contact.id,
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        isNewLead,
        utmSource,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Formulario procesado correctamente',
      data: {
        contactId: contact.id,
        isNewLead,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Lead Magnet Engine (Ebook, Whitepaper, Webinar, Cupón)
 */
export const submitLeadMagnet = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      email,
      magnetId,
      magnetTitle = 'Recurso Descargable',
      marketingConsent = true,
    } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'El email es requerido' });
    }

    let contact = await prisma.contact.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          firstName: firstName || 'Suscriptor',
          lastName: 'Lead Magnet',
          email: email.toLowerCase().trim(),
          isLead: true,
          notes: `[Lead Magnet] Descarga: ${magnetTitle} (${magnetId || 'N/A'})\nConsentimiento Marketing: ${marketingConsent ? 'Sí' : 'No'}`,
        },
      });
    } else {
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          notes: `${contact.notes || ''}\n[${new Date().toLocaleDateString()}] Descargó Lead Magnet: ${magnetTitle}`,
        },
      });
    }

    await prisma.activity.create({
      data: {
        type: 'NOTE',
        subject: `Lead Magnet descargado: ${magnetTitle}`,
        description: `El usuario descargó el recurso id=${magnetId}. Opt-in: ${marketingConsent}`,
        contactId: contact.id,
      },
    });

    wsService.broadcast('lead:magnet_downloaded', {
      email,
      resource: magnetTitle,
    });

    return res.json({
      success: true,
      message: 'Acceso al recurso concedido',
      downloadUrl: `/resources/magnets/${magnetId || 'guia-crm-pymes'}.pdf`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Progressive Profiling Check:
 * Given an email, returns which fields are already known and what next question to ask
 */
export const checkProgressiveProfile = async (req: Request, res: Response) => {
  try {
    const email = String(req.query.email || '').toLowerCase().trim();

    if (!email) {
      return res.json({
        success: true,
        known: false,
        requiredFields: ['firstName', 'lastName', 'email', 'marketingConsent'],
      });
    }

    const contact = await prisma.contact.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!contact) {
      return res.json({
        success: true,
        known: false,
        requiredFields: ['firstName', 'lastName', 'email', 'marketingConsent'],
      });
    }

    // Determine missing profile data to ask progressively
    const missingFields: string[] = [];
    if (!contact.phone) missingFields.push('phone');
    if (!contact.companyId) missingFields.push('companyName');
    if (!contact.position) missingFields.push('position');
    if (contact.company && !contact.company.employeesCount) missingFields.push('companySize');
    if (contact.company && !contact.company.annualRevenue) missingFields.push('annualBudget');

    return res.json({
      success: true,
      known: true,
      contact: {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        companyName: contact.company?.name,
      },
      nextSuggestedFields: missingFields.length > 0 ? missingFields.slice(0, 2) : ['customGoal'],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * WhatsApp & Live Chat pre-capture session
 */
export const initiateChatSession = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, initialMessage, channel = 'WHATSAPP' } = req.body;

    if (!name || (!email && !phone)) {
      return res.status(400).json({ success: false, message: 'Nombre y email o teléfono son requeridos' });
    }

    let contact: any = null;
    if (email) {
      contact = await prisma.contact.findUnique({ where: { email: email.toLowerCase().trim() } });
    }

    if (!contact) {
      const parts = name.trim().split(' ');
      contact = await prisma.contact.create({
        data: {
          firstName: parts[0] || name,
          lastName: parts.slice(1).join(' ') || 'Chat User',
          email: email ? email.toLowerCase().trim() : `whatsapp_${Date.now()}@lead.local`,
          phone: phone || null,
          isLead: true,
          notes: `Lead originado desde ${channel} Widget`,
        },
      });
    }

    // Store initial message in OmniMessage timeline
    await prisma.omniMessage.create({
      data: {
        contactId: contact.id,
        channel: channel === 'WHATSAPP' ? 'WHATSAPP' : 'WEB_CHAT',
        direction: 'INBOUND',
        sender: name,
        recipient: 'DAMA Support',
        content: initialMessage || 'Inicio de chat interactivo',
      },
    });

    wsService.broadcast('chat:initiated', {
      contactId: contact.id,
      name,
      channel,
    });

    return res.json({
      success: true,
      contactId: contact.id,
      whatsAppUrl: phone
        ? `https://wa.me/34600000000?text=${encodeURIComponent(`Hola, soy ${name}. Consulta: ${initialMessage || ''}`)}`
        : null,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Integrated Appointment Scheduler (Calendly / Meeting style)
 */
export const bookAppointment = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      companyName,
      meetingDate,
      meetingType = 'VIDEOCALL',
      notes,
    } = req.body;

    if (!email || !meetingDate) {
      return res.status(400).json({ success: false, message: 'Email y fecha de la reunión requeridos' });
    }

    let contact = await prisma.contact.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!contact) {
      const parts = (name || 'Cliente').trim().split(' ');
      contact = await prisma.contact.create({
        data: {
          firstName: parts[0] || 'Cliente',
          lastName: parts.slice(1).join(' ') || 'Reunión',
          email: email.toLowerCase().trim(),
          phone: phone || null,
          isLead: true,
          notes: `Agendó cita ${meetingType} para el ${meetingDate}`,
        },
      });
    }

    // Create Calendar Meeting Activity
    const activity = await prisma.activity.create({
      data: {
        type: 'MEETING',
        subject: `Reunión Comercial: ${meetingType} con ${name || contact.firstName}`,
        description: `Tipo: ${meetingType}\nCompañía: ${companyName || 'N/A'}\nNotas: ${notes || 'Sin notas adicionales'}`,
        scheduledAt: new Date(meetingDate),
        durationMinutes: 30,
        contactId: contact.id,
      },
    });

    wsService.broadcast('appointment:booked', {
      contactId: contact.id,
      name: `${contact.firstName} ${contact.lastName}`,
      date: meetingDate,
      type: meetingType,
    });

    return res.status(201).json({
      success: true,
      message: 'Cita reservada y sincronizada en el calendario del CRM',
      activityId: activity.id,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Tracking Pixel JS Generator
 */
export const getTrackingPixelScript = (req: Request, res: Response) => {
  const protocol = req.protocol;
  const host = req.get('host') || 'localhost:3000';
  const crmEndpoint = `${protocol}://${host}/api/lead-capture/track`;

  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
(function() {
  var ENDPOINT = "${crmEndpoint}";
  var visitorId = localStorage.getItem('dama_crm_vid') || ('v_' + Math.random().toString(36).substr(2, 9));
  localStorage.setItem('dama_crm_vid', visitorId);

  var startTime = Date.now();

  function trackEvent(eventType, metadata) {
    try {
      var payload = {
        visitorId: visitorId,
        url: window.location.href,
        referrer: document.referrer || '',
        title: document.title,
        eventType: eventType || 'PAGE_VIEW',
        timeOnPage: Math.round((Date.now() - startTime) / 1000),
        metadata: metadata || {}
      };

      if (navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, JSON.stringify(payload));
      } else {
        fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        });
      }
    } catch(e) {}
  }

  // Auto track initial pageview
  trackEvent('PAGE_VIEW');

  // Track unload / dwell time
  window.addEventListener('beforeunload', function() {
    trackEvent('PAGE_LEAVE');
  });

  // Global helper for manual click tracking
  window.damaTrack = function(action, data) {
    trackEvent(action, data);
  };
})();
  `);
};

/**
 * Tracking Pixel Event Receiver
 */
export const recordTrackingEvent = async (req: Request, res: Response) => {
  try {
    const { visitorId, url, eventType, timeOnPage, metadata } = req.body;

    // Log pixel activity in audit log
    await prisma.auditLog.create({
      data: {
        action: `TRACK_${eventType || 'PAGE_VIEW'}`,
        entity: 'VisitorSession',
        entityId: visitorId || 'anonymous',
        details: JSON.stringify({
          url,
          timeOnPage,
          metadata,
          ip: req.ip || req.headers['x-forwarded-for'],
          userAgent: req.headers['user-agent'],
        }),
      },
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(200).json({ ok: true });
  }
};

/**
 * E-commerce: Abandoned Cart Notification & Sync
 */
export const handleAbandonedCart = async (req: Request, res: Response) => {
  try {
    const { email, firstName, items, cartTotal, recoveryUrl } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email requerido' });
    }

    let contact = await prisma.contact.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          firstName: firstName || 'Comprador',
          lastName: 'E-commerce',
          email: email.toLowerCase().trim(),
          isLead: true,
          notes: `Carrito abandonado por valor de ${cartTotal || 0}€`,
        },
      });
    }

    // Register Activity
    await prisma.activity.create({
      data: {
        type: 'NOTE',
        subject: `Carrito Abandonado: ${cartTotal || 0}€ (${items?.length || 0} artículos)`,
        description: `Productos: ${JSON.stringify(items || [])}\nEnlace de recuperación: ${recoveryUrl || 'N/A'}`,
        contactId: contact.id,
      },
    });

    // Notify WebSocket
    wsService.broadcast('ecommerce:cart_abandoned', {
      email,
      cartTotal,
      itemCount: items?.length || 0,
    });

    dispatchWorkflowEvent({
      trigger: 'cart.abandoned',
      data: {
        email,
        cartTotal,
        items,
        contactId: contact.id,
      },
    });

    return res.json({
      success: true,
      message: 'Carrito abandonado registrado en CRM y flujo de recuperación activado',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * E-commerce: Order & Lifetime Value (LTV) Calculation / VIP Tier
 */
export const handleEcommerceOrder = async (req: Request, res: Response) => {
  try {
    const { orderId, email, customerName, total, items, currency = 'EUR' } = req.body;

    if (!email || !total) {
      return res.status(400).json({ success: false, message: 'Email y total requeridos' });
    }

    let contact = await prisma.contact.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!contact) {
      const parts = (customerName || 'Cliente').trim().split(' ');
      contact = await prisma.contact.create({
        data: {
          firstName: parts[0] || 'Cliente',
          lastName: parts.slice(1).join(' ') || 'Tienda',
          email: email.toLowerCase().trim(),
          isLead: false,
          notes: `Cliente de tienda online. Pedido inicial: #${orderId}`,
        },
      });
    }

    const currentNotes = contact.notes || '';
    const isVip = total > 1000 || currentNotes.includes('VIP');

    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        isLead: false,
        notes: `${currentNotes}\n[${new Date().toLocaleDateString()}] Pedido #${orderId} por ${total} ${currency} ${isVip ? '⭐ CLIENTE VIP' : ''}`,
      },
    });

    // Create Activity
    await prisma.activity.create({
      data: {
        type: 'NOTE',
        subject: `Compra E-commerce realizada: Pedido #${orderId} (${total} ${currency})`,
        description: `Artículos: ${JSON.stringify(items || [])}`,
        contactId: contact.id,
      },
    });

    wsService.broadcast('ecommerce:order_placed', {
      orderId,
      customerEmail: email,
      total,
      currency,
      isVip,
    });

    return res.json({
      success: true,
      message: 'Pedido e-commerce sincronizado y valor acumulado actualizado',
      isVip,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * RGPD Opt-in & Opt-out Management
 */
export const updateMarketingConsent = async (req: Request, res: Response) => {
  try {
    const { email, consent, source = 'portal_preferences' } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email requerido' });
    }

    const contact = await prisma.contact.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (contact) {
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          notes: `${contact.notes || ''}\n[${new Date().toLocaleDateString()}] Consentimiento comercial actualizado: ${consent ? 'OPT-IN' : 'OPT-OUT (Baja)'}`,
        },
      });

      await prisma.auditLog.create({
        data: {
          action: consent ? 'MARKETING_OPT_IN' : 'MARKETING_OPT_OUT',
          entity: 'Contact',
          entityId: contact.id,
          details: JSON.stringify({
            ip: req.ip || req.headers['x-forwarded-for'],
            userAgent: req.headers['user-agent'],
            source,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    }

    return res.json({
      success: true,
      message: consent
        ? 'Preferencia guardada: Suscripción comercial activa'
        : 'Has sido dado de baja de comunicaciones comerciales (Opt-out RGPD registrado)',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Customer Support Ticketing System (Helpdesk / Service Desk)
 */
export const submitSupportTicket = async (req: Request, res: Response) => {
  try {
    const { email, name, subject, priority = 'MEDIUM', message, category = 'INCIDENT' } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Email, asunto y mensaje requeridos' });
    }

    let contact = await prisma.contact.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!contact) {
      const parts = (name || 'Usuario').trim().split(' ');
      contact = await prisma.contact.create({
        data: {
          firstName: parts[0] || 'Usuario',
          lastName: parts.slice(1).join(' ') || 'Soporte',
          email: email.toLowerCase().trim(),
          isLead: false,
          notes: `Generado desde Portal de Ayuda / Ticketing`,
        },
      });
    }

    const ticketNumber = `TCK-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create an Activity of type TASK for SLA assignment
    const ticketActivity = await prisma.activity.create({
      data: {
        type: 'TASK',
        subject: `[${ticketNumber}] ${subject} (Prioridad: ${priority})`,
        description: `Categoría: ${category}\nEstado: ABIERTO\nIncidencia reportada:\n${message}`,
        contactId: contact.id,
      },
    });

    // Record in OmniMessages timeline
    await prisma.omniMessage.create({
      data: {
        contactId: contact.id,
        channel: 'EMAIL',
        direction: 'INBOUND',
        sender: email,
        recipient: 'Soporte Técnico DAMA',
        subject: `[${ticketNumber}] ${subject}`,
        content: message,
      },
    });

    wsService.broadcast('ticket:created', {
      ticketNumber,
      subject,
      priority,
      contactEmail: email,
    });

    dispatchWorkflowEvent({
      trigger: 'ticket.created',
      data: {
        ticketNumber,
        subject,
        priority,
        email,
        ticketId: ticketActivity.id,
      },
    });

    return res.status(201).json({
      success: true,
      ticketNumber,
      ticketId: ticketActivity.id,
      data: {
        ticketNumber,
        ticketId: ticketActivity.id,
      },
      message: 'Ticket de soporte registrado y asignado al equipo técnico',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * List Support Tickets for Client Portal
 */
export const getClientTickets = async (req: Request, res: Response) => {
  try {
    const email = String(req.query.email || '').toLowerCase().trim();

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email requerido' });
    }

    const contact = await prisma.contact.findUnique({
      where: { email },
    });

    if (!contact) {
      return res.json({ success: true, data: [] });
    }

    const activities = await prisma.activity.findMany({
      where: {
        contactId: contact.id,
        type: 'TASK',
        subject: { startsWith: '[TCK-' },
      },
      orderBy: { createdAt: 'desc' },
    });

    const tickets = activities.map((act) => {
      const match = act.subject.match(/\[(TCK-\d+)\]\s*(.*?)\s*\(Prioridad:\s*(.*?)\)/);
      return {
        id: act.id,
        ticketNumber: match ? match[1] : 'TCK-GEN',
        subject: match ? match[2] : act.subject,
        priority: match ? match[3] : 'MEDIUM',
        description: act.description,
        createdAt: act.createdAt,
        status: act.completedAt ? 'RESOLVED' : 'IN_PROGRESS',
      };
    });

    return res.json({ success: true, data: tickets });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * RGPD Data Export (Right to Data Portability)
 */
export const exportCustomerData = async (req: Request, res: Response) => {
  try {
    const email = String(req.query.email || '').toLowerCase().trim();

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email requerido' });
    }

    const contact = await prisma.contact.findUnique({
      where: { email },
      include: {
        company: true,
        invoices: { include: { items: true } },
        deals: true,
        omniMessages: true,
      },
    });

    if (!contact) {
      return res.status(404).json({ success: false, message: 'No existen registros para este email' });
    }

    const activities = await prisma.activity.findMany({
      where: { contactId: contact.id },
    });

    const exportPayload = {
      exportTimestamp: new Date().toISOString(),
      reglamento: 'RGPD UE 2016/679 - Artículo 20 (Portabilidad de Datos)',
      perfil: {
        id: contact.id,
        nombre: contact.firstName,
        apellidos: contact.lastName,
        email: contact.email,
        telefono: contact.phone,
        empresa: contact.company?.name || null,
        fechaRegistro: contact.createdAt,
      },
      facturas: contact.invoices,
      negociaciones: contact.deals,
      comunicaciones: contact.omniMessages,
      actividades: activities,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="datos-crm-${contact.id}.json"`);
    return res.json(exportPayload);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
