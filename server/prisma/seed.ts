import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting DAMA-CRM database seed...');

  await prisma.timeRecord.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.customFieldValue.deleteMany();
  await prisma.customField.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.twoFactorToken.deleteMany();
  await prisma.omniMessage.deleteMany();
  await prisma.workflowLog.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.product.deleteMany();
  await prisma.task.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.project.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.dealStage.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.tenant.deleteMany();

  // 0. Create Tenants (Multi-Tenant SaaS Foundation)
  const masterTenant = await prisma.tenant.create({
    data: {
      slug: 'master',
      name: 'DAMA Cloud Solutions (God Tenant)',
      domain: 'app.damacrm.com',
      isGodTenant: true,
      status: 'ACTIVE',
      plan: 'ENTERPRISE',
      maxUsers: 999,
      branding: JSON.stringify({ primaryColor: '#2563EB', companyName: 'DAMA Cloud Solutions' }),
    },
  });

  const acmeTenant = await prisma.tenant.create({
    data: {
      slug: 'acme',
      name: 'ACME Corporation Inc.',
      domain: 'acme.damacrm.com',
      isGodTenant: false,
      status: 'ACTIVE',
      plan: 'PRO',
      maxUsers: 25,
      branding: JSON.stringify({ primaryColor: '#059669', companyName: 'ACME Corp' }),
    },
  });

  const innovaTenant = await prisma.tenant.create({
    data: {
      slug: 'innovatech',
      name: 'InnovaTech Solutions SL',
      domain: 'innovatech.damacrm.com',
      isGodTenant: false,
      status: 'ACTIVE',
      plan: 'ENTERPRISE',
      maxUsers: 50,
      branding: JSON.stringify({ primaryColor: '#7C3AED', companyName: 'InnovaTech SL' }),
    },
  });

  // 1. Create Roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      description: 'Acceso total y configuración del sistema',
      isSystem: true,
    },
  });

  const salesRole = await prisma.role.create({
    data: {
      name: 'SALES',
      description: 'Gestión comercial, pipeline de ventas y contactos',
      isSystem: false,
    },
  });

  const pmRole = await prisma.role.create({
    data: {
      name: 'PROJECT_MANAGER',
      description: 'Planificador ágil, proyectos, sprints y tareas',
      isSystem: false,
    },
  });

  const clientRole = await prisma.role.create({
    data: {
      name: 'CLIENT',
      description: 'Portal autoservicio B2B para visualización de presupuestos y facturas',
      isSystem: true,
    },
  });

  // 2. Populate Dynamic Permissions Matrix
  const resources = [
    'users',
    'companies',
    'contacts',
    'deals',
    'projects',
    'tasks',
    'invoices',
    'quotes',
    'inventory',
    'workflows',
    'omnichannel',
    'reports',
  ];
  const actions = ['create', 'read', 'update', 'delete', 'manage'];

  // Admin has full manage permissions across all resources
  for (const res of resources) {
    for (const act of actions) {
      await prisma.permission.create({
        data: {
          roleId: adminRole.id,
          resource: res,
          action: act,
        },
      });
    }
  }

  // Sales permissions
  const salesResources = ['companies', 'contacts', 'deals', 'quotes', 'invoices', 'omnichannel', 'inventory'];
  for (const res of salesResources) {
    for (const act of ['create', 'read', 'update']) {
      await prisma.permission.create({
        data: {
          roleId: salesRole.id,
          resource: res,
          action: act,
        },
      });
    }
  }
  // Allow sales read-only on projects and tasks
  await prisma.permission.create({ data: { roleId: salesRole.id, resource: 'projects', action: 'read' } });
  await prisma.permission.create({ data: { roleId: salesRole.id, resource: 'tasks', action: 'read' } });

  // Project Manager permissions
  const pmResources = ['projects', 'tasks', 'companies', 'contacts', 'deals'];
  for (const res of pmResources) {
    for (const act of ['create', 'read', 'update']) {
      await prisma.permission.create({
        data: {
          roleId: pmRole.id,
          resource: res,
          action: act,
        },
      });
    }
  }

  // Client permissions
  await prisma.permission.create({ data: { roleId: clientRole.id, resource: 'quotes', action: 'read' } });
  await prisma.permission.create({ data: { roleId: clientRole.id, resource: 'invoices', action: 'read' } });

  // 3. Create Users with encrypted passwords
  const passwordHashIgnacio = await bcrypt.hash('1', 10);
  const passwordHashAdmin = await bcrypt.hash('Admin1234!', 10);
  const passwordHashSales = await bcrypt.hash('Ventas1234!', 10);
  const passwordHashPm = await bcrypt.hash('Pm1234!', 10);

  const ignacioUser = await prisma.user.create({
    data: {
      email: 'ignaciobrenas@gmail.com',
      passwordHash: passwordHashIgnacio,
      name: 'Ignacio Breñas',
      roleId: adminRole.id,
      twoFactorEnabled: false,
      isActive: true,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@dama-crm.local',
      passwordHash: passwordHashAdmin,
      name: 'Ignacio Administrador',
      roleId: adminRole.id,
      twoFactorEnabled: false, // Can be toggled on in settings
      isActive: true,
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      email: 'ventas@dama-crm.local',
      passwordHash: passwordHashSales,
      name: 'Laura Gómez (Comercial)',
      roleId: salesRole.id,
      isActive: true,
    },
  });

  const pmUser = await prisma.user.create({
    data: {
      email: 'pm@dama-crm.local',
      passwordHash: passwordHashPm,
      name: 'Carlos Ruiz (Project Manager)',
      roleId: pmRole.id,
      isActive: true,
    },
  });

  // 4. Create Companies
  const company1 = await prisma.company.create({
    data: {
      name: 'Innovatech Solutions SL',
      industry: 'Tecnología & Software',
      website: 'https://innovatech.es',
      phone: '+34 912 345 678',
      email: 'contacto@innovatech.es',
      address: 'Paseo de la Castellana 140',
      city: 'Madrid',
      country: 'España',
      taxId: 'B-87654321',
      annualRevenue: 1250000.0,
      employeesCount: 45,
      notes: 'Cliente estratégico de alta prioridad para automatizaciones cloud.',
    },
  });

  const company2 = await prisma.company.create({
    data: {
      name: 'Logística Ibérica SA',
      industry: 'Transporte y Distribución',
      website: 'https://logisticaiberica.com',
      phone: '+34 934 567 890',
      email: 'ops@logisticaiberica.com',
      address: 'Polígono Industrial Zona Franca',
      city: 'Barcelona',
      country: 'España',
      taxId: 'A-12345678',
      annualRevenue: 4800000.0,
      employeesCount: 120,
      notes: 'Requiere integración UnoPIM para catálogo de repuestos.',
    },
  });

  const company3 = await prisma.company.create({
    data: {
      name: 'Biomedical Europa',
      industry: 'Salud y Farmacia',
      website: 'https://biomedicaleurope.org',
      phone: '+34 961 234 567',
      email: 'info@biomedicaleurope.org',
      address: 'Avenida Blasco Ibáñez 28',
      city: 'Valencia',
      country: 'España',
      taxId: 'B-99887766',
      annualRevenue: 850000.0,
      employeesCount: 22,
      notes: 'Interesados en CRM omnicanal con WhatsApp integrado.',
    },
  });

  // 5. Create Contacts
  const contact1 = await prisma.contact.create({
    data: {
      companyId: company1.id,
      firstName: 'Elena',
      lastName: 'Martínez',
      email: 'elena.martinez@innovatech.es',
      phone: '+34 600 112 233',
      position: 'Directora de Operaciones (COO)',
      department: 'Dirección',
      notes: 'Toma decisiones técnicas y presupuestarias.',
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      companyId: company2.id,
      firstName: 'Marcos',
      lastName: 'Vidal',
      email: 'marcos.vidal@logisticaiberica.com',
      phone: '+34 622 334 455',
      position: 'Jefe de Cadena de Suministro',
      department: 'Logística',
      notes: 'Muy interesado en la sincronización de inventario con UnoPIM.',
    },
  });

  const contact3 = await prisma.contact.create({
    data: {
      companyId: company3.id,
      firstName: 'Dra. Sofía',
      lastName: 'Herrera',
      email: 'sofia.herrera@biomedicaleurope.org',
      phone: '+34 655 778 899',
      position: 'Gerente Comercial',
      department: 'Ventas',
      isLead: true,
      notes: 'Lead recibido a través de la web.',
    },
  });

  // 6. Create Deal Stages
  const stage1 = await prisma.dealStage.create({
    data: { name: 'Prospección', order: 1, color: '#64748B', probability: 15 },
  });
  const stage2 = await prisma.dealStage.create({
    data: { name: 'Contacto Cualificado', order: 2, color: '#0EA5E9', probability: 35 },
  });
  const stage3 = await prisma.dealStage.create({
    data: { name: 'Propuesta / Presupuesto', order: 3, color: '#F59E0B', probability: 60 },
  });
  const stage4 = await prisma.dealStage.create({
    data: { name: 'Negociación Final', order: 4, color: '#8B5CF6', probability: 80 },
  });
  const stage5 = await prisma.dealStage.create({
    data: { name: 'Cerrada Ganada', order: 5, color: '#10B981', probability: 100 },
  });
  const stage6 = await prisma.dealStage.create({
    data: { name: 'Cerrada Perdida', order: 6, color: '#EF4444', probability: 0 },
  });

  // 7. Create Deals
  const deal1 = await prisma.deal.create({
    data: {
      title: 'Plataforma Cloud ERP + CRM',
      value: 18500.0,
      currency: 'EUR',
      stageId: stage4.id,
      contactId: contact1.id,
      companyId: company1.id,
      expectedCloseDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'OPEN',
      notes: 'Revisión final de cláusulas de SLA y soporte 24/7.',
    },
  });

  const deal2 = await prisma.deal.create({
    data: {
      title: 'Conector UnoPIM & Trazabilidad',
      value: 9400.0,
      currency: 'EUR',
      stageId: stage3.id,
      contactId: contact2.id,
      companyId: company2.id,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'OPEN',
      notes: 'Presupuesto emitido a la espera de aprobación del comité de compras.',
    },
  });

  const deal3 = await prisma.deal.create({
    data: {
      title: 'Módulo WhatsApp Omnicanal',
      value: 4200.0,
      currency: 'EUR',
      stageId: stage5.id,
      contactId: contact3.id,
      companyId: company3.id,
      expectedCloseDate: new Date(),
      status: 'WON',
      notes: 'Trato ganado. Se procede a crear el proyecto en el Agile Planner.',
    },
  });

  // 8. Create Agile Project, Sprint & Tasks
  const project1 = await prisma.project.create({
    data: {
      name: 'Implantación WhatsApp Omnicanal - Biomedical',
      description: 'Configuración de webhooks de WhatsApp Meta API y panel de atención en CRM',
      status: 'ACTIVE',
      priority: 'HIGH',
      dealId: deal3.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      budget: 4200.0,
    },
  });

  const sprint1 = await prisma.sprint.create({
    data: {
      projectId: project1.id,
      name: 'Sprint 1: Conexión API y Modelos',
      goal: 'Tener validado el token de webhook y la tabla de mensajes en BD',
      startDate: new Date(),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
    },
  });

  await prisma.task.create({
    data: {
      projectId: project1.id,
      sprintId: sprint1.id,
      title: 'Verificar Webhook Meta WhatsApp Cloud API',
      description: 'Implementar endpoint GET /api/webhooks/whatsapp con verificación de token',
      status: 'DONE',
      priority: 'HIGH',
      storyPoints: 3,
      estimatedHours: 6.0,
      loggedHours: 5.5,
      assigneeId: pmUser.id,
    },
  });

  await prisma.task.create({
    data: {
      projectId: project1.id,
      sprintId: sprint1.id,
      title: 'Desarrollar interfaz de Chat en tiempo real',
      description: 'Componente React con selector de canal WhatsApp/Email y timeline',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      storyPoints: 5,
      estimatedHours: 12.0,
      loggedHours: 4.0,
      assigneeId: adminUser.id,
    },
  });

  await prisma.task.create({
    data: {
      projectId: project1.id,
      sprintId: sprint1.id,
      title: 'Pruebas de envío de mensajes salientes',
      description: 'Verificar envío de plantilla y recepción de acuse de entrega',
      status: 'TODO',
      priority: 'MEDIUM',
      storyPoints: 2,
      estimatedHours: 4.0,
      loggedHours: 0.0,
      assigneeId: pmUser.id,
    },
  });

  // 9. Create Products (UnoPIM integration catalog)
  await prisma.product.create({
    data: {
      externalId: 'UNOPIM-SKU-001',
      sku: 'SRV-CLOUD-M',
      name: 'Instancia Cloud Gestionada M (Oracle Cloud)',
      description: 'Configuración en ARM 4 vCPU + 24GB RAM de infraestructura sin coste de licencia',
      price: 1500.0,
      costPrice: 200.0,
      stock: 99,
      category: 'Servicios Cloud',
      barcode: '8412345678901',
      isSync: true,
      lastSyncedAt: new Date(),
    },
  });

  await prisma.product.create({
    data: {
      externalId: 'UNOPIM-SKU-002',
      sku: 'MOD-OMNI-WA',
      name: 'Módulo Conector Omnicanal WhatsApp Meta API',
      description: 'Licencia perpetua de conector con webhooks entrantes y salientes',
      price: 2400.0,
      costPrice: 300.0,
      stock: 50,
      category: 'Módulos CRM',
      barcode: '8412345678902',
      isSync: true,
      lastSyncedAt: new Date(),
    },
  });

  await prisma.product.create({
    data: {
      externalId: 'UNOPIM-SKU-003',
      sku: 'SRV-SLA-247',
      name: 'Mantenimiento Preventivo Anual y SLA 99.9%',
      description: 'Monitorización 24/7 y copias de seguridad automatizadas en S3 / R2',
      price: 3600.0,
      costPrice: 600.0,
      stock: 100,
      category: 'Mantenimiento',
      barcode: '8412345678903',
      isSync: true,
      lastSyncedAt: new Date(),
    },
  });

  // 10. Create Billing: Quotes and Invoices
  const quote1 = await prisma.quote.create({
    data: {
      quoteNumber: 'PRE-2025-001',
      contactId: contact1.id,
      companyId: company1.id,
      issueDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'SENT',
      subtotal: 18500.0,
      taxRate: 21.0,
      taxAmount: 3885.0,
      total: 22385.0,
      currency: 'EUR',
      notes: 'Presupuesto válido por 30 días naturales. Incluye despliegue en servidor.',
      items: {
        create: [
          {
            description: 'Licencia Core DAMA-CRM y personalización corporativa',
            quantity: 1,
            unitPrice: 12500.0,
            amount: 12500.0,
          },
          {
            description: 'Módulo Facturación + Generador PDF + Portal B2B',
            quantity: 1,
            unitPrice: 6000.0,
            amount: 6000.0,
          },
        ],
      },
    },
  });

  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'FAC-2025-001',
      quoteId: quote1.id,
      contactId: contact3.id,
      companyId: company3.id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'PAID',
      subtotal: 4200.0,
      taxRate: 21.0,
      taxAmount: 882.0,
      total: 5082.0,
      currency: 'EUR',
      paidAt: new Date(),
      notes: 'Factura abonada mediante transferencia bancaria. Gracias por su confianza.',
      items: {
        create: [
          {
            description: 'Módulo WhatsApp Omnicanal + Instalación',
            quantity: 1,
            unitPrice: 4200.0,
            amount: 4200.0,
          },
        ],
      },
    },
  });

  // 11. Create Automated Workflows
  await prisma.workflow.create({
    data: {
      name: 'Bienvenida automática a nuevo contacto',
      description: 'Envía un email de bienvenida con catálogo de servicios cuando se crea un contacto',
      trigger: 'contact.created',
      action: 'send_email',
      actionConfig: JSON.stringify({
        template: 'welcome_lead',
        subject: 'Bienvenido a DAMA-CRM: Crecemos juntos',
      }),
      isActive: true,
      executionCount: 14,
      lastExecutedAt: new Date(),
    },
  });

  await prisma.workflow.create({
    data: {
      name: 'Crear Proyecto automático al Ganar Venta',
      description: 'Si un Deal pasa al estado Cerrada Ganada, crea el proyecto en Agile Planner',
      trigger: 'deal.won',
      action: 'create_project',
      actionConfig: JSON.stringify({
        defaultSprintDurationDays: 14,
        assignProjectManager: pmUser.id,
      }),
      isActive: true,
      executionCount: 3,
      lastExecutedAt: new Date(),
    },
  });

  // 12. Create Omnichannel Messages (WhatsApp & Email)
  await prisma.omniMessage.create({
    data: {
      contactId: contact3.id,
      channel: 'WHATSAPP',
      direction: 'INBOUND',
      sender: '+34 655 778 899',
      recipient: 'DAMA-CRM Soporte',
      content: '¡Hola! Queríamos confirmar si la factura FAC-2025-001 ya está disponible para descargar en el portal.',
      timestamp: new Date(Date.now() - 3600 * 1000 * 4),
      isRead: true,
    },
  });

  await prisma.omniMessage.create({
    data: {
      contactId: contact3.id,
      channel: 'WHATSAPP',
      direction: 'OUTBOUND',
      sender: 'DAMA-CRM Soporte',
      recipient: '+34 655 778 899',
      content: 'Hola Dra. Herrera, sí, ya está confirmada como PAGADA y puede descargarla directamente en PDF en su portal de cliente.',
      timestamp: new Date(Date.now() - 3600 * 1000 * 3),
      isRead: true,
    },
  });

  // 13. Create Custom Fields Definitions & Values
  const cfContactTier = await prisma.customField.create({
    data: {
      entityType: 'CONTACT',
      name: 'tier',
      label: 'Nivel de Prioridad (Tier)',
      fieldType: 'SELECT',
      optionsJson: JSON.stringify(['TIER_1_ENTERPRISE', 'TIER_2_MIDMARKET', 'STARTUP_PYME']),
    },
  });

  const cfLinkedin = await prisma.customField.create({
    data: {
      entityType: 'CONTACT',
      name: 'linkedin_url',
      label: 'Perfil LinkedIn',
      fieldType: 'TEXT',
    },
  });

  const cfCompetitor = await prisma.customField.create({
    data: {
      entityType: 'DEAL',
      name: 'competitor',
      label: 'Competidor Principal',
      fieldType: 'TEXT',
    },
  });

  const cfBudgetApproved = await prisma.customField.create({
    data: {
      entityType: 'DEAL',
      name: 'budget_approved',
      label: 'Presupuesto Aprobado por CFO',
      fieldType: 'BOOLEAN',
    },
  });

  // Assign values
  await prisma.customFieldValue.create({
    data: {
      customFieldId: cfContactTier.id,
      entityId: contact1.id,
      value: 'TIER_1_ENTERPRISE',
    },
  });

  await prisma.customFieldValue.create({
    data: {
      customFieldId: cfLinkedin.id,
      entityId: contact1.id,
      value: 'https://linkedin.com/in/elena-martinez-innovatech',
    },
  });

  await prisma.customFieldValue.create({
    data: {
      customFieldId: cfCompetitor.id,
      entityId: deal1.id,
      value: 'Salesforce / HubSpot',
    },
  });

  await prisma.customFieldValue.create({
    data: {
      customFieldId: cfBudgetApproved.id,
      entityId: deal1.id,
      value: 'true',
    },
  });

  // 14. Create Activities (Calls, Meetings, Notes, Tasks)
  await prisma.activity.create({
    data: {
      type: 'CALL',
      subject: 'Llamada de cualificación técnica con COO',
      description: 'Se revisaron requerimientos de hosting on-premise y compatibilidad con PostgreSQL 15.',
      scheduledAt: new Date(Date.now() - 24 * 3600 * 1000),
      durationMinutes: 30,
      outcome: 'COMPLETED',
      completedAt: new Date(Date.now() - 24 * 3600 * 1000 + 30 * 60 * 1000),
      contactId: contact1.id,
      dealId: deal1.id,
      userId: salesUser.id,
    },
  });

  await prisma.activity.create({
    data: {
      type: 'MEETING',
      subject: 'Demo en vivo de DAMA-CRM y despliegue Docker Traefik',
      description: 'Presentación ejecutiva al equipo directivo de Innovatech Solutions SL.',
      scheduledAt: new Date(Date.now() + 48 * 3600 * 1000),
      durationMinutes: 45,
      completedAt: null,
      contactId: contact1.id,
      dealId: deal1.id,
      userId: adminUser.id,
    },
  });

  await prisma.activity.create({
    data: {
      type: 'NOTE',
      subject: 'Acuerdo de pagos y sincronización UnoPIM',
      description: 'Cliente solicita sweep nocturno a las 03:00 AM para no saturar su servidor de repuestos.',
      scheduledAt: new Date(),
      outcome: 'COMPLETED',
      completedAt: new Date(),
      contactId: contact2.id,
      dealId: deal2.id,
      userId: salesUser.id,
    },
  });

  await prisma.activity.create({
    data: {
      type: 'TASK',
      subject: 'Preparar anexo técnico de SLA 99.9%',
      description: 'Redactar especificación de alta disponibilidad con failover local.',
      scheduledAt: new Date(Date.now() + 24 * 3600 * 1000),
      durationMinutes: 60,
      completedAt: null,
      contactId: contact3.id,
      dealId: deal3.id,
      userId: pmUser.id,
    },
  });

  // 15. Create Helpdesk Support Tickets with SLA & Messages
  const ticket1 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TCK-2026-0001',
      title: 'Incidencia con sincronización de inventario UnoPIM en tiempo real',
      description: 'Los productos actualizados en UnoPIM tardan más de 10 minutos en reflejarse en el catálogo del CRM.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      category: 'TECHNICAL',
      channel: 'PORTAL',
      contactId: contact1.id,
      companyId: company1.id,
      assignedToId: pmUser.id,
      slaDueAt: new Date(Date.now() + 6 * 3600 * 1000), // SLA 8h
      firstResponseAt: new Date(Date.now() - 30 * 60 * 1000),
      tenantId: 'master',
      messages: {
        create: [
          {
            senderType: 'CUSTOMER',
            senderName: 'Elena Martínez',
            message: 'Hola equipo, hemos detectado retrasos en el webhook de stock desde ayer.',
            isInternal: false,
          },
          {
            senderType: 'AGENT',
            senderId: pmUser.id,
            senderName: 'Carlos Gómez',
            message: 'Hola Elena, estamos revisando la cola de procesamiento en Redis. Procedemos con un flush y recarga.',
            isInternal: false,
          },
          {
            senderType: 'AGENT',
            senderId: adminUser.id,
            senderName: 'Ignacio Admin',
            message: 'Nota interna: El payload del webhook contenía 500 items en batch. Ajustar tamaño de chunk a 50.',
            isInternal: true, // Confidential internal note
          },
        ],
      },
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TCK-2026-0002',
      title: 'Solicitud de factura rectificativa con NIF intracomunitario (VIES)',
      description: 'El cliente solicita aplicar exención de IVA por operador intracomunitario en Alemania.',
      status: 'OPEN',
      priority: 'MEDIUM',
      category: 'BILLING',
      channel: 'EMAIL',
      contactId: contact2.id,
      companyId: company2.id,
      assignedToId: salesUser.id,
      slaDueAt: new Date(Date.now() + 20 * 3600 * 1000), // SLA 24h
      tenantId: 'master',
      messages: {
        create: [
          {
            senderType: 'CUSTOMER',
            senderName: 'Marc Weber',
            message: 'Please update our billing details to include our DE VAT number: DE987654321.',
            isInternal: false,
          },
        ],
      },
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TCK-2026-0003',
      title: 'Error 500 en endpoint de Webhook WhatsApp Meta Handshake',
      description: 'El token de verificación retornado no coincidía con el hash esperado.',
      status: 'RESOLVED',
      priority: 'URGENT',
      category: 'TECHNICAL',
      channel: 'WHATSAPP',
      contactId: contact1.id,
      companyId: company1.id,
      assignedToId: adminUser.id,
      slaDueAt: new Date(Date.now() - 2 * 3600 * 1000),
      firstResponseAt: new Date(Date.now() - 4 * 3600 * 1000),
      resolvedAt: new Date(),
      tenantId: 'master',
      messages: {
        create: [
          {
            senderType: 'AGENT',
            senderId: adminUser.id,
            senderName: 'Ignacio Admin',
            message: 'Verificación corregida en auth.middleware con timingSafeEqual.',
            isInternal: false,
          },
        ],
      },
    },
  });

  // 16. Create Expenses (PYME Suite P&L & Tax Books)
  await prisma.expense.create({
    data: {
      expenseNumber: 'EXP-2026-0001',
      supplierName: 'Hetzner Cloud GmbH',
      supplierTaxId: 'DE814670600',
      category: 'SOFTWARE',
      issueDate: new Date(Date.now() - 15 * 24 * 3600 * 1000),
      dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000),
      subtotal: 450.0,
      taxRate: 21.0,
      taxAmount: 94.5,
      total: 544.5,
      status: 'PAID',
      paymentMethod: 'CREDIT_CARD',
      notes: 'Servidores dedicados de staging y clúster PostgreSQL 15',
      tenantId: 'master',
    },
  });

  await prisma.expense.create({
    data: {
      expenseNumber: 'EXP-2026-0002',
      supplierName: 'Twilio Ireland Ltd',
      supplierTaxId: 'IE3382756H',
      category: 'OPERATIONAL',
      issueDate: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      dueDate: new Date(Date.now() + 25 * 24 * 3600 * 1000),
      subtotal: 180.0,
      taxRate: 21.0,
      taxAmount: 37.8,
      total: 217.8,
      status: 'PAID',
      paymentMethod: 'CREDIT_CARD',
      notes: 'Consumo WhatsApp Business API & SMS OTP',
      tenantId: 'master',
    },
  });

  await prisma.expense.create({
    data: {
      expenseNumber: 'EXP-2026-0003',
      supplierName: 'Asesoría Fiscal Brenas & Asociados SL',
      supplierTaxId: 'B-12398745',
      category: 'LEGAL',
      issueDate: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      dueDate: new Date(Date.now() + 28 * 24 * 3600 * 1000),
      subtotal: 350.0,
      taxRate: 21.0,
      taxAmount: 73.5,
      total: 423.5,
      status: 'PENDING',
      paymentMethod: 'BANK_TRANSFER',
      notes: 'Presentación trimestral Modelo 303 de IVA y asesoramiento RGPD',
      tenantId: 'master',
    },
  });

  // 12. Seed HR Employees, Payrolls & Time Records
  const godUser = await prisma.user.findUnique({ where: { email: 'ignaciobrenas@gmail.com' } });
  const salesEmpUser = await prisma.user.findUnique({ where: { email: 'ventas@dama-crm.local' } });

  const emp1 = await prisma.employee.create({
    data: {
      userId: godUser?.id,
      firstName: 'Ignacio',
      lastName: 'Brenas',
      email: 'ignaciobrenas@gmail.com',
      phone: '+34 600 000 001',
      jobTitle: 'Director General & CTO',
      department: 'ENGINEERING',
      contractType: 'INDEFINIDO',
      baseSalary: 4500.0,
      iban: 'ES91 2100 0418 4502 0005 1332',
      status: 'ACTIVE',
      odooEmployeeId: 101,
      tenantId: 'master',
    },
  });

  const emp2 = await prisma.employee.create({
    data: {
      userId: salesEmpUser?.id,
      firstName: 'Lucía',
      lastName: 'García',
      email: 'ventas@dama-crm.local',
      phone: '+34 600 000 002',
      jobTitle: 'Ejecutiva de Cuentas Senior',
      department: 'SALES',
      contractType: 'INDEFINIDO',
      baseSalary: 2800.0,
      iban: 'ES76 0049 1500 0512 3456 7890',
      status: 'ACTIVE',
      odooEmployeeId: 102,
      tenantId: 'master',
    },
  });

  // Seed Payrolls
  await prisma.payroll.create({
    data: {
      employeeId: emp1.id,
      month: 8,
      year: 2026,
      baseSalary: 4500.0,
      bonuses: 500.0,
      deductions: 950.0,
      netSalary: 4050.0,
      status: 'PAID',
      paidAt: new Date('2026-08-30'),
      notes: 'Nómina Agosto 2026 abonada por transferencia',
      tenantId: 'master',
    },
  });

  await prisma.payroll.create({
    data: {
      employeeId: emp2.id,
      month: 8,
      year: 2026,
      baseSalary: 2800.0,
      bonuses: 350.0,
      deductions: 580.0,
      netSalary: 2570.0,
      status: 'PAID',
      paidAt: new Date('2026-08-30'),
      notes: 'Nómina Agosto 2026 con incentivo por ventas',
      tenantId: 'master',
    },
  });

  // Seed Time Records
  await prisma.timeRecord.create({
    data: {
      employeeId: emp1.id,
      userId: godUser?.id,
      clockIn: new Date(Date.now() - 4 * 3600 * 1000),
      clockOut: new Date(Date.now() - 30 * 60 * 1000),
      durationMinutes: 210,
      type: 'WORK',
      reason: 'Oficina Central',
      status: 'VALID',
      tenantId: 'master',
    },
  });

  await prisma.timeRecord.create({
    data: {
      employeeId: emp2.id,
      userId: salesEmpUser?.id,
      clockIn: new Date(Date.now() - 2 * 3600 * 1000),
      clockOut: null,
      type: 'REMOTE',
      reason: 'Teletrabajo',
      status: 'VALID',
      tenantId: 'master',
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('---------------------------------------------------------');
  console.log('🔑 Credenciales de Acceso:');
  console.log('   Admin:   ignaciobrenas@gmail.com / 1');
  console.log('   Admin:   admin@dama-crm.local / Admin1234!');
  console.log('   Ventas:  ventas@dama-crm.local / Ventas1234!');
  console.log('   PM:      pm@dama-crm.local / Pm1234!');
  console.log('---------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error in seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
