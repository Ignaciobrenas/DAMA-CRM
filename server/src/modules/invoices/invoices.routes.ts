import { Router } from 'express';
import {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoiceStatus,
  downloadInvoicePdf,
  deleteInvoice,
  listQuotes,
  createQuote,
  downloadQuotePdf,
  convertQuoteToInvoice,
  deleteQuote,
  publicPortalDownload,
  getPublicQuoteByToken,
  signPublicQuote,
  recordInvoicePayment,
  getAgingReport,
  listRecurringInvoices,
  createRecurringInvoice,
  updateRecurringInvoiceStatus,
  generateInvoiceFromRecurring,
  deleteRecurringInvoice,
  importInvoices,
  rectifyInvoice,
  duplicateInvoice,
  sendInvoiceEmail,
} from './invoices.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createInvoiceSchema } from '../../utils/validators';

const router = Router();

// Public routes for B2B Client Portal & Online Digital Quote Acceptance
router.get('/portal/:id/pdf', publicPortalDownload);
router.get('/quotes/public/:token', getPublicQuoteByToken);
router.post('/quotes/public/:token/sign', signPublicQuote);

// Protected routes
router.use(authMiddleware);

// Invoices & Dunning
router.get('/aging/report', requirePermission('invoices', 'read'), getAgingReport);
router.get('/', requirePermission('invoices', 'read'), listInvoices);
router.post('/import', requirePermission('invoices', 'create'), importInvoices);
router.get('/:id', requirePermission('invoices', 'read'), getInvoice);
router.post('/', requirePermission('invoices', 'create'), validate(createInvoiceSchema), createInvoice);
router.patch('/:id/status', requirePermission('invoices', 'update'), updateInvoiceStatus);
router.post('/:id/payments', requirePermission('invoices', 'update'), recordInvoicePayment);
router.post('/:id/rectify', requirePermission('invoices', 'create'), rectifyInvoice);
router.post('/:id/duplicate', requirePermission('invoices', 'create'), duplicateInvoice);
router.post('/:id/send-email', requirePermission('invoices', 'read'), sendInvoiceEmail);
router.get('/:id/pdf', requirePermission('invoices', 'read'), downloadInvoicePdf);
router.delete('/:id', requirePermission('invoices', 'delete'), deleteInvoice);

// Recurring Invoices / Subscriptions
router.get('/recurring/all', requirePermission('invoices', 'read'), listRecurringInvoices);
router.post('/recurring', requirePermission('invoices', 'create'), createRecurringInvoice);
router.patch('/recurring/:id/status', requirePermission('invoices', 'update'), updateRecurringInvoiceStatus);
router.post('/recurring/:id/generate', requirePermission('invoices', 'create'), generateInvoiceFromRecurring);
router.delete('/recurring/:id', requirePermission('invoices', 'delete'), deleteRecurringInvoice);

// Quotes
router.get('/quotes/all', requirePermission('quotes', 'read'), listQuotes);
router.post('/quotes', requirePermission('quotes', 'create'), createQuote);
router.get('/quotes/:id/pdf', requirePermission('quotes', 'read'), downloadQuotePdf);
router.post('/quotes/:id/convert', requirePermission('invoices', 'create'), convertQuoteToInvoice);
router.delete('/quotes/:id', requirePermission('quotes', 'delete'), deleteQuote);

export default router;
