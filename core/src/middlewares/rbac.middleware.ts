import { Request, Response, NextFunction } from 'express';

/**
 * Dynamic RBAC Middleware for fine-grained permission checks.
 * Compares incoming HTTP operations against the database matrix.
 *
 * @param resource - Entity being accessed (e.g. "companies", "contacts", "deals", "invoices")
 * @param action - Verb / permission required (e.g. "create", "read", "update", "delete", "manage")
 */
export function requirePermission(resource: string, action: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    // System administrator bypasses matrix
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    // Check specific permission or 'manage' wildcard on the resource
    const hasPermission = req.user.permissions.some(
      (p) =>
        (p.resource === resource || p.resource === '*') &&
        (p.action === action || p.action === 'manage')
    );

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: `Acceso denegado: permiso insuficiente para realizar la acción '${action}' sobre el recurso '${resource}'`,
      });
      return;
    }

    next();
  };
}
