import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  addTicketMessage,
  getTicketStats,
} from './tickets.controller';

const router = Router();

// Allow public access for customer ticket creation or authenticated access
router.get('/stats/summary', authMiddleware, getTicketStats);
router.get('/', authMiddleware, getTickets);
router.get('/:id', authMiddleware, getTicketById);
router.post('/', createTicket); // Supports both authenticated agents and customer self-service
router.patch('/:id', authMiddleware, updateTicket);
router.post('/:id/messages', authMiddleware, addTicketMessage);

export default router;
