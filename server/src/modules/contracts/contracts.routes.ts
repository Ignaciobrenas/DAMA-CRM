import { Router } from 'express';
import {
  listContracts,
  getContract,
  createContract,
  updateContract,
  signContract,
  deleteContract,
} from './contracts.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('deals', 'read'), listContracts);
router.get('/:id', requirePermission('deals', 'read'), getContract);
router.post('/', requirePermission('deals', 'create'), createContract);
router.patch('/:id', requirePermission('deals', 'update'), updateContract);
router.post('/:id/sign', requirePermission('deals', 'update'), signContract);
router.delete('/:id', requirePermission('deals', 'delete'), deleteContract);

export default router;
