import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { logAudit } from '../../middlewares/audit.middleware';
import { getRequestTenant, isGodSuperAdmin } from '../../utils/tenant';

export async function listContacts(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);
    const { search, companyId, isLead, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: String(search), mode: 'insensitive' } },
        { lastName: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { position: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search), mode: 'insensitive' } },
        { mobile: { contains: String(search), mode: 'insensitive' } },
      ];
    }
    if (companyId) {
      where.companyId = String(companyId);
    }
    if (isLead !== undefined) {
      where.isLead = isLead === 'true';
    }

    const [total, contacts] = await Promise.all([
      prisma.contact.count({ where }),
      prisma.contact.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          company: {
            select: { id: true, name: true },
          },
          _count: {
            select: { deals: true, omniMessages: true, invoices: true, tickets: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: contacts,
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

export async function getContact(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        company: true,
        deals: {
          where: isSuper ? undefined : { tenantId },
          include: { stage: true },
        },
        quotes: {
          where: isSuper ? undefined : { tenantId },
          orderBy: { issueDate: 'desc' },
        },
        invoices: {
          where: isSuper ? undefined : { tenantId },
          orderBy: { issueDate: 'desc' },
        },
        tickets: {
          where: isSuper ? undefined : { tenantId },
          orderBy: { createdAt: 'desc' },
        },
        omniMessages: {
          where: isSuper ? undefined : { tenantId },
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
      },
    });

    if (!contact) {
      res.status(404).json({ success: false, message: 'Contacto no encontrado' });
      return;
    }

    if (!isSuper && contact.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes acceso a este contacto' });
      return;
    }

    res.json({ success: true, data: contact });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createContact(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const { companyId, firstName, lastName, email, phone, mobile, position, department, isLead, notes } = req.body;

    if (!firstName || !lastName || !email) {
      res.status(400).json({ success: false, message: 'Nombre, apellidos y correo electrónico son obligatorios' });
      return;
    }

    // Verify company belongs to same tenant if companyId provided
    if (companyId) {
      const comp = await prisma.company.findUnique({ where: { id: companyId } });
      if (!comp || (!isGodSuperAdmin(req) && comp.tenantId !== tenantId)) {
        res.status(400).json({ success: false, message: 'La empresa seleccionada no pertenece a su organización' });
        return;
      }
    }

    const contact = await prisma.contact.create({
      data: {
        companyId: companyId || null,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        mobile: mobile?.trim() || null,
        position: position?.trim() || null,
        department: department?.trim() || null,
        isLead: Boolean(isLead),
        notes: notes?.trim() || null,
        tenantId,
      },
      include: { company: true },
    });

    await logAudit(req.user?.id || null, 'CREATE', 'Contact', contact.id, { name: `${contact.firstName} ${contact.lastName}`, tenantId }, req.ip);

    res.status(201).json({ success: true, data: contact });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateContact(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Contacto no encontrado' });
      return;
    }

    if (!isSuper && existing.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para modificar este contacto' });
      return;
    }

    const { companyId, firstName, lastName, email, phone, mobile, position, department, isLead, notes } = req.body;

    const updated = await prisma.contact.update({
      where: { id },
      data: {
        companyId: companyId !== undefined ? (companyId || null) : undefined,
        firstName: firstName ? firstName.trim() : undefined,
        lastName: lastName ? lastName.trim() : undefined,
        email: email ? email.toLowerCase().trim() : undefined,
        phone: phone !== undefined ? (phone?.trim() || null) : undefined,
        mobile: mobile !== undefined ? (mobile?.trim() || null) : undefined,
        position: position !== undefined ? (position?.trim() || null) : undefined,
        department: department !== undefined ? (department?.trim() || null) : undefined,
        isLead: isLead !== undefined ? Boolean(isLead) : undefined,
        notes: notes !== undefined ? (notes?.trim() || null) : undefined,
      },
      include: { company: true },
    });

    await logAudit(req.user?.id || null, 'UPDATE', 'Contact', id, { name: `${updated.firstName} ${updated.lastName}`, tenantId }, req.ip);

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteContact(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Contacto no encontrado' });
      return;
    }

    if (!isSuper && existing.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para eliminar este contacto' });
      return;
    }

    // SPANISH COMPLIANCE: RGPD vs Fiscal Obligation Conflict (Art. 32 LOPDGDD & Arts. 66-70 LGT)
    // If contact has emitted invoices, physical deletion is prohibited by tax law. The data must be BLOCKED.
    const invoiceCount = await prisma.invoice.count({ where: { contactId: id } });
    if (invoiceCount > 0) {
      await prisma.contact.update({
        where: { id },
        data: {
          isLead: false,
          notes: `[BLOQUEO DE DATOS RGPD ART. 32 / LGT]: Sujeto a deber de conservación fiscal por ${invoiceCount} facturas emitidas. Acceso restringido exclusivamente a requerimientos judiciales o de la AEAT. Registrado el ${new Date().toISOString()}`,
        },
      });

      await logAudit(
        req.user?.id || null,
        'DATA_BLOCKING_RGPD_LGT',
        'Contact',
        id,
        {
          name: `${existing.firstName} ${existing.lastName}`,
          invoiceCount,
          legalBasis: 'Art. 32 LOPDGDD & Arts. 66-70 LGT',
          tenantId,
        },
        req.ip
      );

      res.status(409).json({
        success: false,
        isBlocked: true,
        message: `Por imperativo legal (Art. 32 LOPDGDD y Arts. 66-70 de la Ley General Tributaria), este contacto no puede ser suprimido físicamente al tener ${invoiceCount} facturas emitidas vinculadas durante el plazo de prescripción fiscal (4 a 6 años). Los datos han sido BLOQUEADOS para impedir cualquier tratamiento comercial o comunicación.`,
      });
      return;
    }

    await prisma.contact.delete({ where: { id } });
    await logAudit(req.user?.id || null, 'DELETE', 'Contact', id, { name: `${existing.firstName} ${existing.lastName}`, tenantId }, req.ip);
    res.json({ success: true, message: 'Contacto eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function bulkDeleteContacts(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: 'Se requiere una lista de IDs de contactos' });
      return;
    }

    // Filter contacts that have invoices to prevent destroying fiscal audit trails
    const contactsWithInvoices = await prisma.invoice.findMany({
      where: { contactId: { in: ids } },
      select: { contactId: true },
      distinct: ['contactId'],
    });
    const blockedIds = new Set(contactsWithInvoices.map((inv) => inv.contactId).filter(Boolean) as string[]);

    // Block contacts with invoices
    if (blockedIds.size > 0) {
      await prisma.contact.updateMany({
        where: { id: { in: Array.from(blockedIds) } },
        data: {
          isLead: false,
          notes: `[BLOQUEO DE DATOS RGPD ART. 32 / LGT]: Sujeto a deber de conservación fiscal por facturas emitidas. Acceso restringido exclusivamente a requerimientos judiciales o de la AEAT. Registrado el ${new Date().toISOString()}`,
        },
      });
      await logAudit(
        req.user?.id || null,
        'DATA_BLOCKING_BULK_RGPD_LGT',
        'Contact',
        undefined,
        { count: blockedIds.size, blockedIds: Array.from(blockedIds), tenantId },
        req.ip
      );
    }

    const deletableIds = ids.filter((cid: string) => !blockedIds.has(cid));
    let deletedCount = 0;

    if (deletableIds.length > 0) {
      const where: any = { id: { in: deletableIds } };
      if (!isSuper) {
        where.tenantId = tenantId;
      }
      const result = await prisma.contact.deleteMany({ where });
      deletedCount = result.count;
      await logAudit(req.user?.id || null, 'BULK_DELETE', 'Contact', undefined, { count: deletedCount, deletableIds, tenantId }, req.ip);
    }

    res.json({
      success: true,
      message: `${deletedCount} contactos eliminados.${blockedIds.size > 0 ? ` ${blockedIds.size} contactos no se eliminaron y fueron BLOQUEADOS conforme al Art. 32 LOPDGDD por tener facturas emitidas asociadas.` : ''}`,
      deletedCount,
      blockedCount: blockedIds.size,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function bulkUpdateContacts(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);
    const { ids, isLead, companyId } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: 'Se requiere una lista de IDs de contactos' });
      return;
    }

    const where: any = { id: { in: ids } };
    if (!isSuper) {
      where.tenantId = tenantId;
    }

    const data: any = {};
    if (isLead !== undefined) data.isLead = Boolean(isLead);
    if (companyId !== undefined) data.companyId = companyId || null;

    const result = await prisma.contact.updateMany({
      where,
      data,
    });

    await logAudit(req.user?.id || null, 'BULK_UPDATE', 'Contact', undefined, { count: result.count, ids, changes: data, tenantId }, req.ip);

    res.json({
      success: true,
      message: `${result.count} contactos actualizados correctamente`,
      updatedCount: result.count,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function importContacts(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const userId = req.user?.id || null;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Se requiere una lista de contactos para importar' });
      return;
    }

    const createdOrUpdated = [];
    for (const item of items) {
      const email = (item.email && String(item.email).trim().toLowerCase()) || `contacto_${Date.now().toString().slice(-6)}_${Math.floor(Math.random() * 1000)}@damacrm.local`;
      const firstName = String(item.firstName || item.name || 'Sin Nombre').trim();
      const lastName = String(item.lastName || '').trim();

      const contact = await prisma.contact.upsert({
        where: { email },
        update: {
          firstName,
          lastName,
          phone: item.phone ? String(item.phone) : undefined,
          mobile: item.mobile ? String(item.mobile) : undefined,
          position: item.position || item.cargo || undefined,
          department: item.department || item.departamento || undefined,
          isLead: item.isLead !== undefined ? Boolean(item.isLead) : undefined,
          notes: item.notes || undefined,
        },
        create: {
          email,
          firstName,
          lastName,
          phone: item.phone ? String(item.phone) : null,
          mobile: item.mobile ? String(item.mobile) : null,
          position: item.position || item.cargo || null,
          department: item.department || item.departamento || null,
          isLead: item.isLead !== undefined ? Boolean(item.isLead) : false,
          notes: item.notes || null,
          tenantId,
        },
      });
      createdOrUpdated.push(contact);
    }

    await logAudit(userId, 'IMPORT_CONTACTS', 'Contact', 'batch', { count: createdOrUpdated.length, tenantId }, req.ip);

    res.status(201).json({
      success: true,
      data: createdOrUpdated,
      message: `Se han importado/actualizado ${createdOrUpdated.length} contactos con éxito`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
