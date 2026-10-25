import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import {
  getCompanyModules,
  updateCompanyModules,
  exportCompanyBackup,
  getSystemHealth,
} from './modules.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('settings', 'read'), getCompanyModules);
router.patch('/', requirePermission('settings', 'update'), updateCompanyModules);
router.get('/export-backup', requirePermission('settings', 'manage'), exportCompanyBackup);
router.get('/system-status', requirePermission('settings', 'read'), getSystemHealth);

export default router;
