import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { isGodSuperAdmin } from '../../utils/tenant';
import {
  getTenants,
  createTenant,
  toggleTenantStatus,
  switchTenant,
  getGlobalStats,
} from './god.controller';

const router = Router();

// All God Mode endpoints require authentication and SuperAdmin God permissions
router.use(authMiddleware);
router.use((req, res, next) => {
  if (!isGodSuperAdmin(req)) {
    res.status(403).json({ success: false, message: 'Acceso restringido: requiere permisos de SuperAdmin God Mode' });
    return;
  }
  next();
});

router.get('/tenants', getTenants);
router.post('/tenants', createTenant);
router.patch('/tenants/:id/status', toggleTenantStatus);
router.post('/switch-tenant', switchTenant);
router.get('/stats', getGlobalStats);

export default router;
