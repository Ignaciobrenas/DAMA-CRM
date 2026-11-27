import { Request, Response } from 'express';
import { buildThirdPartyIntegrationsCatalog } from './core/third-party-catalog';
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
    const apps = buildThirdPartyIntegrationsCatalog(config, baseUrl);

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
          userId: (req as any).user?.id || (req as any).user?.userId || null,
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
