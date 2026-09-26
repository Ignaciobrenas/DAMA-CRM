import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  // Safe server-side logging
  console.error(`🚨 [API Error] ${req.method} ${req.path}:`, err.message || err);

  let statusCode = err.statusCode || 500;
  let friendlyMessage = 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo en unos momentos.';

  // Friendly Prisma / Database Error Mappings
  if (err.code === 'P2002') {
    statusCode = 409;
    friendlyMessage = 'Ya existe un elemento con los mismos datos clave (ej. email, código o identificación duplicada).';
  } else if (err.code === 'P2025') {
    statusCode = 404;
    friendlyMessage = 'El registro solicitado no fue encontrado o ya no está disponible.';
  } else if (err.code === 'P2003') {
    statusCode = 400;
    friendlyMessage = 'No se puede modificar o eliminar este registro porque tiene otros elementos vinculados.';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    friendlyMessage = 'Tu sesión ha expirado o el token de acceso es inválido. Por favor, inicia sesión de nuevo.';
  } else if (statusCode < 500 && err.message) {
    // Client-side / validation error: keep concise message
    friendlyMessage = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message: friendlyMessage,
    errors: err.errors || undefined,
  });
}
