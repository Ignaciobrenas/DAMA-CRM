import { Router } from 'express';
import { listUsers, createUser, listRoles, updateRolePermissions } from './users.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('users', 'read'), listUsers);
router.post('/', requirePermission('users', 'create'), createUser);
router.get('/roles', requirePermission('users', 'read'), listRoles);
router.put('/roles/:roleId/permissions', requirePermission('users', 'manage'), updateRolePermissions);

export default router;
