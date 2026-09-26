import { Router } from 'express';
import {
  getPipeline,
  listDeals,
  getDeal,
  createDeal,
  patchDeal,
  deleteDeal,
  listStages,
} from './deals.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createDealSchema } from '../../utils/validators';

const router = Router();

router.use(authMiddleware);

router.get('/pipeline', requirePermission('deals', 'read'), getPipeline);
router.get('/stages', requirePermission('deals', 'read'), listStages);
router.get('/', requirePermission('deals', 'read'), listDeals);
router.get('/:id', requirePermission('deals', 'read'), getDeal);
router.post('/', requirePermission('deals', 'create'), validate(createDealSchema), createDeal);
router.patch('/:id', requirePermission('deals', 'update'), patchDeal);
router.delete('/:id', requirePermission('deals', 'delete'), deleteDeal);

export default router;
