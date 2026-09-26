import { Router } from 'express';
import { listActivities, createActivity, updateActivity } from './activities.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', listActivities);
router.post('/', createActivity);
router.patch('/:id', updateActivity);

export default router;
