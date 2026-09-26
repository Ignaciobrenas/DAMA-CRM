import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import {
  getTenants,
  createTenant,
  toggleTenantStatus,
  switchTenant,
  getGlobalStats,
} from './god.controller';

const router = Router();

// All God Mode endpoints require authentication
router.use(authMiddleware);

router.get('/tenants', getTenants);
router.post('/tenants', createTenant);
router.patch('/tenants/:id/status', toggleTenantStatus);
router.post('/switch-tenant', switchTenant);
router.get('/stats', getGlobalStats);

export default router;
