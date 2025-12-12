import { Router } from 'express';
import {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoiceStatus,
  downloadInvoicePdf,
  listQuotes,
  createQuote,
  downloadQuotePdf,
  publicPortalDownload,
} from './invoices.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';

const router = Router();

// Public route for B2B Client Portal PDF download
router.get('/portal/:id/pdf', publicPortalDownload);

// Protected routes
router.use(authMiddleware);

// Invoices
router.get('/', requirePermission('invoices', 'read'), listInvoices);
router.get('/:id', requirePermission('invoices', 'read'), getInvoice);
router.post('/', requirePermission('invoices', 'create'), createInvoice);
router.patch('/:id/status', requirePermission('invoices', 'update'), updateInvoiceStatus);
router.get('/:id/pdf', requirePermission('invoices', 'read'), downloadInvoicePdf);

// Quotes
router.get('/quotes/all', requirePermission('quotes', 'read'), listQuotes);
router.post('/quotes', requirePermission('quotes', 'create'), createQuote);
router.get('/quotes/:id/pdf', requirePermission('quotes', 'read'), downloadQuotePdf);

export default router;
