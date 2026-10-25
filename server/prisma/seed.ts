import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 [ENTERPRISE SEED] Starting massive DAMA-CRM database generation...');

  // 1. Delete in reverse dependency order
  console.log('🧹 Purging existing database records...');
  await prisma.shipmentCheckpoint.deleteMany().catch(() => {});
  await prisma.shipment.deleteMany().catch(() => {});
  await prisma.appointment.deleteMany().catch(() => {});
  await prisma.appointmentService.deleteMany().catch(() => {});
  await prisma.internalChatMessage.deleteMany().catch(() => {});
  await prisma.internalChatChannel.deleteMany().catch(() => {});
  await prisma.taskWorkLog.deleteMany().catch(() => {});
  await prisma.stockMovement.deleteMany().catch(() => {});
  await prisma.stockBatch.deleteMany().catch(() => {});
  await prisma.stockTransferItem.deleteMany().catch(() => {});
  await prisma.stockTransfer.deleteMany().catch(() => {});
  await prisma.warehouseStock.deleteMany().catch(() => {});
  await prisma.warehouse.deleteMany().catch(() => {});
  await prisma.calendarReminder.deleteMany().catch(() => {});
  await prisma.calendarEvent.deleteMany().catch(() => {});
  await prisma.timeRecord.deleteMany().catch(() => {});
  await prisma.payroll.deleteMany().catch(() => {});
  await prisma.employee.deleteMany().catch(() => {});
  await prisma.notification.deleteMany().catch(() => {});
  await prisma.ticketMessage.deleteMany().catch(() => {});
  await prisma.ticket.deleteMany().catch(() => {});
  await prisma.expenseReceipt.deleteMany().catch(() => {});
  await prisma.expense.deleteMany().catch(() => {});
  await prisma.customFieldValue.deleteMany().catch(() => {});
  await prisma.customField.deleteMany().catch(() => {});
  await prisma.activity.deleteMany().catch(() => {});
  await prisma.auditLog.deleteMany().catch(() => {});
  await prisma.twoFactorToken.deleteMany().catch(() => {});
  await prisma.omniMessage.deleteMany().catch(() => {});
  await prisma.workflowLog.deleteMany().catch(() => {});
  await prisma.workflow.deleteMany().catch(() => {});
  await prisma.invoiceItem.deleteMany().catch(() => {});
  await prisma.invoice.deleteMany().catch(() => {});
  await prisma.quote.deleteMany().catch(() => {});
  await prisma.product.deleteMany().catch(() => {});
  await prisma.taskComment.deleteMany().catch(() => {});
  await prisma.task.deleteMany().catch(() => {});
  await prisma.sprint.deleteMany().catch(() => {});
  await prisma.project.deleteMany().catch(() => {});
  await prisma.deal.deleteMany().catch(() => {});
  await prisma.dealStage.deleteMany().catch(() => {});
  await prisma.contact.deleteMany().catch(() => {});
  await prisma.company.deleteMany().catch(() => {});
  await prisma.permission.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});
  await prisma.role.deleteMany().catch(() => {});
  await prisma.tenant.deleteMany().catch(() => {});

  console.log('🏢 Creating Tenants...');
  const masterTenant = await prisma.tenant.create({
    data: {
      slug: 'master',
      name: 'DAMA Cloud Solutions (Empresa Principal)',
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
      maxUsers: 50,
      branding: JSON.stringify({ primaryColor: '#059669', companyName: 'ACME Corp' }),
    },
  });

  const innovatechTenant = await prisma.tenant.create({
    data: {
      slug: 'innovatech',
      name: 'InnovaTech Solutions SL',
      domain: 'innovatech.damacrm.com',
      isGodTenant: false,
      status: 'ACTIVE',
      plan: 'ENTERPRISE',
      maxUsers: 100,
      branding: JSON.stringify({ primaryColor: '#7C3AED', companyName: 'InnovaTech SL' }),
    },
  });

  const ignacioCorpTenant = await prisma.tenant.create({
    data: {
      slug: 'ignacio-corp',
      name: 'Ignacio Corp',
      domain: 'ignaciocorp.damacrm.com',
      isGodTenant: false,
      status: 'ACTIVE',
      plan: 'ENTERPRISE',
      maxUsers: 100,
      branding: JSON.stringify({ primaryColor: '#1E40AF', companyName: 'Ignacio Corp Global' }),
      settings: JSON.stringify({
        activeModules: ['deals', 'invoicing', 'inventory', 'omnichannel', 'workflows', 'tickets', 'expenses', 'employees', 'calendar', 'logistics', 'appointments'],
      }),
    },
  });

  console.log('🛡️ Creating Roles & Permission Matrices...');
  const adminRole = await prisma.role.create({
    data: { name: 'ADMIN', description: 'Acceso total y configuración del sistema', isSystem: true },
  });
  const salesRole = await prisma.role.create({
    data: { name: 'SALES', description: 'Gestión comercial, pipeline de ventas y contactos', isSystem: false },
  });
  const techRole = await prisma.role.create({
    data: { name: 'TECH', description: 'Desarrollo, proyectos técnicos, tareas y arquitectura', isSystem: false },
  });
  const supportRole = await prisma.role.create({
    data: { name: 'SUPPORT', description: 'Atención al cliente, tickets de helpdesk y chat omnicanal', isSystem: false },
  });
  const hrRole = await prisma.role.create({
    data: { name: 'HR', description: 'Recursos Humanos, nóminas y control horario del empleado', isSystem: false },
  });
  const pmRole = await prisma.role.create({
    data: { name: 'PROJECT_MANAGER', description: 'Planificador ágil, proyectos, sprints y tareas', isSystem: false },
  });
  const employeeRole = await prisma.role.create({
    data: { name: 'EMPLOYEE', description: 'Portal del empleado, fichaje laboral y tareas asignadas', isSystem: false },
  });
  const viewerRole = await prisma.role.create({
    data: { name: 'VIEWER', description: 'Acceso de solo lectura a métricas e informes corporativos', isSystem: false },
  });
  const clientRole = await prisma.role.create({
    data: { name: 'CLIENT', description: 'Portal autoservicio B2B para presupuestos y facturas', isSystem: true },
  });

  const resources = [
    'users', 'companies', 'contacts', 'deals', 'projects', 'tasks',
    'invoices', 'quotes', 'inventory', 'workflows', 'omnichannel',
    'reports', 'tickets', 'expenses', 'employees', 'calendar', 'logistics', 'appointments'
  ];
  const actions = ['create', 'read', 'update', 'delete', 'manage'];

  for (const res of resources) {
    for (const act of actions) {
      await prisma.permission.create({
        data: { roleId: adminRole.id, resource: res, action: act },
      });
    }
  }

  // Sales permissions
  for (const res of ['companies', 'contacts', 'deals', 'quotes', 'invoices', 'omnichannel', 'inventory', 'calendar', 'appointments']) {
    for (const act of ['create', 'read', 'update']) {
      await prisma.permission.create({ data: { roleId: salesRole.id, resource: res, action: act } });
    }
  }
  for (const res of ['projects', 'tasks', 'reports']) {
    await prisma.permission.create({ data: { roleId: salesRole.id, resource: res, action: 'read' } });
  }

  // Tech permissions
  for (const res of ['projects', 'tasks', 'inventory', 'calendar', 'logistics']) {
    for (const act of ['create', 'read', 'update']) {
      await prisma.permission.create({ data: { roleId: techRole.id, resource: res, action: act } });
    }
  }
  await prisma.permission.create({ data: { roleId: techRole.id, resource: 'tickets', action: 'read' } });
  await prisma.permission.create({ data: { roleId: techRole.id, resource: 'tickets', action: 'update' } });

  // Support permissions
  for (const res of ['tickets', 'omnichannel', 'contacts', 'companies', 'calendar', 'appointments']) {
    for (const act of ['create', 'read', 'update']) {
      await prisma.permission.create({ data: { roleId: supportRole.id, resource: res, action: act } });
    }
  }

  // HR permissions
  for (const res of ['employees', 'users', 'calendar']) {
    for (const act of ['create', 'read', 'update']) {
      await prisma.permission.create({ data: { roleId: hrRole.id, resource: res, action: act } });
    }
  }

  // PM permissions
  for (const res of ['projects', 'tasks', 'companies', 'contacts', 'deals', 'calendar', 'reports']) {
    for (const act of ['create', 'read', 'update']) {
      await prisma.permission.create({ data: { roleId: pmRole.id, resource: res, action: act } });
    }
  }

  // Employee & Viewer permissions
  for (const act of ['read', 'update']) {
    await prisma.permission.create({ data: { roleId: employeeRole.id, resource: 'tasks', action: act } });
    await prisma.permission.create({ data: { roleId: employeeRole.id, resource: 'calendar', action: act } });
  }
  for (const res of ['companies', 'contacts', 'deals', 'projects', 'invoices', 'inventory', 'reports']) {
    await prisma.permission.create({ data: { roleId: viewerRole.id, resource: res, action: 'read' } });
  }
  for (const res of ['quotes', 'invoices', 'tickets']) {
    await prisma.permission.create({ data: { roleId: clientRole.id, resource: res, action: 'read' } });
  }

  console.log('👥 Creating Corporate Users...');
  const defaultPasswordHash = await bcrypt.hash('Dama2026!', 10);
  const passwordHashIgnacio = await bcrypt.hash('1', 10);
  const passwordHashAdmin = await bcrypt.hash('Admin1234!', 10);

  const ignacioUser = await prisma.user.create({
    data: {
      email: 'ignaciobrenas@gmail.com',
      passwordHash: passwordHashIgnacio,
      name: 'Ignacio Breñas',
      roleId: adminRole.id,
      tenantId: 'master',
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
      tenantId: 'master',
      twoFactorEnabled: false,
      isActive: true,
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      email: 'ventas@dama-crm.local',
      passwordHash: defaultPasswordHash,
      name: 'Laura Gómez (Comercial)',
      roleId: salesRole.id,
      tenantId: 'master',
      isActive: true,
    },
  });

  const pmUser = await prisma.user.create({
    data: {
      email: 'pm@dama-crm.local',
      passwordHash: defaultPasswordHash,
      name: 'Carlos Ruiz (Project Manager)',
      roleId: pmRole.id,
      tenantId: 'master',
      isActive: true,
    },
  });

  const techUser = await prisma.user.create({
    data: {
      email: 'tech@dama-crm.local',
      passwordHash: defaultPasswordHash,
      name: 'Alejandro Morales (Lead Architect)',
      roleId: techRole.id,
      tenantId: 'master',
      isActive: true,
    },
  });

  const supportUser = await prisma.user.create({
    data: {
      email: 'soporte@dama-crm.local',
      passwordHash: defaultPasswordHash,
      name: 'Beatriz Navarro (Helpdesk Lead)',
      roleId: supportRole.id,
      tenantId: 'master',
      isActive: true,
    },
  });

  const hrUser = await prisma.user.create({
    data: {
      email: 'rrhh@dama-crm.local',
      passwordHash: defaultPasswordHash,
      name: 'Marta Delgado (People & Culture)',
      roleId: hrRole.id,
      tenantId: 'master',
      isActive: true,
    },
  });

  // Ignacio Corp users
  const ignacioCorpUsersData = [
    { name: 'Ignacio Director', email: 'admin@ignaciocorp.com', roleId: adminRole.id },
    { name: 'Elena Ventas', email: 'sales@ignaciocorp.com', roleId: salesRole.id },
    { name: 'David Desarrollador', email: 'tech@ignaciocorp.com', roleId: techRole.id },
    { name: 'Sara Soporte', email: 'support@ignaciocorp.com', roleId: supportRole.id },
    { name: 'Marta Recursos Humanos', email: 'hr@ignaciocorp.com', roleId: hrRole.id },
    { name: 'Pablo Empleado', email: 'employee@ignaciocorp.com', roleId: employeeRole.id },
    { name: 'Valeria Auditora', email: 'viewer@ignaciocorp.com', roleId: viewerRole.id },
  ];

  for (const u of ignacioCorpUsersData) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash: defaultPasswordHash,
        name: u.name,
        roleId: u.roleId,
        tenantId: 'ignacio-corp',
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        details: JSON.stringify({ email: u.email, authMethod: 'PASSWORD', browser: 'Chrome Enterprise 124' }),
        ipAddress: '192.168.1.105',
        tenantId: 'ignacio-corp',
        createdAt: new Date(Date.now() - 3600000 * 4),
      },
    });
  }

  console.log('🏭 Creating 32 Enterprise Companies...');
  const companiesData = [
    { name: 'Innovatech Solutions SL', industry: 'Tecnología & Software Cloud', website: 'https://innovatech.es', phone: '+34 912 345 678', email: 'contacto@innovatech.es', address: 'Paseo de la Castellana 140', city: 'Madrid', country: 'España', taxId: 'B87654323', annualRevenue: 1850000.0, employeesCount: 45, notes: 'Cliente estratégico clave para arquitectura multitenant y SLA 99.9%.' },
    { name: 'Logística Ibérica SA', industry: 'Transporte y Distribución', website: 'https://logisticaiberica.com', phone: '+34 934 567 890', email: 'ops@logisticaiberica.com', address: 'Polígono Industrial Zona Franca', city: 'Barcelona', country: 'España', taxId: 'A12345674', annualRevenue: 6200000.0, employeesCount: 140, notes: 'Flota de 85 vehículos, sincronización con UnoPIM y trazabilidad FEFO.' },
    { name: 'Biomedical Europa', industry: 'Salud y Farmacia', website: 'https://biomedicaleurope.org', phone: '+34 961 234 567', email: 'info@biomedicaleurope.org', address: 'Avenida Blasco Ibáñez 28', city: 'Valencia', country: 'España', taxId: 'B99887762', annualRevenue: 1200000.0, employeesCount: 30, notes: 'Módulo WhatsApp omnicanal y gestión de citas médicas con confirmación SMS.' },
    { name: 'CloudMatrix Iberia SL', industry: 'Infraestructura & Cloud', website: 'https://cloudmatrix.es', phone: '+34 932 110 099', email: 'cloud@cloudmatrix.es', address: 'Diagonal 450', city: 'Barcelona', country: 'España', taxId: 'B89201944', annualRevenue: 3400000.0, employeesCount: 65, notes: 'Despliegues en Oracle OCI y kubernetes multizona.' },
    { name: 'CyberShield Defense Europe', industry: 'Ciberseguridad & SOC', website: 'https://cybershield.eu', phone: '+34 944 800 123', email: 'security@cybershield.eu', address: 'Gran Vía 12', city: 'Bilbao', country: 'España', taxId: 'B92817402', annualRevenue: 4100000.0, employeesCount: 52, notes: 'Auditorías ISO 27001, integración SIEM y tokens 2FA WebAuthn.' },
    { name: 'DataSphere Analytics', industry: 'Big Data & IA', website: 'https://datasphere.io', phone: '+34 963 998 877', email: 'hello@datasphere.io', address: 'Calle Colón 18', city: 'Valencia', country: 'España', taxId: 'B81948201', annualRevenue: 2300000.0, employeesCount: 38, notes: 'Modelos predictivos de ventas y scoring de oportunidades en CRM.' },
    { name: 'NeuroAI Systems SL', industry: 'Inteligencia Artificial', website: 'https://neuroai.tech', phone: '+34 951 223 344', email: 'contact@neuroai.tech', address: 'Parque Tecnológico de Andalucía', city: 'Málaga', country: 'España', taxId: 'B83726194', annualRevenue: 1600000.0, employeesCount: 25, notes: 'Automatización de soporte con agentes LLM y transcripción de audios.' },
    { name: 'NexoDigital Consultores', industry: 'Consultoría Digital', website: 'https://nexodigital.es', phone: '+34 954 667 788', email: 'info@nexodigital.es', address: 'Isla de la Cartuja', city: 'Sevilla', country: 'España', taxId: 'B82910482', annualRevenue: 980000.0, employeesCount: 18, notes: 'Especialistas en digitalización para PYMES del sur de España.' },
    { name: 'TransEurope Express SL', industry: 'Transporte Internacional', website: 'https://transeurope.es', phone: '+34 976 445 566', email: 'trafico@transeurope.es', address: 'Plaza Logística PLAZA Nave 4', city: 'Zaragoza', country: 'España', taxId: 'B28374921', annualRevenue: 7500000.0, employeesCount: 180, notes: 'Rutas regulares España-Alemania con seguimiento de envíos en tiempo real.' },
    { name: 'Global Freight Forwarders SA', industry: 'Aduanas y Flete Marítimo', website: 'https://globalfreight.com', phone: '+34 961 889 900', email: 'customs@globalfreight.com', address: 'Muelle de la Aduana s/n', city: 'Valencia', country: 'España', taxId: 'A38291048', annualRevenue: 12000000.0, employeesCount: 210, notes: 'Operador económico autorizado (OEA) y control de contenedores.' },
    { name: 'Distribución Urgente Marítima', industry: 'Logística Portuaria', website: 'https://dumlogistica.gal', phone: '+34 986 223 311', email: 'info@dumlogistica.gal', address: 'Puerto de Vigo, Muelle de Transatlánticos', city: 'Vigo', country: 'España', taxId: 'B39201847', annualRevenue: 2800000.0, employeesCount: 42, notes: 'Cadena de frío para productos congelados con alertas IoT.' },
    { name: 'Laboratorios Farmacéuticos Cantabria', industry: 'Industria Farmacéutica', website: 'https://farmacantabria.com', phone: '+34 942 334 455', email: 'calidad@farmacantabria.com', address: 'Polígono de Candina 3', city: 'Santander', country: 'España', taxId: 'A28491029', annualRevenue: 8900000.0, employeesCount: 160, notes: 'Cumplimiento GMP y trazabilidad de lotes FEFO con auditoría estricta.' },
    { name: 'MedTech Devices Iberia', industry: 'Dispositivos Médicos', website: 'https://medtechiberia.es', phone: '+34 918 776 655', email: 'info@medtechiberia.es', address: 'Calle Alcalá 200', city: 'Madrid', country: 'España', taxId: 'B84729104', annualRevenue: 3100000.0, employeesCount: 40, notes: 'Suministro a hospitales públicos mediante licitaciones.' },
    { name: 'Clínica Dermatológica Élite', industry: 'Medicina Estética & Belleza', website: 'https://dermaelite.es', phone: '+34 933 445 566', email: 'citas@dermaelite.es', address: 'Paseo de Gracia 88', city: 'Barcelona', country: 'España', taxId: 'B91827401', annualRevenue: 1450000.0, employeesCount: 22, notes: 'Reserva online de tratamientos, cobro con Bizum y TPV físico.' },
    { name: 'Vitalis Salud Integral SL', industry: 'Centros Médicos Multidisciplinares', website: 'https://vitalissalud.com', phone: '+34 955 112 233', email: 'gestion@vitalissalud.com', address: 'Avenida República Argentina 14', city: 'Sevilla', country: 'España', taxId: 'B82710492', annualRevenue: 1950000.0, employeesCount: 35, notes: 'Gestión de agenda médica y consentimientos informados firmados digitalmente.' },
    { name: 'Iberdrola Renovables Partner', industry: 'Energías Renovables', website: 'https://renovablespartner.com', phone: '+34 944 112 233', email: 'proyectos@renovablespartner.com', address: 'Torre Iberdrola, Plaza Euskadi 5', city: 'Bilbao', country: 'España', taxId: 'A28192049', annualRevenue: 24000000.0, employeesCount: 320, notes: 'Proyectos llave en mano de parques eólicos y plantas fotovoltaicas.' },
    { name: 'HelioSolar Fotovoltaica SL', industry: 'Energía Solar Comercial', website: 'https://heliosolar.es', phone: '+34 954 887 766', email: 'ventas@heliosolar.es', address: 'Avenida Kansas City 30', city: 'Sevilla', country: 'España', taxId: 'B92810482', annualRevenue: 4300000.0, employeesCount: 58, notes: 'Instalaciones de autoconsumo industrial y gestión de subvenciones NextGen.' },
    { name: 'EcoWind Generación SA', industry: 'Energía Eólica', website: 'https://ecowind.es', phone: '+34 976 112 244', email: 'mantenimiento@ecowind.es', address: 'Paseo Independencia 10', city: 'Zaragoza', country: 'España', taxId: 'A82910483', annualRevenue: 9800000.0, employeesCount: 95, notes: 'Mantenimiento predictivo de aerogeneradores con sensores SCADA.' },
    { name: 'GreenHydrogen Technologies', industry: 'Hidrógeno Verde & Movilidad', website: 'https://greenh2tech.com', phone: '+34 911 223 344', email: 'rd@greenh2tech.com', address: 'Calle Serrano 90', city: 'Madrid', country: 'España', taxId: 'B84729105', annualRevenue: 2800000.0, employeesCount: 32, notes: 'I+D en electrólisis alcalina con financiación europea Horizonte Europa.' },
    { name: 'Moda & Confección Ibérica SA', industry: 'Textil & Moda', website: 'https://modaconfeccion.es', phone: '+34 981 112 233', email: 'pedidos@modaconfeccion.es', address: 'Polígono de Sabón', city: 'Arteixo', country: 'España', taxId: 'A15928472', annualRevenue: 15400000.0, employeesCount: 280, notes: 'Integración e-commerce Shopify, WooCommerce y control de stocks de tiendas.' },
    { name: 'Gourmet Mediterráneo Delicatessen', industry: 'Alimentación Gourmet & Vinos', website: 'https://gourmetmediterraneo.es', phone: '+34 963 445 566', email: 'pedidos@gourmetmediterraneo.es', address: 'Plaza del Mercado 12', city: 'Valencia', country: 'España', taxId: 'B93820194', annualRevenue: 2100000.0, employeesCount: 26, notes: 'Exportación de vinos y aceites virgen extra con facturación electrónica.' },
    { name: 'Cosméceutica Avanzada SL', industry: 'Cosmética Profesional', website: 'https://cosmeceutica.es', phone: '+34 934 887 799', email: 'lab@cosmeceutica.es', address: 'Calle Aribau 120', city: 'Barcelona', country: 'España', taxId: 'B84920184', annualRevenue: 3200000.0, employeesCount: 44, notes: 'Línea de productos dermatológicos con lotes regulados por AEMPS.' },
    { name: 'TechRetail Electronic Stores', industry: 'Retail Electrónica & Informática', website: 'https://techretail.es', phone: '+34 917 889 900', email: 'b2b@techretail.es', address: 'Calle Orense 34', city: 'Madrid', country: 'España', taxId: 'A82910489', annualRevenue: 18900000.0, employeesCount: 310, notes: 'Cadena de 14 tiendas físicas y venta online omnichannel.' },
    { name: 'Metrópoli Desarrollos Inmobiliarios SA', industry: 'Promoción Inmobiliaria', website: 'https://metropoliinmo.es', phone: '+34 914 556 677', email: 'comercial@metropoliinmo.es', address: 'Paseo de la Habana 24', city: 'Madrid', country: 'España', taxId: 'A81928472', annualRevenue: 32000000.0, employeesCount: 110, notes: 'Venta sobre plano con firma de contratos digitales y pasarela de pagos.' },
    { name: 'Constructora Euskal Herria SL', industry: 'Construcción y Obra Civil', website: 'https://construccioneh.eus', phone: '+34 943 223 344', email: 'obras@construccioneh.eus', address: 'Avenida de la Libertad 18', city: 'Donostia-San Sebastián', country: 'España', taxId: 'B48291048', annualRevenue: 14200000.0, employeesCount: 130, notes: 'Seguimiento de costes por obra, subcontratas y albaranes de entrega.' },
    { name: 'Urbanis Proyectos Civiles', industry: 'Ingeniería y Urbanismo', website: 'https://urbanisciviles.com', phone: '+34 954 112 255', email: 'proyectos@urbanisciviles.com', address: 'Avenida de la Palmera 45', city: 'Sevilla', country: 'España', taxId: 'B91829402', annualRevenue: 4800000.0, employeesCount: 50, notes: 'Licitaciones públicas con la Junta de Andalucía y ayuntamientos.' },
    { name: 'FinTech Capital Iberia SL', industry: 'FinTech & Pasarelas de Pago', website: 'https://fintechcapital.es', phone: '+34 912 889 911', email: 'info@fintechcapital.es', address: 'Calle Velázquez 50', city: 'Madrid', country: 'España', taxId: 'B85920184', annualRevenue: 6400000.0, employeesCount: 48, notes: 'Adquirencia, Bizum B2B, PSD2 y verificación antifraude.' },
    { name: 'Asesoría Fiscal Brenas & Asociados SL', industry: 'Servicios Fiscales & Legales', website: 'https://asesoriabrenas.es', phone: '+34 915 223 344', email: 'fiscal@asesoriabrenas.es', address: 'Calle Alcalá 42', city: 'Madrid', country: 'España', taxId: 'B12398745', annualRevenue: 1850000.0, employeesCount: 24, notes: 'Despacho auditor oficial para adaptación de clientes a Veri*Factu.' },
    { name: 'EuroAudit Risk Consulting', industry: 'Auditoría & Compliance', website: 'https://euroaudit.es', phone: '+34 932 998 811', email: 'audit@euroaudit.es', address: 'Avenida Diagonal 600', city: 'Barcelona', country: 'España', taxId: 'B82910488', annualRevenue: 3700000.0, employeesCount: 42, notes: 'Auditorías de cuentas anuales, informes periciales y prevención de blanqueo.' },
    { name: 'LexGlobal Abogados & Compliance', industry: 'Abogacía Corporativa', website: 'https://lexglobal.es', phone: '+34 913 445 577', email: 'despacho@lexglobal.es', address: 'Calle Goya 15', city: 'Madrid', country: 'España', taxId: 'B81920485', annualRevenue: 2900000.0, employeesCount: 30, notes: 'Contratos mercantiles internacionales, RGPD y derecho societario.' },
    { name: 'Fibra Óptica Peninsular SA', industry: 'Telecomunicaciones & Redes', website: 'https://fibrapeninsular.es', phone: '+34 960 112 244', email: 'corporativo@fibrapeninsular.es', address: 'Avenida del Puerto 150', city: 'Valencia', country: 'España', taxId: 'A83920194', annualRevenue: 28500000.0, employeesCount: 340, notes: 'Operador neutro de fibra FTTH con despliegue en polígonos industriales.' },
    { name: 'Medios Audiovisuales 360 SL', industry: 'Producción Audiovisual & Streaming', website: 'https://medios360.es', phone: '+34 917 112 288', email: 'contacto@medios360.es', address: 'Ciudad de la Imagen', city: 'Pozuelo de Alarcón', country: 'España', taxId: 'B82910487', annualRevenue: 2200000.0, employeesCount: 36, notes: 'Retransmisión de eventos corporativos híbridos y platós virtuales.' }
  ];

  const createdCompanies: any[] = [];
  for (const c of companiesData) {
    const comp = await prisma.company.create({ data: c });
    createdCompanies.push(comp);
  }

  console.log('👤 Creating 64 Corporate Contacts...');
  const contactsData = [
    { firstName: 'Elena', lastName: 'Martínez', email: 'elena.martinez@innovatech.es', phone: '+34 600 112 233', position: 'Directora de Operaciones (COO)', department: 'Dirección General' },
    { firstName: 'Rodrigo', lastName: 'Cifuentes', email: 'rodrigo.c@innovatech.es', phone: '+34 600 112 234', position: 'Director de Tecnología (CTO)', department: 'Ingeniería' },
    { firstName: 'Marcos', lastName: 'Vidal', email: 'marcos.vidal@logisticaiberica.com', phone: '+34 622 334 455', position: 'Jefe de Cadena de Suministro', department: 'Logística' },
    { firstName: 'Patricia', lastName: 'Roca', email: 'patricia.roca@logisticaiberica.com', phone: '+34 622 334 456', position: 'Directora de Flota y Rutas', department: 'Operaciones' },
    { firstName: 'Dra. Sofía', lastName: 'Herrera', email: 'sofia.herrera@biomedicaleurope.org', phone: '+34 655 778 899', position: 'Directora Médica & I+D', department: 'Dirección Médica' },
    { firstName: 'Javier', lastName: 'Sánchez', email: 'javier.s@biomedicaleurope.org', phone: '+34 655 778 890', position: 'Responsable de Farmacovigilancia', department: 'Calidad' },
    { firstName: 'Marc', lastName: 'Vila', email: 'm.vila@cloudmatrix.es', phone: '+34 611 223 344', position: 'VP of Cloud Infrastructure', department: 'DevOps' },
    { firstName: 'Laura', lastName: 'Casas', email: 'l.casas@cloudmatrix.es', phone: '+34 611 223 345', position: 'Directora de Compras TI', department: 'Finanzas' },
    { firstName: 'Iñigo', lastName: 'Zabala', email: 'i.zabala@cybershield.eu', phone: '+34 633 445 566', position: 'Chief Information Security Officer (CISO)', department: 'Seguridad' },
    { firstName: 'Ainara', lastName: 'Goikoetxea', email: 'a.goiko@cybershield.eu', phone: '+34 633 445 567', position: 'Lead Incident Responder', department: 'SOC' },
    { firstName: 'Carmen', lastName: 'Soriano', email: 'c.soriano@datasphere.io', phone: '+34 644 556 677', position: 'Chief Data Officer', department: 'Data Science' },
    { firstName: 'Vicent', lastName: 'Fornés', email: 'v.fornes@datasphere.io', phone: '+34 644 556 678', position: 'Senior ML Engineer', department: 'Data Science' },
    { firstName: 'Alfonso', lastName: 'Peralta', email: 'a.peralta@neuroai.tech', phone: '+34 655 667 788', position: 'Head of Applied AI', department: 'I+D' },
    { firstName: 'Marta', lastName: 'Castaño', email: 'm.castano@neuroai.tech', phone: '+34 655 667 789', position: 'Product Lead CRM Voice', department: 'Producto' },
    { firstName: 'Lucía', lastName: 'Benítez', email: 'l.benitez@nexodigital.es', phone: '+34 666 778 899', position: 'Directora de Consultoría', department: 'Consultoría' },
    { firstName: 'Fernando', lastName: 'Romero', email: 'f.romero@nexodigital.es', phone: '+34 666 778 890', position: 'Socio Director', department: 'Dirección' },
    { firstName: 'Jorge', lastName: 'Echevarría', email: 'j.echevarria@transeurope.es', phone: '+34 677 889 900', position: 'Director de Tráfico Internacional', department: 'Operaciones' },
    { firstName: 'Klaus', lastName: 'Müller', email: 'k.mueller@transeurope.es', phone: '+34 677 889 901', position: 'Country Manager DACH', department: 'Expansión' },
    { firstName: 'Antonio', lastName: 'Guillén', email: 'a.guillen@globalfreight.com', phone: '+34 688 990 011', position: 'Director de Aduanas OEA', department: 'Aduanas' },
    { firstName: 'María', lastName: 'Pascual', email: 'm.pascual@globalfreight.com', phone: '+34 688 990 012', position: 'Key Account Manager Forwarding', department: 'Comercial' },
    { firstName: 'Manuel', lastName: 'Regueiro', email: 'm.regueiro@dumlogistica.gal', phone: '+34 699 001 122', position: 'Capitán de Operaciones Portuarias', department: 'Operaciones' },
    { firstName: 'Uxía', lastName: 'Castro', email: 'u.castro@dumlogistica.gal', phone: '+34 699 001 123', position: 'Responsable de Logística de Frío', department: 'Calidad' },
    { firstName: 'Dr. Guillermo', lastName: 'Riaño', email: 'g.riano@farmacantabria.com', phone: '+34 600 223 344', position: 'Director de Garantía de Calidad GMP', department: 'Garantía de Calidad' },
    { firstName: 'Mercedes', lastName: 'Salcedo', email: 'm.salcedo@farmacantabria.com', phone: '+34 600 223 345', position: 'Directora de Producción Farmacéutica', department: 'Planta Industrial' },
    { firstName: 'Ignacio', lastName: 'De la Torre', email: 'i.delatorre@medtechiberia.es', phone: '+34 611 334 455', position: 'Director de Licitaciones Hospitalarias', department: 'Ventas Públicas' },
    { firstName: 'Silvia', lastName: 'Montero', email: 's.montero@medtechiberia.es', phone: '+34 611 334 456', position: 'Ingeniera Biomédica de Soporte', department: 'Soporte Técnico' },
    { firstName: 'Dra. Cristina', lastName: 'Font', email: 'c.font@dermaelite.es', phone: '+34 622 445 566', position: 'Directora Médica Dermatóloga', department: 'Clínica' },
    { firstName: 'Gerard', lastName: 'Soler', email: 'g.soler@dermaelite.es', phone: '+34 622 445 567', position: 'Director de Finanzas y Recepción', department: 'Administración' },
    { firstName: 'Dr. Pablo', lastName: 'Montiel', email: 'p.montiel@vitalissalud.com', phone: '+34 633 556 677', position: 'Director Médico Coordinador', department: 'Servicios Médicos' },
    { firstName: 'Raquel', lastName: 'Giménez', email: 'r.gimenez@vitalissalud.com', phone: '+34 633 556 678', position: 'Jefa de Atención al Paciente', department: 'Atención al Cliente' },
    { firstName: 'Mikel', lastName: 'Aranburu', email: 'm.aranburu@renovablespartner.com', phone: '+34 644 667 788', position: 'Director de Proyectos Eólicos', department: 'Ingeniería' },
    { firstName: 'Leire', lastName: 'Urrutia', email: 'l.urrutia@renovablespartner.com', phone: '+34 644 667 789', position: 'Directora de Contrataciones', department: 'Legal y Compras' },
    { firstName: 'Rafael', lastName: 'Valero', email: 'r.valero@heliosolar.es', phone: '+34 655 778 800', position: 'Jefe de Instalaciones Fotovoltaicas', department: 'Técnico' },
    { firstName: 'Inmaculada', lastName: 'Cano', email: 'i.cano@heliosolar.es', phone: '+34 655 778 801', position: 'Directora Comercial Autoconsumo', department: 'Ventas' },
    { firstName: 'Eduardo', lastName: 'Bailo', email: 'e.bailo@ecowind.es', phone: '+34 666 889 911', position: 'Director de Mantenimiento Eólico', department: 'O&M' },
    { firstName: 'Pilar', lastName: 'Serrat', email: 'p.serrat@ecowind.es', phone: '+34 666 889 912', position: 'Responsable de Prevención de Riesgos', department: 'HSE' },
    { firstName: 'Dra. Celia', lastName: 'Navas', email: 'c.navas@greenh2tech.com', phone: '+34 677 990 022', position: 'Chief Scientist Hydrogen', department: 'I+D' },
    { firstName: 'Javier', lastName: 'Garrido', email: 'j.garrido@greenh2tech.com', phone: '+34 677 990 023', position: 'Director de Desarrollo de Negocio', department: 'Estrategia' },
    { firstName: 'Brais', lastName: 'Pazo', email: 'b.pazo@modaconfeccion.es', phone: '+34 688 001 133', position: 'Director de Cadena de Suministro Textil', department: 'Suministro' },
    { firstName: 'Antía', lastName: 'Mallo', email: 'a.mallo@modaconfeccion.es', phone: '+34 688 001 134', position: 'Directora de E-Commerce & Retail', department: 'Digital' },
    { firstName: 'Vicent', lastName: 'Ribelles', email: 'v.ribelles@gourmetmediterraneo.es', phone: '+34 699 112 244', position: 'Director de Exportación', department: 'Exportación' },
    { firstName: 'Amparo', lastName: 'Mompó', email: 'a.mompo@gourmetmediterraneo.es', phone: '+34 699 112 245', position: 'Responsable de Bodega y Selección', department: 'Producto' },
    { firstName: 'Nuria', lastName: 'Alba', email: 'n.alba@cosmeceutica.es', phone: '+34 600 334 455', position: 'Directora de Laboratorio Cosmético', department: 'I+D' },
    { firstName: 'Carles', lastName: 'Puig', email: 'c.puig@cosmeceutica.es', phone: '+34 600 334 456', position: 'Director Comercial de Farmacias', department: 'Ventas' },
    { firstName: 'Héctor', lastName: 'Salas', email: 'h.salas@techretail.es', phone: '+34 611 445 566', position: 'Director de Compras de Electrónica', department: 'Compras' },
    { firstName: 'Miriam', lastName: 'Paredes', email: 'm.paredes@techretail.es', phone: '+34 611 445 567', position: 'Directora de Operaciones de Tiendas', department: 'Retail' },
    { firstName: 'Santiago', lastName: 'Abelló', email: 's.abello@metropoliinmo.es', phone: '+34 622 556 677', position: 'Consejero Delegado (CEO)', department: 'Presidencia' },
    { firstName: 'Patricia', lastName: 'Villalba', email: 'p.villalba@metropoliinmo.es', phone: '+34 622 556 678', position: 'Directora de Comercialización', department: 'Promoción' },
    { firstName: 'Gorka', lastName: 'Etxebarria', email: 'g.etxebarria@construccioneh.eus', phone: '+34 633 667 788', position: 'Jefe de Obra Principal', department: 'Obras' },
    { firstName: 'Nerea', lastName: 'Agirre', email: 'n.agirre@construccioneh.eus', phone: '+34 633 667 789', position: 'Directora Financiera (CFO)', department: 'Finanzas' },
    { firstName: 'Joaquín', lastName: 'Montoro', email: 'j.montoro@urbanisciviles.com', phone: '+34 644 778 899', position: 'Director de Ingeniería Civil', department: 'Proyectos' },
    { firstName: 'Esther', lastName: 'Coronel', email: 'e.coronel@urbanisciviles.com', phone: '+34 644 778 890', position: 'Responsable de Licitaciones', department: 'Licitaciones' },
    { firstName: 'Bernardo', lastName: 'Lara', email: 'b.lara@fintechcapital.es', phone: '+34 655 889 911', position: 'Head of Payment Processing', department: 'Operaciones' },
    { firstName: 'Alba', lastName: 'Téllez', email: 'a.tellez@fintechcapital.es', phone: '+34 655 889 912', position: 'Compliance & Anti-Money Laundering Lead', department: 'Compliance' },
    { firstName: 'Ignacio', lastName: 'Brenas Martín', email: 'ignacio@asesoriabrenas.es', phone: '+34 666 990 022', position: 'Socio Director Fiscal', department: 'Dirección' },
    { firstName: 'Clara', lastName: 'Casado', email: 'c.casado@asesoriabrenas.es', phone: '+34 666 990 023', position: 'Responsable de Contabilidad y Sociedades', department: 'Contable' },
    { firstName: 'Arturo', lastName: 'Bosch', email: 'a.bosch@euroaudit.es', phone: '+34 677 001 133', position: 'Socio Auditor Principal', department: 'Auditoría' },
    { firstName: 'Eva', lastName: 'Cardona', email: 'e.cardona@euroaudit.es', phone: '+34 677 001 134', position: 'Senior Forensic Manager', department: 'Forense' },
    { firstName: 'Gonzalo', lastName: 'Fierro', email: 'g.fierro@lexglobal.es', phone: '+34 688 112 244', position: 'Socio de Mercantil y Fusiones', department: 'M&A' },
    { firstName: 'Cristina', lastName: 'Peña', email: 'c.pena@lexglobal.es', phone: '+34 688 112 245', position: 'Directora del Área Laboral', department: 'Laboral' },
    { firstName: 'Mateo', lastName: 'Alonso', email: 'm.alonso@fibrapeninsular.es', phone: '+34 699 223 355', position: 'Director de Despliegue de Red', department: 'Ingeniería' },
    { firstName: 'Susana', lastName: 'Valls', email: 's.valls@fibrapeninsular.es', phone: '+34 699 223 356', position: 'Key Account Manager Operadores', department: 'Mayorista' },
    { firstName: 'Bruno', lastName: 'Lamas', email: 'b.lamas@medios360.es', phone: '+34 600 445 566', position: 'Director Técnico Audiovisual', department: 'Producción' },
    { firstName: 'Adriana', lastName: 'Seco', email: 'a.seco@medios360.es', phone: '+34 600 445 567', position: 'Directora de Eventos Corporativos', department: 'Eventos' }
  ];

  const createdContacts: any[] = [];
  for (let i = 0; i < contactsData.length; i++) {
    const company = createdCompanies[Math.floor(i / 2)] || createdCompanies[0];
    const contact = await prisma.contact.create({
      data: {
        companyId: company.id,
        firstName: contactsData[i].firstName,
        lastName: contactsData[i].lastName,
        email: contactsData[i].email,
        phone: contactsData[i].phone,
        position: contactsData[i].position,
        department: contactsData[i].department,
        isLead: i % 4 === 3,
        notes: `Contacto clave en ${company.name}. Nivel decisorio verificado.`,
      },
    });
    createdContacts.push(contact);
  }

  console.log('📊 Creating Deal Stages...');
  const stage1 = await prisma.dealStage.create({ data: { name: 'Prospección', order: 1, color: '#64748B', probability: 15 } });
  const stage2 = await prisma.dealStage.create({ data: { name: 'Contacto Cualificado', order: 2, color: '#0EA5E9', probability: 35 } });
  const stage3 = await prisma.dealStage.create({ data: { name: 'Propuesta / Presupuesto', order: 3, color: '#F59E0B', probability: 60 } });
  const stage4 = await prisma.dealStage.create({ data: { name: 'Negociación Final', order: 4, color: '#8B5CF6', probability: 80 } });
  const stage5 = await prisma.dealStage.create({ data: { name: 'Cerrada Ganada', order: 5, color: '#10B981', probability: 100 } });
  const stage6 = await prisma.dealStage.create({ data: { name: 'Cerrada Perdida', order: 6, color: '#EF4444', probability: 0 } });
  const stages = [stage1, stage2, stage3, stage4, stage5, stage6];

  console.log('💼 Creating 48 Enterprise Pipeline Deals...');
  const dealTitles = [
    { title: 'Plataforma Cloud ERP + CRM Multitenant', val: 24500, stg: stage4, status: 'OPEN' },
    { title: 'Conector UnoPIM & Trazabilidad FEFO en Tiempo Real', val: 14800, stg: stage3, status: 'OPEN' },
    { title: 'Módulo WhatsApp Meta Cloud API Omnicanal', val: 6800, stg: stage5, status: 'WON' },
    { title: 'Adaptación Legal Veri*Factu AEAT 2026 y Firma Digital', val: 18200, stg: stage5, status: 'WON' },
    { title: 'Auditoría de Ciberseguridad ISO 27001 y Pentesting', val: 12500, stg: stage2, status: 'OPEN' },
    { title: 'Migración Clúster PostgreSQL 16 con Failover Automático', val: 32000, stg: stage4, status: 'OPEN' },
    { title: 'Integración Pasarela Pagos PSD2 y Cobros Bizum B2B', val: 8900, stg: stage5, status: 'WON' },
    { title: 'Gestor de Flota Logística Multi-Carrier (GLS, SEUR, DHL)', val: 21500, stg: stage3, status: 'OPEN' },
    { title: 'Sistema de Reservas y Citas Médicas con Portal Paciente', val: 15400, stg: stage5, status: 'WON' },
    { title: 'Motor de Automatización de Nóminas y Portal Empleado', val: 9600, stg: stage1, status: 'OPEN' },
    { title: 'Cuadro de Mando Ejecutivo PowerBI y Métricas ARR', val: 11200, stg: stage2, status: 'OPEN' },
    { title: 'Despliegue On-Premise Docker Traefik de Alta Disponibilidad', val: 28000, stg: stage4, status: 'OPEN' },
    { title: 'Conector EDI Facturación Grandes Superficies (El Corte Inglés)', val: 17500, stg: stage3, status: 'OPEN' },
    { title: 'Gestor Documental RGPD con Cifrado en Reposo AES-256', val: 7400, stg: stage6, status: 'LOST' },
    { title: 'Software de Trazabilidad de Cadena de Frío con Sensores IoT', val: 34000, stg: stage5, status: 'WON' },
    { title: 'Portal Autoservicio Proveedores y Homologación de Compras', val: 13900, stg: stage2, status: 'OPEN' },
    { title: 'Módulo de Helpdesk Omnicanal con SLA 24/7 y Enrutamiento', val: 8200, stg: stage5, status: 'WON' },
    { title: 'Integración Contable Sage 50 / Sage 200 con Sweep Automático', val: 19800, stg: stage4, status: 'OPEN' },
    { title: 'Desarrollo de App Móvil para Repartidores (React Native)', val: 42000, stg: stage3, status: 'OPEN' },
    { title: 'Licenciamiento Anual Enterprise DAMA-CRM (50 usuarios)', val: 18000, stg: stage5, status: 'WON' },
    { title: 'Consultoría Estratégica de Optimización de Procesos Lean', val: 9500, stg: stage1, status: 'OPEN' },
    { title: 'Sistema de Albaranes Digitales con Firma en Tablet', val: 11800, stg: stage2, status: 'OPEN' },
    { title: 'Conector E-Commerce Shopify Plus & Sincronización B2B', val: 14500, stg: stage5, status: 'WON' },
    { title: 'Módulo de Control Horario Biométrico y Fichaje Harvest', val: 6200, stg: stage5, status: 'WON' },
    { title: 'Mantenimiento Correctivo y Evolutivo 24/7 (SLA Oro)', val: 24000, stg: stage4, status: 'OPEN' },
    { title: 'Migración de ERP Legacy AS400 a DAMA-CRM Cloud', val: 85000, stg: stage3, status: 'OPEN' },
    { title: 'Módulo de Presupuestos Interactivos B2B con Firma OTP', val: 7800, stg: stage5, status: 'WON' },
    { title: 'Despliegue Red Privada WireGuard y VPN Corporativa', val: 5600, stg: stage6, status: 'LOST' },
    { title: 'Plataforma de Fidelización y Cupones para Retail', val: 13400, stg: stage2, status: 'OPEN' },
    { title: 'Motor de Reglas de Negocio y Workflows Visuales en Tiempo Real', val: 16800, stg: stage5, status: 'WON' },
    { title: 'Conector Bancario Redsys TPV Virtual y Débito Directo SEPA', val: 10500, stg: stage4, status: 'OPEN' },
    { title: 'Auditoría Fiscal Preventiva Modelo 347 y Factura Electrónica', val: 4500, stg: stage5, status: 'WON' },
    { title: 'Implantación CRM Comercial para Red de 30 Delegaciones', val: 68000, stg: stage4, status: 'OPEN' },
    { title: 'Infraestructura Cloud Dedicada en Hetzner con Backup Offsite', val: 12800, stg: stage5, status: 'WON' },
    { title: 'Integración PBX Telefónica Asterisk / VoIP con Pop-up de Llamada', val: 8900, stg: stage3, status: 'OPEN' },
    { title: 'Software de Gestión de Residuos y Huella de Carbono ISO 14001', val: 22000, stg: stage2, status: 'OPEN' },
    { title: 'Módulo de Comisiones Comerciales Multinivel y Liquidación', val: 9400, stg: stage5, status: 'WON' },
    { title: 'Portal de Empleado con Solicitud de Vacaciones y Turnos', val: 7200, stg: stage5, status: 'WON' },
    { title: 'Desarrollo de Conector API GraphQL para Integradores Externos', val: 15000, stg: stage1, status: 'OPEN' },
    { title: 'Implantación CRM Inmobiliario con Publicación en Portales', val: 29000, stg: stage3, status: 'OPEN' },
    { title: 'Plataforma de Subastas B2B y Liquidación de Stock Excedente', val: 38000, stg: stage4, status: 'OPEN' },
    { title: 'Módulo de Notificaciones Push y Alertas Críticas por SMS', val: 5400, stg: stage5, status: 'WON' },
    { title: 'Servicio de Recuperación ante Desastres (Disaster Recovery RTO 1h)', val: 31000, stg: stage3, status: 'OPEN' },
    { title: 'Conector WooSync para WooCommerce con Multitienda', val: 6900, stg: stage5, status: 'WON' },
    { title: 'Consultoría RGPD y Registro de Actividades de Tratamiento (RAT)', val: 3900, stg: stage6, status: 'LOST' },
    { title: 'Software de Control de Calidad en Planta con Código de Barras', val: 26500, stg: stage4, status: 'OPEN' },
    { title: 'Portal de Proveedores con Validación Automática de Certificados', val: 14200, stg: stage2, status: 'OPEN' },
    { title: 'Licencia Global DAMA Enterprise Ilimitada (Holding 5 Empresas)', val: 120000, stg: stage4, status: 'OPEN' }
  ];

  const createdDeals: any[] = [];
  for (let i = 0; i < dealTitles.length; i++) {
    const d = dealTitles[i];
    const contact = createdContacts[i % createdContacts.length];
    const company = createdCompanies[i % createdCompanies.length];
    const deal = await prisma.deal.create({
      data: {
        title: d.title,
        value: d.val,
        currency: 'EUR',
        stageId: d.stg.id,
        contactId: contact.id,
        companyId: company.id,
        expectedCloseDate: new Date(Date.now() + (i * 2 - 20) * 86400000),
        status: d.status,
        notes: `Trato estratégico para ${company.name}. Contacto principal: ${contact.firstName} ${contact.lastName}.`,
      },
    });
    createdDeals.push(deal);
  }

  console.log('📦 Creating 3 Physical Warehouses & Locations...');
  const whCentral = await prisma.warehouse.create({
    data: {
      code: 'WH-MAD-01',
      name: 'Hub Central de Distribución Madrid',
      type: 'CENTRAL',
      address: 'Polígono Industrial Los Ángeles, Calle Ebanistería 4',
      city: 'Getafe',
      postalCode: '28906',
      province: 'Madrid',
      country: 'España',
      contactPerson: 'Carlos Ruiz',
      phone: '+34 916 889 900',
      email: 'almacen.madrid@damacrm.com',
      isDefault: true,
      isActive: true,
    },
  });

  const whBarcelona = await prisma.warehouse.create({
    data: {
      code: 'WH-BCN-02',
      name: 'Plataforma Logística Portuaria Barcelona',
      type: 'REGIONAL_HUB',
      address: 'Zona de Actividades Logísticas (ZAL), Port de Barcelona',
      city: 'El Prat de Llobregat',
      postalCode: '08820',
      province: 'Barcelona',
      country: 'España',
      contactPerson: 'Marta Solé',
      phone: '+34 932 445 566',
      email: 'almacen.barcelona@damacrm.com',
      isDefault: false,
      isActive: true,
    },
  });

  const whValencia = await prisma.warehouse.create({
    data: {
      code: 'WH-VLC-03',
      name: 'Centro Tecnológico y Distribución Levante',
      type: 'PHYSICAL',
      address: 'Parque Tecnológico de Paterna, Calle Ronda 12',
      city: 'Paterna',
      postalCode: '46980',
      province: 'Valencia',
      country: 'España',
      contactPerson: 'Vicent Ferrando',
      phone: '+34 961 334 455',
      email: 'almacen.valencia@damacrm.com',
      isDefault: false,
      isActive: true,
    },
  });
  const warehouses = [whCentral, whBarcelona, whValencia];

  console.log('🏷️ Creating 45 Multi-Category Enterprise Products...');
  const productsCatalog = [
    { sku: 'SRV-CLOUD-ENT', name: 'Instancia Cloud Gestionada Enterprise (Oracle OCI)', cat: 'Servicios Cloud', price: 2800.0, cost: 400.0, stock: 120, bc: '8412345678901' },
    { sku: 'MOD-OMNI-WA', name: 'Conector Omnicanal Meta WhatsApp API Business', cat: 'Módulos CRM', price: 2400.0, cost: 300.0, stock: 85, bc: '8412345678902' },
    { sku: 'SRV-SLA-247', name: 'Mantenimiento Preventivo Anual y SLA 99.9%', cat: 'Mantenimiento', price: 3600.0, cost: 600.0, stock: 200, bc: '8412345678903' },
    { sku: 'MOD-VERIFACTU', name: 'Módulo Veri*Factu AEAT 2026 Facturación Legal', cat: 'Módulos CRM', price: 1800.0, cost: 250.0, stock: 150, bc: '8412345678904' },
    { sku: 'HW-ZEBRA-TC26', name: 'Terminal Portátil Barcode Zebra TC26 Android 13', cat: 'Hardware', price: 680.0, cost: 420.0, stock: 45, bc: '8412345678905' },
    { sku: 'HW-PRINTER-STAR', name: 'Impresora Térmica de Tickets Star Micronics TSP143', cat: 'Hardware', price: 220.0, cost: 140.0, stock: 60, bc: '8412345678906' },
    { sku: 'HW-GPS-FLEET4G', name: 'Localizador GPS 4G OBD para Flotas con Batería', cat: 'Hardware', price: 145.0, cost: 75.0, stock: 110, bc: '8412345678907' },
    { sku: 'SRV-CONSULT-HOUR', name: 'Bolsa de 20 Horas Consultoría de Arquitectura', cat: 'Servicios Profesionales', price: 1800.0, cost: 600.0, stock: 50, bc: '8412345678908' },
    { sku: 'LIC-DAMA-CORE50', name: 'Licencia DAMA-CRM Core 50 Usuarios Concurrentes', cat: 'Software', price: 4500.0, cost: 500.0, stock: 999, bc: '8412345678909' },
    { sku: 'MOD-UNOPIM-SYNC', name: 'Conector Sincronizador Bidireccional UnoPIM ERP', cat: 'Módulos CRM', price: 2900.0, cost: 400.0, stock: 75, bc: '8412345678910' },
    { sku: 'SRV-SEC-AUDIT', name: 'Auditoría de Vulnerabilidades y Pentesting OWASP', cat: 'Servicios Profesionales', price: 4200.0, cost: 1200.0, stock: 30, bc: '8412345678911' },
    { sku: 'HW-SCANNER-RING', name: 'Lector de Código de Barras de Anillo Bluetooth 2D', cat: 'Hardware', price: 290.0, cost: 160.0, stock: 35, bc: '8412345678912' },
    { sku: 'HW-RFID-GATE', name: 'Antena RFID UHF de Paso para Muelle de Carga', cat: 'Hardware', price: 1850.0, cost: 1100.0, stock: 15, bc: '8412345678913' },
    { sku: 'SRV-TRAINING-TEAM', name: 'Taller Formación en Planta para Operarios (8h)', cat: 'Servicios Profesionales', price: 950.0, cost: 300.0, stock: 40, bc: '8412345678914' },
    { sku: 'LIC-HARVEST-TIME', name: 'Módulo Harvest Time Tracker con Control Biométrico', cat: 'Módulos CRM', price: 1200.0, cost: 150.0, stock: 100, bc: '8412345678915' },
    { sku: 'COS-HYAL-50ML', name: 'Serum Ácido Hialurónico Puro Grado Clínico 50ml', cat: 'Cosmética & Belleza', price: 65.0, cost: 18.0, stock: 240, bc: '8412345678916' },
    { sku: 'COS-COLLAGEN-PRO', name: 'Crema Regeneradora Colágeno Marino Bio 100ml', cat: 'Cosmética & Belleza', price: 82.0, cost: 24.0, stock: 180, bc: '8412345678917' },
    { sku: 'MED-KIT-SUTURE', name: 'Kit Quirúrgico Desechable Instrumental Titanio', cat: 'Material Sanitario', price: 130.0, cost: 45.0, stock: 95, bc: '8412345678918' },
    { sku: 'MED-MASK-FFP3', name: 'Caja 50 Mascarillas FFP3 con Válvula Homologadas', cat: 'Material Sanitario', price: 45.0, cost: 12.0, stock: 500, bc: '8412345678919' },
    { sku: 'HW-ROUTER-5G', name: 'Router Industrial 5G Teltonika RUTX50 Dual SIM', cat: 'Hardware', price: 590.0, cost: 380.0, stock: 28, bc: '8412345678920' },
    { sku: 'HW-DYMO-550', name: 'Impresora de Etiquetas de Envío Dymo 550 Turbo', cat: 'Hardware', price: 165.0, cost: 95.0, stock: 70, bc: '8412345678921' },
    { sku: 'MOD-RECURRING-INV', name: 'Generador de Facturación Recurrente Automática', cat: 'Módulos CRM', price: 1400.0, cost: 200.0, stock: 90, bc: '8412345678922' },
    { sku: 'SRV-BACKUP-S3', name: 'Almacenamiento Cloud Cifrado S3 R2 10TB Anual', cat: 'Servicios Cloud', price: 1200.0, cost: 350.0, stock: 100, bc: '8412345678923' },
    { sku: 'MOD-PORTAL-CLIENT', name: 'Portal B2B Autoservicio Descarga Facturas y Firma', cat: 'Módulos CRM', price: 1950.0, cost: 280.0, stock: 110, bc: '8412345678924' },
    { sku: 'COS-PEEL-GLYCOL', name: 'Peeling Químico Ácido Glicólico 30% Profesional', cat: 'Cosmética & Belleza', price: 95.0, cost: 26.0, stock: 130, bc: '8412345678925' },
    { sku: 'COS-VIT-C-SERUM', name: 'Ampollas Vitamina C Pura 15% Iluminadoras (Pack 30)', cat: 'Cosmética & Belleza', price: 48.0, cost: 14.0, stock: 320, bc: '8412345678926' },
    { sku: 'HW-TABLET-10R', name: 'Tablet Rugerizada 10 Pulgadas IP67 Caídas 1.8m', cat: 'Hardware', price: 740.0, cost: 480.0, stock: 32, bc: '8412345678927' },
    { sku: 'HW-LABEL-ROLLS', name: 'Bobina 1000 Etiquetas Térmicas 100x150mm GLS/SEUR', cat: 'Consumibles', price: 18.0, cost: 5.5, stock: 850, bc: '8412345678928' },
    { sku: 'MOD-BIZUM-PAY', name: 'Pasarela de Cobro Inmediato Bizum B2B & Clientes', cat: 'Módulos CRM', price: 1100.0, cost: 150.0, stock: 95, bc: '8412345678929' },
    { sku: 'SRV-CUSTOM-CODE', name: 'Desarrollo de Adaptaciones a Medida (Bloque 40h)', cat: 'Servicios Profesionales', price: 3400.0, cost: 1400.0, stock: 25, bc: '8412345678930' },
    { sku: 'LIC-AI-CHATBOT', name: 'Agente IA LLM de Atención 24/7 con RAG Local', cat: 'Software', price: 3200.0, cost: 450.0, stock: 60, bc: '8412345678931' },
    { sku: 'HW-BALANZA-PAQ', name: 'Báscula Digital de Paquetería hasta 60kg Calibrada', cat: 'Hardware', price: 195.0, cost: 110.0, stock: 45, bc: '8412345678932' },
    { sku: 'HW-WEBCAM-4K', name: 'Cámara 4K Gran Angular para Salas de Videollamadas', cat: 'Hardware', price: 210.0, cost: 130.0, stock: 55, bc: '8412345678933' },
    { sku: 'MED-GEL-ULTRASOUND', name: 'Garrafa 5 Litros Gel Conductor Ecografía y Láser', cat: 'Material Sanitario', price: 28.0, cost: 8.0, stock: 160, bc: '8412345678934' },
    { sku: 'COS-SPF50-MINERAL', name: 'Fotoprotector Solar Mineral SPF50+ Toque Seco', cat: 'Cosmética & Belleza', price: 32.0, cost: 9.5, stock: 410, bc: '8412345678935' },
    { sku: 'MOD-LOGISTICS-CARRIER', name: 'Conector Multitransporte 22 Agencias Mensajería', cat: 'Módulos CRM', price: 2600.0, cost: 350.0, stock: 70, bc: '8412345678936' },
    { sku: 'SRV-GDPR-DPO', name: 'Servicio Delegado de Protección de Datos (DPO) Anual', cat: 'Servicios Profesionales', price: 2200.0, cost: 500.0, stock: 40, bc: '8412345678937' },
    { sku: 'HW-SWITCH-POE24', name: 'Switch Gestionable 24 Puertos PoE+ Gigabit Ubiquiti', cat: 'Hardware', price: 420.0, cost: 290.0, stock: 22, bc: '8412345678938' },
    { sku: 'HW-AP-WIFI6E', name: 'Punto de Acceso Wi-Fi 6E Corporativo Tri-Banda', cat: 'Hardware', price: 260.0, cost: 175.0, stock: 38, bc: '8412345678939' },
    { sku: 'SRV-PERF-TUNING', name: 'Optimización de Consultas SQL y Rendimiento BD', cat: 'Servicios Profesionales', price: 1950.0, cost: 650.0, stock: 20, bc: '8412345678940' },
    { sku: 'LIC-SALON-APPT', name: 'Módulo de Citas y Cobros para Salones y Centros', cat: 'Módulos CRM', price: 1650.0, cost: 220.0, stock: 80, bc: '8412345678941' },
    { sku: 'COS-MASK-ALGINATE', name: 'Mascarilla Alginatos Purificante Espirulina 1kg', cat: 'Cosmética & Belleza', price: 54.0, cost: 16.0, stock: 140, bc: '8412345678942' },
    { sku: 'MED-NEEDLE-MESO', name: 'Caja 100 Agujas Mesoterapia 30G 4mm Esterilizadas', cat: 'Material Sanitario', price: 38.0, cost: 11.0, stock: 280, bc: '8412345678943' },
    { sku: 'HW-POS-TERMINAL', name: 'Terminal Punto de Venta All-in-One Pantalla Táctil', cat: 'Hardware', price: 890.0, cost: 580.0, stock: 18, bc: '8412345678944' },
    { sku: 'SRV-DISASTER-PLAN', name: 'Plan de Continuidad de Negocio y Simulacro RTO', cat: 'Servicios Profesionales', price: 3900.0, cost: 1100.0, stock: 15, bc: '8412345678945' }
  ];

  const createdProducts: any[] = [];
  for (const p of productsCatalog) {
    const prod = await prisma.product.create({
      data: {
        externalId: `UNOPIM-${p.sku}`,
        sku: p.sku,
        name: p.name,
        description: `Especificación técnica y trazabilidad de ${p.name}. Stock validado en red logística.`,
        price: p.price,
        costPrice: p.cost,
        stock: p.stock,
        category: p.cat,
        barcode: p.bc,
        isSync: true,
        lastSyncedAt: new Date(),
      },
    });
    createdProducts.push(prod);

    // Seed WarehouseStock across the 3 warehouses
    for (let wIdx = 0; wIdx < warehouses.length; wIdx++) {
      const wh = warehouses[wIdx];
      const portion = Math.floor(p.stock / 3) + (wIdx === 0 ? p.stock % 3 : 0);
      await prisma.warehouseStock.create({
        data: {
          warehouseId: wh.id,
          productId: prod.id,
          stock: portion,
          reservedStock: Math.floor(portion * 0.1),
          minStock: 5,
          maxStock: portion * 2 + 10,
          binLocation: `PAS-0${wIdx + 1}-EST-0${(prod.id.charCodeAt(0) % 9) + 1}`,
          weightedAvgCost: p.cost,
        },
      });
    }

    // Seed StockBatches (FEFO Expiration) for health, cosmetics & hardware
    await prisma.stockBatch.create({
      data: {
        productId: prod.id,
        warehouseId: whCentral.id,
        batchNumber: `LOT-2026-${prod.sku.slice(0, 6)}`,
        initialQty: p.stock,
        remainingQty: p.stock,
        quantity: p.stock,
        costPrice: p.cost,
        unitCost: p.cost,
        manufacturedAt: new Date(Date.now() - 60 * 86400000),
        expiryDate: new Date(Date.now() + 365 * 86400000),
        status: 'ACTIVE',
      },
    });

    // Seed StockMovements
    await prisma.stockMovement.create({
      data: {
        productId: prod.id,
        warehouseId: whCentral.id,
        quantity: p.stock,
        previousStock: 0,
        newStock: p.stock,
        type: 'INBOUND',
        reason: 'Recepción inicial proveedor homologado',
        reference: `ALB-PROV-${prod.sku}`,
        performedBy: adminUser.name,
        tenantId: 'master',
        createdAt: new Date(Date.now() - 30 * 86400000),
      },
    });
  }

  console.log('🚚 Creating 36 Multi-Carrier Logistics Shipments with Checkpoints...');
  const carriers = ['GLS', 'SEUR', 'CORREOS_EXPRESS', 'MRW', 'DHL', 'UPS', 'FEDEX', 'NACEX'];
  const cities = [
    { city: 'Madrid', address: 'Calle Alcalá 42', dest: 'Madrid Central' },
    { city: 'Barcelona', address: 'Passeig de Gràcia 88', dest: 'Barcelona Eixample' },
    { city: 'Valencia', address: 'Avenida Blasco Ibáñez 28', dest: 'Valencia Mestalla' },
    { city: 'Sevilla', address: 'Calle Sierpes 15', dest: 'Sevilla Casco Antiguo' },
    { city: 'Bilbao', address: 'Gran Vía 12', dest: 'Bilbao Abando' },
    { city: 'Zaragoza', address: 'Paseo Independencia 10', dest: 'Zaragoza Centro' },
    { city: 'Málaga', address: 'Calle Larios 5', dest: 'Málaga Puerto' },
    { city: 'Santander', address: 'Paseo de Pereda 8', dest: 'Santander Bahía' },
  ];

  for (let i = 0; i < 36; i++) {
    const carrier = carriers[i % carriers.length];
    const loc = cities[i % cities.length];
    const contact = createdContacts[i % createdContacts.length];
    const isDelivered = i < 20;
    const isOutForDelivery = i >= 20 && i < 28;
    const status = isDelivered ? 'DELIVERED' : (isOutForDelivery ? 'OUT_FOR_DELIVERY' : 'IN_TRANSIT');
    const trackingNum = `${carrier}-ES-${20260000 + i}`;

    const shipment = await prisma.shipment.create({
      data: {
        trackingNumber: trackingNum,
        carrier: carrier,
        recipientName: `${contact.firstName} ${contact.lastName}`,
        recipientAddress: loc.address,
        recipientCity: loc.city,
        recipientPhone: contact.phone,
        recipientEmail: contact.email,
        status: status,
        origin: 'Hub Central de Distribución Madrid',
        destination: loc.dest,
        estimatedDelivery: new Date(Date.now() + (isDelivered ? -1 : 1) * 86400000),
        actualDelivery: isDelivered ? new Date(Date.now() - 3600000 * 5) : null,
        weightKg: Number((1.5 + (i * 0.7) % 15).toFixed(1)),
        notes: isDelivered ? 'Entregado con firma digital en terminal móvil.' : 'En reparto prioritario.',
      },
    });

    // Checkpoint 1: Picked up
    await prisma.shipmentCheckpoint.create({
      data: {
        shipmentId: shipment.id,
        status: 'PICKED_UP',
        location: 'Getafe (Madrid)',
        description: 'Paquete recogido en las instalaciones del expedidor.',
        timestamp: new Date(Date.now() - 48 * 3600000),
      },
    });

    // Checkpoint 2: Hub Transit
    await prisma.shipmentCheckpoint.create({
      data: {
        shipmentId: shipment.id,
        status: 'IN_TRANSIT',
        location: 'Centro de Clasificación Logística Madrid',
        description: 'Clasificado y en tránsito hacia la delegación de destino.',
        timestamp: new Date(Date.now() - 24 * 3600000),
      },
    });

    if (isOutForDelivery || isDelivered) {
      await prisma.shipmentCheckpoint.create({
        data: {
          shipmentId: shipment.id,
          status: 'OUT_FOR_DELIVERY',
          location: loc.city,
          description: 'En reparto. El transportista se dirige a la dirección acordada.',
          timestamp: new Date(Date.now() - 6 * 3600000),
        },
      });
    }

    if (isDelivered) {
      await prisma.shipmentCheckpoint.create({
        data: {
          shipmentId: shipment.id,
          status: 'DELIVERED',
          location: loc.city,
          description: `Entregado satisfactoriamente. Receptor: ${contact.firstName} ${contact.lastName}.`,
          timestamp: new Date(Date.now() - 2 * 3600000),
        },
      });
    }
  }

  console.log('🩺 Creating 12 Appointment Services & 40 Bookings...');
  const apptServicesData = [
    { name: 'Consultoría Estratégica & Diagnóstico TI', cat: 'ADVISORY', dur: 60, price: 150.0, cost: 30.0, pop: true },
    { name: 'Auditoría Técnica de Infraestructura Cloud', cat: 'TECHNICAL', dur: 90, price: 240.0, cost: 50.0, pop: true },
    { name: 'Sesión de Onboarding y Formación de Equipo', cat: 'CONSULTATION', dur: 120, price: 300.0, cost: 60.0, pop: false },
    { name: 'Demostración Ejecutiva y Prueba de Concepto', cat: 'SERVICE', dur: 45, price: 90.0, cost: 15.0, pop: true },
    { name: 'Tratamiento Regenerador Facial con Ácido Hialurónico', cat: 'TREATMENT', dur: 60, price: 120.0, cost: 25.0, pop: true },
    { name: 'Peeling Médico Anti-edad y Terapia Lumínica', cat: 'TREATMENT', dur: 45, price: 95.0, cost: 20.0, pop: false },
    { name: 'Revisión Médica General y Panel Analítico', cat: 'CONSULTATION', dur: 30, price: 80.0, cost: 15.0, pop: true },
    { name: 'Configuración y Verificación Webhooks Meta WhatsApp', cat: 'TECHNICAL', dur: 60, price: 180.0, cost: 35.0, pop: false },
    { name: 'Auditoría Legal y Adaptación Veri*Factu AEAT', cat: 'ADVISORY', dur: 60, price: 210.0, cost: 40.0, pop: true },
    { name: 'Corte de Estilo & Tratamiento Capilar Hidratante', cat: 'SERVICE', dur: 45, price: 45.0, cost: 10.0, pop: true },
    { name: 'Manicura Spa Rusa con Esmaltado Semipermanente', cat: 'SERVICE', dur: 50, price: 38.0, cost: 8.0, pop: true },
    { name: 'Masaje Terapéutico Descontracturante Espalda', cat: 'TREATMENT', dur: 50, price: 55.0, cost: 12.0, pop: true },
  ];

  const createdApptServices: any[] = [];
  for (const s of apptServicesData) {
    const srv = await prisma.appointmentService.create({
      data: {
        name: s.name,
        category: s.cat,
        durationMin: s.dur,
        price: s.price,
        supplyCost: s.cost,
        description: `Servicio profesional corporativo: ${s.name}.`,
        isPopular: s.pop,
        isActive: true,
      },
    });
    createdApptServices.push(srv);
  }

  const paymentMethods = ['BIZUM', 'CARD', 'CASH', 'TRANSFER'];
  const specialists = ['Dra. Elena García', 'Carlos Ruiz', 'Marta Navarro', 'Alejandro Morales', 'Beatriz Gómez'];

  for (let i = 0; i < 40; i++) {
    const srv = createdApptServices[i % createdApptServices.length];
    const contact = createdContacts[i % createdContacts.length];
    const spec = specialists[i % specialists.length];
    const method = paymentMethods[i % paymentMethods.length];
    const isPast = i < 25;
    const start = new Date(Date.now() + (isPast ? -i : i + 1) * 3600000 * 4);
    const end = new Date(start.getTime() + srv.durationMin * 60000);

    await prisma.appointment.create({
      data: {
        clientName: `${contact.firstName} ${contact.lastName}`,
        clientPhone: contact.phone,
        clientEmail: contact.email,
        contactId: contact.id,
        staffName: spec,
        serviceIds: JSON.stringify([srv.id]),
        servicesDetails: JSON.stringify([{ id: srv.id, name: srv.name, price: srv.price, duration: srv.durationMin }]),
        startTime: start,
        endTime: end,
        durationMin: srv.durationMin,
        totalPrice: srv.price,
        totalSupplyCost: srv.supplyCost,
        estimatedProfit: srv.price - srv.supplyCost,
        status: isPast ? 'COMPLETED' : 'CONFIRMED',
        paymentStatus: isPast ? 'PAID' : (i % 3 === 0 ? 'PAID' : 'PENDING'),
        paymentMethod: method,
        notes: `Cita coordinada con ${contact.firstName}. Especialista: ${spec}.`,
      },
    });
  }

  console.log('📜 Creating 35 Quotes and 45 Invoices with Veri*Factu Chaining...');
  for (let i = 1; i <= 35; i++) {
    const contact = createdContacts[i % createdContacts.length];
    const company = createdCompanies[i % createdCompanies.length];
    const subtotal = 1200.0 * (i % 5 + 1);
    const taxRate = 21.0;
    const taxAmount = Number((subtotal * 0.21).toFixed(2));
    const total = subtotal + taxAmount;
    const isAccepted = i % 2 === 0;

    await prisma.quote.create({
      data: {
        quoteNumber: `PRE-2026-${String(i).padStart(3, '0')}`,
        contactId: contact.id,
        companyId: company.id,
        issueDate: new Date(Date.now() - i * 86400000),
        expiryDate: new Date(Date.now() + (30 - i) * 86400000),
        status: isAccepted ? 'ACCEPTED' : (i % 3 === 0 ? 'SENT' : 'DRAFT'),
        subtotal: subtotal,
        taxRate: taxRate,
        taxAmount: taxAmount,
        total: total,
        currency: 'EUR',
        notes: 'Presupuesto válido durante 30 días. Incluye soporte inicial y garantía.',
        items: {
          create: [
            { description: 'Licenciamiento de plataforma y conectores API', quantity: 1, unitPrice: subtotal * 0.7, amount: subtotal * 0.7 },
            { description: 'Implantación técnica y parametrización', quantity: 1, unitPrice: subtotal * 0.3, amount: subtotal * 0.3 },
          ],
        },
      },
    });
  }

  for (let i = 1; i <= 45; i++) {
    const contact = createdContacts[i % createdContacts.length];
    const company = createdCompanies[i % createdCompanies.length];
    const subtotal = 1500.0 * (i % 6 + 1);
    const taxRate = 21.0;
    const taxAmount = Number((subtotal * 0.21).toFixed(2));
    const total = subtotal + taxAmount;
    const isPaid = i <= 32;
    const isOverdue = !isPaid && i > 38;
    const status = isPaid ? 'PAID' : (isOverdue ? 'OVERDUE' : 'SENT');

    await prisma.invoice.create({
      data: {
        invoiceNumber: `FAC-2026-${String(i).padStart(4, '0')}`,
        contactId: contact.id,
        companyId: company.id,
        issueDate: new Date(Date.now() - (50 - i) * 86400000),
        dueDate: new Date(Date.now() - (20 - i) * 86400000),
        status: status,
        subtotal: subtotal,
        taxRate: taxRate,
        taxAmount: taxAmount,
        total: total,
        currency: 'EUR',
        paidAt: isPaid ? new Date(Date.now() - (40 - i) * 86400000) : null,
        notes: isPaid ? 'Factura abonada puntualmente mediante transferencia bancaria SEPA.' : 'Pendiente de cobro en plazo pactado.',
        items: {
          create: [
            { description: 'Suscripción Enterprise DAMA Cloud Solutions', quantity: 1, unitPrice: subtotal * 0.65, amount: subtotal * 0.65 },
            { description: 'Mantenimiento Preventivo y SLA 99.9%', quantity: 1, unitPrice: subtotal * 0.35, amount: subtotal * 0.35 },
          ],
        },
      },
    });
  }

  console.log('🎫 Creating 38 Helpdesk Support Tickets with SLA & Messages...');
  const ticketCategories = ['TECHNICAL', 'BILLING', 'FEATURE_REQUEST', 'GENERAL', 'INCIDENT'];
  const ticketPriorities = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

  const ticketTitles = [
    'Error 500 en webhook entrante de WhatsApp Meta al recibir imagen',
    'Solicitud de factura rectificativa con NIF intracomunitario (VIES)',
    'Latencia elevada en sincronización de stock con UnoPIM en hora punta',
    'Duda sobre firma digital de presupuestos desde móvil iOS',
    'Solicitud de alta de nuevo empleado con permisos de almacenero',
    'Problema al descargar informe fiscal de gastos en formato Excel',
    'Aviso de caducidad inminente en lote LOT-2026-MED de suero fisiológico',
    'Error en autenticación 2FA tras actualización de aplicación autenticadora',
    'Solicitud de conector con pasarela de pago Bizum para tienda física',
    'Discrepancia en recuento de bultos en envío SEUR-ES-20260012',
    'Petición de exportación completa de contactos en CSV según RGPD',
    'Consulta sobre cálculo de retenciones IRPF en nómina de directivos',
    'Fallo al imprimir etiqueta de envío en impresora térmica Dymo',
    'Sugerencia de mejora: permitir vista kanban compacta en tareas ágiles',
    'Incidencia en asignación de especialista en reserva de estética VIP'
  ];

  for (let i = 0; i < 38; i++) {
    const title = ticketTitles[i % ticketTitles.length] + (i >= ticketTitles.length ? ` (Ref #${i + 1})` : '');
    const priority = ticketPriorities[i % ticketPriorities.length];
    const category = ticketCategories[i % ticketCategories.length];
    const contact = createdContacts[i % createdContacts.length];
    const company = createdCompanies[i % createdCompanies.length];
    const isResolved = i < 22;
    const status = isResolved ? 'RESOLVED' : (i % 2 === 0 ? 'IN_PROGRESS' : 'OPEN');
    const assignedAgent = i % 2 === 0 ? pmUser : adminUser;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TCK-2026-${String(i + 1).padStart(4, '0')}`,
        title: title,
        description: `Detalle de la consulta reportada por ${contact.firstName} ${contact.lastName} (${company.name}). Requiere análisis según política de SLA.`,
        status: status,
        priority: priority,
        category: category,
        channel: i % 3 === 0 ? 'WHATSAPP' : (i % 3 === 1 ? 'EMAIL' : 'PORTAL'),
        contactId: contact.id,
        companyId: company.id,
        assignedToId: assignedAgent.id,
        slaDueAt: new Date(Date.now() + (priority === 'URGENT' ? 4 : 24) * 3600000),
        firstResponseAt: new Date(Date.now() - 3600000 * 2),
        resolvedAt: isResolved ? new Date(Date.now() - 3600000) : null,
        tenantId: 'master',
        messages: {
          create: [
            {
              senderType: 'CUSTOMER',
              senderName: `${contact.firstName} ${contact.lastName}`,
              message: `Hola equipo de soporte, les contactamos debido a: ${title}. Agradecemos su pronta respuesta.`,
              isInternal: false,
            },
            {
              senderType: 'AGENT',
              senderId: assignedAgent.id,
              senderName: assignedAgent.name,
              message: 'Estimado/a cliente, hemos recibido su solicitud y estamos revisando los registros en el servidor.',
              isInternal: false,
            },
            {
              senderType: 'AGENT',
              senderId: adminUser.id,
              senderName: 'Ignacio Administrador',
              message: `Nota confidencial de diagnóstico interno: Verificado en clúster. Nivel de severidad asignado: ${priority}.`,
              isInternal: true,
            },
          ],
        },
      },
    });
  }

  console.log('💸 Creating 32 Corporate Expenses (P&L Tax Books)...');
  const expenseVendors = [
    { sup: 'Hetzner Cloud GmbH', nif: 'DE814670600', cat: 'SOFTWARE', sub: 650.0, notes: 'Servidores dedicados y almacenamiento en nube' },
    { sup: 'Twilio Ireland Ltd', nif: 'IE3382756H', cat: 'OPERATIONAL', sub: 240.0, notes: 'Consumo WhatsApp Business API & SMS OTP' },
    { sup: 'Asesoría Fiscal Brenas & Asociados', nif: 'B12398745', cat: 'LEGAL', sub: 450.0, notes: 'Presentación trimestral Modelo 303 y 111 de Hacienda' },
    { sup: 'Telefónica de España SA', nif: 'A28015865', cat: 'UTILITIES', sub: 180.0, notes: 'Fibra simétrica 1Gbps y líneas IP de oficina' },
    { sup: 'Amazon Web Services EMEA', nif: 'LU26375245', cat: 'SOFTWARE', sub: 890.0, notes: 'Buckets S3 Glacier y réplica de copias de seguridad' },
    { sup: 'Iberdrola Clientes SAU', nif: 'A95000294', cat: 'UTILITIES', sub: 320.0, notes: 'Suministro eléctrico de las instalaciones centrales' },
    { sup: 'Papelería y Suministros Castellana', nif: 'B82910480', cat: 'OFFICE', sub: 120.0, notes: 'Consumibles, tóner y bobinas de etiquetas térmicas' },
    { sup: 'Google Workspace Ireland', nif: 'IE6388047V', cat: 'SOFTWARE', sub: 280.0, notes: 'Cuentas de correo corporativo y Google Drive' },
  ];

  for (let i = 0; i < 32; i++) {
    const v = expenseVendors[i % expenseVendors.length];
    const sub = v.sub * (1 + (i % 3) * 0.2);
    const taxRate = 21.0;
    const tax = Number((sub * 0.21).toFixed(2));
    const total = sub + tax;
    const isPaid = i < 26;

    await prisma.expense.create({
      data: {
        expenseNumber: `EXP-2026-${String(i + 1).padStart(4, '0')}`,
        supplierName: v.sup,
        supplierTaxId: v.nif,
        category: v.cat,
        issueDate: new Date(Date.now() - (45 - i) * 86400000),
        dueDate: new Date(Date.now() + (15 - i) * 86400000),
        subtotal: sub,
        taxRate: taxRate,
        taxAmount: tax,
        total: total,
        status: isPaid ? 'PAID' : 'PENDING',
        paymentMethod: 'BANK_TRANSFER',
        notes: v.notes,
        tenantId: 'master',
      },
    });
  }

  console.log('🚀 Creating 6 Agile Projects, 12 Sprints, 50 Tasks & 35 WorkLogs...');
  const project1 = await prisma.project.create({
    data: {
      name: 'Implantación WhatsApp Omnicanal Meta - Biomedical Europa',
      description: 'Configuración de webhooks de WhatsApp Meta API y panel de atención en CRM',
      status: 'ACTIVE',
      priority: 'HIGH',
      startDate: new Date(Date.now() - 30 * 86400000),
      endDate: new Date(Date.now() + 30 * 86400000),
      budget: 14500.0,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Cumplimiento Legal Veri*Factu AEAT 2026 y Firma Digital',
      description: 'Generación de encadenamiento criptográfico SHA-256 y remisión voluntaria',
      status: 'ACTIVE',
      priority: 'HIGH',
      startDate: new Date(Date.now() - 20 * 86400000),
      endDate: new Date(Date.now() + 40 * 86400000),
      budget: 22000.0,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'Sincronizador UnoPIM ERP y Control de Lotes FEFO',
      description: 'Arquitectura bidireccional de catálogo, variantes de producto y stocks',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      startDate: new Date(Date.now() - 15 * 86400000),
      endDate: new Date(Date.now() + 45 * 86400000),
      budget: 18500.0,
    },
  });

  const sprint1 = await prisma.sprint.create({
    data: {
      projectId: project1.id,
      name: 'Sprint 1: Conectividad Webhook & Cifrado',
      goal: 'Verificación de handshake de Meta WhatsApp API y persistencia en base de datos',
      startDate: new Date(Date.now() - 14 * 86400000),
      endDate: new Date(),
      status: 'COMPLETED',
    },
  });

  const sprint2 = await prisma.sprint.create({
    data: {
      projectId: project1.id,
      name: 'Sprint 2: Timeline de Chat en Tiempo Real',
      goal: 'Desarrollo de frontend React con WebSocket y soporte de notas de voz',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 86400000),
      status: 'ACTIVE',
    },
  });

  const taskStatuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
  const createdTasks: any[] = [];

  const taskTitles = [
    'Implementar endpoint GET /api/webhooks/whatsapp con verificación timingSafeEqual',
    'Diseñar componente de chat con scroll automático al último mensaje',
    'Integrar reproductor de notas de voz con onda de audio interactiva',
    'Pruebas de carga con 100 mensajes entrantes por segundo en Redis',
    'Configurar algoritmo SHA-256 para encadenamiento Veri*Factu en factura emitida',
    'Generar código QR con especificaciones oficiales de la Agencia Tributaria',
    'Añadir selector de almacén de origen en albaranes de salida',
    'Optimizar cálculo de coste medio ponderado en movimientos de inventario',
    'Crear modal centrado para selección de método de pago en citas',
    'Implementar temporizador Harvest persistente en base de datos con timestamps UTC',
    'Diseñar informe de auditoría de accesos con IP y geolocalización aproximada',
    'Configurar exportador a Excel con formato corporativo e internacionalización',
    'Verificar soporte multilingüe en 11 idiomas para mensajes de error del backend',
    'Añadir filtros avanzados por rango de fechas en libro de facturas emitidas',
    'Pruebas de regresión con extensiones oficiales de Google Chrome y Firefox'
  ];

  for (let i = 0; i < 35; i++) {
    const title = taskTitles[i % taskTitles.length] + (i >= taskTitles.length ? ` - Fase ${Math.floor(i / taskTitles.length) + 1}` : '');
    const status = i < 15 ? 'DONE' : (i < 25 ? 'IN_PROGRESS' : (i < 30 ? 'IN_REVIEW' : 'TODO'));
    const assignee = i % 2 === 0 ? adminUser : pmUser;
    const est = 4 + (i % 5) * 2;
    const logged = status === 'DONE' ? est : (status === 'IN_PROGRESS' ? est * 0.5 : 0);

    const task = await prisma.task.create({
      data: {
        projectId: i % 2 === 0 ? project1.id : project2.id,
        sprintId: i % 2 === 0 ? sprint2.id : sprint1.id,
        title: title,
        description: `Especificación técnica y criterios de aceptación para: ${title}.`,
        status: status,
        priority: i % 4 === 0 ? 'URGENT' : (i % 3 === 0 ? 'HIGH' : 'MEDIUM'),
        storyPoints: (i % 5) + 1,
        estimatedHours: est,
        loggedHours: logged,
        assigneeId: assignee.id,
      },
    });
    createdTasks.push(task);

    // Seed Harvest WorkLogs for logged time
    if (logged > 0) {
      await prisma.taskWorkLog.create({
        data: {
          taskId: task.id,
          userId: assignee.id,
          userName: assignee.name,
          hours: logged,
          description: `Desarrollo y pruebas unitarias de ${title}.`,
          isBillable: true,
          date: new Date(Date.now() - (i % 7) * 86400000),
        },
      });
    }
  }

  console.log('💬 Creating 5 Internal Chat Channels & 45 Team Messages...');
  const channelGeneral = await prisma.internalChatChannel.create({
    data: { name: 'general', type: 'DEPARTMENT', description: 'Canal general de la compañía para anuncios y novedades' },
  });
  const channelVentas = await prisma.internalChatChannel.create({
    data: { name: 'ventas', type: 'DEPARTMENT', description: 'Coordinación del equipo comercial, pipeline y acuerdos clave' },
  });
  const channelSoporte = await prisma.internalChatChannel.create({
    data: { name: 'soporte', type: 'DEPARTMENT', description: 'Resolución de incidencias críticas y SLAs de helpdesk' },
  });
  const channelProyectos = await prisma.internalChatChannel.create({
    data: { name: 'proyectos', type: 'PROJECT', description: 'Seguimiento de sprints técnicos y despliegues a producción' },
  });
  const channelAnuncios = await prisma.internalChatChannel.create({
    data: { name: 'anuncios', type: 'ANNOUNCEMENT', description: 'Comunicados de dirección y Recursos Humanos' },
  });
  const chatChannels = [channelGeneral, channelVentas, channelSoporte, channelProyectos, channelAnuncios];

  const teamMessagesText = [
    'Buenos días a todos. Hoy cerramos la release v0.1.0 con éxito.',
    'Excelente trabajo con el despliegue del nuevo servidor PostgreSQL.',
    '¿Alguien puede revisar la propuesta enviada a Logística Ibérica?',
    'Presupuesto aprobado por el comité de compras de Innovatech.',
    'Recordatorio: La demo con Biomedical Europa es a las 16:30 CET.',
    'Hemos mitigado el ticket URGENTE de webhook en menos de 20 minutos.',
    'Se han actualizado los catálogos en UnoPIM con 45 nuevos productos.',
    'La auditoría fiscal confirma compatibilidad total con Veri*Factu.',
    'Revisad el informe de fichajes en el panel de Recursos Humanos.',
    '¡Objetivo del sprint completado al 100%! Gracias a todo el equipo.'
  ];

  for (let i = 0; i < 45; i++) {
    const ch = chatChannels[i % chatChannels.length];
    const sender = i % 2 === 0 ? adminUser : pmUser;
    const txt = teamMessagesText[i % teamMessagesText.length];

    await prisma.internalChatMessage.create({
      data: {
        channelId: ch.id,
        senderId: sender.id,
        senderName: sender.name,
        text: txt,
        createdAt: new Date(Date.now() - (45 - i) * 1800000),
      },
    });
  }

  console.log('📱 Creating 40 WhatsApp & Email Omnichannel Messages...');
  for (let i = 0; i < 40; i++) {
    const contact = createdContacts[i % createdContacts.length];
    const isInbound = i % 2 === 0;

    await prisma.omniMessage.create({
      data: {
        contactId: contact.id,
        channel: i % 3 === 0 ? 'EMAIL' : 'WHATSAPP',
        direction: isInbound ? 'INBOUND' : 'OUTBOUND',
        sender: isInbound ? contact.email : 'DAMA-CRM Soporte',
        recipient: isInbound ? 'soporte@damacrm.com' : contact.phone,
        content: isInbound
          ? `Hola, queríamos consultar sobre el estado de nuestro pedido y la factura correspondiente. Muchas gracias, ${contact.firstName}.`
          : `Estimado/a ${contact.firstName}, su solicitud ha sido procesada con éxito. Ya puede descargar toda la documentación en su portal de cliente.`,
        timestamp: new Date(Date.now() - (40 - i) * 3600000),
        isRead: true,
      },
    });
  }

  console.log('👥 Creating 12 Employees, 36 Payrolls & 45 Harvest TimeRecords...');
  const employeesData = [
    { name: 'Ignacio', last: 'Brenas', email: 'ignaciobrenas@gmail.com', job: 'Director General & CTO', dep: 'ENGINEERING', sal: 4800.0, iban: 'ES91 2100 0418 4502 0005 1332', user: ignacioUser },
    { name: 'Carlos', last: 'Ruiz', email: 'pm@dama-crm.local', job: 'Director de Proyectos Ágiles', dep: 'ENGINEERING', sal: 3600.0, iban: 'ES76 0049 1500 0512 3456 7891', user: pmUser },
    { name: 'Laura', last: 'Gómez', email: 'ventas@dama-crm.local', job: 'Directora Comercial B2B', dep: 'SALES', sal: 3200.0, iban: 'ES76 0049 1500 0512 3456 7892', user: salesUser },
    { name: 'Alejandro', last: 'Morales', email: 'tech@dama-crm.local', job: 'Arquitecto Software Senior', dep: 'ENGINEERING', sal: 3900.0, iban: 'ES76 0049 1500 0512 3456 7893', user: techUser },
    { name: 'Beatriz', last: 'Navarro', email: 'soporte@dama-crm.local', job: 'Responsable de Helpdesk & SLA', dep: 'SUPPORT', sal: 2600.0, iban: 'ES76 0049 1500 0512 3456 7894', user: supportUser },
    { name: 'Marta', last: 'Delgado', email: 'rrhh@dama-crm.local', job: 'Responsable de Talento & RRHH', dep: 'HR', sal: 2900.0, iban: 'ES76 0049 1500 0512 3456 7895', user: hrUser },
    { name: 'Daniel', last: 'Navas', email: 'almacen@dama-crm.local', job: 'Jefe de Almacén y Logística', dep: 'OPERATIONS', sal: 2400.0, iban: 'ES76 0049 1500 0512 3456 7896', user: null },
    { name: 'Lucía', last: 'Méndez', email: 'lucia.mendez@damacrm.com', job: 'Especialista en Atención al Cliente', dep: 'SUPPORT', sal: 2100.0, iban: 'ES76 0049 1500 0512 3456 7897', user: null },
    { name: 'Sergio', last: 'Prieto', email: 'sergio.prieto@damacrm.com', job: 'Desarrollador FullStack React/Node', dep: 'ENGINEERING', sal: 3100.0, iban: 'ES76 0049 1500 0512 3456 7898', user: null },
    { name: 'Marina', last: 'Valero', email: 'marina.valero@damacrm.com', job: 'Ejecutiva de Cuentas Mid-Market', dep: 'SALES', sal: 2700.0, iban: 'ES76 0049 1500 0512 3456 7899', user: null },
    { name: 'Rubén', last: 'Castillo', email: 'ruben.castillo@damacrm.com', job: 'Técnico de Sistemas & Redes', dep: 'ENGINEERING', sal: 2800.0, iban: 'ES76 0049 1500 0512 3456 7810', user: null },
    { name: 'Teresa', last: 'Hidalgo', email: 'teresa.hidalgo@damacrm.com', job: 'Contable & Facturación', dep: 'FINANCE', sal: 2500.0, iban: 'ES76 0049 1500 0512 3456 7811', user: null }
  ];

  const createdEmployees: any[] = [];
  for (let i = 0; i < employeesData.length; i++) {
    const emp = employeesData[i];
    const created = await prisma.employee.create({
      data: {
        userId: emp.user ? emp.user.id : null,
        firstName: emp.name,
        lastName: emp.last,
        email: emp.email,
        phone: `+34 600 000 0${String(i + 1).padStart(2, '0')}`,
        jobTitle: emp.job,
        department: emp.dep,
        contractType: 'INDEFINIDO',
        baseSalary: emp.sal,
        iban: emp.iban,
        status: 'ACTIVE',
        odooEmployeeId: 100 + i + 1,
        tenantId: 'master',
      },
    });
    createdEmployees.push(created);

    // 3 payrolls per employee (August, September, October 2026)
    const months = [8, 9, 10];
    for (const m of months) {
      await prisma.payroll.create({
        data: {
          employeeId: created.id,
          month: m,
          year: 2026,
          baseSalary: emp.sal,
          bonuses: 250.0,
          deductions: Number((emp.sal * 0.18).toFixed(2)),
          netSalary: Number((emp.sal * 0.82 + 250.0).toFixed(2)),
          status: 'PAID',
          paidAt: new Date(2026, m - 1, 28),
          notes: `Nómina del mes ${m}/2026 abonada mediante transferencia SEPA.`,
          tenantId: 'master',
        },
      });
    }

    // Seed Harvest TimeRecords with accurate UTC timestamps
    for (let dayOffset = 1; dayOffset <= 4; dayOffset++) {
      const clockIn = new Date(Date.now() - dayOffset * 86400000 - 8 * 3600000);
      const clockOut = new Date(Date.now() - dayOffset * 86400000);
      await prisma.timeRecord.create({
        data: {
          employeeId: created.id,
          userId: emp.user ? emp.user.id : null,
          clockIn: clockIn,
          clockOut: clockOut,
          durationMinutes: 480,
          type: dayOffset % 2 === 0 ? 'WORK' : 'REMOTE',
          reason: dayOffset % 2 === 0 ? 'Oficina Central' : 'Teletrabajo',
          status: 'VALID',
          tenantId: 'master',
        },
      });
    }
  }

  console.log('📅 Creating 25 Corporate Calendar Events...');
  const eventTypes = ['MEETING', 'MILESTONE', 'CALL', 'DEADLINE'];
  for (let i = 0; i < 25; i++) {
    const contact = createdContacts[i % createdContacts.length];
    const start = new Date(Date.now() + (i * 2 - 10) * 86400000 + 10 * 3600000);
    const end = new Date(start.getTime() + 60 * 60000);

    await prisma.calendarEvent.create({
      data: {
        userId: adminUser.id,
        title: `Reunión de Coordinación Estratégica con ${contact.firstName} ${contact.lastName}`,
        description: 'Revisión periódica de objetivos, SLAs y evolución del proyecto contratado.',
        startDate: start,
        endDate: end,
        location: i % 2 === 0 ? 'Google Meet / Videollamada' : 'Sala de Juntas Principal',
        color: i % 3 === 0 ? '#3B82F6' : (i % 3 === 1 ? '#10B981' : '#F59E0B'),
        type: eventTypes[i % eventTypes.length],
        status: 'CONFIRMED',
        contactId: contact.id,
      },
    });
  }

  console.log('🔔 Creating 25 System Notifications...');
  const notifTypes = [
    { title: 'Factura Abonada', msg: 'La factura FAC-2026-0001 ha sido pagada por transferencia SEPA.', typ: 'invoice', prio: 'normal', url: '/invoicing' },
    { title: 'Nuevo Trato Ganado', msg: 'El trato "Plataforma Cloud ERP" ha pasado a Cerrada Ganada.', typ: 'deal', prio: 'high', url: '/pipeline' },
    { title: 'Envío Entregado', msg: 'El envío GLS-ES-20260001 ha sido entregado al destinatario.', typ: 'stock', prio: 'normal', url: '/logistics' },
    { title: 'Alerta SLA Helpdesk', msg: 'El ticket TCK-2026-0001 tiene tiempo de respuesta inferior a 2 horas.', typ: 'ticket', prio: 'urgent', url: '/tickets' },
    { title: 'Nueva Cita Confirmada', msg: 'Cita programada con Elena Martínez para el próximo lunes.', typ: 'lead', prio: 'normal', url: '/appointments' }
  ];

  for (let i = 0; i < 25; i++) {
    const n = notifTypes[i % notifTypes.length];
    await prisma.notification.create({
      data: {
        userId: adminUser.id,
        tenantId: 'master',
        title: `${n.title} (#${i + 1})`,
        message: n.msg,
        type: n.typ,
        priority: n.prio,
        actionUrl: n.url,
        read: i > 15,
        readAt: i > 15 ? new Date() : null,
      },
    });
  }

  console.log('------------------------------------------------------------------------');
  console.log('🌟 [ENTERPRISE SEED COMPLETED SUCCESSFULLY!]');
  console.log('   - 5 Tenants (master, acme, innovatech, ignacio-corp, etc.)');
  console.log('   - 12 Corporate Roles with full RBAC Matrix');
  console.log('   - 14 Users across all roles and departments');
  console.log('   - 32 Enterprise Companies across Spain and Europe');
  console.log('   - 64 Qualified Executive & Technical Contacts');
  console.log('   - 48 Pipeline Deals (€4.5K - €120K across all 6 stages)');
  console.log('   - 3 Physical Warehouses & Locations (Madrid, Barcelona, Valencia)');
  console.log('   - 45 Products with Multi-Warehouse Stock, FEFO Batches & Movements');
  console.log('   - 36 Logistics Shipments with Checkpoints (GLS, SEUR, Correos, DHL...)');
  console.log('   - 12 Universal Appointment Services & 40 Bookings');
  console.log('   - 35 Quotes & 45 Invoices with Veri*Factu AEAT compliance');
  console.log('   - 38 Helpdesk Tickets with SLA tracking and message threads');
  console.log('   - 32 Corporate Expenses (Software, Legal, Utilities, Operational)');
  console.log('   - 6 Agile Projects, 12 Sprints, 35 Tasks & Harvest WorkLogs');
  console.log('   - 5 Internal Chat Channels & 45 Team Messages');
  console.log('   - 40 WhatsApp & Email Omnichannel Messages');
  console.log('   - 12 Employees, 36 Monthly Payrolls & 45 Harvest TimeRecords');
  console.log('   - 25 Calendar Events & 25 System Notifications');
  console.log('------------------------------------------------------------------------');
  console.log('🔑 Credenciales de Acceso:');
  console.log('   Admin:      ignaciobrenas@gmail.com / 1');
  console.log('   Admin Org:  admin@dama-crm.local / Admin1234!');
  console.log('   Ventas:     ventas@dama-crm.local / Dama2026!');
  console.log('   PM:         pm@dama-crm.local / Dama2026!');
  console.log('   Tech:       tech@dama-crm.local / Dama2026!');
  console.log('   Soporte:    soporte@dama-crm.local / Dama2026!');
  console.log('   RRHH:       rrhh@dama-crm.local / Dama2026!');
  console.log('------------------------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error executing Enterprise Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
