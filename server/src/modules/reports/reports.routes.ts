import { Router } from 'express';
import { getSalesPerformance, getAgileVelocity, exportCsv } from './reports.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/sales', requirePermission('reports', 'read'), getSalesPerformance);
router.get('/velocity', requirePermission('reports', 'read'), getAgileVelocity);
router.get('/export', requirePermission('reports', 'read'), exportCsv);

export default router;
