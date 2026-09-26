import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { NotificationService } from './notifications.service';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId || 'master';
    const userId = (req as any).user?.id;
    const unreadOnly = req.query.unreadOnly === 'true';
    const type = req.query.type as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      ...(userId ? { OR: [{ userId }, { userId: null }] } : {}),
      ...(unreadOnly ? { read: false } : {}),
      ...(type && type !== 'all' ? { type } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          tenantId,
          ...(userId ? { OR: [{ userId }, { userId: null }] } : {}),
          read: false,
        },
      }),
    ]);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener notificaciones', error: error.message });
  }
};

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId || 'master';
    const userId = (req as any).user?.id;

    const unreadCount = await prisma.notification.count({
      where: {
        tenantId,
        ...(userId ? { OR: [{ userId }, { userId: null }] } : {}),
        read: false,
      },
    });

    res.json({ success: true, count: unreadCount });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener conteo de no leídas', error: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId || 'master';

    const notification = await prisma.notification.findFirst({
      where: { id, tenantId },
    });

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notificación no encontrada' });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al marcar como leída', error: error.message });
  }
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId || 'master';
    const userId = (req as any).user?.id;

    const where: any = {
      tenantId,
      ...(userId ? { OR: [{ userId }, { userId: null }] } : {}),
      read: false,
    };

    await prisma.notification.updateMany({
      where,
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    res.json({ success: true, message: 'Todas las notificaciones han sido marcadas como leídas' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al marcar todas como leídas', error: error.message });
  }
};

export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId || 'master';

    const notification = await prisma.notification.findFirst({
      where: { id, tenantId },
    });

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notificación no encontrada' });
      return;
    }

    await prisma.notification.delete({ where: { id } });
    res.json({ success: true, message: 'Notificación eliminada correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al eliminar notificación', error: error.message });
  }
};

export const clearReadNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId || 'master';
    const userId = (req as any).user?.id;

    const where: any = {
      tenantId,
      ...(userId ? { OR: [{ userId }, { userId: null }] } : {}),
      read: true,
    };

    const deleted = await prisma.notification.deleteMany({ where });
    res.json({ success: true, message: `${deleted.count} notificaciones leídas eliminadas` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al limpiar notificaciones leídas', error: error.message });
  }
};

export const createNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId || 'master';
    const { title, message, type, priority, actionUrl, metadata, userId } = req.body;

    if (!title || !message) {
      res.status(400).json({ success: false, message: 'Título y mensaje son obligatorios' });
      return;
    }

    const created = await NotificationService.dispatch({
      tenantId,
      userId: userId || (req as any).user?.id,
      title,
      message,
      type,
      priority,
      actionUrl,
      metadata,
    });

    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al crear notificación', error: error.message });
  }
};
