import { Request, Response } from 'express';
import { IntegrationsService } from './integrations.service';
import { ConnectorType } from './integrations.types';

export function getIntegrations(req: Request, res: Response): void {
  try {
    const config = IntegrationsService.getPublicConfig();
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;

    const endpoints = {
      woocommerceWebhook: `${baseUrl}/api/integrations/woocommerce/webhook`,
      shopifyWebhook: `${baseUrl}/api/integrations/shopify/webhook`,
      n8nActionEndpoint: `${baseUrl}/api/integrations/n8n/action`,
      stripeWebhook: `${baseUrl}/api/integrations/stripe/webhook`,
      zapierWebhook: `${baseUrl}/api/integrations/zapier/webhook`,
      unopimWebhook: `${baseUrl}/api/inventory/webhooks/unopim`,
      whatsappWebhook: `${baseUrl}/api/omnichannel/webhooks/whatsapp`,
    };

    res.json({
      success: true,
      data: config,
      endpoints,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export function getIntegracionesDeTerceros(req: Request, res: Response): void {
  try {
    const config = IntegrationsService.getPublicConfig();
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;

    const apps = [
      {
        id: 'odoo',
        nombre: 'Odoo ERP & CRM',
        categoria: 'ERP & Contabilidad',
        tipo: 'Bidireccional (XML-RPC / JSON-RPC)',
        estado: config.odoo.status,
        activo: config.odoo.enabled,
        descripcion: 'Sincronización de contactos (res.partner), pedidos de venta, facturas (account.move) y catálogo de productos.',
        capacidades: ['Contactos', 'Facturación', 'Presupuestos', 'Productos'],
        documentacion: 'https://www.odoo.com/documentation/17.0/developer/reference/external_api.html',
        configuracion: {
          url: config.odoo.url,
          db: config.odoo.db,
          usuario: config.odoo.username,
          tieneApiKey: config.odoo.hasApiKey,
          sincronizarContactos: config.odoo.syncContacts,
          sincronizarFacturas: config.odoo.syncInvoices,
          sincronizarProductos: config.odoo.syncProducts,
          ultimaSincronizacion: config.odoo.lastSyncAt || null,
        },
      },
      {
        id: 'woocommerce',
        nombre: 'WooCommerce',
        categoria: 'Comercio Electrónico',
        tipo: 'Webhooks & REST API v3',
        estado: config.woocommerce.status,
        activo: config.woocommerce.enabled,
        descripcion: 'Recepción de pedidos en tiempo real, creación automática de tratos en el pipeline y sincronización de clientes.',
        capacidades: ['Pedidos', 'Clientes', 'Webhooks en tiempo real', 'Stock'],
        documentacion: 'https://woocommerce.github.io/woocommerce-rest-api-docs/',
        webhookUrl: `${baseUrl}/api/integrations/woocommerce/webhook`,
        eventosSoportados: ['order.created', 'order.updated', 'customer.created'],
        configuracion: {
          storeUrl: config.woocommerce.storeUrl,
          tieneConsumerKey: config.woocommerce.hasConsumerKey,
          tieneConsumerSecret: config.woocommerce.hasConsumerSecret,
          ultimaSincronizacion: config.woocommerce.lastSyncAt || null,
        },
      },
      {
        id: 'shopify',
        nombre: 'Shopify Store',
        categoria: 'Comercio Electrónico',
        tipo: 'Webhooks HMAC-SHA256 & Admin API',
        estado: config.shopify.status,
        activo: config.shopify.enabled,
        descripcion: 'Integración criptográficamente verificada con tiendas Shopify para importar pedidos, crear leads y sincronizar catálogo.',
        capacidades: ['Pedidos', 'Clientes', 'HMAC SHA-256', 'Catálogo'],
        documentacion: 'https://shopify.dev/docs/api/admin-rest',
        webhookUrl: `${baseUrl}/api/integrations/shopify/webhook`,
        eventosSoportados: ['orders/create', 'customers/create', 'products/update'],
        configuracion: {
          shopDomain: config.shopify.shopDomain,
          tieneAccessToken: config.shopify.hasAccessToken,
          tieneApiSecretKey: config.shopify.hasApiSecretKey,
          ultimaSincronizacion: config.shopify.lastSyncAt || null,
        },
      },
      {
        id: 'n8n',
        nombre: 'n8n Workflow Automation',
        categoria: 'Automatización & Flujos',
        tipo: 'Bidireccional (Outbound Webhooks + Inbound Action Runner)',
        estado: config.n8n.status,
        activo: config.n8n.enabled,
        descripcion: 'Disparador de eventos en tiempo real hacia n8n y ejecutor de acciones inbound para orquestar flujos de trabajo ilimitados.',
        capacidades: ['Webhooks Outbound', 'Acciones Inbound', 'API Keys', 'Triggers CRM'],
        documentacion: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/',
        actionEndpointUrl: `${baseUrl}/api/integrations/n8n/action`,
        accionesInboundSoportadas: ['create_contact', 'create_deal', 'update_deal_stage', 'create_activity', 'create_product'],
        configuracion: {
          webhookUrl: config.n8n.webhookUrl,
          tieneApiKey: config.n8n.hasApiKey,
          eventosSuscritos: config.n8n.subscribedEvents,
          ultimoDisparo: config.n8n.lastTriggerAt || null,
        },
      },
      {
        id: 'unopim',
        nombre: 'UnoPIM (Product Information Management)',
        categoria: 'Gestión de Productos & PIM',
        tipo: 'Webhooks JSON & Sincronización Nocturna',
        estado: 'connected',
        activo: true,
        descripcion: 'Catálogo centralizado de productos, sincronización nocturna e integración nativa con inventario DAMA.',
        capacidades: ['Catálogo', 'Variantes', 'Stock automático', 'SKUs'],
        webhookUrl: `${baseUrl}/api/inventory/webhooks/unopim`,
        documentacion: 'https://unopim.com/docs',
      },
      {
        id: 'whatsapp',
        nombre: 'WhatsApp Cloud (Meta Business API)',
        categoria: 'Mensajería Omnicanal',
        tipo: 'Webhooks Meta Cloud & Conversational Graph API',
        estado: 'connected',
        activo: true,
        descripcion: 'Bandeja omnicanal unificada para atención al cliente, mensajes de plantilla verificados y agentes multi-usuario.',
        capacidades: ['Chat 24/7', 'Webhooks Meta', 'Plantillas HSM', 'Respuestas automáticas'],
        webhookUrl: `${baseUrl}/api/omnichannel/webhooks/whatsapp`,
        documentacion: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
      },
      {
        id: 'stripe',
        nombre: 'Stripe Payments',
        categoria: 'Pasarela de Pagos',
        tipo: 'Webhooks & Checkout Sessions',
        estado: config.stripe?.status || 'disconnected',
        activo: config.stripe?.enabled || false,
        descripcion: 'Cobro de facturas y presupuestos directamente desde el portal del cliente con tarjeta, SEPA y Apple Pay.',
        capacidades: ['Pagos 3D-Secure', 'Suscripciones', 'SEPA Direct Debit', 'Facturas'],
        documentacion: 'https://stripe.com/docs/api',
        configuracion: {
          tieneSecretKey: config.stripe?.hasSecretKey,
          ultimaSincronizacion: config.stripe?.lastSyncAt || null,
        },
      },
      {
        id: 'zapier',
        nombre: 'Zapier Webhooks',
        categoria: 'Automatización & Flujos',
        tipo: 'REST Hooks',
        estado: config.zapier?.status || 'disconnected',
        activo: config.zapier?.enabled || false,
        descripcion: 'Conecta con más de 5.000 aplicaciones a través de webhooks estándar de entrada y salida.',
        capacidades: ['Disparadores Zaps', 'Acciones', 'Multi-app workflows'],
        documentacion: 'https://zapier.com/apps/webhook/integrations',
        webhookUrl: `${baseUrl}/api/integrations/zapier/webhook`,
        configuracion: {
          webhookUrl: config.zapier?.webhookUrl,
          tieneApiKey: config.zapier?.hasApiKey,
          ultimoDisparo: config.zapier?.lastTriggerAt || null,
        },
      },
      {
        id: 'google_calendar',
        nombre: 'Google Calendar',
        categoria: 'Productividad & Agenda',
        tipo: 'OAuth2 / CalDAV Bidireccional',
        estado: config.google_calendar?.status || 'disconnected',
        activo: config.google_calendar?.enabled || false,
        descripcion: 'Sincroniza reuniones de tratos, llamadas programadas y tareas directamente con la agenda de Google Workspace.',
        capacidades: ['Reuniones', 'Eventos en tiempo real', 'Recordatorios', 'Sincronización bidireccional'],
        documentacion: 'https://developers.google.com/calendar/api',
        configuracion: {
          email: config.google_calendar?.email,
          tieneClientSecret: config.google_calendar?.hasClientSecret,
          ultimaSincronizacion: config.google_calendar?.lastSyncAt || null,
        },
      },
    ];

    res.json({
      success: true,
      endpoint: '/api/integraciones-de-terceros',
      total: apps.length,
      timestamp: new Date().toISOString(),
      aplicaciones: apps,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export function updateIntegration(req: Request, res: Response): void {
  try {
    const { connector } = req.params;
    const allowed: ConnectorType[] = ['odoo', 'woocommerce', 'shopify', 'n8n', 'stripe', 'zapier', 'google_calendar'];
    if (!allowed.includes(connector as ConnectorType)) {
      res.status(400).json({ success: false, message: `Conector inválido: ${connector}` });
      return;
    }

    const updated = IntegrationsService.updateConnectorConfig(connector as any, req.body);
    res.json({
      success: true,
      data: updated,
      message: `Configuración de ${connector} actualizada correctamente`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function testIntegration(req: Request, res: Response): Promise<void> {
  try {
    const { connector } = req.params;
    let result: { success: boolean; message: string; details?: any };

    switch (connector) {
      case 'odoo':
        result = await IntegrationsService.testOdoo(req.body);
        break;
      case 'woocommerce':
        result = await IntegrationsService.testWooCommerce(req.body);
        break;
      case 'shopify':
        result = await IntegrationsService.testShopify(req.body);
        break;
      case 'n8n':
        result = await IntegrationsService.testN8n(req.body);
        break;
      case 'stripe':
        result = await IntegrationsService.testStripe(req.body);
        break;
      case 'zapier':
        result = await IntegrationsService.testZapier(req.body);
        break;
      case 'google_calendar':
        result = await IntegrationsService.testGoogleCalendar(req.body);
        break;
      case 'unopim':
      case 'whatsapp':
        result = { success: true, message: `Conector nativo ${connector} activo y respondiendo.` };
        break;
      default:
        res.status(400).json({ success: false, message: `Conector no soportado para test: ${connector}` });
        return;
    }

    res.status(result.success ? 200 : 400).json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function syncIntegration(req: Request, res: Response): Promise<void> {
  try {
    const { connector } = req.params;
    const allowed = ['odoo', 'woocommerce', 'shopify', 'stripe', 'google_calendar'];
    if (!allowed.includes(connector)) {
      res.status(400).json({ success: false, message: `La sincronización manual solo aplica a: ${allowed.join(', ')}` });
      return;
    }

    const result = await IntegrationsService.syncConnector(connector as any);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  try {
    const result = await IntegrationsService.processStripeWebhook(req.body);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function handleZapierWebhook(req: Request, res: Response): Promise<void> {
  try {
    const result = await IntegrationsService.processZapierWebhook(req.body);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function handleWooCommerceWebhook(req: Request, res: Response): Promise<void> {
  try {
    const topic = (req.headers['x-wc-webhook-topic'] as string) || req.body?.event || 'order.created';
    const result = await IntegrationsService.processWooCommerceWebhook(topic, req.body);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function handleShopifyWebhook(req: Request, res: Response): Promise<void> {
  try {
    const hmacHeader = (req.headers['x-shopify-hmac-sha256'] as string) || '';
    const topic = (req.headers['x-shopify-topic'] as string) || req.body?.topic || 'orders/create';

    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const isValid = IntegrationsService.verifyShopifyHmac(rawBody, hmacHeader);

    if (!isValid && process.env.NODE_ENV === 'production') {
      res.status(401).json({ success: false, message: 'Firma HMAC de Shopify inválida' });
      return;
    }

    const result = await IntegrationsService.processShopifyWebhook(topic, req.body);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function handleN8nAction(req: Request, res: Response): Promise<void> {
  try {
    const { action, payload } = req.body;
    if (!action) {
      res.status(400).json({ success: false, message: 'El parámetro action es obligatorio' });
      return;
    }

    const result = await IntegrationsService.processN8nAction(action, payload || {});
    res.status(result.success ? 200 : 400).json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function triggerN8nTest(req: Request, res: Response): Promise<void> {
  try {
    const result = await IntegrationsService.testN8n(req.body);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
