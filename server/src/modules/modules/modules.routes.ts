import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import {
  getCompanyModules,
  updateCompanyModules,
  exportCompanyBackup,
  getSystemHealth,
} from './modules.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', getCompanyModules);
router.patch('/', updateCompanyModules);
router.get('/export-backup', exportCompanyBackup);
router.get('/system-status', getSystemHealth);

export default router;
