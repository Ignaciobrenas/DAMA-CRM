import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { isSuperAdminUser } from './employees.controller';

export const listPayrolls = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const isSuper = isSuperAdminUser(user);
    const isHrOrAdmin = user?.role === 'ADMIN' || user?.role === 'HR' || isSuper;
    const { employeeId, year, month, status } = req.query;

    let where: any = {};

    // Standard employee: strictly limited to their own payrolls (Privacy Compliance)
    if (!isHrOrAdmin) {
      const myEmployee = await prisma.employee.findUnique({ where: { userId: user.id } });
      if (!myEmployee) {
        res.json({ success: true, data: [] });
        return;
      }
      where.employeeId = myEmployee.id;
    } else {
      // HR/Admin: Filter by tenant and optional employeeId
      if (!isSuper) {
        where.tenantId = user?.tenantId || 'master';
      }
      if (employeeId) {
        where.employeeId = String(employeeId);
      }
    }

    if (year) where.year = Number(year);
    if (month) where.month = Number(month);
    if (status) where.status = String(status);

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, email: true, jobTitle: true, department: true, iban: true },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    res.json({ success: true, data: payrolls });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al listar nóminas', error: error.message });
  }
};

export const issuePayroll = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = (req as any).user;
    const isSuper = isSuperAdminUser(currentUser);
    const isHrOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'HR' || isSuper;

    if (!isHrOrAdmin) {
      res.status(403).json({ success: false, message: 'Solo RRHH y Administradores pueden emitir nóminas' });
      return;
    }

    const { employeeId, month, year, baseSalary, bonuses = 0, deductions = 0, notes } = req.body;

    if (!employeeId || !month || !year) {
      res.status(400).json({ success: false, message: 'Empleado, mes y año son obligatorios' });
      return;
    }

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      res.status(404).json({ success: false, message: 'Empleado no encontrado' });
      return;
    }

    if (!isSuper && employee.tenantId !== currentUser?.tenantId) {
      res.status(403).json({ success: false, message: 'No puedes emitir nóminas para empleados de otra empresa' });
      return;
    }

    const base = parseFloat(baseSalary) || employee.baseSalary || 0;
    const bonus = parseFloat(bonuses) || 0;
    const deduct = parseFloat(deductions) || 0;
    const net = Number((base + bonus - deduct).toFixed(2));

    const payroll = await prisma.payroll.upsert({
      where: {
        employeeId_month_year: {
          employeeId,
          month: Number(month),
          year: Number(year),
        },
      },
      update: {
        baseSalary: base,
        bonuses: bonus,
        deductions: deduct,
        netSalary: net,
        notes,
      },
      create: {
        employeeId,
        tenantId: employee.tenantId,
        month: Number(month),
        year: Number(year),
        baseSalary: base,
        bonuses: bonus,
        deductions: deduct,
        netSalary: net,
        status: 'ISSUED',
        notes,
      },
      include: {
        employee: true,
      },
    });

    res.status(201).json({
      success: true,
      data: payroll,
      message: `Nómina de ${payroll.employee.firstName} ${payroll.employee.lastName} (${month}/${year}) emitida con éxito`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al emitir nómina', error: error.message });
  }
};

export const updatePayrollStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, paidAt } = req.body;
    const currentUser = (req as any).user;
    const isSuper = isSuperAdminUser(currentUser);
    const isHrOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'HR' || isSuper;

    if (!isHrOrAdmin) {
      res.status(403).json({ success: false, message: 'Permisos insuficientes para actualizar el estado de nóminas' });
      return;
    }

    const updated = await prisma.payroll.update({
      where: { id },
      data: {
        status,
        ...(status === 'PAID' ? { paidAt: paidAt ? new Date(paidAt) : new Date() } : {}),
      },
      include: {
        employee: true,
      },
    });

    res.json({ success: true, data: updated, message: 'Estado de nómina actualizado correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al actualizar nómina', error: error.message });
  }
};
