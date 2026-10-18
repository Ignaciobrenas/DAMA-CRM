import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  addTicketMessage,
  getTicketStats,
  exportTicketsCsv,
  exportTicketsPdf,
  deleteTicket,
} from './tickets.controller';

const router = Router();

router.get('/export/csv', authMiddleware, requirePermission('tickets', 'read'), exportTicketsCsv);
router.get('/export/pdf', authMiddleware, requirePermission('tickets', 'read'), exportTicketsPdf);

router.get('/stats/summary', authMiddleware, requirePermission('tickets', 'read'), getTicketStats);
router.get('/', authMiddleware, requirePermission('tickets', 'read'), getTickets);
router.get('/:id', authMiddleware, requirePermission('tickets', 'read'), getTicketById);
router.post('/', createTicket); // Supports both authenticated agents and customer self-service
router.patch('/:id', authMiddleware, requirePermission('tickets', 'update'), updateTicket);
router.delete('/:id', authMiddleware, requirePermission('tickets', 'delete'), deleteTicket);
router.post('/:id/messages', authMiddleware, addTicketMessage);

export default router;
