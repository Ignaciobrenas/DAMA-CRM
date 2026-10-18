import { Router } from 'express';
import {
  listAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  listServices,
  createOrUpdateService,
  getRevenueStats,
  exportAppointmentsCsv,
  exportAppointmentsPdf,
} from './appointments.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/export/csv', requirePermission('appointments', 'read'), exportAppointmentsCsv);
router.get('/export/pdf', requirePermission('appointments', 'read'), exportAppointmentsPdf);

router.get('/services', requirePermission('appointments', 'read'), listServices);
router.post('/services', requirePermission('appointments', 'create'), createOrUpdateService);

router.get('/stats/revenue', requirePermission('appointments', 'read'), getRevenueStats);

router.get('/', requirePermission('appointments', 'read'), listAppointments);
router.post('/', requirePermission('appointments', 'create'), createAppointment);
router.put('/:id', requirePermission('appointments', 'update'), updateAppointment);
router.delete('/:id', requirePermission('appointments', 'delete'), deleteAppointment);

export default router;
