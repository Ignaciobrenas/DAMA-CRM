import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import fs from 'fs';
import path from 'path';

// Services catalog storage path per tenant (fallback persistent storage)
const DATA_DIR = path.resolve(__dirname, '../../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface SalonServiceItem {
  id: string;
  name: string;
  category: 'CONSULTATION' | 'TECHNICAL' | 'ADVISORY' | 'SERVICE' | 'TREATMENT' | 'OTHER' | 'HAIRDRESSING' | 'BEAUTY' | 'BARBER' | 'MASSAGE';
  durationMin: number;
  price: number;
  supplyCost: number; // Coste de materiales o suministros directos
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
  startTime: string; // ISO String
  endTime: string; // ISO String
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

function getServicesFilePath(tenantId: string): string {
  return path.join(DATA_DIR, `services_${tenantId}.json`);
}

function getAppointmentsFilePath(tenantId: string): string {
  return path.join(DATA_DIR, `appointments_${tenantId}.json`);
}

function loadServices(tenantId: string): SalonServiceItem[] {
  const filePath = getServicesFilePath(tenantId);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(DEFAULT_SERVICES, null, 2), 'utf8');
    return DEFAULT_SERVICES;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return DEFAULT_SERVICES;
  }
}

function saveServices(tenantId: string, services: SalonServiceItem[]): void {
  fs.writeFileSync(getServicesFilePath(tenantId), JSON.stringify(services, null, 2), 'utf8');
}

