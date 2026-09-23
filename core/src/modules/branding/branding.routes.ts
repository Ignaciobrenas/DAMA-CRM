import { Router } from 'express';
import { getBranding, updateBranding } from './branding.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';

const router = Router();

router.get('/', getBranding);
router.patch('/', authMiddleware, requirePermission('users', 'manage'), updateBranding);
router.put('/', authMiddleware, requirePermission('users', 'manage'), updateBranding);

export default router;
