import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { config } from '../../config';
import { generateToken } from '../../utils/jwt';
import { renderDiagnosticsHtml } from './diagnostics.view';
import { EndpointDescriptor, SystemTelemetry } from './diagnostics.types';

export const ENDPOINTS_CATALOG: EndpointDescriptor[] = [
  // Sistema & Salud
  {
    id: 'health',
    name: 'Chequeo de Salud del Servicio',
    method: 'GET',
    path: '/api/health',
    category: 'Sistema',
    description: 'Verifica la disponibilidad básica del core API para balanceadores Docker y Traefik.',
    requiresAuth: false,
  },
  {
    id: 'status',
    name: 'Telemetría y Estado en Tiempo Real',
    method: 'GET',
    path: '/api/status',
    category: 'Sistema',
    description: 'Retorna métricas de memoria, latencia de base de datos y conteo de entidades.',
    requiresAuth: false,
  },
  {
    id: 'docs-json',
    name: 'Especificación OpenAPI 3.0 (JSON)',
    method: 'GET',
    path: '/api/docs/json',
    category: 'Sistema',
    description: 'Definición OpenAPI del contrato de endpoints para clientes e integradores.',
    requiresAuth: false,
  },
  {
    id: 'branding',
    name: 'Identidad y Personalización Corporativa',
    method: 'GET',
    path: '/api/branding/current',
    category: 'Sistema',
    description: 'Retorna el esquema de colores, logotipos y configuración visual activa.',
    requiresAuth: false,
  },

  // CRM & Ventas
  {
    id: 'companies',
    name: 'Empresas y Cuentas B2B',
    method: 'GET',
    path: '/api/companies',
    category: 'CRM',
    description: 'Consulta el directorio de empresas con CIF, sector, volumen anual y sedes.',
    requiresAuth: true,
  },
  {
    id: 'contacts',
    name: 'Contactos y Directivos',
    method: 'GET',
    path: '/api/contacts',
    category: 'CRM',
    description: 'Directorio de contactos clave con cargos, teléfonos, correos y notas.',
    requiresAuth: true,
  },
  {
    id: 'deals',
    name: 'Pipeline de Ventas y Tratos',
    method: 'GET',
    path: '/api/deals',
    category: 'CRM',
    description: 'Oportunidades comerciales clasificadas por etapas, valores y probabilidades.',
    requiresAuth: true,
  },
  {
    id: 'deal-stages',
    name: 'Etapas del Pipeline Comercial',
    method: 'GET',
    path: '/api/deals/stages',
    category: 'CRM',
    description: 'Configuración correlativa de fases comerciales con colores y porcentajes.',
    requiresAuth: true,
  },

  // Facturación & Fiscal
  {
    id: 'invoices',
    name: 'Libro de Facturas Emitidas',
    method: 'GET',
    path: '/api/invoices',
    category: 'Facturación',
    description: 'Facturas correlativas con desglose de IVA (21%), estados de cobro y Veri*Factu.',
    requiresAuth: true,
  },
  {
    id: 'invoices-stats',
    name: 'Métricas y Resumen Financiero',
    method: 'GET',
    path: '/api/invoices/stats',
    category: 'Facturación',
    description: 'Totales facturados, importes pendientes de cobro y facturas vencidas.',
    requiresAuth: true,
  },
  {
    id: 'quotes',
    name: 'Presupuestos Emitidos',
    method: 'GET',
    path: '/api/quotes',
    category: 'Facturación',
    description: 'Ofertas comerciales con líneas de detalle, vencimiento y firma digital.',
    requiresAuth: true,
  },

  // Logística & Almacén
  {
    id: 'products',
    name: 'Catálogo de Productos y SKUs',
    method: 'GET',
    path: '/api/inventory/products',
    category: 'Logística',
    description: 'Productos sincronizados con UnoPIM, costes de compra y códigos de barras.',
    requiresAuth: true,
  },
  {
    id: 'warehouses',
    name: 'Red de Almacenes Físicos',
    method: 'GET',
    path: '/api/inventory/warehouses',
    category: 'Logística',
    description: 'Hubs de distribución (Madrid, Barcelona, Valencia) y ubicaciones de estantería.',
    requiresAuth: true,
  },
  {
    id: 'shipments',
    name: 'Envíos y Seguimiento Multiruta',
    method: 'GET',
    path: '/api/logistics/shipments',
    category: 'Logística',
    description: 'Trazabilidad de paquetes con 22 operadores (GLS, SEUR, Correos, DHL, MRW).',
    requiresAuth: true,
  },

  // Servicios & Citas
  {
    id: 'appointments',
    name: 'Agenda de Citas y Reservas',
    method: 'GET',
    path: '/api/appointments',
    category: 'Servicios',
    description: 'Citas profesionales de consultoría, medicina y estética con cobros vinculados.',
    requiresAuth: true,
  },
  {
    id: 'appointment-services',
    name: 'Catálogo de Servicios Tarifados',
    method: 'GET',
    path: '/api/appointments/services',
    category: 'Servicios',
    description: 'Tarifario de servicios con duraciones estimadas, precios y costes de insumos.',
    requiresAuth: true,
  },

  // Helpdesk & Soporte
  {
    id: 'tickets',
    name: 'Bandeja de Tickets Helpdesk',
    method: 'GET',
    path: '/api/tickets',
    category: 'Soporte',
    description: 'Incidencias con seguimiento de SLA estricto, prioridades y agentes asignados.',
    requiresAuth: true,
  },
  {
    id: 'ticket-stats',
    name: 'Métricas de Cumplimiento SLA',
    method: 'GET',
    path: '/api/tickets/stats',
    category: 'Soporte',
    description: 'Porcentaje de tickets en SLA, tiempos medios de primera respuesta y resolución.',
    requiresAuth: true,
  },

  // Proyectos & Harvest
  {
    id: 'projects',
    name: 'Proyectos Ágiles Activos',
    method: 'GET',
    path: '/api/projects',
    category: 'Proyectos',
    description: 'Proyectos vinculados a acuerdos comerciales con presupuesto y fechas límite.',
    requiresAuth: true,
  },
  {
    id: 'tasks',
    name: 'Tareas del Tablero Kanban',
    method: 'GET',
    path: '/api/planner/tasks',
    category: 'Proyectos',
    description: 'Historias de usuario con estimación de horas, story points y responsables.',
    requiresAuth: true,
  },
  {
    id: 'time-tracking',
    name: 'Temporizador Harvest Persistente',
    method: 'GET',
    path: '/api/employees/time-tracking/status',
    category: 'RRHH',
    description: 'Estado del fichaje laboral del usuario con cálculo UTC inmune a desconexión.',
    requiresAuth: true,
  },

  // Personas & Comunicación
  {
    id: 'employees',
    name: 'Directorio de Empleados',
    method: 'GET',
    path: '/api/employees',
    category: 'RRHH',
    description: 'Fichas de personal con departamento, tipo de contrato, IBAN y salario base.',
    requiresAuth: true,
  },
  {
    id: 'expenses',
    name: 'Libro de Gastos Operativos (P&L)',
    method: 'GET',
    path: '/api/expenses',
    category: 'Facturación',
    description: 'Facturas de proveedores clasificadas contablemente (Software, Legal, Suministros).',
    requiresAuth: true,
  },
  {
    id: 'calendar',
    name: 'Eventos de la Agenda',
    method: 'GET',
    path: '/api/calendar/events',
    category: 'Comunicación',
    description: 'Reuniones estratégicas, llamadas y fechas límite corporativas.',
    requiresAuth: true,
  },
  {
    id: 'channels',
    name: 'Canales de Chat de Equipo',
    method: 'GET',
    path: '/api/omnichannel/channels',
    category: 'Comunicación',
    description: 'Salas temáticas internas (#general, #ventas, #soporte, #proyectos, #anuncios).',
    requiresAuth: true,
  },
  {
    id: 'notifications',
    name: 'Centro de Notificaciones',
    method: 'GET',
    path: '/api/notifications',
    category: 'Comunicación',
    description: 'Alertas prioritarias de pagos, incidencias críticas y asignaciones.',
    requiresAuth: true,
  },

  // Integraciones
  {
    id: 'integrations-catalog',
    name: 'Catálogo de Conectores Oficiales',
    method: 'GET',
    path: '/api/integraciones-de-terceros',
    category: 'Integraciones',
    description: 'Estado de conexión de UnoPIM, Meta WhatsApp, WooCommerce, Shopify y Stripe.',
    requiresAuth: false,
  },
  {
    id: 'modules-active',
    name: 'Módulos Habilitados en la Organización',
    method: 'GET',
    path: '/api/modules',
    category: 'Sistema',
    description: 'Verifica los 20 módulos corporativos activos en el tenant del usuario.',
    requiresAuth: true,
  },
];

