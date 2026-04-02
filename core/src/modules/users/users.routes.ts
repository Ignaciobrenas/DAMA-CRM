import { Router } from 'express';
import { listUsers, createUser, listRoles, updateRolePermissions, listAuditLogs } from './users.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createUserSchema } from '../../utils/validators';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('users', 'read'), listUsers);
router.post('/', requirePermission('users', 'create'), validate(createUserSchema), createUser);
router.get('/roles', requirePermission('users', 'read'), listRoles);
router.put('/roles/:roleId/permissions', requirePermission('users', 'manage'), updateRolePermissions);
router.get('/audit-logs', requirePermission('users', 'read'), listAuditLogs);

export default router;
