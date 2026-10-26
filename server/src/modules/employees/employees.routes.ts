import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
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
  pauseTimer,
  resumeTimer,
  updateActiveTimer,
  getClockStatus,
  getTrackableTasks,
  getTimeHistory,
  syncWithOdooAttendance,
  exportTimeRecordsCsv,
  exportTimeRecordsPdf,
} from './time-tracking.controller';

const router = Router();

router.use(authMiddleware);

// --- Harvest-Style Persistent Time Tracking & Fichajes Endpoints ---
router.get('/time-tracking/export/csv', requirePermission('employees', 'read'), exportTimeRecordsCsv);
router.get('/time-tracking/export/pdf', requirePermission('employees', 'read'), exportTimeRecordsPdf);
router.post('/time-tracking/clock-in', clockIn);
router.post('/time-tracking/clock-out', clockOut);
router.post('/time-tracking/timer/start', clockIn);
router.post('/time-tracking/timer/stop', clockOut);
router.post('/time-tracking/timer/pause', pauseTimer);
router.post('/time-tracking/timer/resume', resumeTimer);
router.patch('/time-tracking/timer/active', updateActiveTimer);
router.post('/time-tracking/timer/update', updateActiveTimer);
router.get('/time-tracking/status', getClockStatus);
router.get('/time-tracking/timer/active', getClockStatus);
router.get('/time-tracking/tasks', getTrackableTasks);
router.get('/time-tracking/history', getTimeHistory);
router.post('/time-tracking/sync-odoo', requirePermission('employees', 'manage'), auditMiddleware('SYNC', 'ODOO_ATTENDANCE'), syncWithOdooAttendance);

// --- Payrolls & Nóminas Endpoints ---
router.get('/payrolls', listPayrolls);
router.post('/payrolls', requirePermission('employees', 'create'), auditMiddleware('ISSUE', 'PAYROLL'), issuePayroll);
router.patch('/payrolls/:id/status', requirePermission('employees', 'update'), auditMiddleware('UPDATE', 'PAYROLL_STATUS'), updatePayrollStatus);

// --- Employees Directory Endpoints ---
router.get('/', requirePermission('employees', 'read'), listEmployees);
router.post('/', requirePermission('employees', 'create'), auditMiddleware('CREATE', 'EMPLOYEE'), createEmployee);
router.get('/:id', getEmployeeById);
router.patch('/:id', requirePermission('employees', 'update'), auditMiddleware('UPDATE', 'EMPLOYEE'), updateEmployee);
router.delete('/:id', requirePermission('employees', 'delete'), auditMiddleware('DELETE', 'EMPLOYEE'), deleteEmployee);

export default router;
