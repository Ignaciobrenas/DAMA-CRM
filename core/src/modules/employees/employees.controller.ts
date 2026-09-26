import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import * as bcrypt from 'bcryptjs';

// Helper to determine if requester is God / SuperAdmin
export const isSuperAdminUser = (user: any): boolean => {
  return (
    user?.role === 'ADMIN' &&
    (user?.email === 'ignaciobrenas@gmail.com' ||
      user?.email === 'admin@dama-crm.local' ||
      user?.tenantId === 'master')
  );
};

export const listEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const isSuper = isSuperAdminUser(user);
    const tenantId = isSuper ? (req.query.tenantId as string) || user?.tenantId || 'master' : user?.tenantId || 'master';
    const department = req.query.department as string | undefined;
    const status = req.query.status as string | undefined;

    const where: any = {
      ...(isSuper && !req.query.tenantId ? {} : { tenantId }),
      ...(department ? { department } : {}),
      ...(status ? { status } : {}),
    };

    const employees = await prisma.employee.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true, avatar: true } },
        _count: { select: { payrolls: true, timeRecords: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Privacy Masking: If requester is standard employee and not HR/Admin, mask confidential salary & IBAN of others
    const isHrOrAdmin = user?.role === 'ADMIN' || user?.role === 'HR' || isSuper;
    const sanitized = employees.map((emp) => {
      const isSelf = emp.userId === user?.id;
      if (!isHrOrAdmin && !isSelf) {
        return {
          ...emp,
          baseSalary: 0,
          iban: emp.iban ? '••••••••••••' : null,
        };
      }
      return emp;
    });

    res.json({ success: true, data: sanitized });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al listar empleados', error: error.message });
  }
};

export const getEmployeeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const isSuper = isSuperAdminUser(user);

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, avatar: true } },
        payrolls: { orderBy: { year: 'desc' }, take: 12 },
        timeRecords: { orderBy: { clockIn: 'desc' }, take: 30 },
      },
    });

    if (!employee) {
      res.status(404).json({ success: false, message: 'Empleado no encontrado' });
      return;
    }

    // Tenant authorization check
    if (!isSuper && employee.tenantId !== user?.tenantId) {
      res.status(403).json({ success: false, message: 'No tienes acceso a los datos de este empleado' });
      return;
    }

    // Privacy check for standard employees
    const isHrOrAdmin = user?.role === 'ADMIN' || user?.role === 'HR' || isSuper;
    const isSelf = employee.userId === user?.id;

    if (!isHrOrAdmin && !isSelf) {
      res.json({
        success: true,
        data: {
          ...employee,
          baseSalary: 0,
          iban: '••••••••••••',
          payrolls: [],
        },
      });
      return;
    }

    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener empleado', error: error.message });
  }
};

export const createEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = (req as any).user;
    const isSuper = isSuperAdminUser(currentUser);
    const {
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      department = 'ENGINEERING',
      contractType = 'INDEFINIDO',
      baseSalary = 0,
      iban,
      targetTenantId,
      createLogin = false,
      initialPassword,
    } = req.body;

    if (!firstName || !lastName || !email) {
      res.status(400).json({ success: false, message: 'Nombre, apellidos y email son obligatorios' });
      return;
    }

    // Multi-tenant permission rule: Company Admin can ONLY create in own tenant, God can assign to any tenant
    const assignedTenantId = isSuper ? (targetTenantId || currentUser?.tenantId || 'master') : (currentUser?.tenantId || 'master');

    let linkedUserId: string | null = null;

    // Optionally create linked CRM user login
    if (createLogin) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        linkedUserId = existingUser.id;
      } else {
        const defaultRole = await prisma.role.findFirst({ where: { name: 'EMPLOYEE' } }) ||
          await prisma.role.findFirst({ where: { name: 'USER' } }) ||
          await prisma.role.findFirst();

        const passwordHash = await bcrypt.hash(initialPassword || 'Dama2026!', 10);
        const newUser = await prisma.user.create({
          data: {
            name: `${firstName} ${lastName}`,
            email,
            passwordHash,
            roleId: defaultRole!.id,
            tenantId: assignedTenantId,
            isActive: true,
          },
        });
        linkedUserId = newUser.id;
      }
    }

    const employee = await prisma.employee.create({
      data: {
        userId: linkedUserId,
        tenantId: assignedTenantId,
        firstName,
        lastName,
        email,
        phone,
        jobTitle,
        department,
        contractType,
        baseSalary: parseFloat(baseSalary) || 0,
        iban,
        status: 'ACTIVE',
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    res.status(201).json({
      success: true,
      data: employee,
      message: 'Empleado creado y registrado en el Portal del Empleado con éxito',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al crear empleado', error: error.message });
  }
};

export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;
    const isSuper = isSuperAdminUser(currentUser);
    const isHrOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'HR' || isSuper;

    if (!isHrOrAdmin) {
      res.status(403).json({ success: false, message: 'Permisos insuficientes para editar empleados' });
      return;
    }

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Empleado no encontrado' });
      return;
    }

    if (!isSuper && existing.tenantId !== currentUser?.tenantId) {
      res.status(403).json({ success: false, message: 'No puedes editar empleados de otra empresa' });
      return;
    }

    const { firstName, lastName, email, phone, jobTitle, department, contractType, baseSalary, iban, status } = req.body;

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(jobTitle !== undefined && { jobTitle }),
        ...(department && { department }),
        ...(contractType && { contractType }),
        ...(baseSalary !== undefined && { baseSalary: parseFloat(baseSalary) }),
        ...(iban !== undefined && { iban }),
        ...(status && { status }),
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    res.json({ success: true, data: updated, message: 'Ficha de empleado actualizada correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al actualizar empleado', error: error.message });
  }
};

export const deleteEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;
    const isSuper = isSuperAdminUser(currentUser);

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Empleado no encontrado' });
      return;
    }

    if (!isSuper && existing.tenantId !== currentUser?.tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para eliminar este empleado' });
      return;
    }

    await prisma.employee.delete({ where: { id } });
    res.json({ success: true, message: 'Empleado eliminado del sistema' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al eliminar empleado', error: error.message });
  }
};
