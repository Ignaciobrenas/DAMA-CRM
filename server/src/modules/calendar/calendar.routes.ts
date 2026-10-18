import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarIntegrations,
  toggleCalendarIntegration,
  syncExternalCalendar,
  getICalFeed,
  getUpcomingAlerts,
  dismissReminder,
} from './calendar.controller';

const router = Router();

// Public / Tokenized iCal subscription feed (for Apple Calendar, Google Calendar, Outlook)
router.get('/feed/:token', getICalFeed);

// Protected routes (require JWT authentication)
router.use(authMiddleware);

router.get('/events', requirePermission('calendar', 'read'), getCalendarEvents);
router.post('/events', requirePermission('calendar', 'create'), createCalendarEvent);
router.put('/events/:id', requirePermission('calendar', 'update'), updateCalendarEvent);
router.delete('/events/:id', requirePermission('calendar', 'delete'), deleteCalendarEvent);

router.get('/alerts', getUpcomingAlerts);
router.post('/alerts/:id/dismiss', dismissReminder);

router.get('/integrations', requirePermission('calendar', 'update'), getCalendarIntegrations);
router.post('/integrations/:provider/toggle', requirePermission('calendar', 'update'), toggleCalendarIntegration);
router.post('/integrations/:provider/sync', requirePermission('calendar', 'update'), syncExternalCalendar);

export default router;
