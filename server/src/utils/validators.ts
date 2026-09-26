import { z } from 'zod';

// ==============================================================================
// Expresiones regulares normalizadas
// ==============================================================================
export const PHONE_REGEX = /^\+?[0-9\s\-().]{7,20}$/;
export const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
export const PASSWORD_LOWERCASE_REGEX = /[a-z]/;
export const PASSWORD_NUMBER_REGEX = /[0-9]/;
export const PASSWORD_SYMBOL_REGEX = /[^A-Za-z0-9]/;

// ==============================================================================
// 1. Validadores individuales (Campos base)
// ==============================================================================

/**
 * Validador estricto para correos electrónicos
 */
export const emailSchema = z
  .string({ required_error: 'El correo electrónico es un campo obligatorio' })
  .trim()
  .min(1, 'El correo electrónico no puede estar vacío')
  .email('El formato del correo electrónico es inválido (ej. usuario@dominio.com)')
  .toLowerCase();

/**
 * Validador opcional para correos electrónicos (acepta null, undefined o string vacío)
 */
export const optionalEmailSchema = z
  .string()
  .trim()
  .email('El formato del correo electrónico es inválido (ej. usuario@dominio.com)')
  .toLowerCase()
  .optional()
  .nullable()
  .or(z.literal(''));

/**
 * Validador robusto de contraseña:
 * - Mínimo 8 caracteres
 * - Al menos una letra mayúscula
 * - Al menos una letra minúscula
 * - Al menos un número
 * - Al menos un símbolo o carácter especial
 */
export const strongPasswordSchema = z
  .string({ required_error: 'La contraseña es un campo obligatorio' })
  .min(8, 'La contraseña debe tener un mínimo de 8 caracteres')
  .regex(PASSWORD_UPPERCASE_REGEX, 'La contraseña debe incluir al menos una letra mayúscula (A-Z)')
  .regex(PASSWORD_LOWERCASE_REGEX, 'La contraseña debe incluir al menos una letra minúscula (a-z)')
  .regex(PASSWORD_NUMBER_REGEX, 'La contraseña debe incluir al menos un número (0-9)')
  .regex(PASSWORD_SYMBOL_REGEX, 'La contraseña debe incluir al menos un carácter especial o símbolo (!@#$%^&*...)');

/**
 * Validador de número de teléfono obligatorio
 */
export const requiredPhoneSchema = z
  .string({ required_error: 'El número de teléfono es un campo obligatorio' })
  .trim()
  .min(1, 'El número de teléfono no puede estar vacío')
  .regex(PHONE_REGEX, 'El formato del teléfono es inválido (ej. +34 600 123 456 o 912345678)');

/**
 * Validador de número de teléfono opcional
 */
export const optionalPhoneSchema = z
  .string()
  .trim()
  .regex(PHONE_REGEX, 'El formato del teléfono es inválido (ej. +34 600 123 456 o 912345678)')
  .optional()
  .nullable()
  .or(z.literal(''));

// ==============================================================================
// 2. Esquemas de validación de Entidades (CRUD / Formularios)
// ==============================================================================

/**
 * Esquema de inicio de sesión
 */
export const loginSchema = z.object({
  email: z.string({ required_error: 'El correo electrónico es obligatorio' }).trim().min(1, 'El correo electrónico es obligatorio'),
  password: z.string({ required_error: 'La contraseña es obligatoria' }).min(1, 'La contraseña es obligatoria'),
});

/**
 * Esquema para alta de usuario corporativo
 */
