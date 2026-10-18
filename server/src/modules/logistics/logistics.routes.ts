import { Router } from 'express';
import {
  listShipments,
  createShipment,
  getShipmentDetails,
  updateShipmentStatus,
  getLogisticsStats,
  exportShipmentsCsv,
  exportShipmentsPdf,
} from './logistics.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/export/csv', requirePermission('logistics', 'read'), exportShipmentsCsv);
router.get('/export/pdf', requirePermission('logistics', 'read'), exportShipmentsPdf);

router.get('/stats', requirePermission('logistics', 'read'), getLogisticsStats);

router.get('/shipments', requirePermission('logistics', 'read'), listShipments);
router.post('/shipments', requirePermission('logistics', 'create'), createShipment);
router.get('/shipments/:id', requirePermission('logistics', 'read'), getShipmentDetails);
router.put('/shipments/:id/status', requirePermission('logistics', 'update'), updateShipmentStatus);

export default router;
