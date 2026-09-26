import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../prisma';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  tenantId?: string | null;
  roleId: string;
  role: string;
  permissions: Array<{ resource: string; action: string }>;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Cabecera de autenticación no proporcionada o formato inválido' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (payload.isTemp2FA) {
      res.status(403).json({ success: false, message: 'Token temporal de 2FA pendiente de validación' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Usuario no encontrado o cuenta desactivada' });
      return;
    }

    const permissionsMap = new Map<string, { resource: string; action: string }>();
    for (const p of user.role.permissions) {
      permissionsMap.set(`${p.resource}:${p.action}`, { resource: p.resource, action: p.action });
    }

    if (user.preferences) {
      try {
        const parsed = JSON.parse(user.preferences);
        if (Array.isArray(parsed.customPermissions)) {
          for (const cp of parsed.customPermissions) {
            if (cp.resource && cp.action) {
              permissionsMap.set(`${cp.resource}:${cp.action}`, { resource: cp.resource, action: cp.action });
            }
          }
        }
      } catch {}
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId || (req.headers['x-tenant-id'] as string) || 'master',
      roleId: user.roleId,
      role: user.role.name,
      permissions: Array.from(permissionsMap.values()),
    };

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token de acceso inválido o expirado' });
  }
}
