import { Router } from 'express';
import {
  getIntegrations,
  getIntegracionesDeTerceros,
  updateIntegration,
  testIntegration,
  syncIntegration,
  handleWooCommerceWebhook,
  handleShopifyWebhook,
  handleOpenCartWebhook,
  handleN8nAction,
  handleStripeWebhook,
  handleZapierWebhook,
  triggerN8nTest,
  getAttributesSchema,
  bulkAutoMapAttributes,
} from './integrations.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';

const router = Router();

// Endpoint público/autenticado con el catálogo completo de aplicaciones integrables
router.get('/terceros', getIntegracionesDeTerceros);
router.get('/third-party', getIntegracionesDeTerceros);

// -----------------------------------------------------------------------------
// Inbound Webhooks & Action Receivers (Public / Signature-Verified)
// -----------------------------------------------------------------------------
router.post('/woocommerce/webhook', handleWooCommerceWebhook);
router.post('/shopify/webhook', handleShopifyWebhook);
router.post('/opencart/webhook', handleOpenCartWebhook);
router.post('/n8n/action', handleN8nAction);
router.post('/stripe/webhook', handleStripeWebhook);
router.post('/zapier/webhook', handleZapierWebhook);

// -----------------------------------------------------------------------------
// Protected Management Endpoints (Requires Auth & Manage Permissions)
// -----------------------------------------------------------------------------
router.use(authMiddleware);

// Lectura de estado permitida a usuarios autenticados
router.get('/', getIntegrations);
router.get('/attributes/schema', getAttributesSchema);
router.post('/attributes/auto-map-bulk', requirePermission('inventory', 'update'), bulkAutoMapAttributes);

// Modificaciones y ejecuciones protegidas para administradores
router.put('/:connector', requirePermission('integrations', 'manage'), updateIntegration);
router.post('/:connector/test', requirePermission('integrations', 'manage'), testIntegration);
router.post('/:connector/sync', requirePermission('integrations', 'manage'), syncIntegration);
router.post('/n8n/test', requirePermission('integrations', 'manage'), triggerN8nTest);

export default router;

