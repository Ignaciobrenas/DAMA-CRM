import { Router } from 'express';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  handleUnoPimWebhook,
  triggerNightlySync,
} from './inventory.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';

const router = Router();

// Public webhook endpoint for UnoPIM
router.post('/webhooks/unopim', handleUnoPimWebhook);

// Protected inventory routes
router.use(authMiddleware);

router.get('/', requirePermission('inventory', 'read'), listProducts);
router.get('/:id', requirePermission('inventory', 'read'), getProduct);
router.post('/', requirePermission('inventory', 'create'), createProduct);
router.put('/:id', requirePermission('inventory', 'update'), updateProduct);
router.delete('/:id', requirePermission('inventory', 'delete'), deleteProduct);
router.post('/sync/nightly', requirePermission('inventory', 'manage'), triggerNightlySync);

export default router;