function loadAppointments(tenantId: string): AppointmentData[] {
  const filePath = getAppointmentsFilePath(tenantId);
  if (!fs.existsSync(filePath)) {
    // Generate starter sample appointments for today and this week
    const starter: AppointmentData[] = [
      {
        id: 'apt-001',
        tenantId,
        clientName: 'Elena Ramos García',
        clientPhone: '+34 612 345 678',
        clientEmail: 'elena.ramos@example.com',
        staffId: 'staff-1',
        staffName: 'Ignacio (Especialista Senior)',
        serviceIds: ['srv-auditoria-tecnica'],
        services: [DEFAULT_SERVICES[1]],
        startTime: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
        endTime: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(),
        durationMin: 90,
        totalPrice: 120.0,
        totalSupplyCost: 10.0,
        estimatedProfit: 110.0,
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        notes: 'Revisión inicial del plan de trabajo y validación de requisitos.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'apt-002',
        tenantId,
        clientName: 'Carlos Mendoza',
        clientPhone: '+34 689 987 654',
        clientEmail: 'carlos.m@example.com',
        staffId: 'staff-1',
        staffName: 'Ignacio (Especialista Senior)',
        serviceIds: ['srv-asesoramiento-fiscal'],
        services: [DEFAULT_SERVICES[2]],
        startTime: new Date(new Date().setHours(12, 30, 0, 0)).toISOString(),
        endTime: new Date(new Date().setHours(13, 15, 0, 0)).toISOString(),
        durationMin: 45,
        totalPrice: 65.0,
        totalSupplyCost: 2.5,
        estimatedProfit: 62.5,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        paymentMethod: 'BIZUM',
        notes: 'Sesión de asesoramiento completada con éxito.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'apt-003',
        tenantId,
        clientName: 'Laura Valero',
        clientPhone: '+34 655 443 322',
        clientEmail: 'laura.v@example.com',
        staffId: 'staff-2',
        staffName: 'Sofía Martínez (Consultor Senior)',
        serviceIds: ['srv-consultoria-estrategica'],
        services: [DEFAULT_SERVICES[0]],
        startTime: new Date(new Date().setHours(16, 0, 0, 0)).toISOString(),
        endTime: new Date(new Date().setHours(17, 0, 0, 0)).toISOString(),
        durationMin: 60,
        totalPrice: 85.0,
        totalSupplyCost: 5.0,
        estimatedProfit: 80.0,
        status: 'SCHEDULED',
        paymentStatus: 'PENDING',
        notes: 'Primera reunión de diagnóstico.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(filePath, JSON.stringify(starter, null, 2), 'utf8');
    return starter;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}

function saveAppointments(tenantId: string, appointments: AppointmentData[]): void {
  fs.writeFileSync(getAppointmentsFilePath(tenantId), JSON.stringify(appointments, null, 2), 'utf8');
}

/**
 * GET /api/appointments/services
 * Get list of salon & beauty services
 */
export async function listServices(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const services = loadServices(tenantId);
    res.json({ success: true, data: services });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/appointments/services
 * Create or update a service
 */
export async function createOrUpdateService(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const { id, name, category, durationMin, price, supplyCost, description, isPopular } = req.body;

    if (!name || !price) {
      res.status(400).json({ success: false, message: 'El nombre y precio del servicio son obligatorios' });
      return;
    }

    const services = loadServices(tenantId);
    const existingIndex = services.findIndex((s) => s.id === id);

    const serviceObj: SalonServiceItem = {
      id: id || `srv-${Date.now()}`,
      name,
      category: category || 'HAIRDRESSING',
      durationMin: Number(durationMin) || 30,
      price: Number(price),
      supplyCost: Number(supplyCost) || 0,
      description,
      isPopular: Boolean(isPopular),
    };

    if (existingIndex >= 0) {
      services[existingIndex] = serviceObj;
    } else {
      services.push(serviceObj);
    }

    saveServices(tenantId, services);
    res.status(201).json({ success: true, data: serviceObj });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/appointments
 * List all scheduled appointments with optional date, staff, or status filters
 */
export async function listAppointments(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const { startDate, endDate, staffId, status, query } = req.query;

    let appointments = loadAppointments(tenantId);

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

    // Sort by startTime descending
    appointments.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    res.json({ success: true, data: appointments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/appointments
 * Create a new appointment and calculate revenue / supply costs
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

    const allServices = loadServices(tenantId);
    const selectedServices = allServices.filter((s) => serviceIds.includes(s.id));

    const durationMin = selectedServices.reduce((acc, s) => acc + (s.durationMin || 30), 0);
    const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0);
    const totalSupplyCost = selectedServices.reduce((acc, s) => acc + (s.supplyCost || 0), 0);
    const estimatedProfit = totalPrice - totalSupplyCost;

    const startObj = new Date(startTime);
    const endObj = new Date(startObj.getTime() + durationMin * 60 * 1000);

    const newAppointment: AppointmentData = {
      id: `apt-${Date.now()}`,
      tenantId,
      clientName,
      clientPhone,
      clientEmail,
      contactId,
      staffId: staffId || 'staff-default',
      staffName,
      serviceIds,
      services: selectedServices,
      startTime: startObj.toISOString(),
      endTime: endObj.toISOString(),
      durationMin,
      totalPrice,
      totalSupplyCost,
      estimatedProfit,
      status: 'SCHEDULED',
      paymentStatus: 'PENDING',
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const appointments = loadAppointments(tenantId);
    appointments.unshift(newAppointment);
    saveAppointments(tenantId, appointments);

    // Sync to Calendar if user exists
    if (req.user?.id) {
      try {
        await prisma.calendarEvent.create({
          data: {
            tenantId,
            userId: req.user.id,
            title: `Cita: ${clientName} (${selectedServices.map((s) => s.name).join(', ')})`,
            description: `Servicios: ${selectedServices.map((s) => s.name).join(', ')}\nIngresos estimados: ${totalPrice.toFixed(2)}€\nNotas: ${notes || 'Sin notas'}`,
            startDate: startObj,
            endDate: endObj,
            type: 'APPOINTMENT',
            color: '#EC4899', // Pink theme for appointments & salon
            status: 'CONFIRMED',
          },
        });
      } catch {}
    }

    res.status(201).json({ success: true, data: newAppointment });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * PUT /api/appointments/:id
 * Update appointment details, status or payment
 */
export async function updateAppointment(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const { id } = req.params;
    const updates = req.body;

    const appointments = loadAppointments(tenantId);
    const index = appointments.findIndex((a) => a.id === id);

    if (index === -1) {
      res.status(404).json({ success: false, message: 'Cita no encontrada' });
      return;
    }

    const current = appointments[index];
    const updated: AppointmentData = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // If services changed, recalculate metrics
    if (updates.serviceIds) {
      const allServices = loadServices(tenantId);
      const selected = allServices.filter((s) => updates.serviceIds.includes(s.id));
      updated.services = selected;
      updated.durationMin = selected.reduce((acc, s) => acc + (s.durationMin || 30), 0);
      updated.totalPrice = selected.reduce((acc, s) => acc + s.price, 0);
      updated.totalSupplyCost = selected.reduce((acc, s) => acc + (s.supplyCost || 0), 0);
      updated.estimatedProfit = updated.totalPrice - updated.totalSupplyCost;
    }

    appointments[index] = updated;
    saveAppointments(tenantId, appointments);

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * DELETE /api/appointments/:id
 * Remove an appointment
 */
export async function deleteAppointment(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const { id } = req.params;

    let appointments = loadAppointments(tenantId);
    const exists = appointments.some((a) => a.id === id);

    if (!exists) {
      res.status(404).json({ success: false, message: 'Cita no encontrada' });
      return;
    }

    appointments = appointments.filter((a) => a.id !== id);
    saveAppointments(tenantId, appointments);

    res.json({ success: true, message: 'Cita eliminada correctamente' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/appointments/stats/revenue
 * Get aggregated revenue, projected earnings, ticket average and occupation
 */
export async function getRevenueStats(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const appointments = loadAppointments(tenantId);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Today's stats
    const todayAppointments = appointments.filter((a) => {
      const d = new Date(a.startTime).toISOString().split('T')[0];
      return d === todayStr && a.status !== 'CANCELLED';
    });

    const todayEstimatedRevenue = todayAppointments.reduce((sum, a) => sum + a.totalPrice, 0);
    const todayRealizedRevenue = todayAppointments
      .filter((a) => a.status === 'COMPLETED' || a.paymentStatus === 'PAID')
      .reduce((sum, a) => sum + a.totalPrice, 0);

    const todayEstimatedProfit = todayAppointments.reduce((sum, a) => sum + a.estimatedProfit, 0);

    // Month's stats
    const monthAppointments = appointments.filter((a) => {
      const date = new Date(a.startTime);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear && a.status !== 'CANCELLED';
    });

    const monthEstimatedRevenue = monthAppointments.reduce((sum, a) => sum + a.totalPrice, 0);
    const monthRealizedRevenue = monthAppointments
      .filter((a) => a.status === 'COMPLETED' || a.paymentStatus === 'PAID')
      .reduce((sum, a) => sum + a.totalPrice, 0);

    const monthEstimatedProfit = monthAppointments.reduce((sum, a) => sum + a.estimatedProfit, 0);

    const totalActiveAppointments = monthAppointments.length;
    const averageTicket = totalActiveAppointments > 0 ? monthEstimatedRevenue / totalActiveAppointments : 0;
    const profitMarginPercent = monthEstimatedRevenue > 0 ? (monthEstimatedProfit / monthEstimatedRevenue) * 100 : 0;

    // Breakdown by Staff
    const staffMap: Record<string, { staffName: string; totalRevenue: number; appointmentCount: number }> = {};
    for (const apt of monthAppointments) {
      if (!staffMap[apt.staffName]) {
        staffMap[apt.staffName] = { staffName: apt.staffName, totalRevenue: 0, appointmentCount: 0 };
      }
      staffMap[apt.staffName].totalRevenue += apt.totalPrice;
      staffMap[apt.staffName].appointmentCount += 1;
    }
    const staffBreakdown = Object.values(staffMap).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Breakdown by Service
    const serviceMap: Record<string, { serviceName: string; count: number; revenue: number }> = {};
    for (const apt of monthAppointments) {
      for (const s of apt.services) {
        if (!serviceMap[s.name]) {
          serviceMap[s.name] = { serviceName: s.name, count: 0, revenue: 0 };
        }
        serviceMap[s.name].count += 1;
        serviceMap[s.name].revenue += s.price;
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
 * Export appointments to CSV / Excel
 */
export async function exportAppointmentsCsv(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const appointments = loadAppointments(tenantId);
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

    const rows = appointments.map((a) => {
      const sDate = new Date(a.startTime);
      const eDate = new Date(a.endTime);
      return [
        a.id,
        sDate.toLocaleDateString('es-ES'),
        sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        eDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        a.clientName,
        a.clientPhone || '',
        a.clientEmail || '',
        a.staffName,
        a.services.map((s) => s.name).join(' + '),
        a.durationMin,
        a.totalPrice.toFixed(2),
        a.totalSupplyCost.toFixed(2),
        a.estimatedProfit.toFixed(2),
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
 * Export official Professional Services & Appointments PDF Report
 */
export async function exportAppointmentsPdf(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const appointments = loadAppointments(tenantId);
    const { generateReportPdf } = await import('../../services/report-exporter.service');

    const totalRevenue = appointments.reduce((sum, a) => sum + (a.status !== 'CANCELLED' ? a.totalPrice : 0), 0);
    const totalProfit = appointments.reduce((sum, a) => sum + (a.status !== 'CANCELLED' ? a.estimatedProfit : 0), 0);
    const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;

    const tableHeaders = ['Fecha / Hora', 'Cliente', 'Profesional', 'Servicios', 'Total (€)', 'Estado'];
    const tableRows = appointments.slice(0, 40).map((a) => [
      `${new Date(a.startTime).toLocaleDateString('es-ES')} ${new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      a.clientName,
      a.staffName.split(' ')[0],
      a.services.map((s) => s.name).join(', ').slice(0, 30),
      `${a.totalPrice.toFixed(2)}€`,
      a.status === 'COMPLETED' ? 'Completada' : a.status === 'CONFIRMED' ? 'Confirmada' : a.status,
    ]);

    const pdfBuf = await generateReportPdf({
      title: 'Informe de Citas, Servicios Profesionales & Estimación de Ingresos',
      subtitle: 'Resumen financiero de reservas, ocupación de especialistas y rentabilidad neta',
      companyName: 'DAMA-CRM Professional Services',
      dateRange: `Mes de ${new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}`,
      kpis: [
        { label: 'Facturación Prevista', value: `${totalRevenue.toFixed(2)}€`, color: '#3B82F6' },
        { label: 'Beneficio Neto Estimado', value: `${totalProfit.toFixed(2)}€`, color: '#10B981' },
        { label: 'Citas Realizadas', value: completedCount, color: '#6366F1' },
        { label: 'Total Reservas', value: appointments.length, color: '#8B5CF6' },
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

