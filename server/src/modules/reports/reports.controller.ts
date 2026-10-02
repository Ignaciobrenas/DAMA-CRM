import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { getRequestTenant, isGodSuperAdmin } from '../../utils/tenant';

export async function getSalesPerformance(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    const deals = await prisma.deal.findMany({
      where,
      include: {
        stage: true,
        company: { select: { id: true, name: true } },
      },
    });

    const wonDeals = deals.filter((d) => d.status === 'WON');
    const lostDeals = deals.filter((d) => d.status === 'LOST');
    const openDeals = deals.filter((d) => d.status === 'OPEN');

    const totalWonRevenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const totalOpenPipeline = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const averageDealSize = wonDeals.length > 0 ? totalWonRevenue / wonDeals.length : 0;
    const winRate = deals.length > 0 ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length || 1)) * 100) : 0;

    // Revenue by company
    const companyRevenueMap: Record<string, { name: string; total: number; dealsCount: number }> = {};
    deals.forEach((d) => {
      const compName = d.company?.name || 'Oportunidades Directas';
      if (!companyRevenueMap[compName]) {
        companyRevenueMap[compName] = { name: compName, total: 0, dealsCount: 0 };
      }
      companyRevenueMap[compName].total += (d.value || 0);
      companyRevenueMap[compName].dealsCount += 1;
    });

    const topCompanies = Object.values(companyRevenueMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Monthly revenue from real PAID invoices (last 12 months)
    const MONTH_NAMES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const invoiceWhere: any = { status: 'PAID', issueDate: { gte: twelveMonthsAgo } };
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      invoiceWhere.tenantId = tenantId;
    }

    const paidInvoices = await prisma.invoice.findMany({
      where: invoiceWhere,
      select: { issueDate: true, total: true },
    });

    // Build a map: "YYYY-M" → total revenue for that month
    const revenueByMonthKey: Record<string, number> = {};
    paidInvoices.forEach((inv) => {
      const key = `${inv.issueDate.getFullYear()}-${inv.issueDate.getMonth()}`;
      revenueByMonthKey[key] = (revenueByMonthKey[key] || 0) + inv.total;
    });

    // Generate ordered array for the last 12 months
    const monthlyRevenue: { month: string; revenue: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyRevenue.push({ month: MONTH_NAMES_ES[d.getMonth()], revenue: Number((revenueByMonthKey[key] || 0).toFixed(2)) });
    }

    res.json({
      success: true,
      data: {
        kpis: {
          totalWonRevenue,
          totalOpenPipeline,
          averageDealSize,
          winRate,
          wonDealsCount: wonDeals.length,
          lostDealsCount: lostDeals.length,
          openDealsCount: openDeals.length,
        },
        topCompanies,
        monthlyRevenue,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getAgileVelocity(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const projectWhere: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      projectWhere.tenantId = tenantId;
    }

    const [tasks, sprints] = await Promise.all([
      prisma.task.findMany({
        where: { project: projectWhere },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
        },
      }),
      prisma.sprint.findMany({
        where: { project: projectWhere },
        include: {
          tasks: true,
        },
      }),
    ]);

    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) => t.status === 'DONE').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const reviewTasks = tasks.filter((t) => t.status === 'REVIEW').length;
    const todoTasks = tasks.filter((t) => t.status === 'TODO').length;

    const totalStoryPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedStoryPoints = tasks.filter((t) => t.status === 'DONE').reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    const sprintVelocity = sprints.map((s) => ({
      name: s.name,
      totalPoints: s.tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0),
      completedPoints: s.tasks.filter((t) => t.status === 'DONE').reduce((sum, t) => sum + (t.storyPoints || 0), 0),
    }));

    res.json({
      success: true,
      data: {
        totalTasks,
        doneTasks,
        inProgressTasks,
        reviewTasks,
        todoTasks,
        totalStoryPoints,
        completedStoryPoints,
        completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
        sprintVelocity,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function exportCsv(req: Request, res: Response): Promise<void> {
  try {
    const { type } = req.query; // deals, contacts, invoices, companies, products, tasks, tax-issued, tax-received
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    if (type === 'deals') {
      const deals = await prisma.deal.findMany({
        where,
        include: { stage: true, company: true, contact: true },
      });

      let csv = 'ID,Titulo,Valor,Moneda,Estado,Etapa,Empresa,Contacto,FechaCreacion\n';
      deals.forEach((d) => {
        csv += `"${d.id}","${(d.title || '').replace(/"/g, '""')}",${d.value},"${d.currency}","${d.status}","${d.stage?.name || ''}","${(d.company?.name || '').replace(/"/g, '""')}","${d.contact?.firstName || ''} ${d.contact?.lastName || ''}","${d.createdAt.toISOString()}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="deals-export-${tenantId}.csv"`);
      res.send('\uFEFF' + csv);
      return;
    }

    if (type === 'contacts') {
      const contacts = await prisma.contact.findMany({
        where,
        include: { company: true },
      });

      let csv = 'ID,Nombre,Apellidos,Email,Telefono,Puesto,Empresa,EsLead,FechaCreacion\n';
      contacts.forEach((c) => {
        csv += `"${c.id}","${(c.firstName || '').replace(/"/g, '""')}","${(c.lastName || '').replace(/"/g, '""')}","${c.email}","${c.phone || ''}","${(c.position || '').replace(/"/g, '""')}","${(c.company?.name || '').replace(/"/g, '""')}",${c.isLead},"${c.createdAt.toISOString()}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="contacts-export-${tenantId}.csv"`);
      res.send('\uFEFF' + csv);
      return;
    }

    if (type === 'companies') {
      const companies = await prisma.company.findMany({
        where,
        include: { _count: { select: { contacts: true, deals: true } } },
      });

      let csv = 'ID,Nombre,Sector,Ciudad,FacturacionAnual,SitioWeb,Telefono,Email,Contactos,Deals\n';
      companies.forEach((c) => {
        csv += `"${c.id}","${(c.name || '').replace(/"/g, '""')}","${c.industry || ''}","${c.city || ''}",${c.annualRevenue || 0},"${c.website || ''}","${c.phone || ''}","${c.email || ''}",${c._count.contacts},${c._count.deals}\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="companies-export-${tenantId}.csv"`);
      res.send('\uFEFF' + csv);
      return;
    }

    if (type === 'invoices') {
      const invoices = await prisma.invoice.findMany({
        where,
        include: { company: true, contact: true },
      });

      let csv = 'ID,NumeroFactura,Cliente,FechaEmision,FechaVencimiento,Estado,BaseImponible,Impuestos,Total,Moneda\n';
      invoices.forEach((inv) => {
        const clientName = inv.company?.name || `${inv.contact?.firstName || ''} ${inv.contact?.lastName || ''}`;
        csv += `"${inv.id}","${inv.invoiceNumber}","${clientName.replace(/"/g, '""')}","${inv.issueDate.toISOString()}","${inv.dueDate?.toISOString() || ''}","${inv.status}",${inv.subtotal},${inv.taxAmount},${inv.total},"${inv.currency}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="invoices-export-${tenantId}.csv"`);
      res.send('\uFEFF' + csv);
      return;
    }

    if (type === 'products') {
      const products = await prisma.product.findMany({ where });

      let csv = 'ID,SKU,Nombre,Categoria,Stock,PrecioPVP,Coste,CodigoBarras,SincronizadoUnoPIM\n';
      products.forEach((p) => {
        csv += `"${p.id}","${p.sku}","${(p.name || '').replace(/"/g, '""')}","${p.category || ''}",${p.stock},${p.price},${p.costPrice || 0},"${p.barcode || ''}",${p.isSync}\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="products-export-${tenantId}.csv"`);
      res.send('\uFEFF' + csv);
      return;
    }

    if (type === 'tasks') {
      const tasks = await prisma.task.findMany({
        where: { project: where },
        include: { project: true, assignee: true },
      });

      let csv = 'ID,Titulo,Proyecto,AsignadoA,Estado,Prioridad,StoryPoints,HorasEstimadas,HorasImputadas\n';
      tasks.forEach((t) => {
        csv += `"${t.id}","${(t.title || '').replace(/"/g, '""')}","${(t.project?.name || '').replace(/"/g, '""')}","${t.assignee?.name || ''}","${t.status}","${t.priority}",${t.storyPoints || 0},${t.estimatedHours || 0},${t.loggedHours || 0}\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="tasks-export-${tenantId}.csv"`);
      res.send('\uFEFF' + csv);
      return;
    }

    if (type === 'tax-issued' || type === 'tax-books-issued') {
      const invoices = await prisma.invoice.findMany({
        where,
        include: { company: true, contact: true },
        orderBy: { issueDate: 'asc' },
      });

      let csv = 'Fecha_Operacion,Fecha_Expedicion,Numero_Factura,NIF_Cliente,Nombre_Razon_Social,Tipo_Factura,Base_Imponible,Tipo_IVA_Pct,Cuota_IVA_Repercutido,Total_Factura,Estado_Cobro\n';
      invoices.forEach((inv) => {
        const clientName = inv.company?.name || `${inv.contact?.firstName || ''} ${inv.contact?.lastName || ''}`.trim() || 'Cliente Final';
        const clientTaxId = inv.company?.taxId || '';
        const issueDate = inv.issueDate.toISOString().split('T')[0];
        csv += `"${issueDate}","${issueDate}","${inv.invoiceNumber}","${clientTaxId}","${clientName.replace(/"/g, '""')}","F1",${inv.subtotal.toFixed(2)},${inv.taxRate.toFixed(2)},${inv.taxAmount.toFixed(2)},${inv.total.toFixed(2)},"${inv.status}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="Libro-Facturas-Expedidas-AEAT-Mod303-${tenantId}.csv"`);
      res.send('\uFEFF' + csv);
      return;
    }

    if (type === 'tax-received' || type === 'tax-books-received' || type === 'expenses') {
      const expenses = await prisma.expense.findMany({
        where,
        orderBy: { issueDate: 'asc' },
      });

      let csv = 'Fecha_Operacion,Fecha_Factura,Numero_Factura_Gasto,NIF_Proveedor,Nombre_Proveedor,Categoria,Base_Imponible,Tipo_IVA_Pct,Cuota_IVA_Soportado_Deducible,Total_Gasto,Estado_Pago\n';
      expenses.forEach((exp) => {
        const issueDate = exp.issueDate.toISOString().split('T')[0];
        csv += `"${issueDate}","${issueDate}","${exp.expenseNumber}","${exp.supplierTaxId || ''}","${(exp.supplierName || '').replace(/"/g, '""')}","${exp.category}",${exp.subtotal.toFixed(2)},${exp.taxRate.toFixed(2)},${exp.taxAmount.toFixed(2)},${exp.total.toFixed(2)},"${exp.status}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="Libro-Facturas-Recibidas-AEAT-Mod303-${tenantId}.csv"`);
      res.send('\uFEFF' + csv);
      return;
    }

    res.status(400).json({ success: false, message: 'Tipo de exportación inválido' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function exportExecutivePdf(req: Request, res: Response): Promise<void> {
  try {
    const PDFDocument = (await import('pdfkit')).default;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    const [deals, paidInvoices, pendingInvoices, products, tasks, companies] = await Promise.all([
      prisma.deal.findMany({ where, include: { company: true } }),
      prisma.invoice.findMany({ where: { ...where, status: 'PAID' } }),
      prisma.invoice.findMany({ where: { ...where, status: { in: ['SENT', 'OVERDUE', 'DRAFT'] } } }),
      prisma.product.findMany({ where }),
      prisma.task.findMany({ where: { project: where } }),
      prisma.company.findMany({ where }),
    ]);

    const wonDeals = deals.filter((d) => d.status === 'WON');
    const totalWonRevenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const totalPaidInvoices = paidInvoices.reduce((sum, i) => sum + i.total, 0);
    const totalPendingInvoices = pendingInvoices.reduce((sum, i) => sum + i.total, 0);
    const winRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;
    const inventoryValuation = products.reduce((sum, p) => sum + p.price * p.stock, 0);
    const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
    const doneTasks = tasks.filter((t) => t.status === 'DONE').length;

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="informe-ejecutivo-bi-${tenantId}.pdf"`);
      res.send(pdfBuffer);
    });

    // Color Palette
    const primaryColor = '#072053';
    const accentColor = '#2563EB';
    const slateColor = '#475569';
    const lightBg = '#F8FAFC';

    // Header Background Accent
    doc.rect(40, 40, 515, 60).fill(primaryColor);
    doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold').text('INFORME EJECUTIVO & BUSINESS INTELLIGENCE', 55, 55);
    doc.fontSize(9).font('Helvetica').text(`DAMA CRM ENTERPRISE • TENANT: ${tenantId.toUpperCase()} • FECHA: ${new Date().toLocaleDateString('es-ES')}`, 55, 78);

    doc.moveDown(3);

    // Section 1: KPI Summary Boxes
    let y = 120;
    doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold').text('1. RESUMEN EJECUTIVO Y RENDIMIENTO FINANCIERO', 40, y);
    y += 20;

    const kpis = [
      { label: 'Facturación Cobrada', val: `${totalPaidInvoices.toLocaleString('es-ES', { maximumFractionDigits: 2 })} €`, sub: `${paidInvoices.length} facturas pagadas` },
      { label: 'Pipeline Cerrado (WON)', val: `${totalWonRevenue.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €`, sub: `${wonDeals.length} oportunidades` },
      { label: 'Deuda Pendiente / Cobro', val: `${totalPendingInvoices.toLocaleString('es-ES', { maximumFractionDigits: 2 })} €`, sub: `${pendingInvoices.length} facturas pendientes` },
      { label: 'Ratio de Cierre (Win Rate)', val: `${winRate}%`, sub: `Sobre ${deals.length} deals totales` },
    ];

    kpis.forEach((kpi, index) => {
      const colX = 40 + (index % 2) * 265;
      const rowY = y + Math.floor(index / 2) * 55;
      doc.roundedRect(colX, rowY, 250, 48, 6).fillAndStroke(lightBg, '#E2E8F0');
      doc.fillColor(slateColor).fontSize(8).font('Helvetica-Bold').text(kpi.label.toUpperCase(), colX + 12, rowY + 8);
      doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text(kpi.val, colX + 12, rowY + 20);
      doc.fillColor('#94A3B8').fontSize(7.5).font('Helvetica').text(kpi.sub, colX + 12, rowY + 36);
    });

    y += 125;

    // Section 2: Operations & Inventory
    doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold').text('2. CATÁLOGO, EXISTENCIAS Y OPERACIONES SCRUM', 40, y);
    y += 20;

    const opKpis = [
      { label: 'Valoración de Inventario (PVP)', val: `${inventoryValuation.toLocaleString('es-ES', { maximumFractionDigits: 2 })} €`, sub: `${products.length} productos en catálogo` },
      { label: 'Alertas de Stock Bajo', val: `${lowStockCount} artículos`, sub: lowStockCount > 0 ? 'Requiere reabastecimiento' : 'Existencias saludables' },
      { label: 'Tareas Scrum Completadas', val: `${doneTasks} / ${tasks.length}`, sub: `Tasa éxito: ${tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0}%` },
      { label: 'Cuentas / Clientes Activos', val: `${companies.length} empresas`, sub: 'Directorio empresarial' },
    ];

    opKpis.forEach((kpi, index) => {
      const colX = 40 + (index % 2) * 265;
      const rowY = y + Math.floor(index / 2) * 55;
      doc.roundedRect(colX, rowY, 250, 48, 6).fillAndStroke(lightBg, '#E2E8F0');
      doc.fillColor(slateColor).fontSize(8).font('Helvetica-Bold').text(kpi.label.toUpperCase(), colX + 12, rowY + 8);
      doc.fillColor(accentColor).fontSize(14).font('Helvetica-Bold').text(kpi.val, colX + 12, rowY + 20);
      doc.fillColor('#94A3B8').fontSize(7.5).font('Helvetica').text(kpi.sub, colX + 12, rowY + 36);
    });

    y += 130;

    // Section 3: Recent High-Value Invoices & Deals Table
    doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold').text('3. DESGLOSE DE FACTURACIÓN Y VENTAS RECIENTES', 40, y);
    y += 20;

    // Table Header
    doc.rect(40, y, 515, 20).fill('#E2E8F0');
    doc.fillColor('#1E293B').fontSize(8).font('Helvetica-Bold');
    doc.text('DOCUMENTO / REF', 50, y + 6);
    doc.text('FECHA', 170, y + 6);
    doc.text('ESTADO', 260, y + 6);
    doc.text('BASE IMPONIBLE', 360, y + 6, { width: 80, align: 'right' });
    doc.text('TOTAL (€)', 460, y + 6, { width: 85, align: 'right' });

    y += 22;

    const sampleInvoices = paidInvoices.concat(pendingInvoices).slice(0, 8);
    sampleInvoices.forEach((inv, idx) => {
      const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      doc.rect(40, y, 515, 18).fill(rowBg);
      doc.fillColor('#334155').fontSize(8).font('Helvetica');
      doc.text(inv.invoiceNumber, 50, y + 5);
      doc.text(inv.issueDate.toISOString().split('T')[0], 170, y + 5);
      doc.text(inv.status, 260, y + 5);
      doc.text(`${inv.subtotal.toFixed(2)} €`, 360, y + 5, { width: 80, align: 'right' });
      doc.font('Helvetica-Bold').text(`${inv.total.toFixed(2)} €`, 460, y + 5, { width: 85, align: 'right' });
      y += 18;
    });

    // Footer
    doc.fontSize(8).font('Helvetica').fillColor('#94A3B8').text(
      'Generado automáticamente por el motor de BI de DAMA CRM • Documento confidencial para uso interno y directivo.',
      40,
      760,
      { align: 'center', width: 515 }
    );

    doc.end();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getAdminSystemAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const isSuper = isGodSuperAdmin(req);
    const tenantId = getRequestTenant(req);

    const [userCount, companyCount, dealCount, invoiceCount, auditLogs] = await Promise.all([
      prisma.user.count(),
      prisma.company.count(),
      prisma.deal.count(),
      prisma.invoice.count(),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }).catch(() => []),
    ]);

    const wonDeals = await prisma.deal.findMany({
      where: { status: 'WON' },
      select: { value: true },
    });
    const totalWonRevenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);

    const paidInvoices = await prisma.invoice.findMany({
      where: { status: 'PAID' },
      select: { total: true },
    });
    const totalPaidRevenue = paidInvoices.reduce((sum, i) => sum + i.total, 0);

    const memoryUsage = process.memoryUsage();

    res.json({
      success: true,
      data: {
        system: {
          uptimeSeconds: Math.round(process.uptime()),
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsageMb: {
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            rss: Math.round(memoryUsage.rss / 1024 / 1024),
          },
          activeTenants: isSuper ? 5 : 1,
        },
        database: {
          userCount,
          companyCount,
          dealCount,
          invoiceCount,
          totalWonRevenue,
          totalPaidRevenue,
        },
        auditLogs: auditLogs.map((log) => ({
          id: log.id,
          action: log.action,
          entity: log.entity,
          userId: log.userId,
          createdAt: log.createdAt,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}


