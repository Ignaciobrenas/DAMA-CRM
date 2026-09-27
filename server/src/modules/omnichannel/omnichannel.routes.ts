import { Router } from 'express';
import {
  verifyWhatsAppWebhook,
  receiveWhatsAppWebhook,
  listMessages,
  sendOutboundMessage,
  getClientPortalData,
  listInternalChannelsAndTeam,
  listInternalMessages,
  sendInternalMessage,
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

// External Omnichannel & WhatsApp
router.get('/messages', requirePermission('omnichannel', 'read'), listMessages);
router.post('/messages', requirePermission('omnichannel', 'create'), sendOutboundMessage);

// Internal Team Chat & Colleague Direct Messages
router.get('/internal/channels', requirePermission('omnichannel', 'read'), listInternalChannelsAndTeam);
router.get('/internal/messages', requirePermission('omnichannel', 'read'), listInternalMessages);
router.post('/internal/messages', requirePermission('omnichannel', 'create'), sendInternalMessage);

export default router;
