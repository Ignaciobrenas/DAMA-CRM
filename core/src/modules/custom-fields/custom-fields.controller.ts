import { Request, Response } from 'express';
import { prisma } from '../../prisma';

export async function listFields(req: Request, res: Response): Promise<void> {
  try {
    const { entityType } = req.query;
    const where: any = {};
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
