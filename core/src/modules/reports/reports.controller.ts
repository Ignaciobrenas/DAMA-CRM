import { Request, Response } from 'express';
import { prisma } from '../../prisma';

export async function getSalesPerformance(req: Request, res: Response): Promise<void> {
  try {
    const deals = await prisma.deal.findMany({
      include: {
        stage: true,
        company: { select: { id: true, name: true } },
      },
    });

    const wonDeals = deals.filter((d) => d.status === 'WON');
    const lostDeals = deals.filter((d) => d.status === 'LOST');
    const openDeals = deals.filter((d) => d.status === 'OPEN');

    const totalWonRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
    const totalOpenPipeline = openDeals.reduce((sum, d) => sum + d.value, 0);
    const averageDealSize = wonDeals.length > 0 ? totalWonRevenue / wonDeals.length : 0;
    const winRate = deals.length > 0 ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length || 1)) * 100) : 0;

    // Revenue by company
    const companyRevenueMap: Record<string, { name: string; total: number; dealsCount: number }> = {};
    deals.forEach((d) => {
      const compName = d.company?.name || 'Oportunidades Directas';
      if (!companyRevenueMap[compName]) {
        companyRevenueMap[compName] = { name: compName, total: 0, dealsCount: 0 };
      }
      companyRevenueMap[compName].total += d.value;
      companyRevenueMap[compName].dealsCount += 1;
    });

    const topCompanies = Object.values(companyRevenueMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Monthly revenue from real PAID invoices (last 12 months)
    const MONTH_NAMES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const paidInvoices = await prisma.invoice.findMany({
      where: { status: 'PAID', issueDate: { gte: twelveMonthsAgo } },
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
      monthlyRevenue.push({ month: MONTH_NAMES_ES[d.getMonth()], revenue: revenueByMonthKey[key] || 0 });
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
    const [tasks, sprints] = await Promise.all([
      prisma.task.findMany({
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
        },
      }),
      prisma.sprint.findMany({
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
    const { type } = req.query; // deals, contacts, invoices, companies, products, tasks

    if (type === 'deals') {
      const deals = await prisma.deal.findMany({
        include: { stage: true, company: true, contact: true },
      });

      let csv = 'ID,Titulo,Valor,Moneda,Estado,Etapa,Empresa,Contacto,FechaCreacion\n';
      deals.forEach((d) => {
        csv += `"${d.id}","${d.title.replace(/"/g, '""')}",${d.value},"${d.currency}","${d.status}","${d.stage.name}","${(d.company?.name || '').replace(/"/g, '""')}","${d.contact?.firstName || ''} ${d.contact?.lastName || ''}","${d.createdAt.toISOString()}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="deals-export.csv"');
      res.send('\uFEFF' + csv);
      return;
    }

    if (type === 'contacts') {
      const contacts = await prisma.contact.findMany({
        include: { company: true },
      });

      let csv = 'ID,Nombre,Apellidos,Email,Telefono,Puesto,Empresa,EsLead,FechaCreacion\n';
      contacts.forEach((c) => {
        csv += `"${c.id}","${c.firstName.replace(/"/g, '""')}","${c.lastName.replace(/"/g, '""')}","${c.email}","${c.phone || ''}","${(c.position || '').replace(/"/g, '""')}","${(c.company?.name || '').replace(/"/g, '""')}",${c.isLead},"${c.createdAt.toISOString()}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="contacts-export.csv"');
      res.send('\uFEFF' + csv);
      return;
    }

    if (type === 'companies') {
      const companies = await prisma.company.findMany({
        include: { _count: { select: { contacts: true, deals: true } } },
      });

      let csv = 'ID,Nombre,Sector,Ciudad,FacturacionAnual,SitioWeb,Telefono,Email,Contactos,Deals\n';
      companies.forEach((c) => {
        csv += `"${c.id}","${c.name.replace(/"/g, '""')}","${c.industry || ''}","${c.city || ''}",${c.annualRevenue || 0},"${c.website || ''}","${c.phone || ''}","${c.email || ''}",${c._count.contacts},${c._count.deals}\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="companies-export.csv"');
      res.send('\uFEFF' + csv);
      return;
    }

    if (type === 'invoices') {
      const invoices = await prisma.invoice.findMany({
        include: { company: true, contact: true },
      });

      let csv = 'ID,NumeroFactura,Cliente,FechaEmision,FechaVencimiento,Estado,BaseImponible,Impuestos,Total,Moneda\n';
      invoices.forEach((inv) => {
        const clientName = inv.company?.name || `${inv.contact?.firstName || ''} ${inv.contact?.lastName || ''}`;
        csv += `"${inv.id}","${inv.invoiceNumber}","${clientName.replace(/"/g, '""')}","${inv.issueDate.toISOString()}","${inv.dueDate?.toISOString() || ''}","${inv.status}",${inv.subtotal},${inv.taxAmount},${inv.total},"${inv.currency}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="invoices-export.csv"');
      res.send('\uFEFF' + csv);
      return;
    }

    if (type === 'products') {
      const products = await prisma.product.findMany();

      let csv = 'ID,SKU,Nombre,Categoria,Stock,PrecioPVP,Coste,CodigoBarras,SincronizadoUnoPIM\n';
      products.forEach((p) => {
        csv += `"${p.id}","${p.sku}","${p.name.replace(/"/g, '""')}","${p.category || ''}",${p.stock},${p.price},${p.costPrice || 0},"${p.barcode || ''}",${p.isSync}\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="products-export.csv"');
      res.send('\uFEFF' + csv);
      return;
    }

    if (type === 'tasks') {
      const tasks = await prisma.task.findMany({
        include: { project: true, assignee: true },
      });

      let csv = 'ID,Titulo,Proyecto,AsignadoA,Estado,Prioridad,StoryPoints,HorasEstimadas,HorasImputadas\n';
      tasks.forEach((t) => {
        csv += `"${t.id}","${t.title.replace(/"/g, '""')}","${(t.project?.name || '').replace(/"/g, '""')}","${t.assignee?.name || ''}","${t.status}","${t.priority}",${t.storyPoints || 0},${t.estimatedHours || 0},${t.loggedHours || 0}\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="tasks-export.csv"');
      res.send('\uFEFF' + csv);
      return;
    }

    res.status(400).json({ success: false, message: 'Tipo de exportación inválido' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
