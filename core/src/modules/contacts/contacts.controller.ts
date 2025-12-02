import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { logAudit } from '../../middlewares/audit.middleware';

export async function listContacts(req: Request, res: Response): Promise<void> {
  try {
    const { search, companyId, isLead, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: String(search), mode: 'insensitive' } },
        { lastName: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { position: { contains: String(search), mode: 'insensitive' } },
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
            select: { deals: true, omniMessages: true, invoices: true },
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
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getContact(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        company: true,
        deals: { include: { stage: true } },
        quotes: true,
        invoices: true,
        omniMessages: {
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
      },
    });

    if (!contact) {
      res.status(404).json({ success: false, message: 'Contacto no encontrado' });
      return;
    }

    res.json({ success: true, data: contact });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createContact(req: Request, res: Response): Promise<void> {
  try {
    const { companyId, firstName, lastName, email, phone, mobile, position, department, isLead, notes } = req.body;

    if (!firstName || !lastName || !email) {
      res.status(400).json({ success: false, message: 'Nombre, apellidos y correo electrónico son obligatorios' });
      return;
    }

    const contact = await prisma.contact.create({
      data: {
        companyId: companyId || null,
        firstName,
        lastName,
        email: email.toLowerCase().trim(),
        phone,
        mobile,
        position,
        department,
        isLead: Boolean(isLead),
        notes,
      },
      include: { company: true },
    });

    await logAudit(req.user?.id || null, 'CREATE', 'Contact', contact.id, { name: `${contact.firstName} ${contact.lastName}` }, req.ip);

    res.status(201).json({ success: true, data: contact });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateContact(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { companyId, firstName, lastName, email, phone, mobile, position, department, isLead, notes } = req.body;

    const updated = await prisma.contact.update({
      where: { id },
      data: {
        companyId: companyId !== undefined ? (companyId || null) : undefined,
        firstName,
        lastName,
        email: email ? email.toLowerCase().trim() : undefined,
        phone,
        mobile,
        position,
        department,
        isLead: isLead !== undefined ? Boolean(isLead) : undefined,
        notes,
      },
      include: { company: true },
    });

    await logAudit(req.user?.id || null, 'UPDATE', 'Contact', id, { name: `${updated.firstName} ${updated.lastName}` }, req.ip);

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteContact(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.contact.delete({ where: { id } });
    await logAudit(req.user?.id || null, 'DELETE', 'Contact', id, {}, req.ip);
    res.json({ success: true, message: 'Contacto eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
