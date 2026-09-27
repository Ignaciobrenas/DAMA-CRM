import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../prisma';
import { isGodSuperAdmin, isTenantActive } from '../utils/tenant';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
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

    // Multi-tenant resolution:
    // Only God SuperAdmins can switch tenant via headers/query. Regular users are strictly bound to their user.tenantId.
    const isSuper = isGodSuperAdmin({ email: user.email, role: user.role.name, tenantId: user.tenantId });
    let resolvedTenantId = user.tenantId || 'master';

    if (isSuper) {
      const switchHeader = (req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id'] || req.headers['x-tenant-slug']) as string | undefined;
      if (switchHeader && switchHeader.trim()) {
        resolvedTenantId = switchHeader.trim().toLowerCase();
      } else if (req.query.tenantId && typeof req.query.tenantId === 'string' && req.query.tenantId.trim()) {
        resolvedTenantId = req.query.tenantId.trim().toLowerCase();
      }
    }

    // Verify if tenant is suspended (unless requester is SuperAdmin)
    if (!isSuper) {
      const tenantCheck = await isTenantActive(resolvedTenantId);
      if (!tenantCheck.active) {
        res.status(403).json({
          success: false,
          message: tenantCheck.message || 'La cuenta de esta empresa se encuentra temporalmente suspendida.',
          suspended: true,
        });
        return;
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: resolvedTenantId,
      roleId: user.roleId,
      role: user.role.name,
      permissions: Array.from(permissionsMap.values()),
    };

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token de acceso inválido o expirado' });
  }
}

