import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { wsService } from '../../services/websocket.service';
import { isSuperAdminUser } from './employees.controller';

export const clockIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { type = 'WORK', reason = 'Oficina Central', notes, location } = req.body;

    // Find linked employee or create auto-profile if missing
    let employee = await prisma.employee.findUnique({ where: { userId: user.id } });
    if (!employee) {
      employee = await prisma.employee.create({
        data: {
          userId: user.id,
          tenantId: user.tenantId || 'master',
          firstName: user.name?.split(' ')[0] || 'Empleado',
          lastName: user.name?.split(' ').slice(1).join(' ') || '',
          email: user.email,
          status: 'ACTIVE',
        },
      });
    }

    // Check if there is already an active (unclosed) clock-in record today
    const activeClock = await prisma.timeRecord.findFirst({
      where: {
        employeeId: employee.id,
        clockOut: null,
      },
    });

    if (activeClock) {
      res.json({
        success: true,
        data: activeClock,
        message: 'Ya tienes un fichaje de jornada en curso activo',
      });
      return;
    }

    const newRecord = await prisma.timeRecord.create({
      data: {
        employeeId: employee.id,
        userId: user.id,
        tenantId: employee.tenantId || user.tenantId || 'master',
        clockIn: new Date(),
        type,
        reason,
        notes,
        location,
        ipAddress: req.ip,
        status: 'VALID',
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    // Real-time broadcast
    wsService.broadcast('attendance:clock_in', {
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      clockIn: newRecord.clockIn,
      reason: newRecord.reason,
    });

    res.status(201).json({
      success: true,
      data: newRecord,
      message: '¡Fichaje de entrada registrado correctamente!',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al registrar fichaje de entrada', error: error.message });
  }
};

export const clockOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { notes } = req.body;

    const employee = await prisma.employee.findUnique({ where: { userId: user.id } });
    if (!employee) {
      res.status(404).json({ success: false, message: 'Empleado no encontrado' });
      return;
    }

    const activeClock = await prisma.timeRecord.findFirst({
      where: {
        employeeId: employee.id,
        clockOut: null,
      },
      orderBy: { clockIn: 'desc' },
    });

    if (!activeClock) {
      res.status(400).json({ success: false, message: 'No tienes ningún fichaje activo abierto' });
      return;
    }

    const now = new Date();
    const durationMinutes = Math.max(1, Math.round((now.getTime() - new Date(activeClock.clockIn).getTime()) / (1000 * 60)));

    const updated = await prisma.timeRecord.update({
      where: { id: activeClock.id },
      data: {
        clockOut: now,
        durationMinutes,
        notes: notes ? `${activeClock.notes || ''}\n[Salida]: ${notes}` : activeClock.notes,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    // Real-time broadcast
    wsService.broadcast('attendance:clock_out', {
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      clockOut: updated.clockOut,
      durationMinutes,
    });

    res.json({
      success: true,
      data: updated,
      message: `¡Fichaje de salida registrado! Total: ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m trabajados`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al registrar fichaje de salida', error: error.message });
  }
};

export const getClockStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const employee = await prisma.employee.findUnique({ where: { userId: user.id } });

    if (!employee) {
      res.json({
        success: true,
        data: {
          isClockedIn: false,
          activeRecord: null,
          todayMinutes: 0,
          weekMinutes: 0,
        },
      });
      return;
    }

    const activeRecord = await prisma.timeRecord.findFirst({
      where: { employeeId: employee.id, clockOut: null },
      orderBy: { clockIn: 'desc' },
    });

    // Calculate today's total worked minutes
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayRecords = await prisma.timeRecord.findMany({
      where: {
        employeeId: employee.id,
        clockIn: { gte: startOfToday },
      },
    });

    let todayMinutes = 0;
    const now = Date.now();
    for (const rec of todayRecords) {
      if (rec.clockOut) {
        todayMinutes += rec.durationMinutes || 0;
      } else {
        todayMinutes += Math.round((now - new Date(rec.clockIn).getTime()) / 60000);
      }
    }

    res.json({
      success: true,
      data: {
        isClockedIn: !!activeRecord,
        activeRecord,
        todayMinutes,
        employee,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al consultar estado de fichaje', error: error.message });
  }
};

export const getTimeHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const isSuper = isSuperAdminUser(user);
    const isHrOrAdmin = user?.role === 'ADMIN' || user?.role === 'HR' || isSuper;
    const { employeeId, startDate, endDate, limit = 50 } = req.query;

    let where: any = {};

    if (!isHrOrAdmin) {
      const myEmployee = await prisma.employee.findUnique({ where: { userId: user.id } });
      if (!myEmployee) {
        res.json({ success: true, data: [] });
        return;
      }
      where.employeeId = myEmployee.id;
    } else {
      if (!isSuper) {
        where.tenantId = user?.tenantId || 'master';
      }
      if (employeeId) {
        where.employeeId = String(employeeId);
      }
    }

    if (startDate || endDate) {
      where.clockIn = {
        ...(startDate ? { gte: new Date(String(startDate)) } : {}),
        ...(endDate ? { lte: new Date(String(endDate)) } : {}),
      };
    }

    const records = await prisma.timeRecord.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, jobTitle: true, department: true } },
      },
      orderBy: { clockIn: 'desc' },
      take: Math.min(Number(limit) || 50, 100),
    });

    res.json({ success: true, data: records });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al consultar histórico de fichajes', error: error.message });
  }
};

