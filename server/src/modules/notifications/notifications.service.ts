import { prisma } from '../../prisma';
import { wsService } from '../../services/websocket.service';

export interface CreateNotificationInput {
  userId?: string;
  tenantId?: string;
  title: string;
  message: string;
  type?: 'ticket' | 'invoice' | 'quote' | 'deal' | 'stock' | 'lead' | 'system' | 'workflow' | 'chat' | 'info';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  /**
   * Persists a notification to the database and broadcasts in real-time over WebSockets
   */
  public static async dispatch(input: CreateNotificationInput) {
    try {
      const tenantId = input.tenantId || 'master';
      const notification = await prisma.notification.create({
        data: {
          userId: input.userId || null,
          tenantId,
          title: input.title,
          message: input.message,
          type: input.type || 'info',
          priority: input.priority || 'normal',
          actionUrl: input.actionUrl || null,
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
          read: false,
        },
      });

      // Broadcast real-time WebSocket notification to all active clients in this tenant
      wsService.broadcast('notification:new', {
        id: notification.id,
        tenantId: notification.tenantId,
        userId: notification.userId,
        title: notification.title,
        desc: notification.message,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        actionUrl: notification.actionUrl,
        metadata: input.metadata,
        unread: true,
        createdAt: notification.createdAt.toISOString(),
      });

      return notification;
    } catch (error) {
      console.error('❌ Failed to create/dispatch notification:', error);
      return null;
    }
  }

  // Convenience triggers for core business events
  public static async notifyTicketCreated(ticket: { id: string; ticketNumber: string; title: string; priority: string; tenantId?: string | null }) {
    return this.dispatch({
      tenantId: ticket.tenantId || 'master',
      title: `🎫 Ticket #${ticket.ticketNumber} Creado`,
      message: `${ticket.title} (Prioridad: ${ticket.priority})`,
      type: 'ticket',
      priority: ticket.priority === 'URGENT' ? 'urgent' : ticket.priority === 'HIGH' ? 'high' : 'normal',
      actionUrl: '/tickets',
      metadata: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber },
    });
  }

  public static async notifyTicketReply(ticket: { id: string; ticketNumber: string; isInternal: boolean; senderName: string; tenantId?: string | null }) {
    return this.dispatch({
      tenantId: ticket.tenantId || 'master',
      title: ticket.isInternal ? `🔒 Nota Interna en Ticket #${ticket.ticketNumber}` : `💬 Nueva Respuesta en Ticket #${ticket.ticketNumber}`,
      message: `${ticket.senderName} ha respondido al ticket`,
      type: 'ticket',
      priority: 'normal',
      actionUrl: '/tickets',
      metadata: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber },
    });
  }

  public static async notifyQuoteSigned(quote: { id: string; quoteNumber: string; companyName: string; total: number; tenantId?: string | null }) {
    return this.dispatch({
      tenantId: quote.tenantId || 'master',
      title: `✍️ Presupuesto ${quote.quoteNumber} Firmado Digitalmente`,
      message: `${quote.companyName} ha aceptado y firmado la propuesta por €${quote.total.toFixed(2)}`,
      type: 'quote',
      priority: 'high',
      actionUrl: '/invoicing',
      metadata: { quoteId: quote.id, quoteNumber: quote.quoteNumber },
    });
  }

  public static async notifyInvoicePayment(invoice: { id: string; invoiceNumber: string; amount: number; remaining: number; tenantId?: string | null }) {
    const isFullyPaid = invoice.remaining <= 0;
    return this.dispatch({
      tenantId: invoice.tenantId || 'master',
      title: isFullyPaid ? `💰 Factura ${invoice.invoiceNumber} Cobrada` : `💵 Cobro Parcial en Factura ${invoice.invoiceNumber}`,
      message: isFullyPaid
        ? `Cobro completo de €${invoice.amount.toFixed(2)} registrado.`
        : `Abono de €${invoice.amount.toFixed(2)} registrado. Saldo pendiente: €${invoice.remaining.toFixed(2)}`,
      type: 'invoice',
      priority: 'normal',
      actionUrl: '/invoicing',
      metadata: { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber },
    });
  }

  public static async notifyStockAlert(product: { id: string; name: string; sku: string; stock: number; minStock: number; tenantId?: string | null }) {
    return this.dispatch({
      tenantId: product.tenantId || 'master',
      title: `⚠️ Alerta de Stock Mínimo`,
      message: `"${product.name}" (${product.sku}) tiene solo ${product.stock} uds (Mínimo: ${product.minStock})`,
      type: 'stock',
      priority: 'high',
      actionUrl: '/inventory',
      metadata: { productId: product.id, sku: product.sku },
    });
  }

  public static async notifyDealWon(deal: { id: string; title: string; value: number; currency: string; tenantId?: string | null }) {
    return this.dispatch({
      tenantId: deal.tenantId || 'master',
      title: `🎉 ¡Oportunidad Ganada!`,
      message: `${deal.title} cerrada con éxito por ${deal.value.toLocaleString()} ${deal.currency}`,
      type: 'deal',
      priority: 'high',
      actionUrl: '/pipeline',
      metadata: { dealId: deal.id },
    });
  }

  public static async notifyLeadCaptured(lead: { name: string; email: string; source: string; tenantId?: string | null }) {
    return this.dispatch({
      tenantId: lead.tenantId || 'master',
      title: `🎯 Nuevo Lead Capturado`,
      message: `${lead.name} (${lead.email}) capturado desde ${lead.source}`,
      type: 'lead',
      priority: 'normal',
      actionUrl: '/contacts',
      metadata: { email: lead.email, source: lead.source },
    });
  }
}
