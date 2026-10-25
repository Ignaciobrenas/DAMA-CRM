import { Router } from 'express';
import { listActivities, createActivity, updateActivity } from './activities.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('calendar', 'read'), listActivities);
router.post('/', requirePermission('calendar', 'create'), createActivity);
router.patch('/:id', requirePermission('calendar', 'update'), updateActivity);

export default router;
