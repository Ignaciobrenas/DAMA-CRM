import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { generatePdfBuffer, InvoicePdfData } from './pdf.service';
import { logAudit } from '../../middlewares/audit.middleware';
import { getBrandingConfig } from '../branding/branding.controller';

export async function listInvoices(req: Request, res: Response): Promise<void> {
  try {
    const { status, companyId, contactId } = req.query;
    const where: any = {};
    if (status) where.status = String(status);
    if (companyId) where.companyId = String(companyId);
    if (contactId) where.contactId = String(contactId);

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: true,
      },
      orderBy: { issueDate: 'desc' },
    });

    res.json({ success: true, data: invoices });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getInvoice(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        company: true,
        contact: true,
        items: true,
        quote: true,
      },
    });

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Factura no encontrada' });
      return;
    }

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createInvoice(req: Request, res: Response): Promise<void> {
  try {
    const { quoteId, contactId, companyId, dueDate, notes, taxRate = 21, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'La factura debe contener al menos un elemento' });
      return;
    }

    const calculatedItems = items.map((it: any) => {
      const quantity = parseFloat(it.quantity) || 1;
      const unitPrice = parseFloat(it.unitPrice) || 0;
      return {
        description: it.description,
        quantity,
        unitPrice,
        amount: quantity * unitPrice,
      };
    });

    const subtotal = calculatedItems.reduce((acc, it) => acc + it.amount, 0);
    const taxRateNum = parseFloat(taxRate) || 21;
    const taxAmount = subtotal * (taxRateNum / 100);
    const total = subtotal + taxAmount;

    // Generate unique invoice number: FAC-YYYY-SEQ
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count();
    const invoiceNumber = `FAC-${year}-${String(count + 1).padStart(3, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        quoteId: quoteId || null,
        contactId: contactId || null,
        companyId: companyId || null,
        issueDate: new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'DRAFT',
        subtotal,
        taxRate: taxRateNum,
        taxAmount,
        total,
        notes,
        items: {
          create: calculatedItems,
        },
      },
      include: {
        items: true,
        company: true,
        contact: true,
      },
    });

    await logAudit(req.user?.id || null, 'CREATE', 'Invoice', invoice.id, { invoiceNumber, total }, req.ip);

    res.status(201).json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateInvoiceStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        paidAt: status === 'PAID' ? new Date() : undefined,
      },
    });

    await logAudit(req.user?.id || null, 'UPDATE_STATUS', 'Invoice', id, { status }, req.ip);

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function downloadInvoicePdf(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        company: true,
        contact: true,
        items: true,
      },
    });

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Factura no encontrada' });
      return;
    }

    const branding = getBrandingConfig();

    const pdfData: InvoicePdfData = {
      invoiceNumber: invoice.invoiceNumber,
      type: 'FACTURA',
      issueDate: invoice.issueDate.toISOString().split('T')[0],
      dueDate: invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : undefined,
      status: invoice.status,
      companyName: branding.companyName || 'DAMA CRM Soluciones S.L.',
      companyTaxId: branding.companyTaxId || 'B-12345678',
      companyAddress: branding.companyAddress || 'Avenida Tecnológica 42, 28046 Madrid, España',
      companyEmail: branding.companyEmail || 'contacto@dama-crm.com',
      companyPhone: branding.companyPhone || '+34 910 000 000',
      companyWebsite: branding.companyWebsite || 'https://damacrm.com',
      logoUrl: branding.logoUrl || undefined,
      primaryColor: branding.primaryColor || '#072053',
      paymentTerms: branding.paymentTerms || 'Transferencia bancaria a 30 días',
      bankAccount: branding.bankAccount || undefined,
      clientName: invoice.company?.name || `${invoice.contact?.firstName || ''} ${invoice.contact?.lastName || ''}`.trim() || 'Cliente General',
      clientEmail: invoice.contact?.email,
      clientTaxId: invoice.company?.taxId || undefined,
      clientAddress: invoice.company?.address || undefined,
      clientPhone: invoice.contact?.phone || invoice.contact?.mobile || undefined,
      items: invoice.items.map((it) => ({
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        amount: it.amount,
      })),
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      currency: invoice.currency,
      notes: invoice.notes || undefined,
    };

    const buffer = await generatePdfBuffer(pdfData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Factura-${invoice.invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// -----------------------------------------------------------------------------
// Quotes (Presupuestos)
// -----------------------------------------------------------------------------

export async function listQuotes(req: Request, res: Response): Promise<void> {
  try {
    const quotes = await prisma.quote.findMany({
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: true,
      },
      orderBy: { issueDate: 'desc' },
    });

    res.json({ success: true, data: quotes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createQuote(req: Request, res: Response): Promise<void> {
  try {
    const { contactId, companyId, expiryDate, notes, taxRate = 21, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'El presupuesto debe contener al menos una línea' });
      return;
    }

    const calculatedItems = items.map((it: any) => {
      const quantity = parseFloat(it.quantity) || 1;
      const unitPrice = parseFloat(it.unitPrice) || 0;
      return {
        description: it.description,
        quantity,
        unitPrice,
        amount: quantity * unitPrice,
      };
    });

    const subtotal = calculatedItems.reduce((acc, it) => acc + it.amount, 0);
    const taxRateNum = parseFloat(taxRate) || 21;
    const taxAmount = subtotal * (taxRateNum / 100);
    const total = subtotal + taxAmount;

    const year = new Date().getFullYear();
    const count = await prisma.quote.count();
    const quoteNumber = `PRE-${year}-${String(count + 1).padStart(3, '0')}`;

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        contactId: contactId || null,
        companyId: companyId || null,
        issueDate: new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'DRAFT',
        subtotal,
        taxRate: taxRateNum,
        taxAmount,
        total,
        notes,
        items: {
          create: calculatedItems,
        },
      },
      include: {
        items: true,
        company: true,
        contact: true,
      },
    });

    res.status(201).json({ success: true, data: quote });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function downloadQuotePdf(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { company: true, contact: true, items: true },
    });

    if (!quote) {
      res.status(404).json({ success: false, message: 'Presupuesto no encontrado' });
      return;
    }

    const branding = getBrandingConfig();

    const pdfData: InvoicePdfData = {
      invoiceNumber: quote.quoteNumber,
      type: 'PRESUPUESTO',
      issueDate: quote.issueDate.toISOString().split('T')[0],
      dueDate: quote.expiryDate ? quote.expiryDate.toISOString().split('T')[0] : undefined,
      status: quote.status,
      companyName: branding.companyName || 'DAMA CRM Soluciones S.L.',
      companyTaxId: branding.companyTaxId || 'B-12345678',
      companyAddress: branding.companyAddress || 'Avenida Tecnológica 42, 28046 Madrid, España',
      companyEmail: branding.companyEmail || 'contacto@dama-crm.com',
      companyPhone: branding.companyPhone || '+34 910 000 000',
      companyWebsite: branding.companyWebsite || 'https://damacrm.com',
      logoUrl: branding.logoUrl || undefined,
      primaryColor: branding.primaryColor || '#072053',
      paymentTerms: branding.paymentTerms || 'Validez 30 días naturales',
      bankAccount: branding.bankAccount || undefined,
      clientName: quote.company?.name || `${quote.contact?.firstName || ''} ${quote.contact?.lastName || ''}`.trim() || 'Cliente General',
      clientEmail: quote.contact?.email,
      clientTaxId: quote.company?.taxId || undefined,
      clientAddress: quote.company?.address || undefined,
      clientPhone: quote.contact?.phone || quote.contact?.mobile || undefined,
      items: quote.items.map((it) => ({
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        amount: it.amount,
      })),
      subtotal: quote.subtotal,
      taxRate: quote.taxRate,
      taxAmount: quote.taxAmount,
      total: quote.total,
      currency: quote.currency,
      notes: quote.notes || undefined,
    };

    const buffer = await generatePdfBuffer(pdfData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Presupuesto-${quote.quoteNumber}.pdf"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Public B2B Client Portal Invoice PDF download
 */
export async function publicPortalDownload(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { company: true, contact: true, items: true },
    });

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Documento no encontrado' });
      return;
    }

    const branding = getBrandingConfig();

    const pdfData: InvoicePdfData = {
      invoiceNumber: invoice.invoiceNumber,
      type: 'FACTURA',
      issueDate: invoice.issueDate.toISOString().split('T')[0],
      dueDate: invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : undefined,
      status: invoice.status,
      companyName: branding.companyName || 'DAMA CRM Soluciones S.L.',
      companyTaxId: branding.companyTaxId || 'B-12345678',
      companyAddress: branding.companyAddress || 'Avenida Tecnológica 42, 28046 Madrid, España',
      companyEmail: branding.companyEmail || 'contacto@dama-crm.com',
      companyPhone: branding.companyPhone || '+34 910 000 000',
      companyWebsite: branding.companyWebsite || 'https://damacrm.com',
      logoUrl: branding.logoUrl || undefined,
      primaryColor: branding.primaryColor || '#072053',
      paymentTerms: branding.paymentTerms || 'Transferencia bancaria a 30 días',
      bankAccount: branding.bankAccount || undefined,
      clientName: invoice.company?.name || `${invoice.contact?.firstName || ''} ${invoice.contact?.lastName || ''}`.trim() || 'Cliente General',
      clientEmail: invoice.contact?.email,
      clientTaxId: invoice.company?.taxId || undefined,
      clientAddress: invoice.company?.address || undefined,
      clientPhone: invoice.contact?.phone || invoice.contact?.mobile || undefined,
      items: invoice.items.map((it) => ({
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        amount: it.amount,
      })),
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      currency: invoice.currency,
      notes: invoice.notes || undefined,
    };

    const buffer = await generatePdfBuffer(pdfData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Factura-${invoice.invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Convert an approved or pending quote into a draft invoice automatically
 */
export async function convertQuoteToInvoice(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        items: true,
        company: true,
        contact: true,
      },
    });

    if (!quote) {
      res.status(404).json({ success: false, message: 'Presupuesto no encontrado' });
      return;
    }

    const existingInvoice = await prisma.invoice.findFirst({
      where: { quoteId: quote.id },
    });

    if (existingInvoice) {
      res.status(400).json({
        success: false,
        message: `Este presupuesto ya ha sido convertido previamente a la factura ${existingInvoice.invoiceNumber}`,
        data: existingInvoice,
      });
      return;
    }

    const year = new Date().getFullYear();
    const count = await prisma.invoice.count();
    const invoiceNumber = `FAC-${year}-${String(count + 1).padStart(3, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        quoteId: quote.id,
        contactId: quote.contactId,
        companyId: quote.companyId,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'DRAFT',
        subtotal: quote.subtotal,
        taxRate: quote.taxRate,
        taxAmount: quote.taxAmount,
        total: quote.total,
        currency: quote.currency,
        notes: quote.notes ? `${quote.notes} (Convertido de ${quote.quoteNumber})` : `Convertido de presupuesto ${quote.quoteNumber}`,
        items: {
          create: quote.items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            amount: it.amount,
          })),
        },
      },
      include: {
        items: true,
        company: true,
        contact: true,
        quote: true,
      },
    });

    // Mark quote as ACCEPTED upon successful conversion
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'ACCEPTED' },
    });

    await logAudit(
      (req as any).user?.id || null,
      'CONVERT_QUOTE',
      'Invoice',
      invoice.id,
      { quoteId: quote.id, quoteNumber: quote.quoteNumber, invoiceNumber: invoice.invoiceNumber },
      req.ip
    );

    res.status(201).json({
      success: true,
      message: `Presupuesto ${quote.quoteNumber} convertido a factura ${invoice.invoiceNumber} correctamente`,
      data: invoice,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteInvoice(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Factura no encontrada' });
      return;
    }

    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
    await prisma.invoice.delete({ where: { id } });
    await logAudit((req as any).user?.id || null, 'DELETE', 'Invoice', id, { invoiceNumber: invoice.invoiceNumber }, req.ip);

    res.json({ success: true, message: `Factura ${invoice.invoiceNumber} eliminada correctamente` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteQuote(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) {
      res.status(404).json({ success: false, message: 'Presupuesto no encontrado' });
      return;
    }

    await prisma.invoiceItem.deleteMany({ where: { quoteId: id } });
    await prisma.quote.delete({ where: { id } });
    await logAudit((req as any).user?.id || null, 'DELETE', 'Quote', id, { quoteNumber: quote.quoteNumber }, req.ip);

    res.json({ success: true, message: `Presupuesto ${quote.quoteNumber} eliminado correctamente` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