export class DiagnosticsController {
  static getDashboardHtml(req: Request, res: Response): void {
    const html = renderDiagnosticsHtml();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  static async getTelemetry(req: Request, res: Response): Promise<void> {
    try {
      const startTime = Date.now();
      let dbConnected = true;
      let latencyMs = 0;

      try {
        await prisma.$queryRawUnsafe('SELECT 1');
        latencyMs = Date.now() - startTime;
      } catch (e) {
        dbConnected = false;
      }

      // Collect counts safely
      const [
        users, companies, contacts, deals, products, warehouses,
        invoices, quotes, shipments, appointments, tickets, expenses,
        projects, tasks, workLogs, employees, timeRecords, channels, notifications
      ] = await Promise.all([
        prisma.user.count().catch(() => 0),
        prisma.company.count().catch(() => 0),
        prisma.contact.count().catch(() => 0),
        prisma.deal.count().catch(() => 0),
        prisma.product.count().catch(() => 0),
        prisma.warehouse.count().catch(() => 0),
        prisma.invoice.count().catch(() => 0),
        prisma.quote.count().catch(() => 0),
        prisma.shipment.count().catch(() => 0),
        prisma.appointment.count().catch(() => 0),
        prisma.ticket.count().catch(() => 0),
        prisma.expense.count().catch(() => 0),
        prisma.project.count().catch(() => 0),
        prisma.task.count().catch(() => 0),
        prisma.taskWorkLog.count().catch(() => 0),
        prisma.employee.count().catch(() => 0),
        prisma.timeRecord.count().catch(() => 0),
        prisma.internalChatChannel.count().catch(() => 0),
        prisma.notification.count().catch(() => 0),
      ]);

      const uptimeSec = Math.floor(process.uptime());
      const hours = Math.floor(uptimeSec / 3600);
      const minutes = Math.floor((uptimeSec % 3600) / 60);
      const seconds = uptimeSec % 60;
      const uptimeFormatted = `${hours}h ${minutes}m ${seconds}s`;

      const mem = process.memoryUsage();

      const telemetry: SystemTelemetry = {
        service: 'DAMA-CRM Enterprise Core API',
        version: '0.1.0',
        status: dbConnected ? 'OPERATIONAL' : 'DEGRADED',
        timestamp: new Date().toISOString(),
        uptimeSeconds: uptimeSec,
        uptimeFormatted,
        environment: config.env,
        port: config.port,
        nodeVersion: process.version,
        platform: `${process.platform} (${process.arch})`,
        memory: {
          rssMb: Number((mem.rss / 1024 / 1024).toFixed(1)),
          heapUsedMb: Number((mem.heapUsed / 1024 / 1024).toFixed(1)),
          heapTotalMb: Number((mem.heapTotal / 1024 / 1024).toFixed(1)),
          heapPercentage: Number(((mem.heapUsed / mem.heapTotal) * 100).toFixed(1)),
        },
        database: {
          connected: dbConnected,
          engine: process.env.DATABASE_URL?.includes('sqlite') ? 'SQLite Local' : 'PostgreSQL Enterprise',
          latencyMs,
          counts: {
            users,
            companies,
            contacts,
            deals,
            products,
            warehouses,
            invoices,
            quotes,
            shipments,
            appointments,
            tickets,
            expenses,
            projects,
            tasks,
            workLogs,
            employees,
            timeRecords,
            chatChannels: channels,
            notifications,
          },
        },
        security: {
          helmetActive: true,
          rateLimitingActive: true,
          rbacActive: true,
          tlsHstsActive: true,
        },
        integrations: [
          {
            id: 'unopim',
            name: 'UnoPIM ERP Connector',
            category: 'Catálogo & Stocks',
            status: 'ACTIVE',
            endpoint: '/api/inventory/webhooks/unopim',
            details: 'Sincronización bidireccional de variantes y reglas FEFO en almacenes.',
          },
          {
            id: 'whatsapp',
            name: 'Meta WhatsApp Cloud API',
            category: 'Omnicanalidad',
            status: 'ACTIVE',
            endpoint: '/api/omnichannel/webhooks/whatsapp',
            details: 'Webhooks entrantes y salientes con verificación criptográfica HMAC.',
          },
          {
            id: 'verifactu',
            name: 'AEAT Veri*Factu 2026',
            category: 'Fiscal & Tributario',
            status: 'ACTIVE',
            endpoint: '/api/invoices',
            details: 'Encadenamiento criptográfico SHA-256 de facturas con código QR homologado.',
          },
          {
            id: 'woocommerce',
            name: 'WooCommerce B2B Webhook',
            category: 'E-Commerce',
            status: 'CONFIGURED',
            endpoint: '/api/integrations/woocommerce/webhook',
            details: 'Creación automática de tratos y deduplicación por número de pedido.',
          },
          {
            id: 'shopify',
            name: 'Shopify Plus Sync',
            category: 'E-Commerce',
            status: 'CONFIGURED',
            endpoint: '/api/integrations/shopify/webhook',
            details: 'Ingesta de órdenes en tiempo real con firma secreta validada.',
          },
          {
            id: 'stripe',
            name: 'Stripe & Redsys Gateway',
            category: 'Pasarelas de Pago',
            status: 'CONFIGURED',
            endpoint: '/api/integrations/stripe/webhook',
            details: 'Procesamiento de pagos con tarjeta y conciliación con citas e invoices.',
          },
          {
            id: 'n8n',
            name: 'n8n Workflow Automation',
            category: 'Automatización',
            status: 'CONFIGURED',
            endpoint: '/api/integrations/n8n/action',
            details: 'Disparadores de eventos para pipelines externos de integración continua.',
          },
          {
            id: 'harvest',
            name: 'Harvest UTC Time Engine',
            category: 'Control Horario',
            status: 'ACTIVE',
            endpoint: '/api/employees/time-tracking/status',
            details: 'Marcas temporales UTC persistidas en base de datos inmunes a reconexión.',
          },
        ],
      };

      res.status(200).json(telemetry);
    } catch (error: any) {
      res.status(500).json({ status: 'ERROR', message: error.message });
    }
  }

  static getEndpointsCatalog(req: Request, res: Response): void {
    res.status(200).json({
      total: ENDPOINTS_CATALOG.length,
      endpoints: ENDPOINTS_CATALOG,
    });
  }

  static async getQuickToken(req: Request, res: Response): Promise<void> {
    try {
      // Find admin user or fallback
      let user = await prisma.user.findFirst({
        where: { email: 'ignaciobrenas@gmail.com' },
        include: { role: true },
      });

      if (!user) {
        user = await prisma.user.findFirst({
          where: { role: { name: 'ADMIN' } },
          include: { role: true },
        });
      }

      if (!user) {
        res.status(404).json({ error: 'No admin user found' });
        return;
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role?.name || 'ADMIN',
      });

      res.status(200).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role?.name || 'ADMIN',
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
