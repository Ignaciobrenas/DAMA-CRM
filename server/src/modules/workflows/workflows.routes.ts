import { Router } from 'express';
import {
  listWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  toggleWorkflow,
  triggerTestWorkflow,
  getWorkflowLogs,
} from './workflows.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission('workflows', 'read'), listWorkflows);
router.post('/', requirePermission('workflows', 'create'), createWorkflow);
router.put('/:id', requirePermission('workflows', 'update'), updateWorkflow);
router.delete('/:id', requirePermission('workflows', 'delete'), deleteWorkflow);
router.patch('/:id/toggle', requirePermission('workflows', 'update'), toggleWorkflow);
router.post('/:id/test', requirePermission('workflows', 'manage'), triggerTestWorkflow);
router.get('/logs/all', requirePermission('workflows', 'read'), getWorkflowLogs);
router.get('/:id/logs', requirePermission('workflows', 'read'), getWorkflowLogs);

export default router;
