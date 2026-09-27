import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { getRequestTenant, isGodSuperAdmin } from '../../utils/tenant';
import { logAudit } from '../../middlewares/audit.middleware';

export async function listContracts(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);
    const { status, companyId, type } = req.query;

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }
    if (status) where.status = String(status);
    if (companyId) where.companyId = String(companyId);
    if (type) where.type = String(type);

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, taxId: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: contracts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getContract(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        company: true,
        contact: true,
      },
    });

    if (!contract) {
      res.status(404).json({ success: false, message: 'Contrato no encontrado' });
      return;
    }

    if (!isSuper && contract.tenantId && contract.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para acceder a este contrato' });
      return;
    }

    res.json({ success: true, data: contract });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createContract(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const {
      title,
      type = 'SERVICE',
      startDate,
      endDate,
      value = 0,
      currency = 'EUR',
      autoRenew = false,
      noticePeriodDays = 30,
      terms,
      companyId,
      contactId,
    } = req.body;

    if (!title) {
      res.status(400).json({ success: false, message: 'El título del contrato es obligatorio' });
      return;
    }

    const currentYear = new Date().getFullYear();
    const count = await prisma.contract.count({
      where: {
        tenantId,
        contractNumber: { startsWith: `CTR-${currentYear}` },
      },
    });
    const contractNumber = `CTR-${currentYear}-${String(count + 1).padStart(4, '0')}`;

    const contract = await prisma.contract.create({
      data: {
        contractNumber,
        title,
        type,
        status: 'ACTIVE',
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        value: Number(value) || 0,
        currency,
        autoRenew: Boolean(autoRenew),
        noticePeriodDays: Number(noticePeriodDays) || 30,
        terms,
        companyId: companyId || null,
        contactId: contactId || null,
        tenantId,
      },
      include: {
        company: true,
        contact: true,
      },
    });

    logAudit(
      req.user?.id || null,
      'CREATE',
      'Contract',
      contract.id,
      { contractNumber, title, value, tenantId },
      req.ip
    );

    res.status(201).json({ success: true, data: contract });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateContract(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);
    const { title, type, status, startDate, endDate, value, terms, autoRenew, noticePeriodDays } = req.body;

    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Contrato no encontrado' });
      return;
    }

    if (!isSuper && existing.tenantId && existing.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para modificar este contrato' });
      return;
    }

    const updated = await prisma.contract.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(type && { type }),
        ...(status && { status }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(value !== undefined && { value: Number(value) }),
        ...(terms !== undefined && { terms }),
        ...(autoRenew !== undefined && { autoRenew: Boolean(autoRenew) }),
        ...(noticePeriodDays !== undefined && { noticePeriodDays: Number(noticePeriodDays) }),
      },
      include: { company: true, contact: true },
    });

    res.json({ success: true, data: updated, message: 'Contrato actualizado correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function signContract(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { signatureData, signerName } = req.body;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    if (!signatureData || !signerName) {
      res.status(400).json({ success: false, message: 'Firma y nombre del firmante son obligatorios' });
      return;
    }

    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Contrato no encontrado' });
      return;
    }

    if (!isSuper && existing.tenantId && existing.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para firmar este contrato' });
      return;
    }

    const signed = await prisma.contract.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        signatureData,
        signerName,
        signedAt: new Date(),
      },
      include: { company: true, contact: true },
    });

    res.json({ success: true, data: signed, message: 'Contrato firmado digitalmente con éxito' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteContract(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Contrato no encontrado' });
      return;
    }

    if (!isSuper && existing.tenantId && existing.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para eliminar este contrato' });
      return;
    }

    await prisma.contract.delete({ where: { id } });
    res.json({ success: true, message: 'Contrato eliminado exitosamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
