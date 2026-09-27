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

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  type?: string;
}

export function validateEmail(email: string): ValidationResult {
  if (!email || !email.trim()) {
    return { isValid: false, message: 'El correo electrónico es obligatorio' };
  }

  const trimmed = email.trim();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(trimmed)) {
    return { isValid: false, message: 'Formato de correo electrónico inválido (ej. usuario@empresa.com)' };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return { isValid: false, message: 'El correo debe contener un único @' };
  }

  const [local, domain] = parts;
  if (local.length > 64) {
    return { isValid: false, message: 'La parte local del correo es demasiado larga' };
  }

  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) {
    return { isValid: false, message: 'El dominio del correo debe tener una extensión válida (ej. .es, .com)' };
  }

  return { isValid: true };
}

export function validatePhone(phone: string): ValidationResult {
  if (!phone || !phone.trim()) {
    return { isValid: true };
  }

  const clean = phone.trim().replace(/[\s\-\(\)\.]/g, '');

  if (clean.startsWith('+')) {
    if (clean.length < 8 || clean.length > 16 || !/^\+[0-9]+$/.test(clean)) {
      return { isValid: false, message: 'Número internacional inválido (ej. +34 600 000 000)' };
    }
    return { isValid: true };
  }

  if (/^[6789][0-9]{8}$/.test(clean)) {
    return { isValid: true, type: 'ES' };
  }

  if (/^[0-9]{7,15}$/.test(clean)) {
    return { isValid: true };
  }

  return { isValid: false, message: 'Número de teléfono no válido (debe tener entre 9 y 15 dígitos)' };
}

export function validateSpanishTaxId(value: string): ValidationResult {
  if (!value || !value.trim()) {
    return { isValid: false, message: 'El CIF / NIF / NIE es requerido' };
  }

  const clean = value.trim().toUpperCase().replace(/[\s\-\.]/g, '');
  const nifLetters = 'TRWAGMYFPDXBNJZSQVHLCKE';

  const nifRegex = /^([0-9]{8})([A-Z])$/;
  if (nifRegex.test(clean)) {
    const match = clean.match(nifRegex)!;
    const number = parseInt(match[1], 10);
    const letter = match[2];
    const expectedLetter = nifLetters.charAt(number % 23);
    if (letter === expectedLetter) {
      return { isValid: true, type: 'NIF' };
    }
    return { isValid: false, message: `Letra de NIF incorrecta (esperada: ${expectedLetter})` };
  }

  const nieRegex = /^([XYZ])([0-9]{7})([A-Z])$/;
  if (nieRegex.test(clean)) {
    const match = clean.match(nieRegex)!;
    const prefix = match[1];
    const numberStr = match[2];
    const letter = match[3];

    let prefixNumber = '0';
    if (prefix === 'Y') prefixNumber = '1';
    if (prefix === 'Z') prefixNumber = '2';

    const fullNumber = parseInt(prefixNumber + numberStr, 10);
    const expectedLetter = nifLetters.charAt(fullNumber % 23);
    if (letter === expectedLetter) {
      return { isValid: true, type: 'NIE' };
    }
    return { isValid: false, message: `Letra de NIE incorrecta (esperada: ${expectedLetter})` };
  }

  const cifRegex = /^([ABCDEFGHJNPQRSUVW])([0-9]{7})([0-9A-J])$/;
  if (cifRegex.test(clean)) {
    const match = clean.match(cifRegex)!;
    const letter = match[1];
    const digits = match[2];
    const control = match[3];

    let evenSum = 0;
    let oddSum = 0;

    for (let i = 0; i < digits.length; i++) {
      const d = parseInt(digits[i], 10);
      if (i % 2 === 0) {
        const doubled = d * 2;
        oddSum += Math.floor(doubled / 10) + (doubled % 10);
      } else {
        evenSum += d;
      }
    }

    const totalSum = evenSum + oddSum;
    const unitDigit = totalSum % 10;
    const controlDigit = unitDigit === 0 ? 0 : 10 - unitDigit;
    const controlLetter = String.fromCharCode(64 + controlDigit);

    const letterControlOnly = /^[PQSKW]/.test(letter);
    const digitControlOnly = /^[ABEH]/.test(letter);

    if (letterControlOnly && control === controlLetter) {
      return { isValid: true, type: 'CIF' };
    }
    if (digitControlOnly && control === String(controlDigit)) {
      return { isValid: true, type: 'CIF' };
    }
    if (control === String(controlDigit) || control === controlLetter) {
      return { isValid: true, type: 'CIF' };
    }

    return { isValid: false, message: 'Dígito de control de CIF inválido' };
  }

  if (/^[A-Z]{2}[0-9A-Z]{5,15}$/.test(clean)) {
    return { isValid: true, type: 'VAT_INTL' };
  }

  return { isValid: false, message: 'CIF/NIF/NIE no válido (ej. B12345678 o 12345678Z)' };
}

