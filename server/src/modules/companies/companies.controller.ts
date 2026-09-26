import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { logAudit } from '../../middlewares/audit.middleware';

export async function listCompanies(req: Request, res: Response): Promise<void> {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { industry: { contains: String(search), mode: 'insensitive' } },
        { city: { contains: String(search), mode: 'insensitive' } },
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
            select: { contacts: true, deals: true, invoices: true },
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
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getCompany(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        contacts: true,
        deals: { include: { stage: true } },
        invoices: true,
        quotes: true,
      },
    });

    if (!company) {
      res.status(404).json({ success: false, message: 'Empresa no encontrada' });
      return;
    }

    res.json({ success: true, data: company });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createCompany(req: Request, res: Response): Promise<void> {
  try {
    const { name, industry, website, phone, email, address, city, country, taxId, annualRevenue, employeesCount, notes } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'El nombre de la empresa es obligatorio' });
      return;
    }

    const company = await prisma.company.create({
      data: {
        name,
        industry,
        website,
        phone,
        email,
        address,
        city,
        country,
        taxId,
        annualRevenue: annualRevenue ? parseFloat(annualRevenue) : null,
        employeesCount: employeesCount ? parseInt(employeesCount, 10) : null,
        notes,
      },
    });

    await logAudit((req as any).user?.id || null, 'CREATE', 'Company', company.id, { name: company.name }, req.ip);

    res.status(201).json({ success: true, data: company });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateCompany(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, industry, website, phone, email, address, city, country, taxId, annualRevenue, employeesCount, notes } = req.body;

    const updated = await prisma.company.update({
      where: { id },
      data: {
        name,
        industry,
        website,
        phone,
        email,
        address,
        city,
        country,
        taxId,
        annualRevenue: annualRevenue !== undefined ? parseFloat(annualRevenue) : undefined,
        employeesCount: employeesCount !== undefined ? parseInt(employeesCount, 10) : undefined,
        notes,
      },
    });

    await logAudit((req as any).user?.id || null, 'UPDATE', 'Company', id, { name: updated.name }, req.ip);

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteCompany(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.company.delete({ where: { id } });
    await logAudit((req as any).user?.id || null, 'DELETE', 'Company', id, {}, req.ip);
    res.json({ success: true, message: 'Empresa eliminada correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function bulkDeleteCompanies(req: Request, res: Response): Promise<void> {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: 'Se requiere una lista de IDs de empresas' });
      return;
    }

    const result = await prisma.company.deleteMany({
      where: { id: { in: ids } },
    });

    await logAudit((req as any).user?.id || null, 'BULK_DELETE', 'Company', undefined, { count: result.count, ids }, req.ip);

    res.json({
      success: true,
      message: `${result.count} empresas eliminadas correctamente`,
      deletedCount: result.count,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

