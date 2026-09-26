import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { auditMiddleware } from '../../middlewares/audit.middleware';
import {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from './employees.controller';
import {
  listPayrolls,
  issuePayroll,
  updatePayrollStatus,
} from './payrolls.controller';
import {
  clockIn,
  clockOut,
  getClockStatus,
  getTimeHistory,
  syncWithOdooAttendance,
} from './time-tracking.controller';

const router = Router();

router.use(authMiddleware);

// --- Time Tracking & Fichajes Endpoints ---
router.post('/time-tracking/clock-in', clockIn);
router.post('/time-tracking/clock-out', clockOut);
router.get('/time-tracking/status', getClockStatus);
router.get('/time-tracking/history', getTimeHistory);
router.post('/time-tracking/sync-odoo', auditMiddleware('SYNC', 'ODOO_ATTENDANCE'), syncWithOdooAttendance);

// --- Payrolls & Nóminas Endpoints ---
router.get('/payrolls', listPayrolls);
router.post('/payrolls', auditMiddleware('ISSUE', 'PAYROLL'), issuePayroll);
router.patch('/payrolls/:id/status', auditMiddleware('UPDATE', 'PAYROLL_STATUS'), updatePayrollStatus);

// --- Employees Directory Endpoints ---
router.get('/', listEmployees);
router.post('/', auditMiddleware('CREATE', 'EMPLOYEE'), createEmployee);
router.get('/:id', getEmployeeById);
router.patch('/:id', auditMiddleware('UPDATE', 'EMPLOYEE'), updateEmployee);
router.delete('/:id', auditMiddleware('DELETE', 'EMPLOYEE'), deleteEmployee);

export default router;
