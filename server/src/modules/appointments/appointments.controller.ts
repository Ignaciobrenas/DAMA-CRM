import { Request, Response } from 'express';
import { prisma } from '../../prisma';

export interface SalonServiceItem {
  id: string;
  name: string;
  category: 'CONSULTATION' | 'TECHNICAL' | 'ADVISORY' | 'SERVICE' | 'TREATMENT' | 'OTHER' | 'HAIRDRESSING' | 'BEAUTY' | 'BARBER' | 'MASSAGE';
  durationMin: number;
  price: number;
  supplyCost: number;
  description?: string;
  isPopular?: boolean;
}

export interface AppointmentData {
  id: string;
  tenantId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  contactId?: string;
  staffId: string;
  staffName: string;
  serviceIds: string[];
  services: SalonServiceItem[];
  startTime: string;
  endTime: string;
  durationMin: number;
  totalPrice: number;
  totalSupplyCost: number;
  estimatedProfit: number;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  paymentMethod?: 'CASH' | 'CARD' | 'BIZUM' | 'TRANSFER';
  notes?: string;
  invoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_SERVICES: SalonServiceItem[] = [
  {
    id: 'srv-consultoria-estrategica',
    name: 'Consultoría Estratégica & Diagnóstico Inicial',
    category: 'CONSULTATION',
    durationMin: 60,
    price: 85.0,
    supplyCost: 5.0,
    description: 'Sesión de análisis de negocio, detección de necesidades y hoja de ruta personalizada',
    isPopular: true,
  },
  {
    id: 'srv-auditoria-tecnica',
    name: 'Auditoría Técnica y Plan de Acción',
    category: 'TECHNICAL',
    durationMin: 90,
    price: 120.0,
    supplyCost: 10.0,
    description: 'Revisión exhaustiva de sistemas, procesos y entrega de informe ejecutivo',
    isPopular: true,
  },
  {
    id: 'srv-asesoramiento-fiscal',
    name: 'Sesión de Asesoramiento Personalizado',
    category: 'ADVISORY',
    durationMin: 45,
    price: 65.0,
    supplyCost: 2.5,
    description: 'Resolución de dudas especializadas, planificación y recomendaciones operativas',
    isPopular: true,
  },
  {
    id: 'srv-mantenimiento-preventivo',
    name: 'Mantenimiento Preventivo & Optimización',
    category: 'SERVICE',
    durationMin: 60,
    price: 75.0,
    supplyCost: 8.0,
    description: 'Inspección de calidad, puesta a punto preventiva y ajuste de parámetros',
    isPopular: false,
  },
  {
    id: 'srv-revision-periodica',
    name: 'Revisión Periódica de Seguimiento',
    category: 'SERVICE',
    durationMin: 30,
    price: 45.0,
    supplyCost: 2.0,
    description: 'Control de avances, revisión de hitos clave y soporte directo',
    isPopular: true,
  },
];

/**
 * Ensure default services exist in Database
 */
async function ensureDbServices(tenantId: string): Promise<any[]> {
  let services = await prisma.appointmentService.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });

  if (services.length === 0) {
    for (const s of DEFAULT_SERVICES) {
      await prisma.appointmentService.create({
        data: {
          id: s.id,
          tenantId,
          name: s.name,
          category: s.category,
          durationMin: s.durationMin,
          price: s.price,
          supplyCost: s.supplyCost,
          description: s.description,
          isPopular: s.isPopular,
        },
      });
    }
    services = await prisma.appointmentService.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  return services;
}

/**
 * Ensure default sample appointments exist in Database
 */
