import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
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

router.get('/export/csv', exportExpensesCsv);
router.get('/export/pdf', exportExpensesPdf);
router.get('/pnl/summary', getPnLSummary);
router.get('/', getExpenses);
router.post('/', createExpense);
router.patch('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
