import { Request, Response } from 'express';
import { IntegrationsService } from './integrations.service';
import { ConnectorType } from './integrations.types';

const ALLOWED_CONNECTORS: ConnectorType[] = [
  'a3erp',
  'odoo',
  'woocommerce',
  'shopify',
  'opencart',
  'prestashop',
  'n8n',
  'unopim',
  'whatsapp',
  'stripe',
  'zapier',
  'google_calendar',
  'sage_one',
  'sage_50',
  'sage_200',
];

export function getIntegrations(req: Request, res: Response): void {
  try {
    const config = IntegrationsService.getPublicConfig();
    const host = req.get('host') || 'localhost:4000';
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;

    const endpoints = {
      woocommerceWebhook: `${baseUrl}/api/integrations/woocommerce/webhook`,
      shopifyWebhook: `${baseUrl}/api/integrations/shopify/webhook`,
      opencartWebhook: `${baseUrl}/api/integrations/opencart/webhook`,
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
    const host = req.get('host') || 'localhost:4000';
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;

    const apps = [
      {
        id: 'a3erp',
        nombre: 'a3ERP (Wolters Kluwer / esofitec)',
        categoria: 'ERP & Contabilidad',
        tipo: 'Sit.a3ERP.Api REST v2.4 (Procs + Custom Tasks)',
        estado: config.a3erp.status,
        activo: config.a3erp.enabled,
        descripcion:
          'Conector integral con a3ERP: 26 procedimientos de lectura paginados (X-Pagination / Parameters Base64), 42 endpoints de escritura asíncrona con sondeo de TaskId y cuadrado automático de códigos (15/8/4).',
        capacidades: ['Artículos & Tarifas', 'Pedidos (AltaPedidoVenta)', 'Clientes por NIF', 'Stock & Tallas', 'Códigos Cuadrados'],
        documentacion: 'https://apis.esofitec.com/a3erp-api/openapi.json',
        configuracion: {
          baseUrl: config.a3erp.baseUrl,
          usuario: config.a3erp.username,
          tienePassword: config.a3erp.hasPassword,
          seriePorDefecto: config.a3erp.defaultSerie,
          almacenPorDefecto: config.a3erp.defaultWarehouse,
          ivaIncluido: config.a3erp.ivaIncluido,
          ultimaSincronizacion: config.a3erp.lastSyncAt || null,
        },
      },
      {
        id: 'sage_200',
        nombre: 'Sage 200 Advanced Enterprise (StoamConnectAPIv2)',
        categoria: 'ERP Empresarial & Fabricación',
        tipo: 'REST API v1 (TmpIME + ImportaIME) & GraphQL ES256',
        estado: config.sage_200?.status || 'disconnected',
        activo: config.sage_200?.enabled || false,
        descripcion:
          'Integración empresarial con Sage 200 mediante LCOEM.dll (DameContador + ImportaIME sobre 7 entidades TmpIME_* con 612 campos auditados) y lectura GraphQL de 259 modelos.',
        capacidades: ['10 Tipos Documento (PVE/FAC/ALC)', 'ClientesProveedores', 'Domicilios', 'Traspasos de Stock', 'GraphQL 259 Modelos'],
        documentacion: 'https://developer.sage.com/sage-200/',
        configuracion: {
          baseUrl: config.sage_200?.baseUrl,
          codigoEmpresa: config.sage_200?.codigoEmpresa,
          tieneSubscriptionKey: config.sage_200?.hasSubscriptionKey,
          companyId: config.sage_200?.companyId,
          sincronizarClientes: config.sage_200?.syncCustomers,
          sincronizarFacturas: config.sage_200?.syncInvoices,
          sincronizarLibros: config.sage_200?.syncLedgers,
          ultimaSincronizacion: config.sage_200?.lastSyncAt || null,
        },
      },
      {
        id: 'prestashop',
        nombre: 'PrestaShop (Dual API v8 / v9)',
        categoria: 'Comercio Electrónico',
        tipo: 'Webservice Clásico XML (/api/) + Admin API CQRS (/admin-api/)',
        estado: config.prestashop?.status || 'disconnected',
        activo: config.prestashop?.enabled || false,
        descripcion:
          'Arquitectura dual paralela: Webservice clásico (69 recursos, pedidos en bloque, stock_availables XML parcial) y Admin API de PrestaShop 9 (OAuth2, 33 dominios, productos localizados y combinaciones).',
        capacidades: ['Pedidos en Bloque', 'Admin API OAuth2', 'Combinaciones & Variantes', 'Stock XML Parcial', 'Auditoría Duplicados'],
        documentacion: 'https://devdocs.prestashop-project.org/9/',
        configuracion: {
          storeUrl: config.prestashop?.storeUrl,
          tieneWsKey: config.prestashop?.hasWsKey,
          tieneAdminClientSecret: config.prestashop?.hasAdminClientSecret,
          defaultLocale: config.prestashop?.defaultLocale,
          sincronizarProductos: config.prestashop?.syncProducts,
          sincronizarPedidos: config.prestashop?.syncOrders,
          sincronizarClientes: config.prestashop?.syncCustomers,
          ultimaSincronizacion: config.prestashop?.lastSyncAt || null,
        },
      },
      {
        id: 'shopify',
        nombre: 'Shopify Store (Admin GraphQL & B2B)',
        categoria: 'Comercio Electrónico',
        tipo: 'Admin GraphQL API (2026-04) & Webhooks HMAC-SHA256',
        estado: config.shopify.status,
        activo: config.shopify.enabled,
        descripcion:
          'Conector exclusivo GraphQL Admin API con GIDs, paginación Relay por cursor, MoneyBag (*Set), soporte B2B (PurchasingCompany, PriceList, metafields sage.*/b2b.*) y mutaciones idempotentes productSet e inventorySetQuantities.',
        capacidades: ['GraphQL 2026-04', 'productSet Idempotente', 'B2B PurchasingCompany', 'inventorySetQuantities', 'HMAC SHA-256'],
        documentacion: 'https://shopify.dev/docs/api/admin-graphql',
        webhookUrl: `${baseUrl}/api/integrations/shopify/webhook`,
        eventosSoportados: ['orders/create', 'customers/create', 'products/update'],
        configuracion: {
          shopDomain: config.shopify.shopDomain,
          apiVersion: config.shopify.apiVersion,
          skuField: config.shopify.skuField,
          tieneAccessToken: config.shopify.hasAccessToken,
          tieneApiSecretKey: config.shopify.hasApiSecretKey,
          ultimaSincronizacion: config.shopify.lastSyncAt || null,
        },
      },
      {
        id: 'woocommerce',
        nombre: 'WooCommerce (REST API v3)',
        categoria: 'Comercio Electrónico',
        tipo: 'REST API v3 (/wp-json/wc/v3/) & Batch Operations',
        estado: config.woocommerce.status,
        activo: config.woocommerce.enabled,
        descripcion:
          'Conector completo REST API v3 con 16 familias de entidades, operaciones /batch (hasta 100), extracción de _billing_nif, poda de seguridad, reconciliación de cliente por NIF con retención on_hold y cálculo de precios con IVA incluido.',
        capacidades: ['REST API v3 (16 Entidades)', 'Reconciliación NIF (on_hold)', 'Poda de Seguridad', 'Variaciones /batch', 'Precios con IVA'],
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
        id: 'opencart',
        nombre: 'OpenCart eCommerce',
        categoria: 'Comercio Electrónico & Catálogo',
        tipo: 'REST API v3/v4 & Webhooks',
        estado: config.opencart?.status || 'disconnected',
        activo: config.opencart?.enabled || false,
        descripcion: 'Sincronización bidireccional de catálogo, mapeo automático de atributos de producto, control de existencias y pedidos de OpenCart.',
        capacidades: ['Catálogo', 'Atributos Multi-App', 'Pedidos', 'Clientes', 'Mapeo Automático'],
        documentacion: 'https://docs.opencart.com/en-gb/system/users/api/',
        webhookUrl: `${baseUrl}/api/integrations/opencart/webhook`,
        eventosSoportados: ['product.created', 'product.updated', 'order.created'],
        configuracion: {
          storeUrl: config.opencart?.storeUrl,
          apiUsername: config.opencart?.apiUsername,
          tieneApiKey: config.opencart?.hasApiKey,
          sincronizarProductos: config.opencart?.syncProducts,
          sincronizarPedidos: config.opencart?.syncOrders,
          sincronizarClientes: config.opencart?.syncCustomers,
          ultimaSincronizacion: config.opencart?.lastSyncAt || null,
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
      {
        id: 'sage_one',
        nombre: 'Sage Business Cloud Accounting (Sage 1)',
        categoria: 'ERP & Contabilidad Cloud',
        tipo: 'REST API v3.1 / OAuth 2.0',
        estado: config.sage_one?.status || 'disconnected',
        activo: config.sage_one?.enabled || false,
        descripcion: 'Conexión oficial con Sage Business Cloud (Sage One) para sincronización en tiempo real de contactos, clientes, catálogo y facturación.',
        capacidades: ['Clientes (Sales Ledger)', 'Facturas de Venta', 'Catálogo de Artículos', 'Impuestos SII'],
        documentacion: 'https://developer.sage.com/accounting/reference/',
        configuracion: {
          apiUrl: config.sage_one?.apiUrl,
          tieneApiKey: config.sage_one?.hasApiKey,
          businessId: config.sage_one?.businessId,
          sincronizarContactos: config.sage_one?.syncContacts,
          sincronizarFacturas: config.sage_one?.syncInvoices,
          sincronizarProductos: config.sage_one?.syncProducts,
          ultimaSincronizacion: config.sage_one?.lastSyncAt || null,
        },
      },
      {
        id: 'sage_50',
        nombre: 'Sage 50cloud / Desktop',
        categoria: 'ERP & Contabilidad PYME',
        tipo: 'SData Protocol & Desktop Engine',
        estado: config.sage_50?.status || 'disconnected',
        activo: config.sage_50?.enabled || false,
        descripcion: 'Enlace contable y comercial directo con Sage 50. Gestión de subcuentas de clientes (430), facturas y control de existencias.',
        capacidades: ['Subcuentas 430', 'Facturas Expedidas', 'Control de Stock', 'Asientos Contables'],
        documentacion: 'https://developer.sage.com/50-cloud/',
        configuracion: {
          endpointUrl: config.sage_50?.endpointUrl,
          empresa: config.sage_50?.companyName,
          ejercicioFiscal: config.sage_50?.fiscalYear,
          tieneApiKey: config.sage_50?.hasApiKey,
          sincronizarClientes: config.sage_50?.syncCustomers,
          sincronizarFacturas: config.sage_50?.syncInvoices,
          sincronizarStock: config.sage_50?.syncStock,
          ultimaSincronizacion: config.sage_50?.lastSyncAt || null,
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
    if (!ALLOWED_CONNECTORS.includes(connector as ConnectorType)) {
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
    if (!ALLOWED_CONNECTORS.includes(connector as ConnectorType)) {
      res.status(400).json({ success: false, message: `Conector no soportado para test: ${connector}` });
      return;
    }

    const result = await IntegrationsService.testConnector(connector as ConnectorType, req.body);

    const { prisma } = require('../../prisma');
    await prisma.auditLog
      .create({
        data: {
          userId: req.user?.id || (req as any).user?.userId || null,
          action: 'INTEGRATION_TEST',
          entity: 'Integration',
          entityId: connector,
          details: JSON.stringify({ success: result.success, message: result.message }),
          ipAddress: req.ip || req.socket?.remoteAddress || null,
          tenantId: (req as any).user?.tenantId || 'master',
        },
      })
      .catch(() => {});

    res.status(result.success ? 200 : 400).json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function syncIntegration(req: Request, res: Response): Promise<void> {
  try {
    const { connector } = req.params;
    const syncAllowed: ConnectorType[] = [
      'a3erp',
      'odoo',
      'woocommerce',
      'shopify',
      'opencart',
      'prestashop',
      'stripe',
      'google_calendar',
      'sage_one',
      'sage_50',
      'sage_200',
    ];
    if (!syncAllowed.includes(connector as ConnectorType)) {
      res.status(400).json({
        success: false,
        message: `La sincronización manual solo aplica a: ${syncAllowed.join(', ')}`,
      });
      return;
    }

    const tenantId = (req as any).user?.tenantId || (req.headers['x-tenant-id'] as string) || 'master';
    const result = await IntegrationsService.syncConnector(connector as ConnectorType, tenantId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export function getConnectorCatalog(req: Request, res: Response): void {
  try {
    const { connector } = req.params;
    const catalog = IntegrationsService.getConnectorCatalog(connector as ConnectorType);
    if (!catalog) {
      res.status(404).json({
        success: false,
        message: `Catálogo técnico no encontrado para el conector '${connector}'.`,
      });
      return;
    }
    res.json({
      success: true,
      connector,
      data: catalog,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function executeConnectorOperation(req: Request, res: Response): Promise<void> {
  try {
    const { connector } = req.params;
    const { operation, payload } = req.body || {};
    if (!operation) {
      res.status(400).json({
        success: false,
        message: 'El campo operation es obligatorio para ejecutar una operación de conector.',
      });
      return;
    }

    const tenantId = (req as any).user?.tenantId || (req.headers['x-tenant-id'] as string) || 'master';
    const result = await IntegrationsService.executeConnectorOperation(
      connector as ConnectorType,
      operation,
      payload || {},
      tenantId
    );
    res.status(result.success ? 200 : 400).json(result);
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
    const n8nConfig = IntegrationsService.loadConfig().n8n;
    if (n8nConfig.apiKey && n8nConfig.apiKey.trim()) {
      const authHeader = req.headers.authorization;
      const apiKeyHeader = req.headers['x-api-key'];
      const bodyApiKey = req.body?.apiKey;
      const providedKey =
        apiKeyHeader || bodyApiKey || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader);
      if (providedKey !== n8nConfig.apiKey) {
        res.status(401).json({ success: false, message: 'Clave API de n8n no válida o no proporcionada' });
        return;
      }
    }

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

export async function handleOpenCartWebhook(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = (req.headers['x-tenant-id'] as string) || 'master';
    const result = await IntegrationsService.handleOpenCartWebhook(req.body, tenantId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export function getAttributesSchema(_req: Request, res: Response): void {
  try {
    const schema = IntegrationsService.getConnectorsAttributesSchema();
    res.json({
      success: true,
      data: schema,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function bulkAutoMapAttributes(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = (req.headers['x-tenant-id'] as string) || 'master';
    const result = await IntegrationsService.bulkAutoMapProducts(tenantId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function sendTestEmail(req: Request, res: Response): Promise<void> {
  try {
    const { to, template, variables } = req.body;
    const tenantId = (req as any).user?.tenantId || (req.headers['x-tenant-id'] as string) || 'master';
    const { EmailService } = await import('../../services/email.service');
    const result = await EmailService.sendEmail({
      to: to || 'admin@dama-crm.local',
      subject: req.body.subject,
      template: template || '2fa_otp',
      variables: variables || {},
      tenantId,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function previewEmailTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { template, variables } = req.body;
    const tenantId = (req as any).user?.tenantId || (req.headers['x-tenant-id'] as string) || 'master';
    const { EmailService } = await import('../../services/email.service');
    const branding = await EmailService.getTenantBranding(tenantId);
    const result = EmailService.renderTemplate(template || '2fa_otp', variables || {}, branding);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
