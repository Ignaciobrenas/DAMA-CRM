import { Router } from 'express';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createStockMovement,
  listStockMovements,
  getInventoryStats,
  exportInventoryCsv,
  importInventory,
  handleUnoPimWebhook,
  triggerNightlySync,
  autoMapProductAttributesHandler,
  updateProductAttributesHandler,
} from './inventory.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';

const router = Router();

// Public webhook endpoint for UnoPIM
router.post('/webhooks/unopim', handleUnoPimWebhook);

// Protected inventory routes
router.use(authMiddleware);

router.get('/analytics/stats', requirePermission('inventory', 'read'), getInventoryStats);
router.get('/export/csv', requirePermission('inventory', 'read'), exportInventoryCsv);
router.post('/import', requirePermission('inventory', 'create'), importInventory);

router.get('/', requirePermission('inventory', 'read'), listProducts);
router.get('/:id', requirePermission('inventory', 'read'), getProduct);
router.post('/', requirePermission('inventory', 'create'), createProduct);
router.put('/:id', requirePermission('inventory', 'update'), updateProduct);
router.delete('/:id', requirePermission('inventory', 'delete'), deleteProduct);

router.post('/:id/stock-movement', requirePermission('inventory', 'update'), createStockMovement);
router.get('/:id/movements', requirePermission('inventory', 'read'), listStockMovements);

router.post('/:id/auto-map-attributes', requirePermission('inventory', 'update'), autoMapProductAttributesHandler);
router.patch('/:id/attributes', requirePermission('inventory', 'update'), updateProductAttributesHandler);

router.post('/sync/nightly', requirePermission('inventory', 'manage'), triggerNightlySync);

export default router;

