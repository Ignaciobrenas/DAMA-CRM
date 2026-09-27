import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { logAudit } from '../../middlewares/audit.middleware';
import { getRequestTenant, isGodSuperAdmin } from '../../utils/tenant';

export async function listCompanies(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { industry: { contains: String(search), mode: 'insensitive' } },
        { city: { contains: String(search), mode: 'insensitive' } },
        { taxId: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const [total, companies] = await Promise.all([
      prisma.company.count({ where }),
      prisma.company.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          _count: {
            select: { contacts: true, deals: true, invoices: true, tickets: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    res.json({
      success: true,
      data: companies,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getCompany(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        contacts: {
          where: isSuper ? undefined : { tenantId },
        },
        deals: {
          where: isSuper ? undefined : { tenantId },
          include: { stage: true },
        },
        invoices: {
          where: isSuper ? undefined : { tenantId },
          orderBy: { issueDate: 'desc' },
        },
        quotes: {
          where: isSuper ? undefined : { tenantId },
          orderBy: { issueDate: 'desc' },
        },
        tickets: {
          where: isSuper ? undefined : { tenantId },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!company) {
      res.status(404).json({ success: false, message: 'Empresa no encontrada' });
      return;
    }

    if (!isSuper && company.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes acceso a los datos de esta empresa' });
      return;
    }

    res.json({ success: true, data: company });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createCompany(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const { name, industry, website, phone, email, address, city, country, taxId, annualRevenue, employeesCount, notes } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'El nombre de la empresa es obligatorio' });
      return;
    }

    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        industry: industry?.trim() || null,
        website: website?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim().toLowerCase() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        country: country?.trim() || null,
        taxId: taxId?.trim() || null,
        annualRevenue: annualRevenue !== undefined && annualRevenue !== '' ? parseFloat(annualRevenue) : null,
        employeesCount: employeesCount !== undefined && employeesCount !== '' ? parseInt(employeesCount, 10) : null,
        notes: notes?.trim() || null,
        tenantId,
      },
    });

    await logAudit(req.user?.id || null, 'CREATE', 'Company', company.id, { name: company.name, tenantId }, req.ip);

    res.status(201).json({ success: true, data: company });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateCompany(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Empresa no encontrada' });
      return;
    }

    if (!isSuper && existing.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para modificar esta empresa' });
      return;
    }

    const { name, industry, website, phone, email, address, city, country, taxId, annualRevenue, employeesCount, notes } = req.body;

    const updated = await prisma.company.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        industry: industry !== undefined ? (industry?.trim() || null) : undefined,
        website: website !== undefined ? (website?.trim() || null) : undefined,
        phone: phone !== undefined ? (phone?.trim() || null) : undefined,
        email: email !== undefined ? (email?.trim().toLowerCase() || null) : undefined,
        address: address !== undefined ? (address?.trim() || null) : undefined,
        city: city !== undefined ? (city?.trim() || null) : undefined,
        country: country !== undefined ? (country?.trim() || null) : undefined,
        taxId: taxId !== undefined ? (taxId?.trim() || null) : undefined,
        annualRevenue: annualRevenue !== undefined ? (annualRevenue !== '' ? parseFloat(annualRevenue) : null) : undefined,
        employeesCount: employeesCount !== undefined ? (employeesCount !== '' ? parseInt(employeesCount, 10) : null) : undefined,
        notes: notes !== undefined ? (notes?.trim() || null) : undefined,
      },
    });

    await logAudit(req.user?.id || null, 'UPDATE', 'Company', id, { name: updated.name, tenantId }, req.ip);

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteCompany(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Empresa no encontrada' });
      return;
    }

    if (!isSuper && existing.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para eliminar esta empresa' });
      return;
    }

    await prisma.company.delete({ where: { id } });
    await logAudit(req.user?.id || null, 'DELETE', 'Company', id, { name: existing.name, tenantId }, req.ip);
    res.json({ success: true, message: 'Empresa eliminada correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function bulkDeleteCompanies(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: 'Se requiere una lista de IDs de empresas' });
      return;
    }

    const where: any = { id: { in: ids } };
    if (!isSuper) {
      where.tenantId = tenantId;
    }

    const result = await prisma.company.deleteMany({ where });

    await logAudit(req.user?.id || null, 'BULK_DELETE', 'Company', undefined, { count: result.count, ids, tenantId }, req.ip);

    res.json({
      success: true,
      message: `${result.count} empresas eliminadas correctamente`,
      deletedCount: result.count,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
