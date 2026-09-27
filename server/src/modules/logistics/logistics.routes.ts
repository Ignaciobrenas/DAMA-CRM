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

const router = Router();

router.use(authMiddleware);

router.get('/export/csv', exportShipmentsCsv);
router.get('/export/pdf', exportShipmentsPdf);

router.get('/stats', getLogisticsStats);

router.get('/shipments', listShipments);
router.post('/shipments', createShipment);
router.get('/shipments/:id', getShipmentDetails);
router.put('/shipments/:id/status', updateShipmentStatus);

export default router;
