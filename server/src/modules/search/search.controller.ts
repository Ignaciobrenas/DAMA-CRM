import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { getRequestTenant, isGodSuperAdmin } from '../../utils/tenant';

export interface GlobalSearchResult {
  category: string;
  categoryKey:
    | 'companies'
    | 'contacts'
    | 'deals'
    | 'projects'
    | 'tasks'
    | 'invoices'
    | 'quotes'
    | 'inventory'
    | 'warehouses'
    | 'batches'
    | 'tickets'
    | 'expenses'
    | 'logistics'
    | 'appointments'
    | 'calendar'
    | 'omnichannel'
    | 'employees'
    | 'activities'
    | 'workflows'
    | 'users';
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  route: string;
  icon: string;
}

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
    const tenantFilter: any =
      !isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']
        ? { tenantId }
        : {};

    const userPermissions = req.user?.permissions || [];
    const canAccess = (resource: string): boolean => {
      if (
        req.user?.role === 'ADMIN' ||
        req.user?.role === 'SUPER_ADMIN' ||
        req.user?.role === 'GOD' ||
        req.user?.tenantId === 'god' ||
        isSuper
      ) {
        return true;
      }
      return userPermissions.some(
        (p) => (p.resource === resource || p.resource === '*') && (p.action === 'read' || p.action === 'manage')
      );
    };

    const targetCategory = typeof category === 'string' && category !== 'all' ? category : null;

    // Parallel search across all 20 enterprise modules
    const [
      companies,
      contacts,
      deals,
      projects,
      tasks,
      invoices,
      quotes,
      products,
      warehouses,
      batches,
      tickets,
      expenses,
      shipments,
      appointments,
      calendarEvents,
      omniMessages,
      employees,
      activities,
      workflows,
      users,
    ] = await Promise.all([
      // 1. Companies
      (!targetCategory || targetCategory === 'companies') && canAccess('companies')
        ? prisma.company.findMany({
            where: {
              ...tenantFilter,
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { industry: { contains: query, mode: 'insensitive' } },
                { city: { contains: query, mode: 'insensitive' } },
                { taxId: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { address: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: 8,
          })
        : Promise.resolve([]),

      // 2. Contacts
      (!targetCategory || targetCategory === 'contacts') && canAccess('contacts')
        ? prisma.contact.findMany({
            where: {
              ...tenantFilter,
              OR: [
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query, mode: 'insensitive' } },
                { position: { contains: query, mode: 'insensitive' } },
                { department: { contains: query, mode: 'insensitive' } },
              ],
            },
            include: { company: true },
            take: 8,
          })
        : Promise.resolve([]),

      // 3. Deals (Pipeline)
      (!targetCategory || targetCategory === 'deals') && canAccess('deals')
        ? prisma.deal.findMany({
            where: {
              ...tenantFilter,
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { notes: { contains: query, mode: 'insensitive' } },
              ],
            },
            include: { stage: true, company: true, contact: true },
            take: 8,
          })
        : Promise.resolve([]),

      // 4. Projects (Agile)
      (!targetCategory || targetCategory === 'tasks' || targetCategory === 'projects') && canAccess('projects')
        ? prisma.project.findMany({
            where: {
              ...tenantFilter,
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: 8,
          })
        : Promise.resolve([]),

      // 5. Tasks (Agile Backlog & Board)
      (!targetCategory || targetCategory === 'tasks') && canAccess('tasks')
        ? prisma.task.findMany({
            where: {
              project: tenantFilter,
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            },
            include: { project: true, assignee: true },
            take: 8,
          })
        : Promise.resolve([]),

      // 6. Invoices
      (!targetCategory || targetCategory === 'invoices') && canAccess('invoices')
        ? prisma.invoice.findMany({
            where: {
              ...tenantFilter,
              OR: [
                { invoiceNumber: { contains: query, mode: 'insensitive' } },
                { notes: { contains: query, mode: 'insensitive' } },
              ],
            },
            include: { company: true, contact: true },
            take: 8,
          })
        : Promise.resolve([]),

      // 7. Quotes
      (!targetCategory || targetCategory === 'quotes' || targetCategory === 'invoices') && canAccess('quotes')
        ? prisma.quote.findMany({
            where: {
              ...tenantFilter,
              OR: [
                { quoteNumber: { contains: query, mode: 'insensitive' } },
                { notes: { contains: query, mode: 'insensitive' } },
              ],
            },
            include: { company: true, contact: true },
            take: 8,
          })
        : Promise.resolve([]),

      // 8. Products (Inventory)
      (!targetCategory || targetCategory === 'inventory') && canAccess('inventory')
        ? prisma.product.findMany({
            where: {
              ...tenantFilter,
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { sku: { contains: query, mode: 'insensitive' } },
                { category: { contains: query, mode: 'insensitive' } },
                { barcode: { contains: query, mode: 'insensitive' } },
                { location: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: 8,
          })
        : Promise.resolve([]),

      // 9. Warehouses
      (!targetCategory || targetCategory === 'inventory' || targetCategory === 'warehouses') && canAccess('inventory')
        ? prisma.warehouse.findMany({
            where: {
              ...tenantFilter,
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { code: { contains: query, mode: 'insensitive' } },
                { city: { contains: query, mode: 'insensitive' } },
                { address: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: 6,
          })
        : Promise.resolve([]),

      // 10. Batches
      (!targetCategory || targetCategory === 'inventory' || targetCategory === 'batches') && canAccess('inventory')
        ? prisma.stockBatch.findMany({
            where: {
              ...tenantFilter,
              OR: [
                { batchNumber: { contains: query, mode: 'insensitive' } },
              ],
            },
            include: { product: true, warehouse: true },
            take: 6,
          })
        : Promise.resolve([]),

      // 11. Tickets (Helpdesk)
      (!targetCategory || targetCategory === 'tickets') && canAccess('tickets')
        ? prisma.ticket.findMany({
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
          })
        : Promise.resolve([]),

      // 12. Expenses
      (!targetCategory || targetCategory === 'expenses') && canAccess('expenses')
        ? prisma.expense.findMany({
            where: {
              ...tenantFilter,
              OR: [
                { expenseNumber: { contains: query, mode: 'insensitive' } },
                { supplierName: { contains: query, mode: 'insensitive' } },
                { notes: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: 8,
          })
        : Promise.resolve([]),

      // 13. Shipments (Logistics)
      (!targetCategory || targetCategory === 'logistics') && (canAccess('logistics') || canAccess('shipments'))
        ? prisma.shipment.findMany({
            where: {
              ...tenantFilter,
              OR: [
                { trackingNumber: { contains: query, mode: 'insensitive' } },
                { recipientName: { contains: query, mode: 'insensitive' } },
                { recipientCity: { contains: query, mode: 'insensitive' } },
                { carrier: { contains: query, mode: 'insensitive' } },
                { notes: { contains: query, mode: 'insensitive' } },
              ],
            },
            include: { deal: true, invoice: true },
            take: 8,
          })
        : Promise.resolve([]),

      // 14. Appointments (Agenda / Reservas)
      (!targetCategory || targetCategory === 'appointments') && canAccess('appointments')
        ? prisma.appointment.findMany({
            where: {
              ...tenantFilter,
              OR: [
                { clientName: { contains: query, mode: 'insensitive' } },
                { clientEmail: { contains: query, mode: 'insensitive' } },
                { clientPhone: { contains: query, mode: 'insensitive' } },
                { staffName: { contains: query, mode: 'insensitive' } },
                { notes: { contains: query, mode: 'insensitive' } },
              ],
            },
            include: { contact: true },
            take: 8,
          })
        : Promise.resolve([]),

      // 15. Calendar Events
      (!targetCategory || targetCategory === 'calendar' || targetCategory === 'appointments') && canAccess('calendar')
        ? prisma.calendarEvent.findMany({
            where: {
              ...tenantFilter,
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { location: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: 8,
          })
        : Promise.resolve([]),

      // 16. Omnichannel Messages
      (!targetCategory || targetCategory === 'omnichannel') && canAccess('omnichannel')
        ? prisma.omniMessage.findMany({
            where: {
              ...tenantFilter,
              OR: [
                { sender: { contains: query, mode: 'insensitive' } },
                { recipient: { contains: query, mode: 'insensitive' } },
                { content: { contains: query, mode: 'insensitive' } },
                { subject: { contains: query, mode: 'insensitive' } },
              ],
            },
            include: { contact: true },
            take: 8,
          })
        : Promise.resolve([]),

      // 17. Employees
      (!targetCategory || targetCategory === 'employees') && canAccess('employees')
        ? prisma.employee.findMany({
            where: {
              ...tenantFilter,
              OR: [
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { jobTitle: { contains: query, mode: 'insensitive' } },
                { department: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: 8,
          })
        : Promise.resolve([]),

      // 18. Activities CRM
      (!targetCategory || targetCategory === 'activities' || targetCategory === 'contacts') &&
      (canAccess('activities') || canAccess('contacts') || canAccess('deals'))
        ? prisma.activity.findMany({
            where: {
              ...tenantFilter,
              OR: [
                { subject: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { outcome: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: 8,
          })
        : Promise.resolve([]),

      // 19. Workflows & Automations
      (!targetCategory || targetCategory === 'workflows') && canAccess('workflows')
        ? prisma.workflow.findMany({
            where: {
              ...tenantFilter,
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { trigger: { contains: query, mode: 'insensitive' } },
                { action: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: 8,
          })
        : Promise.resolve([]),

      // 20. Users & Access
      (!targetCategory || targetCategory === 'users') && (canAccess('users') || canAccess('settings'))
        ? prisma.user.findMany({
            where: {
              ...tenantFilter,
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
              ],
            },
            include: { role: true },
            take: 8,
          })
        : Promise.resolve([]),
    ]);

    const results: GlobalSearchResult[] = [];

    // Format Companies
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

    // Format Contacts
    contacts.forEach((ct) => {
      results.push({
        category: 'Contactos',
        categoryKey: 'contacts',
        id: ct.id,
        title: `${ct.firstName} ${ct.lastName}`.trim(),
        subtitle: [ct.position, ct.company?.name, ct.email, ct.phone].filter(Boolean).join(' • '),
        badge: ct.isLead ? 'Lead' : 'Cliente',
        route: `/contacts?id=${ct.id}`,
        icon: 'User',
      });
    });

    // Format Deals
    deals.forEach((d) => {
      results.push({
        category: 'Oportunidades',
        categoryKey: 'deals',
        id: d.id,
        title: d.title,
        subtitle: `${d.value.toLocaleString('es-ES', { style: 'currency', currency: d.currency || 'EUR' })} • ${d.company?.name || d.contact?.firstName || ''} • ${d.stage?.name || d.status}`,
        badge: d.status,
        route: `/pipeline?dealId=${d.id}`,
        icon: 'DollarSign',
      });
    });

    // Format Projects
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

    // Format Tasks
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

    // Format Invoices
    invoices.forEach((i) => {
      results.push({
        category: 'Facturas',
        categoryKey: 'invoices',
        id: i.id,
        title: `Factura ${i.invoiceNumber}`,
        subtitle: `${i.total.toLocaleString('es-ES', { style: 'currency', currency: i.currency || 'EUR' })} • ${i.company?.name || ''} • Estado: ${i.status}`,
        badge: i.status,
        route: `/invoicing?invoiceId=${i.id}`,
        icon: 'FileText',
      });
    });

    // Format Quotes
    quotes.forEach((qItem) => {
      results.push({
        category: 'Presupuestos',
        categoryKey: 'quotes',
        id: qItem.id,
        title: `Presupuesto ${qItem.quoteNumber}`,
        subtitle: `${qItem.total.toLocaleString('es-ES', { style: 'currency', currency: qItem.currency || 'EUR' })} • ${qItem.company?.name || ''} • Estado: ${qItem.status}`,
        badge: qItem.status,
        route: `/invoicing?quoteId=${qItem.id}`,
        icon: 'Receipt',
      });
    });

    // Format Products
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

    // Format Warehouses
    warehouses.forEach((w) => {
      results.push({
        category: 'Almacenes',
        categoryKey: 'warehouses',
        id: w.id,
        title: w.name,
        subtitle: `Código: ${w.code} • Tipo: ${w.type}${w.city ? ` • ${w.city}` : ''}`,
        badge: w.code,
        route: `/inventory?tab=warehouses&warehouseId=${w.id}`,
        icon: 'Layers',
      });
    });

    // Format Batches
    batches.forEach((b: any) => {
      results.push({
        category: 'Lotes de Stock',
        categoryKey: 'batches',
        id: b.id,
        title: `Lote #${b.batchNumber}`,
        subtitle: `Producto: ${b.product?.name || 'N/A'} • Disponible: ${b.remainingQty} uds`,
        badge: `${b.remainingQty} uds`,
        route: `/inventory?tab=batches&batchId=${b.id}`,
        icon: 'Boxes',
      });
    });

    // Format Tickets
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

    // Format Expenses
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

    // Format Shipments (Logistics)
    shipments.forEach((s) => {
      results.push({
        category: 'Logística & Envíos',
        categoryKey: 'logistics',
        id: s.id,
        title: `Envío ${s.trackingNumber} (${s.carrier})`,
        subtitle: `Destino: ${s.recipientName}, ${s.recipientCity} • Estado: ${s.status}`,
        badge: s.carrier,
        route: `/logistics?shipmentId=${s.id}`,
        icon: 'Truck',
      });
    });

    // Format Appointments
    appointments.forEach((apt) => {
      results.push({
        category: 'Citas & Agenda',
        categoryKey: 'appointments',
        id: apt.id,
        title: `Cita: ${apt.clientName}`,
        subtitle: `Especialista: ${apt.staffName} • Fecha: ${new Date(apt.startTime).toLocaleDateString('es-ES')} ${new Date(apt.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} • ${apt.status}`,
        badge: apt.status,
        route: `/appointments?appointmentId=${apt.id}`,
        icon: 'CalendarClock',
      });
    });

    // Format Calendar Events
    calendarEvents.forEach((ev) => {
      results.push({
        category: 'Calendario',
        categoryKey: 'calendar',
        id: ev.id,
        title: ev.title,
        subtitle: `${new Date(ev.startDate).toLocaleDateString('es-ES')} • ${ev.location || ev.description || 'Evento'}`,
        badge: 'Evento',
        route: `/calendar?eventId=${ev.id}`,
        icon: 'Calendar',
      });
    });

    // Format Omnichannel Messages
    omniMessages.forEach((msg) => {
      results.push({
        category: 'Mensajería Omnicanal',
        categoryKey: 'omnichannel',
        id: msg.id,
        title: `${msg.channel}: ${msg.contact ? `${msg.contact.firstName} ${msg.contact.lastName || ''}`.trim() : msg.sender}`,
        subtitle: msg.content.length > 60 ? `${msg.content.substring(0, 57)}...` : msg.content,
        badge: msg.channel,
        route: `/omnichannel?contactId=${msg.contactId}`,
        icon: 'MessageSquare',
      });
    });

    // Format Employees
    employees.forEach((emp) => {
      results.push({
        category: 'Empleados',
        categoryKey: 'employees',
        id: emp.id,
        title: `${emp.firstName} ${emp.lastName}`.trim(),
        subtitle: [emp.jobTitle, emp.department, emp.email, emp.phone].filter(Boolean).join(' • '),
        badge: emp.department || emp.status,
        route: `/portal-empleado?employeeId=${emp.id}`,
        icon: 'Users',
      });
    });

    // Format Activities CRM
    activities.forEach((act) => {
      results.push({
        category: 'Actividades CRM',
        categoryKey: 'activities',
        id: act.id,
        title: `[${act.type}] ${act.subject}`,
        subtitle: act.description ? act.description.slice(0, 60) : `Actividad registrada en CRM`,
        badge: act.type,
        route: act.contactId ? `/contacts?id=${act.contactId}` : `/pipeline`,
        icon: 'Activity',
      });
    });

    // Format Workflows
    workflows.forEach((wf) => {
      results.push({
        category: 'Automatizaciones',
        categoryKey: 'workflows',
        id: wf.id,
        title: wf.name,
        subtitle: `Disparador: ${wf.trigger} ➔ Acción: ${wf.action}`,
        badge: wf.isActive ? 'Activo' : 'Pausado',
        route: `/workflows?workflowId=${wf.id}`,
        icon: 'GitFork',
      });
    });

    // Format Users
    users.forEach((u: any) => {
      results.push({
        category: 'Usuarios del Sistema',
        categoryKey: 'users',
        id: u.id,
        title: u.name,
        subtitle: `${u.email} • Rol: ${u.role?.name || 'Usuario'}`,
        badge: u.role?.name || 'User',
        route: `/settings?tab=users&userId=${u.id}`,
        icon: 'ShieldCheck',
      });
    });

    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
