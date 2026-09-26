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
      companyName: branding.companyName || '',
      companyTaxId: branding.companyTaxId || '',
      companyAddress: branding.companyAddress || '',
      companyEmail: branding.companyEmail || '',
      companyPhone: branding.companyPhone || '',
      companyWebsite: branding.companyWebsite || '',
      logoUrl: branding.logoUrl || undefined,
      primaryColor: branding.primaryColor || '#072053',
      paymentTerms: branding.paymentTerms || '',
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
    const publicToken = `qsign_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        publicToken,
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
      companyName: branding.companyName || '',
      companyTaxId: branding.companyTaxId || '',
      companyAddress: branding.companyAddress || '',
      companyEmail: branding.companyEmail || '',
      companyPhone: branding.companyPhone || '',
      companyWebsite: branding.companyWebsite || '',
      logoUrl: branding.logoUrl || undefined,
      primaryColor: branding.primaryColor || '#072053',
      paymentTerms: branding.paymentTerms || '',
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
      companyName: branding.companyName || '',
      companyTaxId: branding.companyTaxId || '',
      companyAddress: branding.companyAddress || '',
      companyEmail: branding.companyEmail || '',
      companyPhone: branding.companyPhone || '',
      companyWebsite: branding.companyWebsite || '',
      logoUrl: branding.logoUrl || undefined,
      primaryColor: branding.primaryColor || '#072053',
      paymentTerms: branding.paymentTerms || '',
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

// -----------------------------------------------------------------------------
// SME Suite: Digital Quote Acceptance Canvas & Public Signing Portal
// -----------------------------------------------------------------------------

export async function getPublicQuoteByToken(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.params;

    const quote = await prisma.quote.findFirst({
      where: {
        OR: [{ publicToken: token }, { id: token }],
      },
      include: {
        company: true,
        contact: true,
        items: true,
      },
    });

    if (!quote) {
      res.status(404).json({ success: false, message: 'Presupuesto no encontrado o enlace inválido' });
      return;
    }

    const branding = getBrandingConfig();

    res.json({
      success: true,
      data: {
        ...quote,
        branding: {
          companyName: branding.companyName || 'DAMA-CRM',
          companyTaxId: branding.companyTaxId,
          primaryColor: branding.primaryColor || '#2563EB',
          logoUrl: branding.logoUrl,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function signPublicQuote(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.params;
    const { signatureData, signedBy } = req.body;

    if (!signatureData) {
      res.status(400).json({ success: false, message: 'El trazo o rúbrica de la firma es requerido' });
      return;
    }

    const quote = await prisma.quote.findFirst({
      where: {
        OR: [{ publicToken: token }, { id: token }],
      },
      include: { items: true, company: true, contact: true },
    });

    if (!quote) {
      res.status(404).json({ success: false, message: 'Presupuesto no encontrado' });
      return;
    }

    // Update quote with digital signature and status ACCEPTED
    const updatedQuote = await prisma.quote.update({
      where: { id: quote.id },
      data: {
        signatureData,
        signedBy: signedBy || quote.contact?.firstName ? `${quote.contact?.firstName} ${quote.contact?.lastName}` : 'Cliente',
        signedAt: new Date(),
        status: 'ACCEPTED',
      },
    });

    // Auto-create draft invoice upon online acceptance if not already converted
    const existingInvoice = await prisma.invoice.findFirst({ where: { quoteId: quote.id } });
    let createdInvoice = null;

    if (!existingInvoice) {
      const year = new Date().getFullYear();
      const count = await prisma.invoice.count();
      const invoiceNumber = `FAC-${year}-${String(count + 1).padStart(3, '0')}`;

      createdInvoice = await prisma.invoice.create({
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
          notes: `Generada automáticamente tras firma digital online del presupuesto ${quote.quoteNumber}`,
          items: {
            create: quote.items.map((it) => ({
              description: it.description,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              amount: it.amount,
            })),
          },
        },
      });
    }

    // Audit log
    await logAudit(
      null,
      'SIGN_QUOTE_ONLINE',
      'Quote',
      quote.id,
      {
        quoteNumber: quote.quoteNumber,
        signedBy: updatedQuote.signedBy,
        ipAddress: req.ip,
        autoCreatedInvoice: createdInvoice?.invoiceNumber,
      },
      req.ip
    );

    res.json({
      success: true,
      message: 'Presupuesto firmado digitalmente y aceptado con éxito',
      data: {
        quote: updatedQuote,
        invoice: createdInvoice || existingInvoice,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// -----------------------------------------------------------------------------
// SME Suite: Dunning & Debt Aging Report (Antigüedad de Deuda)
// -----------------------------------------------------------------------------

export async function recordInvoicePayment(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { amount, notes } = req.body;

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Factura no encontrada' });
      return;
    }

    const payAmount = Number(amount) || (invoice.total - (invoice.paidAmount || 0));
    const newPaidAmount = Number(((invoice.paidAmount || 0) + payAmount).toFixed(2));
    const isFullyPaid = newPaidAmount >= invoice.total;

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        status: isFullyPaid ? 'PAID' : 'PARTIAL',
        paidAt: isFullyPaid ? new Date() : invoice.paidAt,
        notes: notes ? `${invoice.notes || ''}\n[Pago ${new Date().toLocaleDateString('es-ES')}]: +${payAmount}€ (${notes})` : invoice.notes,
      },
    });

    await logAudit(
      (req as any).user?.id || null,
      'RECORD_PAYMENT',
      'Invoice',
      id,
      { amount: payAmount, totalPaid: newPaidAmount, fullyPaid: isFullyPaid },
      req.ip
    );

    res.json({
      success: true,
      data: updated,
      message: isFullyPaid ? 'Factura pagada en su totalidad' : `Abono parcial de ${payAmount}€ registrado`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getAgingReport(req: Request, res: Response): Promise<void> {
  try {
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['SENT', 'OVERDUE', 'PARTIAL', 'DRAFT'] },
      },
      include: {
        company: true,
        contact: true,
      },
    });

    const now = new Date();
    const buckets = {
      current: 0,      // Not overdue yet
      days1_30: 0,     // 1 to 30 days overdue
      days31_60: 0,    // 31 to 60 days overdue
      days61_90: 0,    // 61 to 90 days overdue
      days90Plus: 0,   // >90 days overdue
    };

    const details: any[] = [];

    for (const inv of pendingInvoices) {
      const remainingBalance = Number((inv.total - (inv.paidAmount || 0)).toFixed(2));
      if (remainingBalance <= 0) continue;

      const due = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.issueDate);
      const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 3600 * 24));

      let bucketKey = 'current';
      if (diffDays > 90) {
        bucketKey = 'days90Plus';
        buckets.days90Plus += remainingBalance;
      } else if (diffDays > 60) {
        bucketKey = 'days61_90';
        buckets.days61_90 += remainingBalance;
      } else if (diffDays > 30) {
        bucketKey = 'days31_60';
        buckets.days31_60 += remainingBalance;
      } else if (diffDays > 0) {
        bucketKey = 'days1_30';
        buckets.days1_30 += remainingBalance;
      } else {
        buckets.current += remainingBalance;
      }

      details.push({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.company?.name || `${inv.contact?.firstName || ''} ${inv.contact?.lastName || ''}`.trim() || 'Cliente',
        total: inv.total,
        paidAmount: inv.paidAmount || 0,
        remainingBalance,
        dueDate: inv.dueDate,
        daysOverdue: Math.max(0, diffDays),
        bucket: bucketKey,
        status: inv.status,
      });
    }

    const totalOverdue = Number(
      (buckets.days1_30 + buckets.days31_60 + buckets.days61_90 + buckets.days90Plus).toFixed(2)
    );
    const totalPending = Number((buckets.current + totalOverdue).toFixed(2));

    res.json({
      success: true,
      data: {
        summary: {
          totalPending,
          totalOverdue,
          current: Number(buckets.current.toFixed(2)),
          days1_30: Number(buckets.days1_30.toFixed(2)),
          days31_60: Number(buckets.days31_60.toFixed(2)),
          days61_90: Number(buckets.days61_90.toFixed(2)),
          days90Plus: Number(buckets.days90Plus.toFixed(2)),
        },
        invoices: details.sort((a, b) => b.daysOverdue - a.daysOverdue),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}


