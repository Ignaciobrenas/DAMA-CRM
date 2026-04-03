import { Request, Response } from 'express';
import { prisma } from '../../prisma';

export async function globalSearch(req: Request, res: Response): Promise<void> {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      res.json({ success: true, data: [] });
      return;
    }

    const query = q.trim();

    const [companies, contacts, deals, tasks, invoices, products] = await Promise.all([
      prisma.company.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { industry: { contains: query } },
            { city: { contains: query } },
          ],
        },
        take: 5,
      }),
      prisma.contact.findMany({
        where: {
          OR: [
            { firstName: { contains: query } },
            { lastName: { contains: query } },
            { email: { contains: query } },
            { position: { contains: query } },
          ],
        },
        include: { company: true },
        take: 5,
      }),
      prisma.deal.findMany({
        where: {
          OR: [
            { title: { contains: query } },
          ],
        },
        include: { stage: true, company: true },
        take: 5,
      }),
      prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
          ],
        },
        include: { project: true },
        take: 5,
      }),
      prisma.invoice.findMany({
        where: {
          OR: [
            { invoiceNumber: { contains: query } },
          ],
        },
        include: { company: true },
        take: 5,
      }),
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { sku: { contains: query } },
          ],
        },
        take: 5,
      }),
    ]);

    const results: Array<{
      category: string;
      id: string;
      title: string;
      subtitle: string;
      route: string;
      icon: string;
    }> = [];

    companies.forEach((c) => {
      results.push({
        category: 'Empresas',
        id: c.id,
        title: c.name,
        subtitle: [c.industry, c.city].filter(Boolean).join(' • '),
        route: `/companies?id=${c.id}`,
        icon: 'Building2',
      });
    });

    contacts.forEach((ct) => {
      results.push({
        category: 'Contactos',
        id: ct.id,
        title: `${ct.firstName} ${ct.lastName}`,
        subtitle: [ct.position, ct.company?.name].filter(Boolean).join(' @ '),
        route: `/contacts?id=${ct.id}`,
        icon: 'User',
      });
    });

    deals.forEach((d) => {
      results.push({
        category: 'Oportunidades (Deals)',
        id: d.id,
        title: d.title,
        subtitle: `${d.value.toLocaleString('es-ES', { style: 'currency', currency: d.currency })} • ${d.stage.name}`,
        route: `/pipeline?dealId=${d.id}`,
        icon: 'DollarSign',
      });
    });

    tasks.forEach((t) => {
      results.push({
        category: 'Tareas Ágiles',
        id: t.id,
        title: t.title,
        subtitle: `Proyecto: ${t.project.name} • Estado: ${t.status}`,
        route: `/agile?taskId=${t.id}`,
        icon: 'CheckSquare',
      });
    });

    invoices.forEach((i) => {
      results.push({
        category: 'Facturas',
        id: i.id,
        title: `Factura ${i.invoiceNumber}`,
        subtitle: `${i.total.toLocaleString('es-ES', { style: 'currency', currency: i.currency })} • ${i.status}`,
        route: `/invoicing?invoiceId=${i.id}`,
        icon: 'FileText',
      });
    });

    products.forEach((p) => {
      results.push({
        category: 'Inventario / UnoPIM',
        id: p.id,
        title: p.name,
        subtitle: `SKU: ${p.sku} • Stock: ${p.stock} uds`,
        route: `/inventory?productId=${p.id}`,
        icon: 'Package',
      });
    });

    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
