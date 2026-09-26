import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { auditMiddleware } from '../../middlewares/audit.middleware';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  createNotification,
} from './notifications.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.delete('/clear-read', clearReadNotifications);
router.delete('/:id', deleteNotification);
router.post('/', auditMiddleware('CREATE', 'NOTIFICATION'), createNotification);

export default router;
