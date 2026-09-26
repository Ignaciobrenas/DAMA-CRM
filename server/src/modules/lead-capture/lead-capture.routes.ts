import { Router } from 'express';
import {
  submitContactForm,
  submitLeadMagnet,
  checkProgressiveProfile,
  initiateChatSession,
  bookAppointment,
  getTrackingPixelScript,
  recordTrackingEvent,
  handleAbandonedCart,
  handleEcommerceOrder,
  updateMarketingConsent,
  submitSupportTicket,
  getClientTickets,
  exportCustomerData,
} from './lead-capture.controller';

const router = Router();

// 1. Puntos de Captura
router.post('/contact', submitContactForm);
router.post('/lead-magnet', submitLeadMagnet);
router.get('/profile-check', checkProgressiveProfile);
router.post('/chat-session', initiateChatSession);
router.post('/appointments', bookAppointment);

// 2. Conectores Técnicos & Píxel
router.get('/pixel.js', getTrackingPixelScript);
router.post('/track', recordTrackingEvent);

// 3. E-commerce & Carrito Abandonado
router.post('/ecommerce/cart-abandoned', handleAbandonedCart);
router.post('/ecommerce/order', handleEcommerceOrder);

// 4. Privacidad RGPD & Consentimientos
router.post('/consent', updateMarketingConsent);
router.get('/privacy-export', exportCustomerData);

// 5. Helpdesk Ticketing
router.post('/tickets', submitSupportTicket);
router.get('/tickets', getClientTickets);

export default router;
