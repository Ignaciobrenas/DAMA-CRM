import { Request, Response } from 'express';
import { prisma } from '../../prisma';

export async function globalSearch(req: Request, res: Response): Promise<void> {
  try {
    const { q, category } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      res.json({ success: true, data: [] });
      return;
    }

    const query = q.trim();

    const [companies, contacts, deals, projects, tasks, invoices, quotes, products] = await Promise.all([
      prisma.company.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { industry: { contains: query } },
            { city: { contains: query } },
            { address: { contains: query } },
            { taxId: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
          ],
        },
        take: 8,
      }),
      prisma.contact.findMany({
        where: {
          OR: [
            { firstName: { contains: query } },
            { lastName: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
            { mobile: { contains: query } },
            { position: { contains: query } },
            { department: { contains: query } },
            { notes: { contains: query } },
          ],
        },
        include: { company: true },
        take: 8,
      }),
      prisma.deal.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { notes: { contains: query } },
          ],
        },
        include: { stage: true, company: true, contact: true },
        take: 8,
      }),
      prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
          ],
        },
        take: 8,
      }),
      prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
            { status: { contains: query } },
            { priority: { contains: query } },
          ],
        },
        include: { project: true, assignee: true },
        take: 8,
      }),
      prisma.invoice.findMany({
        where: {
          OR: [
            { invoiceNumber: { contains: query } },
            { notes: { contains: query } },
            { status: { contains: query } },
          ],
        },
        include: { company: true, contact: true },
        take: 8,
      }),
      prisma.quote.findMany({
        where: {
          OR: [
            { quoteNumber: { contains: query } },
            { notes: { contains: query } },
            { status: { contains: query } },
          ],
        },
        include: { company: true, contact: true },
        take: 8,
      }),
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { sku: { contains: query } },
            { category: { contains: query } },
            { description: { contains: query } },
          ],
        },
        take: 8,
      }),
    ]);

    const results: Array<{
      category: string;
      categoryKey: 'companies' | 'contacts' | 'deals' | 'projects' | 'tasks' | 'invoices' | 'quotes' | 'inventory';
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

    tasks.forEach((t) => {
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
        category: 'Inventario / UnoPIM',
        categoryKey: 'inventory',
        id: p.id,
        title: p.name,
        subtitle: `SKU: ${p.sku} • Categoría: ${p.category || 'General'} • Stock: ${p.stock} uds`,
        badge: `${p.stock} uds`,
        route: `/inventory?productId=${p.id}`,
        icon: 'Package',
      });
    });

    // If client requested a specific category filter on the backend
    const filteredResults = category && category !== 'all'
      ? results.filter((r) => r.categoryKey === category)
      : results;

    res.json({ success: true, data: filteredResults });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
