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
