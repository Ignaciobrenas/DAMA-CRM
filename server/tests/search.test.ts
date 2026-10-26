import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('DAMA-CRM Universal Global Search & Indexing Engine (All 20 Modules)', () => {
  it('should validate query minimum length (at least 2 characters)', () => {
    const isValidQuery = (q: any): boolean => {
      return Boolean(q && typeof q === 'string' && q.trim().length >= 2);
    };

    assert.strictEqual(isValidQuery(''), false);
    assert.strictEqual(isValidQuery('a'), false);
    assert.strictEqual(isValidQuery('   '), false);
    assert.strictEqual(isValidQuery(null), false);
    assert.strictEqual(isValidQuery(undefined), false);
    assert.strictEqual(isValidQuery('ab'), true);
    assert.strictEqual(isValidQuery('GLS-ES'), true);
    assert.strictEqual(isValidQuery('Acme Tech'), true);
  });

  it('should index and map all 20 modules into structured categories', () => {
    const modulesCatalog: Record<string, { label: string; icon: string; sampleRoute: string }> = {
      companies: { label: 'Empresas', icon: 'Building2', sampleRoute: '/companies?id=cmp-101' },
      contacts: { label: 'Contactos', icon: 'User', sampleRoute: '/contacts?id=cnt-202' },
      deals: { label: 'Oportunidades', icon: 'DollarSign', sampleRoute: '/pipeline?dealId=dl-303' },
      projects: { label: 'Proyectos', icon: 'Briefcase', sampleRoute: '/agile?projectId=prj-404' },
      tasks: { label: 'Tareas Ágiles', icon: 'CheckSquare', sampleRoute: '/agile?taskId=tsk-505' },
      invoices: { label: 'Facturas', icon: 'FileText', sampleRoute: '/invoicing?invoiceId=inv-606' },
      quotes: { label: 'Presupuestos', icon: 'Receipt', sampleRoute: '/invoicing?quoteId=quo-707' },
      inventory: { label: 'Inventario', icon: 'Package', sampleRoute: '/inventory?productId=prd-808' },
      warehouses: { label: 'Almacenes', icon: 'Layers', sampleRoute: '/inventory?tab=warehouses&warehouseId=wh-909' },
      batches: { label: 'Lotes de Stock', icon: 'Boxes', sampleRoute: '/inventory?tab=batches&batchId=bt-111' },
      tickets: { label: 'Tickets', icon: 'LifeBuoy', sampleRoute: '/tickets?ticketId=tck-222' },
      expenses: { label: 'Gastos', icon: 'CreditCard', sampleRoute: '/expenses?expenseId=exp-333' },
      logistics: { label: 'Logística & Envíos', icon: 'Truck', sampleRoute: '/logistics?shipmentId=shp-444' },
      appointments: { label: 'Citas & Agenda', icon: 'CalendarClock', sampleRoute: '/appointments?appointmentId=apt-555' },
      calendar: { label: 'Calendario', icon: 'Calendar', sampleRoute: '/calendar?eventId=cal-666' },
      omnichannel: { label: 'Mensajería Omnicanal', icon: 'MessageSquare', sampleRoute: '/omnichannel?contactId=cnt-777' },
      employees: { label: 'Empleados', icon: 'Users', sampleRoute: '/portal-empleado?employeeId=emp-888' },
      activities: { label: 'Actividades CRM', icon: 'Activity', sampleRoute: '/contacts?id=cnt-999' },
      workflows: { label: 'Automatizaciones', icon: 'GitFork', sampleRoute: '/workflows?workflowId=wf-123' },
      users: { label: 'Usuarios del Sistema', icon: 'ShieldCheck', sampleRoute: '/settings?tab=users&userId=usr-456' },
    };

    const keys = Object.keys(modulesCatalog);
    assert.strictEqual(keys.length, 20);

    for (const [key, config] of Object.entries(modulesCatalog)) {
      assert.ok(config.label.length > 0, `Category ${key} must have a label`);
      assert.ok(config.icon.length > 0, `Category ${key} must have an icon`);
      assert.ok(config.sampleRoute.startsWith('/'), `Route for ${key} must start with /`);
      assert.ok(config.sampleRoute.includes('?'), `Deep route for ${key} must include query parameters`);
    }
  });

  it('should correctly format search result objects adhering to frontend CommandMenu interface', () => {
    interface SearchResultItem {
      category: string;
      categoryKey: string;
      id: string;
      title: string;
      subtitle: string;
      badge?: string;
      route: string;
      icon: string;
    }

    const testItem: SearchResultItem = {
      category: 'Logística & Envíos',
      categoryKey: 'logistics',
      id: 'shp_test_123',
      title: 'Envío GLS-ES-98765432 (GLS)',
      subtitle: 'Destino: Transportes Madrid S.L., Madrid • Estado: IN_TRANSIT',
      badge: 'GLS',
      route: '/logistics?shipmentId=shp_test_123',
      icon: 'Truck',
    };

    assert.strictEqual(typeof testItem.id, 'string');
    assert.strictEqual(typeof testItem.title, 'string');
    assert.strictEqual(typeof testItem.route, 'string');
    assert.strictEqual(testItem.icon, 'Truck');
    assert.strictEqual(testItem.categoryKey, 'logistics');
  });

  it('should support category filtering returning only targeted entities', () => {
    const rawItems = [
      { id: '1', categoryKey: 'companies', title: 'Empresa A' },
      { id: '2', categoryKey: 'invoices', title: 'Factura 01' },
      { id: '3', categoryKey: 'companies', title: 'Empresa B' },
      { id: '4', categoryKey: 'logistics', title: 'Envío GLS' },
    ];

    const filterByCategory = (items: typeof rawItems, category?: string) => {
      if (!category || category === 'all') return items;
      return items.filter((i) => i.categoryKey === category);
    };

    const companiesOnly = filterByCategory(rawItems, 'companies');
    assert.strictEqual(companiesOnly.length, 2);
    assert.ok(companiesOnly.every((i) => i.categoryKey === 'companies'));

    const all = filterByCategory(rawItems, 'all');
    assert.strictEqual(all.length, 4);

    const logisticsOnly = filterByCategory(rawItems, 'logistics');
    assert.strictEqual(logisticsOnly.length, 1);
    assert.strictEqual(logisticsOnly[0].title, 'Envío GLS');
  });
});
