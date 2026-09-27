import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { getRequestTenant, isGodSuperAdmin } from '../../utils/tenant';

export async function listFields(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);
    const { entityType } = req.query;

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }
    if (entityType) where.entityType = String(entityType).toUpperCase();

    const fields = await prisma.customField.findMany({
      where,
      orderBy: { label: 'asc' },
    });

    res.json({ success: true, data: fields });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createField(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const { entityType, name, label, fieldType, options, isRequired, defaultValue } = req.body;

    if (!entityType || !name || !label || !fieldType) {
      res.status(400).json({ success: false, message: 'entityType, name, label y fieldType son obligatorios' });
      return;
    }

    const field = await prisma.customField.create({
      data: {
        entityType: String(entityType).toUpperCase(),
        name: String(name).toLowerCase().replace(/\s+/g, '_'),
        label,
        fieldType: String(fieldType).toUpperCase(),
        optionsJson: options ? JSON.stringify(options) : null,
        isRequired: Boolean(isRequired),
        defaultValue: defaultValue || null,
        tenantId,
      },
    });

    res.status(201).json({ success: true, data: field });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getEntityValues(req: Request, res: Response): Promise<void> {
  try {
    const { entityId } = req.params;

    const values = await prisma.customFieldValue.findMany({
      where: { entityId },
      include: { customField: true },
    });

    res.json({ success: true, data: values });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function saveEntityValues(req: Request, res: Response): Promise<void> {
  try {
    const { entityId } = req.params;
    const { values } = req.body; // Array of { customFieldId: string, value: string }

    if (!Array.isArray(values)) {
      res.status(400).json({ success: false, message: 'Formato de valores inválido' });
      return;
    }

    for (const v of values) {
      await prisma.customFieldValue.upsert({
        where: {
          customFieldId_entityId: {
            customFieldId: v.customFieldId,
            entityId,
          },
        },
        update: { value: String(v.value) },
        create: {
          customFieldId: v.customFieldId,
          entityId,
          value: String(v.value),
        },
      });
    }

    res.json({ success: true, message: 'Campos personalizados guardados correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateField(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);
    const { label, fieldType, options, isRequired, defaultValue } = req.body;

    const existing = await prisma.customField.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Campo personalizado no encontrado' });
      return;
    }

    if (!isSuper && existing.tenantId && existing.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permiso para modificar este campo' });
      return;
    }

    const updated = await prisma.customField.update({
      where: { id },
      data: {
        label: label !== undefined ? label : existing.label,
        fieldType: fieldType ? String(fieldType).toUpperCase() : existing.fieldType,
        optionsJson: options !== undefined ? (options ? JSON.stringify(options) : null) : existing.optionsJson,
        isRequired: isRequired !== undefined ? Boolean(isRequired) : existing.isRequired,
        defaultValue: defaultValue !== undefined ? defaultValue : existing.defaultValue,
      },
    });

    res.json({ success: true, data: updated, message: 'Campo personalizado actualizado correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteField(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const existing = await prisma.customField.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Campo personalizado no encontrado' });
      return;
    }

    if (!isSuper && existing.tenantId && existing.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permiso para eliminar este campo' });
      return;
    }

    // Delete associated values first
    await prisma.customFieldValue.deleteMany({ where: { customFieldId: id } });
    await prisma.customField.delete({ where: { id } });

    res.json({ success: true, message: 'Campo personalizado eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