export const syncWithOdooAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const isSuper = isSuperAdminUser(user);
    const isHrOrAdmin = user?.role === 'ADMIN' || user?.role === 'HR' || isSuper;

    if (!isHrOrAdmin) {
      res.status(403).json({ success: false, message: 'Permisos insuficientes para sincronizar con Odoo' });
      return;
    }

    const { IntegrationsService } = require('../integrations/integrations.service');
    const result = await IntegrationsService.syncConnector('odoo');

    res.json({
      success: true,
      data: result,
      message: 'Fichajes y asistencias sincronizados bidireccionalmente con Odoo HR (hr.attendance)',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al sincronizar con Odoo', error: error.message });
  }
};

/**
 * GET /api/employees/time-tracking/export/csv
 * Export labor time records / fichajes to CSV / Excel
 */
export const exportTimeRecordsCsv = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const isSuper = isSuperAdminUser(user);
    const isHrOrAdmin = user?.role === 'ADMIN' || user?.role === 'HR' || isSuper;
    const { generateCsvBuffer } = await import('../../services/report-exporter.service');

    let where: any = {};
    if (!isHrOrAdmin) {
      const myEmployee = await prisma.employee.findUnique({ where: { userId: user.id } });
      if (!myEmployee) {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=registro_jornada_${Date.now()}.csv`);
        res.send(generateCsvBuffer(['Empleado', 'Fecha', 'Entrada', 'Salida', 'Horas', 'Tipo'], []));
        return;
      }
      where.employeeId = myEmployee.id;
    } else {
      if (!isSuper) {
        where.tenantId = user?.tenantId || 'master';
      }
    }

    const records = await prisma.timeRecord.findMany({
      where,
      include: {
        employee: { select: { firstName: true, lastName: true, email: true, jobTitle: true } },
      },
      orderBy: { clockIn: 'desc' },
      take: 1000,
    });

    const headers = [
      'Empleado',
      'Puesto / Cargo',
      'Fecha',
      'Hora Entrada',
      'Hora Salida',
      'Duración (Minutos)',
      'Total Horas',
      'Tipo Jornada',
      'Motivo / Justificación',
      'Ubicación / IP',
      'Estado',
    ];

    const rows = records.map((r) => {
      const cIn = new Date(r.clockIn);
      const cOut = r.clockOut ? new Date(r.clockOut) : null;
      const hours = r.durationMinutes ? (r.durationMinutes / 60).toFixed(2) : 'En curso';
      return [
        r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : 'Empleado',
        r.employee?.jobTitle || '',
        cIn.toLocaleDateString('es-ES'),
        cIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cOut ? cOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'En curso',
        r.durationMinutes || 0,
        hours,
        r.type,
        r.reason || '',
        r.location || r.ipAddress || 'Oficina',
        r.status,
      ];
    });

    const csvBuf = generateCsvBuffer(headers, rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=registro_jornada_${user?.tenantId || 'empresa'}_${Date.now()}.csv`);
    res.send(csvBuf);
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al exportar registro de jornada', error: error.message });
  }
};

/**
 * GET /api/employees/time-tracking/export/pdf
 * Export official Spanish Labor Law (Estatuto de los Trabajadores art. 34.9) Workday PDF Report
 */
export const exportTimeRecordsPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const isSuper = isSuperAdminUser(user);
    const isHrOrAdmin = user?.role === 'ADMIN' || user?.role === 'HR' || isSuper;
    const { generateReportPdf } = await import('../../services/report-exporter.service');

    let where: any = {};
    if (!isHrOrAdmin) {
      const myEmployee = await prisma.employee.findUnique({ where: { userId: user.id } });
      if (!myEmployee) {
        res.status(404).json({ success: false, message: 'Perfil de empleado no encontrado' });
        return;
      }
      where.employeeId = myEmployee.id;
    } else {
      if (!isSuper) {
        where.tenantId = user?.tenantId || 'master';
      }
    }

    const records = await prisma.timeRecord.findMany({
      where,
      include: {
        employee: { select: { firstName: true, lastName: true, jobTitle: true } },
      },
      orderBy: { clockIn: 'desc' },
      take: 50,
    });

    const totalMinutes = records.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    const tableHeaders = ['Empleado', 'Fecha', 'Entrada', 'Salida', 'Horas', 'Tipo'];
    const tableRows = records.map((r) => [
      r.employee ? `${r.employee.firstName} ${r.employee.lastName.charAt(0)}.` : 'Empleado',
      new Date(r.clockIn).toLocaleDateString('es-ES'),
      new Date(r.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      r.clockOut ? new Date(r.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'En curso',
      r.durationMinutes ? `${(r.durationMinutes / 60).toFixed(1)}h` : '0h',
      r.type,
    ]);

    const pdfBuf = await generateReportPdf({
      title: 'Registro de Jornada Laboral Oficial (Art. 34.9 ET)',
      subtitle: 'Certificado de fichajes, horas ordinarias y cumplimiento de normativa laboral',
      companyName: 'DAMA-CRM Recursos Humanos',
      dateRange: `Mes en curso - ${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
      kpis: [
        { label: 'Total Fichajes', value: records.length, color: '#2563EB' },
        { label: 'Horas Trabajadas', value: `${totalHours}h`, color: '#10B981' },
        { label: 'Jornadas Ordinarias', value: records.filter((r) => r.type === 'WORK').length, color: '#3B82F6' },
        { label: 'Guardias / Extras', value: records.filter((r) => r.type === 'OVERTIME').length, color: '#F59E0B' },
      ],
      tableHeaders,
      tableRows,
      summaryNotes: [
        '* Documento legal acreditativo de cómputo de jornada según Real Decreto-ley 8/2019 de 8 de marzo.',
        '* Los datos quedan custodiados electrónicamente durante 4 años a disposición de la ITSS y representación legal.',
      ],
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=registro_jornada_${Date.now()}.pdf`);
    res.send(pdfBuf);
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al exportar registro de jornada en PDF', error: error.message });
  }
};