export function validateUrl(url: string): ValidationResult {
  if (!url || !url.trim()) {
    return { isValid: true };
  }

  const trimmed = url.trim();
  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return { isValid: false, message: 'Formato de dominio web inválido (ej. www.miempresa.com)' };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, message: 'URL o sitio web no válido' };
  }
}

export function validateNumber(
  value: number | string,
  options?: { min?: number; max?: number; integer?: boolean; fieldName?: string }
): ValidationResult {
  const { min, max, integer, fieldName = 'El valor' } = options || {};

  if (value === '' || value === null || value === undefined) {
    return { isValid: false, message: `${fieldName} es requerido` };
  }

  const num = typeof value === 'number' ? value : parseFloat(String(value));

  if (isNaN(num)) {
    return { isValid: false, message: `${fieldName} debe ser un número válido` };
  }

  if (integer && !Number.isInteger(num)) {
    return { isValid: false, message: `${fieldName} debe ser un número entero` };
  }

  if (min !== undefined && num < min) {
    return { isValid: false, message: `${fieldName} debe ser como mínimo ${min}` };
  }

  if (max !== undefined && num > max) {
    return { isValid: false, message: `${fieldName} no puede superar ${max}` };
  }

  return { isValid: true };
}

export function validateIban(iban: string): ValidationResult {
  if (!iban || !iban.trim()) {
    return { isValid: true };
  }

  const clean = iban.trim().toUpperCase().replace(/[\s\-]/g, '');

  if (clean.length < 15 || clean.length > 34 || !/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(clean)) {
    return { isValid: false, message: 'Formato de cuenta IBAN inválido (ej. ES91 2100 0418 4502 0005 1332)' };
  }

  const rearranged = clean.slice(4) + clean.slice(0, 4);

  let numericString = '';
  for (let i = 0; i < rearranged.length; i++) {
    const charCode = rearranged.charCodeAt(i);
    if (charCode >= 65 && charCode <= 90) {
      numericString += (charCode - 55).toString();
    } else {
      numericString += rearranged[i];
    }
  }

  let remainder = 0;
  for (let i = 0; i < numericString.length; i += 7) {
    const chunk = remainder.toString() + numericString.substring(i, i + 7);
    remainder = parseInt(chunk, 10) % 97;
  }

  if (remainder !== 1) {
    return { isValid: false, message: 'Dígitos de control de IBAN incorrectos' };
  }

  return { isValid: true };
}

export function validateRequired(
  value: string | null | undefined,
  fieldName = 'Este campo',
  minLength = 1,
  maxLength = 255
): ValidationResult {
  if (!value || !value.trim()) {
    return { isValid: false, message: `${fieldName} es obligatorio` };
  }

  const len = value.trim().length;
  if (len < minLength) {
    return { isValid: false, message: `${fieldName} debe tener al menos ${minLength} caracteres` };
  }

  if (len > maxLength) {
    return { isValid: false, message: `${fieldName} no puede superar los ${maxLength} caracteres` };
  }

  return { isValid: true };
}

