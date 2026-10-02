import { Router } from 'express';
import { getSalesPerformance, getAgileVelocity, exportCsv, exportExecutivePdf, getAdminSystemAnalytics } from './reports.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/sales', requirePermission('reports', 'read'), getSalesPerformance);
router.get('/velocity', requirePermission('reports', 'read'), getAgileVelocity);
router.get('/admin-bi', requirePermission('reports', 'manage'), getAdminSystemAnalytics);
router.get('/export', requirePermission('reports', 'read'), exportCsv);
router.get('/executive-pdf', requirePermission('reports', 'read'), exportExecutivePdf);

export default router;
