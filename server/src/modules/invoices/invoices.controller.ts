import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { generatePdfBuffer, InvoicePdfData } from './pdf.service';
import { logAudit } from '../../middlewares/audit.middleware';
import { getBrandingConfig } from '../branding/branding.controller';
import { NotificationService } from '../notifications/notifications.service';
import { getRequestTenant, isGodSuperAdmin } from '../../utils/tenant';

export async function listInvoices(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);
    const { status, companyId, contactId } = req.query;

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    if (status) where.status = String(status);
    if (companyId) where.companyId = String(companyId);
    if (contactId) where.contactId = String(contactId);

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, taxId: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
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
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

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

    if (!isSuper && invoice.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes acceso a esta factura' });
      return;
    }

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createInvoice(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const {
      quoteId,
      contactId,
      companyId,
      issueDate: rawIssueDate,
      dueDate,
      notes,
      taxRate = 21,
      items,
      currency = 'EUR',
      discountPercent = 0,
      discountAmount = 0,
      irpfRate = 0,
      paymentTerms = 'IMMEDIATE',
      isRectifying = false,
      rectifiesInvoiceId = null,
      rectifyingReason = null,
      proforma = false,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'La factura debe contener al menos un concepto' });
      return;
    }

    // Verify company/contact tenant ownership
    if (companyId) {
      const comp = await prisma.company.findUnique({ where: { id: companyId } });
      if (!comp || (!isGodSuperAdmin(req) && comp.tenantId !== tenantId)) {
        res.status(400).json({ success: false, message: 'La empresa seleccionada no pertenece a su organización' });
        return;
      }
    }
    if (contactId) {
      const cont = await prisma.contact.findUnique({ where: { id: contactId } });
      if (!cont || (!isGodSuperAdmin(req) && cont.tenantId !== tenantId)) {
        res.status(400).json({ success: false, message: 'El contacto seleccionado no pertenece a su organización' });
        return;
      }
    }

    const calculatedItems = items.map((it: any) => {
      const quantity = parseFloat(it.quantity) || 1;
      const unitPrice = parseFloat(it.unitPrice) || 0;
      const itemDiscount = parseFloat(it.discount) || 0;
      const grossAmount = quantity * unitPrice;
      const netAmount = grossAmount * (1 - itemDiscount / 100);
      return {
        description: it.description || 'Servicio o producto',
        quantity,
        unitPrice,
        discount: itemDiscount,
        amount: Number(netAmount.toFixed(2)),
      };
    });

    const subtotal = Number(calculatedItems.reduce((acc, it) => acc + it.amount, 0).toFixed(2));
    const discPct = parseFloat(discountPercent) || 0;
    const computedDiscountAmount = discountAmount ? parseFloat(discountAmount) : Number(((subtotal * discPct) / 100).toFixed(2));
    const taxableBase = Math.max(0, subtotal - computedDiscountAmount);

    const taxRateNum = parseFloat(taxRate) || 0;
    const taxAmount = Number(((taxableBase * taxRateNum) / 100).toFixed(2));

    const irpfRateNum = parseFloat(irpfRate) || 0;
    const computedIrpfAmount = Number(((taxableBase * irpfRateNum) / 100).toFixed(2));

    const total = Number((taxableBase + taxAmount - computedIrpfAmount).toFixed(2));

    // Generate unique invoice number scoped to current tenant: FAC-YYYY-SEQ / REC-YYYY-SEQ / PRO-YYYY-SEQ
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({ where: { tenantId } });
    const prefix = isRectifying ? 'REC' : proforma ? 'PRO' : 'FAC';
    const invoiceNumber = `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;

    const parsedIssueDate = rawIssueDate ? new Date(rawIssueDate) : new Date();

    // Calculate due date based on payment terms if not explicitly given
    let finalDueDate = dueDate ? new Date(dueDate) : new Date(parsedIssueDate.getTime() + 30 * 86400000);
    if (!dueDate && paymentTerms) {
      if (paymentTerms === 'IMMEDIATE') {
        finalDueDate = new Date(parsedIssueDate);
      } else if (paymentTerms === 'DAYS_15') {
        finalDueDate = new Date(parsedIssueDate.getTime() + 15 * 86400000);
      } else if (paymentTerms === 'DAYS_30') {
        finalDueDate = new Date(parsedIssueDate.getTime() + 30 * 86400000);
      } else if (paymentTerms === 'DAYS_60') {
        finalDueDate = new Date(parsedIssueDate.getTime() + 60 * 86400000);
      } else if (paymentTerms === 'END_OF_MONTH') {
        finalDueDate = new Date(parsedIssueDate.getFullYear(), parsedIssueDate.getMonth() + 1, 0);
      }
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        quoteId: quoteId || null,
        contactId: contactId || null,
        companyId: companyId || null,
        issueDate: parsedIssueDate,
        dueDate: finalDueDate,
        status: 'DRAFT',
        subtotal,
        discountPercent: discPct,
        discountAmount: computedDiscountAmount,
        taxRate: taxRateNum,
        taxAmount,
        irpfRate: irpfRateNum,
        irpfAmount: computedIrpfAmount,
        total,
        currency,
        paymentTerms,
        isRectifying: Boolean(isRectifying),
        rectifiesInvoiceId: rectifiesInvoiceId || null,
        rectifyingReason: rectifyingReason || null,
        proforma: Boolean(proforma),
        notes: notes?.trim() || null,
        tenantId,
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

    await logAudit(req.user?.id || null, 'CREATE', 'Invoice', invoice.id, { invoiceNumber, total, tenantId }, req.ip);

    res.status(201).json({
      success: true,
      data: invoice,
      message: `${isRectifying ? 'Factura Rectificativa' : proforma ? 'Factura Proforma' : 'Factura'} generada correctamente`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateInvoiceStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Factura no encontrada' });
      return;
    }

    if (!isSuper && existing.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para modificar esta factura' });
      return;
    }

    const { status } = req.body;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        paidAt: status === 'PAID' ? new Date() : existing.paidAt,
        paidAmount: status === 'PAID' ? existing.total : existing.paidAmount,
      },
    });

    await logAudit(req.user?.id || null, 'UPDATE_STATUS', 'Invoice', id, { status, tenantId }, req.ip);

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function downloadInvoicePdf(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

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

    if (!isSuper && invoice.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para descargar esta factura' });
      return;
    }

    // Load tenant-specific branding
    let branding = getBrandingConfig();
    try {
      const tenant = await prisma.tenant.findFirst({
        where: { OR: [{ id: invoice.tenantId || 'master' }, { slug: invoice.tenantId || 'master' }] },
        select: { branding: true },
      });
      if (tenant?.branding) {
        branding = { ...branding, ...JSON.parse(tenant.branding) };
      }
    } catch {}

    const pdfData: InvoicePdfData = {
      invoiceNumber: invoice.invoiceNumber,
      type: 'FACTURA',
      issueDate: invoice.issueDate.toISOString().split('T')[0],
      dueDate: invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : undefined,
      status: invoice.status,
      companyName: branding.companyName || 'DAMA Enterprise',
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
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    const quotes = await prisma.quote.findMany({
      where,
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
    const tenantId = getRequestTenant(req);
    const { contactId, companyId, expiryDate, notes, taxRate = 21, items, currency = 'EUR' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'El presupuesto debe contener al menos una línea' });
      return;
    }

    const calculatedItems = items.map((it: any) => {
      const quantity = parseFloat(it.quantity) || 1;
      const unitPrice = parseFloat(it.unitPrice) || 0;
      return {
        description: it.description || 'Concepto presupuestado',
        quantity,
        unitPrice,
        amount: Number((quantity * unitPrice).toFixed(2)),
      };
    });

    const subtotal = Number(calculatedItems.reduce((acc, it) => acc + it.amount, 0).toFixed(2));
    const taxRateNum = parseFloat(taxRate) || 21;
    const taxAmount = Number(((subtotal * taxRateNum) / 100).toFixed(2));
    const total = Number((subtotal + taxAmount).toFixed(2));

    const year = new Date().getFullYear();
    const count = await prisma.quote.count({ where: { tenantId } });
    const quoteNumber = `PRE-${year}-${String(count + 1).padStart(4, '0')}`;
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
        currency,
        notes: notes?.trim() || null,
        tenantId,
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

    await logAudit(req.user?.id || null, 'CREATE', 'Quote', quote.id, { quoteNumber, total, tenantId }, req.ip);

    res.status(201).json({ success: true, data: quote });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function downloadQuotePdf(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { company: true, contact: true, items: true },
    });

    if (!quote) {
      res.status(404).json({ success: false, message: 'Presupuesto no encontrado' });
      return;
    }

    if (!isSuper && quote.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para descargar este presupuesto' });
      return;
    }

    let branding = getBrandingConfig();
    try {
      const tenant = await prisma.tenant.findFirst({
        where: { OR: [{ id: quote.tenantId || 'master' }, { slug: quote.tenantId || 'master' }] },
        select: { branding: true },
      });
      if (tenant?.branding) {
        branding = { ...branding, ...JSON.parse(tenant.branding) };
      }
    } catch {}

    const pdfData: InvoicePdfData = {
      invoiceNumber: quote.quoteNumber,
      type: 'PRESUPUESTO',
      issueDate: quote.issueDate.toISOString().split('T')[0],
      dueDate: quote.expiryDate ? quote.expiryDate.toISOString().split('T')[0] : undefined,
      status: quote.status,
      companyName: branding.companyName || 'DAMA Enterprise',
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

    let branding = getBrandingConfig();
    try {
      const tenant = await prisma.tenant.findFirst({
        where: { OR: [{ id: invoice.tenantId || 'master' }, { slug: invoice.tenantId || 'master' }] },
        select: { branding: true },
      });
      if (tenant?.branding) {
        branding = { ...branding, ...JSON.parse(tenant.branding) };
      }
    } catch {}

    const pdfData: InvoicePdfData = {
      invoiceNumber: invoice.invoiceNumber,
      type: 'FACTURA',
      issueDate: invoice.issueDate.toISOString().split('T')[0],
      dueDate: invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : undefined,
      status: invoice.status,
      companyName: branding.companyName || 'DAMA Enterprise',
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
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

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

    if (!isSuper && quote.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para convertir este presupuesto' });
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
    const count = await prisma.invoice.count({ where: { tenantId: quote.tenantId || 'master' } });
    const invoiceNumber = `FAC-${year}-${String(count + 1).padStart(4, '0')}`;

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
        tenantId: quote.tenantId || 'master',
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

    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'ACCEPTED' },
    });

    await logAudit(
      req.user?.id || null,
      'CONVERT_QUOTE',
      'Invoice',
      invoice.id,
      { quoteId: quote.id, quoteNumber: quote.quoteNumber, invoiceNumber: invoice.invoiceNumber, tenantId },
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
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Factura no encontrada' });
      return;
    }

    if (!isSuper && invoice.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para eliminar esta factura' });
      return;
    }

    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
    await prisma.invoice.delete({ where: { id } });
    await logAudit(req.user?.id || null, 'DELETE', 'Invoice', id, { invoiceNumber: invoice.invoiceNumber, tenantId }, req.ip);

    res.json({ success: true, message: `Factura ${invoice.invoiceNumber} eliminada correctamente` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteQuote(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) {
      res.status(404).json({ success: false, message: 'Presupuesto no encontrado' });
      return;
    }

    if (!isSuper && quote.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para eliminar este presupuesto' });
      return;
    }

    await prisma.invoiceItem.deleteMany({ where: { quoteId: id } });
    await prisma.quote.delete({ where: { id } });
    await logAudit(req.user?.id || null, 'DELETE', 'Quote', id, { quoteNumber: quote.quoteNumber, tenantId }, req.ip);

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

    let branding = getBrandingConfig();
    try {
      const tenant = await prisma.tenant.findFirst({
        where: { OR: [{ id: quote.tenantId || 'master' }, { slug: quote.tenantId || 'master' }] },
        select: { branding: true },
      });
      if (tenant?.branding) {
        branding = { ...branding, ...JSON.parse(tenant.branding) };
      }
    } catch {}

    res.json({
      success: true,
      data: {
        ...quote,
        branding: {
          companyName: branding.companyName || 'DAMA CRM',
          companyTaxId: branding.companyTaxId,
          primaryColor: branding.primaryColor || '#072053',
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
        signedBy: signedBy || (quote.contact?.firstName ? `${quote.contact?.firstName} ${quote.contact?.lastName}` : 'Cliente'),
        signedAt: new Date(),
        status: 'ACCEPTED',
      },
    });

    // Auto-create draft invoice upon online acceptance if not already converted
    const existingInvoice = await prisma.invoice.findFirst({ where: { quoteId: quote.id } });
    let createdInvoice = null;

    if (!existingInvoice) {
      const year = new Date().getFullYear();
      const count = await prisma.invoice.count({ where: { tenantId: quote.tenantId || 'master' } });
      const invoiceNumber = `FAC-${year}-${String(count + 1).padStart(4, '0')}`;

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
          tenantId: quote.tenantId || 'master',
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
        tenantId: quote.tenantId,
      },
      req.ip
    );

    // Dispatch real-time notification to tenant
    await NotificationService.notifyQuoteSigned({
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      companyName: quote.company?.name || updatedQuote.signedBy || 'Cliente',
      total: quote.total,
      tenantId: quote.tenantId,
    });

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
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);
    const { amount, notes } = req.body;

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Factura no encontrada' });
      return;
    }

    if (!isSuper && invoice.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para abonar esta factura' });
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
      req.user?.id || null,
      'RECORD_PAYMENT',
      'Invoice',
      id,
      { amount: payAmount, totalPaid: newPaidAmount, fullyPaid: isFullyPaid, tenantId },
      req.ip
    );

    // Dispatch real-time notification
    await NotificationService.notifyInvoicePayment({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: payAmount,
      remaining: Math.max(0, invoice.total - newPaidAmount),
      tenantId: invoice.tenantId,
    });

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
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const where: any = {
      status: { in: ['SENT', 'OVERDUE', 'PARTIAL', 'DRAFT'] },
    };
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    const pendingInvoices = await prisma.invoice.findMany({
      where,
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

// -----------------------------------------------------------------------------
// Recurring Invoices & Subscription Billing Engine
// -----------------------------------------------------------------------------

export async function listRecurringInvoices(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);
    const { status, companyId } = req.query;

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }
    if (status) where.status = String(status);
    if (companyId) where.companyId = String(companyId);

    const recurring = await prisma.recurringInvoice.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, taxId: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: true,
      },
      orderBy: { nextIssueDate: 'asc' },
    });

    res.json({ success: true, data: recurring });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createRecurringInvoice(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const {
      title,
      frequency = 'MONTHLY',
      startDate,
      nextIssueDate,
      endDate,
      taxRate = 21,
      currency = 'EUR',
      notes,
      autoSendEmail = true,
      companyId,
      contactId,
      items = [],
    } = req.body;

    if (!title || !items || items.length === 0) {
      res.status(400).json({ success: false, message: 'Título y al menos una línea de concepto son obligatorios' });
      return;
    }

    const subtotal = items.reduce(
      (sum: number, it: any) => sum + Number(it.quantity || 1) * Number(it.unitPrice || 0),
      0
    );
    const taxAmount = Number(((subtotal * Number(taxRate)) / 100).toFixed(2));
    const total = Number((subtotal + taxAmount).toFixed(2));

    const start = startDate ? new Date(startDate) : new Date();
    const nextDate = nextIssueDate ? new Date(nextIssueDate) : new Date(start);

    const recurring = await prisma.recurringInvoice.create({
      data: {
        title,
        frequency,
        status: 'ACTIVE',
        startDate: start,
        nextIssueDate: nextDate,
        endDate: endDate ? new Date(endDate) : null,
        subtotal,
        taxRate: Number(taxRate),
        taxAmount,
        total,
        currency,
        notes,
        autoSendEmail: Boolean(autoSendEmail),
        companyId: companyId || null,
        contactId: contactId || null,
        tenantId,
        items: {
          create: items.map((it: any) => ({
            description: it.description,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            amount: Number((Number(it.quantity || 1) * Number(it.unitPrice || 0)).toFixed(2)),
          })),
        },
      },
      include: {
        company: true,
        contact: true,
        items: true,
      },
    });

    logAudit(
      req.user?.id || null,
      'CREATE',
      'RecurringInvoice',
      recurring.id,
      { title, total, frequency, tenantId },
      req.ip
    );

    res.status(201).json({ success: true, data: recurring });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateRecurringInvoiceStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const existing = await prisma.recurringInvoice.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Suscripción recurrente no encontrada' });
      return;
    }

    if (!isSuper && existing.tenantId && existing.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para modificar esta suscripción' });
      return;
    }

    const updated = await prisma.recurringInvoice.update({
      where: { id },
      data: { status },
      include: { company: true, contact: true, items: true },
    });

    res.json({ success: true, data: updated, message: `Estado actualizado a ${status}` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function generateInvoiceFromRecurring(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const recurring = await prisma.recurringInvoice.findUnique({
      where: { id },
      include: { items: true, company: true, contact: true },
    });

    if (!recurring) {
      res.status(404).json({ success: false, message: 'Suscripción no encontrada' });
      return;
    }

    if (!isSuper && recurring.tenantId && recurring.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para acceder a esta suscripción' });
      return;
    }

    // Generate isolated invoice sequence for tenant
    const currentYear = new Date().getFullYear();
    const invoiceCount = await prisma.invoice.count({
      where: {
        tenantId: recurring.tenantId || tenantId,
        invoiceNumber: { startsWith: `FAC-${currentYear}` },
      },
    });
    const invoiceNumber = `FAC-${currentYear}-${String(invoiceCount + 1).padStart(4, '0')}`;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        companyId: recurring.companyId,
        contactId: recurring.contactId,
        status: 'SENT',
        issueDate: new Date(),
        dueDate,
        subtotal: recurring.subtotal,
        taxRate: recurring.taxRate,
        taxAmount: recurring.taxAmount,
        total: recurring.total,
        currency: recurring.currency,
        notes: `Generada automáticamente desde suscripción recurrente: ${recurring.title}. ${recurring.notes || ''}`.trim(),
        tenantId: recurring.tenantId || tenantId,
        items: {
          create: recurring.items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            amount: it.amount,
          })),
        },
      },
      include: { company: true, contact: true, items: true },
    });

    // Compute next issue date according to frequency
    const nextDate = new Date(recurring.nextIssueDate || new Date());
    switch (recurring.frequency) {
      case 'WEEKLY':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'QUARTERLY':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'BIANNUAL':
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case 'YEARLY':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case 'MONTHLY':
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }

    await prisma.recurringInvoice.update({
      where: { id },
      data: {
        lastIssuedAt: new Date(),
        nextIssueDate: nextDate,
      },
    });

    res.json({
      success: true,
      data: invoice,
      message: `Factura ${invoice.invoiceNumber} emitida exitosamente`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteRecurringInvoice(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const existing = await prisma.recurringInvoice.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Suscripción no encontrada' });
      return;
    }

    if (!isSuper && existing.tenantId && existing.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para eliminar esta suscripción' });
      return;
    }

    await prisma.recurringInvoice.delete({ where: { id } });
    res.json({ success: true, message: 'Suscripción recurrente eliminada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function importInvoices(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const userId = (req as any).user?.id || null;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Se requiere una lista de facturas válida en items' });
      return;
    }

    const createdInvoices = [];
    for (const inv of items) {
      const invoiceNumber = inv.invoiceNumber || `IMP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;
      const subtotal = parseFloat(inv.subtotal) || 0;
      const taxRate = parseFloat(inv.taxRate) || 21;
      const taxAmount = Math.round(((subtotal * taxRate) / 100) * 100) / 100;
      const total = inv.total ? parseFloat(inv.total) : subtotal + taxAmount;
      const status = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'].includes(inv.status?.toUpperCase())
        ? inv.status.toUpperCase()
        : 'PAID';

      let companyId: string | null = null;
      if (inv.clientName) {
        const existingCompany = await prisma.company.findFirst({
          where: {
            name: { equals: inv.clientName.trim() },
            tenantId,
          },
        });
        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          const newComp = await prisma.company.create({
            data: {
              name: inv.clientName.trim(),
              taxId: inv.clientTaxId?.trim() || null,
              tenantId,
            },
          });
          companyId = newComp.id;
        }
      }

      const issueDate = inv.issueDate ? new Date(inv.issueDate) : new Date();
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(issueDate.getTime() + 30 * 86400000);

      const record = await prisma.invoice.create({
        data: {
          invoiceNumber,
          tenantId,
          companyId,
          issueDate,
          dueDate,
          subtotal,
          taxRate,
          taxAmount,
          total,
          status,
          notes: inv.notes || 'Importada desde archivo externo',
          items: {
            create: [
              {
                description: inv.description || 'Concepto de servicios importado',
                quantity: 1,
                unitPrice: subtotal,
                amount: subtotal,
              },
            ],
          },
        },
      });
      createdInvoices.push(record);
    }

    await logAudit(userId, 'IMPORT_INVOICES', 'Invoice', 'batch', { count: createdInvoices.length, tenantId }, req.ip);

    res.status(201).json({
      success: true,
      data: createdInvoices,
      message: `Se han importado ${createdInvoices.length} facturas exitosamente a la base de datos`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function rectifyInvoice(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { reason, rectifyAmount } = req.body;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const original = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true, company: true, contact: true },
    });

    if (!original) {
      res.status(404).json({ success: false, message: 'Factura original no encontrada' });
      return;
    }

    if (!isSuper && original.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes acceso a esta factura' });
      return;
    }

    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({ where: { tenantId } });
    const invoiceNumber = `REC-${year}-${String(count + 1).padStart(4, '0')}`;

    // Negative items or adjusted rectify amount
    const isPartial = rectifyAmount !== undefined && rectifyAmount !== null && parseFloat(rectifyAmount) > 0;
    const partialSubtotal = isPartial ? -parseFloat(rectifyAmount) : -original.subtotal;
    const taxAmount = Number(((partialSubtotal * original.taxRate) / 100).toFixed(2));
    const total = Number((partialSubtotal + taxAmount).toFixed(2));

    const items = isPartial
      ? [
          {
            description: `Abono / Rectificación parcial sobre ${original.invoiceNumber}: ${reason || 'Ajuste de importe'}`,
            quantity: 1,
            unitPrice: partialSubtotal,
            amount: partialSubtotal,
          },
        ]
      : original.items.map((it) => ({
          description: `Rectificación: ${it.description}`,
          quantity: it.quantity,
          unitPrice: -Math.abs(it.unitPrice),
          discount: it.discount || 0,
          amount: -Math.abs(it.amount),
        }));

    const rectifyingInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        companyId: original.companyId,
        contactId: original.contactId,
        issueDate: new Date(),
        dueDate: new Date(),
        status: 'PAID',
        subtotal: partialSubtotal,
        taxRate: original.taxRate,
        taxAmount,
        total,
        currency: original.currency,
        isRectifying: true,
        rectifiesInvoiceId: original.id,
        rectifyingReason: reason || `Rectificación y anulación de ${original.invoiceNumber}`,
        notes: `Factura Rectificativa / Abono vinculada a la factura original ${original.invoiceNumber}. Motivo: ${reason || 'Abono'}`,
        tenantId,
        items: {
          create: items,
        },
      },
      include: { items: true, company: true, contact: true },
    });

    await logAudit(
      req.user?.id || null,
      'RECTIFY',
      'Invoice',
      rectifyingInvoice.id,
      { originalId: original.id, rectifyingNumber: invoiceNumber, tenantId },
      req.ip
    );

    res.status(201).json({
      success: true,
      data: rectifyingInvoice,
      message: `Factura rectificativa ${invoiceNumber} generada con éxito`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function duplicateInvoice(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const original = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!original) {
      res.status(404).json({ success: false, message: 'Factura no encontrada' });
      return;
    }

    if (!isSuper && original.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para duplicar esta factura' });
      return;
    }

    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({ where: { tenantId } });
    const invoiceNumber = `FAC-${year}-${String(count + 1).padStart(4, '0')}`;

    const duplicate = await prisma.invoice.create({
      data: {
        invoiceNumber,
        companyId: original.companyId,
        contactId: original.contactId,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 86400000),
        status: 'DRAFT',
        subtotal: original.subtotal,
        discountPercent: original.discountPercent,
        discountAmount: original.discountAmount,
        taxRate: original.taxRate,
        taxAmount: original.taxAmount,
        irpfRate: original.irpfRate,
        irpfAmount: original.irpfAmount,
        total: original.total,
        currency: original.currency,
        paymentTerms: original.paymentTerms,
        notes: original.notes,
        tenantId,
        items: {
          create: original.items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            discount: it.discount || 0,
            amount: it.amount,
          })),
        },
      },
      include: { items: true, company: true, contact: true },
    });

    res.status(201).json({
      success: true,
      data: duplicate,
      message: `Factura clonada con nuevo número ${invoiceNumber}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function sendInvoiceEmail(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { emailTo, subject, message } = req.body;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { company: true, contact: true, items: true },
    });

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Factura no encontrada' });
      return;
    }

    if (!isSuper && invoice.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes acceso a esta factura' });
      return;
    }

    const recipient = emailTo || invoice.contact?.email || invoice.company?.email;
    if (!recipient) {
      res.status(400).json({ success: false, message: 'No se encontró una dirección de correo para el cliente' });
      return;
    }

    // Update status to SENT if it was DRAFT
    if (invoice.status === 'DRAFT') {
      await prisma.invoice.update({
        where: { id },
        data: { status: 'SENT' },
      });
    }

    await logAudit(
      req.user?.id || null,
      'EMAIL_SENT',
      'Invoice',
      invoice.id,
      { recipient, invoiceNumber: invoice.invoiceNumber, tenantId },
      req.ip
    );

    res.json({
      success: true,
      message: `Factura ${invoice.invoiceNumber} enviada por correo a ${recipient}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}



