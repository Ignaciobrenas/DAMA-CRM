import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getPnLSummary,
  exportExpensesCsv,
  exportExpensesPdf,
} from './expenses.controller';

const router = Router();

router.use(authMiddleware);

router.get('/export/csv', requirePermission('expenses', 'read'), exportExpensesCsv);
router.get('/export/pdf', requirePermission('expenses', 'read'), exportExpensesPdf);
router.get('/pnl/summary', requirePermission('expenses', 'read'), getPnLSummary);
router.get('/', requirePermission('expenses', 'read'), getExpenses);
router.post('/', requirePermission('expenses', 'create'), createExpense);
router.patch('/:id', requirePermission('expenses', 'update'), updateExpense);
router.delete('/:id', requirePermission('expenses', 'delete'), deleteExpense);

export default router;