async function ensureDbAppointments(tenantId: string): Promise<any[]> {
  let appointments = await prisma.appointment.findMany({
    where: { tenantId },
    orderBy: { startTime: 'desc' },
  });

  if (appointments.length === 0) {
    const services = await ensureDbServices(tenantId);
    const selectedSrv = services[1] || services[0];

    await prisma.appointment.create({
      data: {
        id: 'apt-001',
        tenantId,
        clientName: 'Elena Ramos García',
        clientPhone: '+34 612 345 678',
        clientEmail: 'elena.ramos@example.com',
        staffId: 'staff-1',
        staffName: 'Ignacio (Especialista Senior)',
        serviceIds: JSON.stringify([selectedSrv.id]),
        servicesDetails: JSON.stringify([selectedSrv]),
        startTime: new Date(new Date().setHours(10, 0, 0, 0)),
        endTime: new Date(new Date().setHours(11, 30, 0, 0)),
        durationMin: 90,
        totalPrice: selectedSrv.price || 120.0,
        totalSupplyCost: selectedSrv.supplyCost || 10.0,
        estimatedProfit: (selectedSrv.price || 120.0) - (selectedSrv.supplyCost || 10.0),
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        notes: 'Revisión inicial del plan de trabajo y validación de requisitos.',
      },
    });

    appointments = await prisma.appointment.findMany({
      where: { tenantId },
      orderBy: { startTime: 'desc' },
    });
  }

  return appointments;
}

/**
 * GET /api/appointments/services
 * Get list of salon & beauty services from DB
 */
