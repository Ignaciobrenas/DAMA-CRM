import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Middleware de Express para validación declarativa con esquemas Zod
 */
export function validate(schema: ZodSchema<any>, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const zodError = result.error as ZodError;
      const formattedErrors = zodError.errors.map((err) => ({
        field: err.path.join('.') || target,
        message: err.message,
      }));

      const primaryMessage = formattedErrors[0]?.message || 'Error de validación en los campos enviados';

      res.status(400).json({
        success: false,
        message: primaryMessage,
        errors: formattedErrors,
      });
      return;
    }

    // Reemplazar con los datos parseados y saneados
    req[target] = result.data;
    next();
  };
}
