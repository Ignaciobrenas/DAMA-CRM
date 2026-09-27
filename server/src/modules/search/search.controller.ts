import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { getRequestTenant, isGodSuperAdmin } from '../../utils/tenant';

export async function globalSearch(req: Request, res: Response): Promise<void> {
  try {
    const { q, category } = req.query;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      res.json({ success: true, data: [] });
      return;
    }

    const query = q.trim();
    const tenantFilter: any = (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) ? { tenantId } : {};

    const [companies, contacts, deals, projects, tasks, invoices, quotes, products, tickets, expenses] = await Promise.all([
      prisma.company.findMany({
        where: {
          ...tenantFilter,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { industry: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
            { taxId: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 8,
      }),
      prisma.contact.findMany({
        where: {
          ...tenantFilter,
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
            { position: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { company: true },
        take: 8,
      }),
      prisma.deal.findMany({
        where: {
          ...tenantFilter,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { notes: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { stage: true, company: true, contact: true },
        take: 8,
      }),
      prisma.project.findMany({
        where: {
          ...tenantFilter,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 8,
      }),
      prisma.task.findMany({
        where: {
          project: tenantFilter,
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
          ],
        },
        include: { project: true, assignee: true },
        take: 8,
      }),
      prisma.invoice.findMany({
        where: {
          ...tenantFilter,
          OR: [
            { invoiceNumber: { contains: query, mode: 'insensitive' } },
            { notes: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { company: true, contact: true },
        take: 8,
      }),
      prisma.quote.findMany({
        where: {
          ...tenantFilter,
          OR: [
            { quoteNumber: { contains: query, mode: 'insensitive' } },
            { notes: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { company: true, contact: true },
        take: 8,
      }),
      prisma.product.findMany({
        where: {
          ...tenantFilter,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 8,
      }),
      prisma.ticket.findMany({
        where: {
          ...tenantFilter,
          OR: [
            { ticketNumber: { contains: query, mode: 'insensitive' } },
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { company: true, contact: true },
        take: 8,
      }),
      prisma.expense.findMany({
        where: {
          ...tenantFilter,
          OR: [
            { expenseNumber: { contains: query, mode: 'insensitive' } },
            { supplierName: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 8,
      }),
    ]);

    const results: Array<{
      category: string;
      categoryKey: 'companies' | 'contacts' | 'deals' | 'projects' | 'tasks' | 'invoices' | 'quotes' | 'inventory' | 'tickets' | 'expenses';
      id: string;
      title: string;
      subtitle: string;
      badge?: string;
      route: string;
      icon: string;
    }> = [];

    companies.forEach((c) => {
      results.push({
        category: 'Empresas',
        categoryKey: 'companies',
        id: c.id,
        title: c.name,
        subtitle: [c.taxId ? `CIF: ${c.taxId}` : null, c.industry, c.city].filter(Boolean).join(' • '),
        badge: c.city || c.industry || 'Empresa',
        route: `/companies?id=${c.id}`,
        icon: 'Building2',
      });
    });

    contacts.forEach((ct) => {
      results.push({
        category: 'Contactos',
        categoryKey: 'contacts',
        id: ct.id,
        title: `${ct.firstName} ${ct.lastName}`,
        subtitle: [ct.position, ct.company?.name, ct.email, ct.phone].filter(Boolean).join(' • '),
        badge: ct.isLead ? 'Lead' : 'Cliente',
        route: `/contacts?id=${ct.id}`,
        icon: 'User',
      });
    });

    deals.forEach((d) => {
      results.push({
        category: 'Oportunidades',
        categoryKey: 'deals',
        id: d.id,
        title: d.title,
        subtitle: `${d.value.toLocaleString('es-ES', { style: 'currency', currency: d.currency })} • ${d.company?.name || d.contact?.firstName || ''} • ${d.stage?.name || d.status}`,
        badge: d.status,
        route: `/pipeline?dealId=${d.id}`,
        icon: 'DollarSign',
      });
    });

    projects.forEach((pr) => {
      results.push({
        category: 'Proyectos',
        categoryKey: 'projects',
        id: pr.id,
        title: pr.name,
        subtitle: `Estado: ${pr.status} • Prioridad: ${pr.priority}${pr.description ? ` • ${pr.description}` : ''}`,
        badge: pr.status,
        route: `/agile?projectId=${pr.id}`,
        icon: 'Briefcase',
      });
    });

    tasks.forEach((t: any) => {
      results.push({
        category: 'Tareas Ágiles',
        categoryKey: 'tasks',
        id: t.id,
        title: t.title,
        subtitle: `Proyecto: ${t.project?.name || 'General'} • Estado: ${t.status} • Puntos: ${t.storyPoints || 0}`,
        badge: t.priority,
        route: `/agile?taskId=${t.id}`,
        icon: 'CheckSquare',
      });
    });

    invoices.forEach((i) => {
      results.push({
        category: 'Facturas',
        categoryKey: 'invoices',
        id: i.id,
        title: `Factura ${i.invoiceNumber}`,
        subtitle: `${i.total.toLocaleString('es-ES', { style: 'currency', currency: i.currency })} • ${i.company?.name || ''} • Estado: ${i.status}`,
        badge: i.status,
        route: `/invoicing?invoiceId=${i.id}`,
        icon: 'FileText',
      });
    });

    quotes.forEach((qItem) => {
      results.push({
        category: 'Presupuestos',
        categoryKey: 'quotes',
        id: qItem.id,
        title: `Presupuesto ${qItem.quoteNumber}`,
        subtitle: `${qItem.total.toLocaleString('es-ES', { style: 'currency', currency: qItem.currency })} • ${qItem.company?.name || ''} • Estado: ${qItem.status}`,
        badge: qItem.status,
        route: `/invoicing?quoteId=${qItem.id}`,
        icon: 'Receipt',
      });
    });

    products.forEach((p) => {
      results.push({
        category: 'Inventario',
        categoryKey: 'inventory',
        id: p.id,
        title: p.name,
        subtitle: `SKU: ${p.sku} • Categoría: ${p.category || 'General'} • Stock: ${p.stock} uds`,
        badge: `${p.stock} uds`,
        route: `/inventory?productId=${p.id}`,
        icon: 'Package',
      });
    });

    tickets.forEach((tck) => {
      results.push({
        category: 'Tickets',
        categoryKey: 'tickets',
        id: tck.id,
        title: `Ticket #${tck.ticketNumber} - ${tck.title}`,
        subtitle: `Prioridad: ${tck.priority} • Estado: ${tck.status} • ${tck.company?.name || tck.contact?.firstName || ''}`,
        badge: tck.priority,
        route: `/tickets?ticketId=${tck.id}`,
        icon: 'LifeBuoy',
      });
    });

    expenses.forEach((exp) => {
      results.push({
        category: 'Gastos',
        categoryKey: 'expenses',
        id: exp.id,
        title: `${exp.expenseNumber} - ${exp.supplierName}`,
        subtitle: `${exp.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} • Categoría: ${exp.category}`,
        badge: exp.status,
        route: `/expenses?expenseId=${exp.id}`,
        icon: 'CreditCard',
      });
    });

    const filteredResults = category && category !== 'all'
      ? results.filter((r) => r.categoryKey === category)
      : results;

    res.json({ success: true, data: filteredResults });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