export async function listServices(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const services = await ensureDbServices(tenantId);
    res.json({ success: true, data: services });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/appointments/services
 * Create or update a service in DB
 */
export async function createOrUpdateService(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const { id, name, category, durationMin, price, supplyCost, description, isPopular } = req.body;

    if (!name || price === undefined) {
      res.status(400).json({ success: false, message: 'El nombre y precio del servicio son obligatorios' });
      return;
    }

    const serviceId = id || `srv-${Date.now()}`;
    const upserted = await prisma.appointmentService.upsert({
      where: { id: serviceId },
      create: {
        id: serviceId,
        tenantId,
        name,
        category: category || 'CONSULTATION',
        durationMin: Number(durationMin) || 30,
        price: Number(price),
        supplyCost: Number(supplyCost) || 0,
        description,
        isPopular: Boolean(isPopular),
      },
      update: {
        name,
        category: category || 'CONSULTATION',
        durationMin: Number(durationMin) || 30,
        price: Number(price),
        supplyCost: Number(supplyCost) || 0,
        description,
        isPopular: Boolean(isPopular),
      },
    });

    res.status(201).json({ success: true, data: upserted });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/appointments
 * List all scheduled appointments with optional date, staff, or status filters from DB
 */
export async function listAppointments(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const { startDate, endDate, staffId, status, query } = req.query;

    const rawAppointments = await ensureDbAppointments(tenantId);

    let appointments: AppointmentData[] = rawAppointments.map((a: any) => ({
      id: a.id,
      tenantId: a.tenantId || tenantId,
      clientName: a.clientName,
      clientPhone: a.clientPhone || undefined,
      clientEmail: a.clientEmail || undefined,
      contactId: a.contactId || undefined,
      staffId: a.staffId || 'staff-default',
      staffName: a.staffName,
      serviceIds: typeof a.serviceIds === 'string' ? JSON.parse(a.serviceIds) : a.serviceIds || [],
      services: typeof a.servicesDetails === 'string' ? JSON.parse(a.servicesDetails) : a.servicesDetails || [],
      startTime: a.startTime instanceof Date ? a.startTime.toISOString() : a.startTime,
      endTime: a.endTime instanceof Date ? a.endTime.toISOString() : a.endTime,
      durationMin: a.durationMin,
      totalPrice: a.totalPrice,
      totalSupplyCost: a.totalSupplyCost,
      estimatedProfit: a.estimatedProfit,
      status: a.status as any,
      paymentStatus: a.paymentStatus as any,
      paymentMethod: a.paymentMethod || undefined,
      notes: a.notes || undefined,
      invoiceId: a.invoiceId || undefined,
      createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
      updatedAt: a.updatedAt instanceof Date ? a.updatedAt.toISOString() : a.updatedAt,
    }));

    if (status && typeof status === 'string') {
      appointments = appointments.filter((a) => a.status === status);
    }
    if (staffId && typeof staffId === 'string') {
      appointments = appointments.filter((a) => a.staffId === staffId);
    }
    if (startDate && typeof startDate === 'string') {
      const start = new Date(startDate).getTime();
      appointments = appointments.filter((a) => new Date(a.startTime).getTime() >= start);
    }
    if (endDate && typeof endDate === 'string') {
      const end = new Date(endDate).getTime();
      appointments = appointments.filter((a) => new Date(a.startTime).getTime() <= end);
    }
    if (query && typeof query === 'string') {
      const q = query.toLowerCase();
      appointments = appointments.filter(
        (a) =>
          a.clientName.toLowerCase().includes(q) ||
          a.clientPhone?.toLowerCase().includes(q) ||
          a.staffName.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, data: appointments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/appointments
 * Create a new appointment in DB
 */
export async function createAppointment(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const {
      clientName,
      clientPhone,
      clientEmail,
      contactId,
      staffId,
      staffName,
      serviceIds,
      startTime,
      notes,
    } = req.body;

    if (!clientName || !staffName || !serviceIds || !startTime) {
      res.status(400).json({
        success: false,
        message: 'Cliente, profesional, servicios y hora de inicio son requeridos',
      });
      return;
    }

    const allServices = await ensureDbServices(tenantId);
    const selectedServices = allServices.filter((s: any) => serviceIds.includes(s.id));

    const durationMin = selectedServices.reduce((acc: number, s: any) => acc + (s.durationMin || 30), 0);
    const totalPrice = selectedServices.reduce((acc: number, s: any) => acc + s.price, 0);
    const totalSupplyCost = selectedServices.reduce((acc: number, s: any) => acc + (s.supplyCost || 0), 0);
    const estimatedProfit = totalPrice - totalSupplyCost;

    const startObj = new Date(startTime);
    const endObj = new Date(startObj.getTime() + (durationMin || 30) * 60 * 1000);
    const aptId = `apt-${Date.now()}`;

    const created = await prisma.appointment.create({
      data: {
        id: aptId,
        tenantId,
        clientName,
        clientPhone,
        clientEmail,
        contactId,
        staffId: staffId || 'staff-default',
        staffName,
        serviceIds: JSON.stringify(serviceIds),
        servicesDetails: JSON.stringify(selectedServices),
        startTime: startObj,
        endTime: endObj,
        durationMin: durationMin || 30,
        totalPrice,
        totalSupplyCost,
        estimatedProfit,
        status: 'SCHEDULED',
        paymentStatus: 'PENDING',
        notes,
      },
    });

    // Sync to Calendar if user exists
    if (req.user?.id) {
      try {
        await prisma.calendarEvent.create({
          data: {
            tenantId,
            userId: req.user.id,
            title: `Cita: ${clientName} (${selectedServices.map((s: any) => s.name).join(', ')})`,
            description: `Servicios: ${selectedServices.map((s: any) => s.name).join(', ')}\nIngresos estimados: ${totalPrice.toFixed(2)}€\nNotas: ${notes || 'Sin notas'}`,
            startDate: startObj,
            endDate: endObj,
            type: 'APPOINTMENT',
            color: '#EC4899',
            status: 'CONFIRMED',
          },
        });
      } catch {}
    }

    const formattedData: AppointmentData = {
      id: created.id,
      tenantId,
      clientName: created.clientName,
      clientPhone: created.clientPhone || undefined,
      clientEmail: created.clientEmail || undefined,
      contactId: created.contactId || undefined,
      staffId: created.staffId || 'staff-default',
      staffName: created.staffName,
      serviceIds,
      services: selectedServices,
      startTime: created.startTime.toISOString(),
      endTime: created.endTime.toISOString(),
      durationMin: created.durationMin,
      totalPrice: created.totalPrice,
      totalSupplyCost: created.totalSupplyCost,
      estimatedProfit: created.estimatedProfit,
      status: created.status as any,
      paymentStatus: created.paymentStatus as any,
      notes: created.notes || undefined,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };

    res.status(201).json({ success: true, data: formattedData });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * PUT /api/appointments/:id
 * Update appointment details in DB
 */
export async function updateAppointment(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const { id } = req.params;
    const updates = req.body;

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Cita no encontrada' });
      return;
    }

    let serviceIds = updates.serviceIds ? updates.serviceIds : JSON.parse(existing.serviceIds || '[]');
    let selectedServices = existing.servicesDetails ? JSON.parse(existing.servicesDetails) : [];

    if (updates.serviceIds) {
      const allServices = await ensureDbServices(tenantId);
      selectedServices = allServices.filter((s: any) => serviceIds.includes(s.id));
    }

    const durationMin = selectedServices.reduce((acc: number, s: any) => acc + (s.durationMin || 30), 0);
    const totalPrice = selectedServices.reduce((acc: number, s: any) => acc + (s.price || 0), 0);
    const totalSupplyCost = selectedServices.reduce((acc: number, s: any) => acc + (s.supplyCost || 0), 0);
    const estimatedProfit = totalPrice - totalSupplyCost;

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        clientName: updates.clientName !== undefined ? updates.clientName : existing.clientName,
        clientPhone: updates.clientPhone !== undefined ? updates.clientPhone : existing.clientPhone,
        clientEmail: updates.clientEmail !== undefined ? updates.clientEmail : existing.clientEmail,
        staffId: updates.staffId !== undefined ? updates.staffId : existing.staffId,
        staffName: updates.staffName !== undefined ? updates.staffName : existing.staffName,
        serviceIds: JSON.stringify(serviceIds),
        servicesDetails: JSON.stringify(selectedServices),
        durationMin,
        totalPrice,
        totalSupplyCost,
        estimatedProfit,
        status: updates.status !== undefined ? updates.status : existing.status,
        paymentStatus: updates.paymentStatus !== undefined ? updates.paymentStatus : existing.paymentStatus,
        paymentMethod: updates.paymentMethod !== undefined ? updates.paymentMethod : existing.paymentMethod,
        notes: updates.notes !== undefined ? updates.notes : existing.notes,
      },
    });

    const formatted: AppointmentData = {
      id: updated.id,
      tenantId: updated.tenantId || tenantId,
      clientName: updated.clientName,
      clientPhone: updated.clientPhone || undefined,
      clientEmail: updated.clientEmail || undefined,
      contactId: updated.contactId || undefined,
      staffId: updated.staffId || 'staff-default',
      staffName: updated.staffName,
      serviceIds,
      services: selectedServices,
      startTime: updated.startTime.toISOString(),
      endTime: updated.endTime.toISOString(),
      durationMin: updated.durationMin,
      totalPrice: updated.totalPrice,
      totalSupplyCost: updated.totalSupplyCost,
      estimatedProfit: updated.estimatedProfit,
      status: updated.status as any,
      paymentStatus: updated.paymentStatus as any,
      paymentMethod: updated.paymentMethod as any,
      notes: updated.notes || undefined,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    res.json({ success: true, data: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * DELETE /api/appointments/:id
 * Remove an appointment from DB
 */
export async function deleteAppointment(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await prisma.appointment.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Cita no encontrada' });
      return;
    }

    await prisma.appointment.delete({ where: { id } });
    res.json({ success: true, message: 'Cita eliminada correctamente' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/appointments/stats/revenue
 * Get aggregated revenue, projected earnings, ticket average and occupation from DB
 */
export async function getRevenueStats(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const rawAppts = await ensureDbAppointments(tenantId);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const todayAppointments = rawAppts.filter((a) => {
      const d = new Date(a.startTime).toISOString().split('T')[0];
      return d === todayStr && a.status !== 'CANCELLED';
    });

    const todayEstimatedRevenue = todayAppointments.reduce((sum, a) => sum + (a.totalPrice || 0), 0);
    const todayRealizedRevenue = todayAppointments
      .filter((a) => a.status === 'COMPLETED' || a.paymentStatus === 'PAID')
      .reduce((sum, a) => sum + (a.totalPrice || 0), 0);

    const todayEstimatedProfit = todayAppointments.reduce((sum, a) => sum + (a.estimatedProfit || 0), 0);

    const monthAppointments = rawAppts.filter((a) => {
      const date = new Date(a.startTime);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear && a.status !== 'CANCELLED';
    });

    const monthEstimatedRevenue = monthAppointments.reduce((sum, a) => sum + (a.totalPrice || 0), 0);
    const monthRealizedRevenue = monthAppointments
      .filter((a) => a.status === 'COMPLETED' || a.paymentStatus === 'PAID')
      .reduce((sum, a) => sum + (a.totalPrice || 0), 0);

    const monthEstimatedProfit = monthAppointments.reduce((sum, a) => sum + (a.estimatedProfit || 0), 0);

    const totalActiveAppointments = monthAppointments.length;
    const averageTicket = totalActiveAppointments > 0 ? monthEstimatedRevenue / totalActiveAppointments : 0;
    const profitMarginPercent = monthEstimatedRevenue > 0 ? (monthEstimatedProfit / monthEstimatedRevenue) * 100 : 0;

    const staffMap: Record<string, { staffName: string; totalRevenue: number; appointmentCount: number }> = {};
    for (const apt of monthAppointments) {
      if (!staffMap[apt.staffName]) {
        staffMap[apt.staffName] = { staffName: apt.staffName, totalRevenue: 0, appointmentCount: 0 };
      }
      staffMap[apt.staffName].totalRevenue += apt.totalPrice || 0;
      staffMap[apt.staffName].appointmentCount += 1;
    }
    const staffBreakdown = Object.values(staffMap).sort((a, b) => b.totalRevenue - a.totalRevenue);

    const serviceMap: Record<string, { serviceName: string; count: number; revenue: number }> = {};
    for (const apt of monthAppointments) {
      const services = typeof apt.servicesDetails === 'string' ? JSON.parse(apt.servicesDetails) : apt.servicesDetails || [];
      for (const s of services) {
        if (!serviceMap[s.name]) {
          serviceMap[s.name] = { serviceName: s.name, count: 0, revenue: 0 };
        }
        serviceMap[s.name].count += 1;
        serviceMap[s.name].revenue += s.price || 0;
      }
    }
    const topServices = Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue);

    res.json({
      success: true,
      data: {
        today: {
          estimatedRevenue: todayEstimatedRevenue,
          realizedRevenue: todayRealizedRevenue,
          estimatedProfit: todayEstimatedProfit,
          appointmentCount: todayAppointments.length,
          completedCount: todayAppointments.filter((a) => a.status === 'COMPLETED').length,
        },
        month: {
          estimatedRevenue: monthEstimatedRevenue,
          realizedRevenue: monthRealizedRevenue,
          estimatedProfit: monthEstimatedProfit,
          totalAppointments: totalActiveAppointments,
          averageTicket: Number(averageTicket.toFixed(2)),
          profitMarginPercent: Number(profitMarginPercent.toFixed(1)),
        },
        staffBreakdown,
        topServices,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/appointments/export/csv
 * Export appointments from DB to CSV / Excel
 */
export async function exportAppointmentsCsv(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const rawAppts = await ensureDbAppointments(tenantId);
    const { generateCsvBuffer } = await import('../../services/report-exporter.service');

    const headers = [
      'ID Cita',
      'Fecha',
      'Hora Inicio',
      'Hora Fin',
      'Cliente',
      'Teléfono',
      'Email',
      'Profesional / Especialista',
      'Servicios',
      'Duración (min)',
      'Precio Total (€)',
      'Coste Insumos / Operativo (€)',
      'Beneficio Neto (€)',
      'Estado Cita',
      'Estado Pago',
      'Método Pago',
      'Notas',
    ];

    const rows = rawAppts.map((a: any) => {
      const sDate = new Date(a.startTime);
      const eDate = new Date(a.endTime);
      const services = typeof a.servicesDetails === 'string' ? JSON.parse(a.servicesDetails) : a.servicesDetails || [];
      return [
        a.id,
        sDate.toLocaleDateString('es-ES'),
        sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        eDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        a.clientName,
        a.clientPhone || '',
        a.clientEmail || '',
        a.staffName,
        services.map((s: any) => s.name).join(' + '),
        a.durationMin,
        (a.totalPrice || 0).toFixed(2),
        (a.totalSupplyCost || 0).toFixed(2),
        (a.estimatedProfit || 0).toFixed(2),
        a.status,
        a.paymentStatus,
        a.paymentMethod || 'PENDIENTE',
        a.notes || '',
      ];
    });

    const csvBuf = generateCsvBuffer(headers, rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=citas_servicios_${tenantId}_${Date.now()}.csv`);
    res.send(csvBuf);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/appointments/export/pdf
 * Export official Professional Services & Appointments PDF Report from DB
 */
export async function exportAppointmentsPdf(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const rawAppts = await ensureDbAppointments(tenantId);
    const { generateReportPdf } = await import('../../services/report-exporter.service');

    const totalRevenue = rawAppts.reduce((sum, a) => sum + (a.status !== 'CANCELLED' ? (a.totalPrice || 0) : 0), 0);
    const totalProfit = rawAppts.reduce((sum, a) => sum + (a.status !== 'CANCELLED' ? (a.estimatedProfit || 0) : 0), 0);
    const completedCount = rawAppts.filter((a) => a.status === 'COMPLETED').length;

    const tableHeaders = ['Fecha / Hora', 'Cliente', 'Profesional', 'Servicios', 'Total (€)', 'Estado'];
    const tableRows = rawAppts.slice(0, 40).map((a: any) => {
      const services = typeof a.servicesDetails === 'string' ? JSON.parse(a.servicesDetails) : a.servicesDetails || [];
      return [
        `${new Date(a.startTime).toLocaleDateString('es-ES')} ${new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        a.clientName,
        a.staffName.split(' ')[0],
        services.map((s: any) => s.name).join(', ').slice(0, 30),
        `${(a.totalPrice || 0).toFixed(2)}€`,
        a.status === 'COMPLETED' ? 'Completada' : a.status === 'CONFIRMED' ? 'Confirmada' : a.status,
      ];
    });

    const pdfBuf = await generateReportPdf({
      title: 'Informe de Citas, Servicios Profesionales & Estimación de Ingresos',
      subtitle: 'Resumen financiero de reservas, ocupación de especialistas y rentabilidad neta',
      companyName: 'DAMA-CRM Professional Services',
      dateRange: `Mes de ${new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}`,
      kpis: [
        { label: 'Facturación Prevista', value: `${totalRevenue.toFixed(2)}€`, color: '#3B82F6' },
        { label: 'Beneficio Neto Estimado', value: `${totalProfit.toFixed(2)}€`, color: '#10B981' },
        { label: 'Citas Realizadas', value: completedCount, color: '#6366F1' },
        { label: 'Total Reservas', value: rawAppts.length, color: '#8B5CF6' },
      ],
      tableHeaders,
      tableRows,
      summaryNotes: [
        '* El beneficio neto se calcula deduciendo los costes de suministros u operativos directos del importe total.',
        '* Informe oficial generado para control de facturación, rendimientos y liquidaciones profesionales.',
      ],
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=informe_citas_servicios_${tenantId}_${Date.now()}.pdf`);
    res.send(pdfBuf);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
