import { Router } from 'express';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listRoles,
  updateRolePermissions,
  listAuditLogs,
  getUserPreferences,
  updateUserPreferences,
  updateProfile,
} from './users.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createUserSchema } from '../../utils/validators';

const router = Router();

router.use(authMiddleware);

// Current User Self-Service Endpoints
router.get('/preferences', getUserPreferences);
router.patch('/preferences', updateUserPreferences);
router.patch('/profile', updateProfile);

// System User Management (RBAC-protected)
router.get('/', requirePermission('users', 'read'), listUsers);
router.post('/', requirePermission('users', 'create'), validate(createUserSchema), createUser);
router.put('/:id', requirePermission('users', 'update'), updateUser);
router.delete('/:id', requirePermission('users', 'delete'), deleteUser);
router.get('/roles', requirePermission('users', 'read'), listRoles);
router.put('/roles/:roleId/permissions', requirePermission('users', 'manage'), updateRolePermissions);
router.get('/audit-logs', requirePermission('users', 'read'), listAuditLogs);

export default router;
