import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
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

router.get('/events', getCalendarEvents);
router.post('/events', createCalendarEvent);
router.put('/events/:id', updateCalendarEvent);
router.delete('/events/:id', deleteCalendarEvent);

router.get('/alerts', getUpcomingAlerts);
router.post('/alerts/:id/dismiss', dismissReminder);

router.get('/integrations', getCalendarIntegrations);
router.post('/integrations/:provider/toggle', toggleCalendarIntegration);
router.post('/integrations/:provider/sync', syncExternalCalendar);

export default router;
