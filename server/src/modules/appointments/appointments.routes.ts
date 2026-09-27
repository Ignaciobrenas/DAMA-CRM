import { Router } from 'express';
import {
  listAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  listServices,
  createOrUpdateService,
  getRevenueStats,
} from './appointments.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/services', listServices);
router.post('/services', createOrUpdateService);

router.get('/stats/revenue', getRevenueStats);

router.get('/', listAppointments);
router.post('/', createAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

export default router;
