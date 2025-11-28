import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../prisma';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
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

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      role: user.role.name,
      permissions: user.role.permissions.map((p) => ({
        resource: p.resource,
        action: p.action,
      })),
    };

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token de acceso inválido o expirado' });
  }
}
