import { Router } from 'express';
import {
  verifyWhatsAppWebhook,
  receiveWhatsAppWebhook,
  listMessages,
  sendOutboundMessage,
  getClientPortalData,
} from './omnichannel.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';

const router = Router();

// Public Webhook endpoints for Meta WhatsApp Cloud API
router.get('/webhooks/whatsapp', verifyWhatsAppWebhook);
router.post('/webhooks/whatsapp', receiveWhatsAppWebhook);

// Public B2B Client Portal data
router.get('/portal/:companyId', getClientPortalData);

// Protected routes for CRM agents
router.use(authMiddleware);
router.get('/messages', requirePermission('omnichannel', 'read'), listMessages);
router.post('/messages', requirePermission('omnichannel', 'create'), sendOutboundMessage);

export default router;