export const createUserSchema = z.object({
  name: z
    .string({ required_error: 'El nombre completo es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: emailSchema,
  password: strongPasswordSchema,
  roleId: z
    .string({ required_error: 'El rol de usuario es obligatorio' })
    .trim()
    .min(1, 'El rol de usuario es obligatorio'),
});

/**
 * Esquema para creación de Contactos
 */
export const createContactSchema = z.object({
  firstName: z
    .string({ required_error: 'El nombre del contacto es obligatorio' })
    .trim()
    .min(1, 'El nombre del contacto es obligatorio'),
  lastName: z
    .string({ required_error: 'Los apellidos son obligatorios' })
    .trim()
    .min(1, 'Los apellidos son obligatorios'),
  email: emailSchema,
  phone: optionalPhoneSchema,
  mobile: optionalPhoneSchema,
  companyId: z.string().trim().optional().nullable().or(z.literal('')),
  position: z.string().trim().optional().nullable(),
  department: z.string().trim().optional().nullable(),
  isLead: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

/**
 * Esquema para creación de Empresas
 */
export const createCompanySchema = z.object({
  name: z
    .string({ required_error: 'La razón social o nombre de la empresa es obligatorio' })
    .trim()
    .min(2, 'El nombre de la empresa debe tener al menos 2 caracteres'),
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
  taxId: z.string().trim().optional().nullable(),
  industry: z.string().trim().optional().nullable(),
  website: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  country: z.string().trim().optional().nullable(),
  annualRevenue: z.number().nonnegative('Los ingresos deben ser un valor positivo').optional().nullable(),
  employeesCount: z.number().int().nonnegative('El número de empleados no puede ser negativo').optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * Esquema para creación de Oportunidades (Deals)
 */
export const createDealSchema = z.object({
  title: z
    .string({ required_error: 'El título de la oportunidad comercial es obligatorio' })
    .trim()
    .min(2, 'El título debe tener al menos 2 caracteres'),
  stageId: z
    .string({ required_error: 'La fase del embudo es obligatoria' })
    .trim()
    .min(1, 'La fase del embudo es obligatoria'),
  value: z
    .number({ invalid_type_error: 'El valor debe ser un número' })
    .nonnegative('El importe no puede ser negativo')
    .default(0),
  currency: z.string().trim().default('EUR'),
  contactId: z.string().trim().optional().nullable().or(z.literal('')),
  companyId: z.string().trim().optional().nullable().or(z.literal('')),
  expectedCloseDate: z.string().optional().nullable(),
  status: z.enum(['OPEN', 'WON', 'LOST']).default('OPEN'),
  notes: z.string().optional().nullable(),
});

/**
 * Esquema para creación de Facturas
 */
export const createInvoiceSchema = z.object({
  invoiceNumber: z
    .string({ required_error: 'El número correlativo de factura es obligatorio' })
    .trim()
    .min(1, 'El número correlativo de factura es obligatorio'),
  contactId: z.string().trim().optional().nullable().or(z.literal('')),
  companyId: z.string().trim().optional().nullable().or(z.literal('')),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  taxRate: z.number().default(21.0),
  currency: z.string().default('EUR'),
  notes: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        description: z
          .string({ required_error: 'La descripción del concepto es obligatoria' })
          .trim()
          .min(1, 'La descripción del concepto es obligatoria'),
        quantity: z
          .number({ required_error: 'La cantidad es obligatoria' })
          .positive('La cantidad de unidades debe ser mayor a 0'),
        unitPrice: z
          .number({ required_error: 'El precio unitario es obligatorio' })
          .nonnegative('El precio unitario no puede ser negativo'),
      }),
      { required_error: 'Debes añadir al menos una línea de concepto a la factura' }
    )
    .min(1, 'La factura debe tener al menos un concepto o producto'),
});

// ==============================================================================
// 3. Funciones utilitarias para verificación interactiva y tests unitarios
// ==============================================================================

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 a 5
  errors: string[];
  checks: {
    minLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const checks = {
    minLength: typeof password === 'string' && password.length >= 8,
    hasUpper: PASSWORD_UPPERCASE_REGEX.test(password || ''),
    hasLower: PASSWORD_LOWERCASE_REGEX.test(password || ''),
    hasNumber: PASSWORD_NUMBER_REGEX.test(password || ''),
    hasSymbol: PASSWORD_SYMBOL_REGEX.test(password || ''),
  };

  const errors: string[] = [];
  if (!checks.minLength) errors.push('Mínimo 8 caracteres');
  if (!checks.hasUpper) errors.push('Al menos una letra mayúscula (A-Z)');
  if (!checks.hasLower) errors.push('Al menos una letra minúscula (a-z)');
  if (!checks.hasNumber) errors.push('Al menos un número (0-9)');
  if (!checks.hasSymbol) errors.push('Al menos un símbolo o carácter especial (!@#$%...)');

  const passedCount = Object.values(checks).filter(Boolean).length;

  return {
    isValid: errors.length === 0,
    score: passedCount,
    errors,
    checks,
  };
}

export function validateEmailFormat(email: string): { isValid: boolean; error?: string } {
  const result = emailSchema.safeParse(email);
  return {
    isValid: result.success,
    error: !result.success ? result.error.errors[0]?.message : undefined,
  };
}

export function validatePhoneFormat(phone: string): { isValid: boolean; error?: string } {
  const result = requiredPhoneSchema.safeParse(phone);
  return {
    isValid: result.success,
    error: !result.success ? result.error.errors[0]?.message : undefined,
  };
}
