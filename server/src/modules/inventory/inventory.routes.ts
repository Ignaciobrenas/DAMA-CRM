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
  listWarehouses,
  createWarehouse,
  listBatches,
  createBatch,
  listGlobalMovements,
  listStockTransfers,
  createStockTransfer,
  receiveStockTransfer,
  downloadStockTransferPdf,
} from './inventory.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';

const router = Router();

// Public webhook endpoint for UnoPIM
router.post('/webhooks/unopim', handleUnoPimWebhook);

// Protected inventory routes
router.use(authMiddleware);

// Multi-Warehouse, Batches (FEFO/FIFO), Kardex & Sage 2-Phase Stock Transfers
router.get('/warehouses', requirePermission('inventory', 'read'), listWarehouses);
router.post('/warehouses', requirePermission('inventory', 'create'), createWarehouse);

router.get('/batches', requirePermission('inventory', 'read'), listBatches);
router.post('/batches', requirePermission('inventory', 'create'), createBatch);

router.get('/movements/all', requirePermission('inventory', 'read'), listGlobalMovements);

router.get('/transfers', requirePermission('inventory', 'read'), listStockTransfers);
router.post('/transfers', requirePermission('inventory', 'create'), createStockTransfer);
router.post('/transfers/:id/receive', requirePermission('inventory', 'update'), receiveStockTransfer);
router.get('/transfers/:id/pdf', requirePermission('inventory', 'read'), downloadStockTransferPdf);

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
