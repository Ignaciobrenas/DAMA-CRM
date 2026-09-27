/**
 * Enterprise Form Validation Engine
 * Validates emails, Spanish Tax IDs (NIF, NIE, CIF), Phone numbers, URLs, IBAN, and Numeric constraints in real-time.
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  type?: string;
}

/**
 * Validates Email Address with strict domain, TLD and character checks.
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || !email.trim()) {
    return { isValid: false, message: 'El correo electrónico es obligatorio' };
  }

  const trimmed = email.trim();

  // Basic RFC 5322 compatible regex
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

/**
 * Validates Phone numbers (Spanish mobile/landline and international format E.164)
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone || !phone.trim()) {
    return { isValid: true }; // Optional if empty
  }

  const clean = phone.trim().replace(/[\s\-\(\)\.]/g, '');

  // International format starting with + (e.g. +34612345678)
  if (clean.startsWith('+')) {
    if (clean.length < 8 || clean.length > 16 || !/^\+[0-9]+$/.test(clean)) {
      return { isValid: false, message: 'Número internacional inválido (ej. +34 600 000 000)' };
    }
    return { isValid: true };
  }

  // Spanish phone number (9 digits starting with 6, 7, 8, or 9)
  if (/^[6789][0-9]{8}$/.test(clean)) {
    return { isValid: true, type: 'ES' };
  }

  // General 7-15 digit phone format
  if (/^[0-9]{7,15}$/.test(clean)) {
    return { isValid: true };
  }

  return { isValid: false, message: 'Número de teléfono no válido (debe tener entre 9 y 15 dígitos)' };
}

/**
 * Validates Spanish Tax Identification Numbers:
 * - DNI / NIF (8 digits + control letter)
 * - NIE (X/Y/Z + 7 digits + control letter)
 * - CIF (Letter + 7 digits + control digit/letter)
 */
export function validateSpanishTaxId(value: string): ValidationResult {
  if (!value || !value.trim()) {
    return { isValid: false, message: 'El CIF / NIF / NIE es requerido' };
  }

  const clean = value.trim().toUpperCase().replace(/[\s\-\.]/g, '');
  const nifLetters = 'TRWAGMYFPDXBNJZSQVHLCKE';

  // 1. Check Standard NIF (DNI: 8 digits + 1 letter)
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

  // 2. Check NIE (X, Y, Z + 7 digits + 1 letter)
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

  // 3. Check CIF (Corporate Tax ID: 1 letter + 7 digits + 1 control character)
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
        // Odd position (1st, 3rd, 5th, 7th in 1-based index)
        const doubled = d * 2;
        oddSum += Math.floor(doubled / 10) + (doubled % 10);
      } else {
        evenSum += d;
      }
    }

    const totalSum = evenSum + oddSum;
    const unitDigit = totalSum % 10;
    const controlDigit = unitDigit === 0 ? 0 : 10 - unitDigit;
    const controlLetter = String.fromCharCode(64 + controlDigit); // A=1, B=2...

    // Some CIF types require a letter control, others require digit, others allow both
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

  // Fallback for international VAT / tax IDs (e.g. DE123456789, FR12345678901)
  if (/^[A-Z]{2}[0-9A-Z]{5,15}$/.test(clean)) {
    return { isValid: true, type: 'VAT_INTL' };
  }

  return { isValid: false, message: 'CIF/NIF/NIE no válido (ej. B12345678 o 12345678Z)' };
}

/**
 * Validates Web URLs (with or without protocol)
 */
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

/**
 * Validates Positive Numbers, decimals, ranges, and integer constraints.
 */
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

/**
 * Validates International Bank Account Number (IBAN) using MOD-97 algorithm.
 */
export function validateIban(iban: string): ValidationResult {
  if (!iban || !iban.trim()) {
    return { isValid: true };
  }

  const clean = iban.trim().toUpperCase().replace(/[\s\-]/g, '');

  if (clean.length < 15 || clean.length > 34 || !/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(clean)) {
    return { isValid: false, message: 'Formato de cuenta IBAN inválido (ej. ES91 2100 0418 4502 0005 1332)' };
  }

  // Rearrange: move the 4 initial characters to the end
  const rearranged = clean.slice(4) + clean.slice(0, 4);

  // Convert letters to numbers (A=10, B=11, ..., Z=35)
  let numericString = '';
  for (let i = 0; i < rearranged.length; i++) {
    const charCode = rearranged.charCodeAt(i);
    if (charCode >= 65 && charCode <= 90) {
      numericString += (charCode - 55).toString();
    } else {
      numericString += rearranged[i];
    }
  }

  // Calculate mod 97 in chunks to avoid BigInt overflow
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

/**
 * Validates Non-empty required text fields with length limits.
 */
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

export interface PasswordStrengthRule {
  id: string;
  label: string;
  passed: boolean;
}

export interface PasswordStrengthResult {
  score: number;
  isValid: boolean;
  rules: PasswordStrengthRule[];
}

/**
 * Checks password strength and returns individual rule checks and overall score.
 */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const pwd = password || '';
  const rules: PasswordStrengthRule[] = [
    { id: 'min_length', label: 'Mínimo 8 caracteres', passed: pwd.length >= 8 },
    { id: 'has_upper', label: 'Al menos una letra mayúscula', passed: /[A-Z]/.test(pwd) },
    { id: 'has_lower', label: 'Al menos una letra minúscula', passed: /[a-z]/.test(pwd) },
    { id: 'has_number', label: 'Al menos un número', passed: /[0-9]/.test(pwd) },
    { id: 'has_special', label: 'Al menos un carácter especial (@, $, !, %, *, etc.)', passed: /[^A-Za-z0-9]/.test(pwd) },
  ];

  const passedCount = rules.filter((r) => r.passed).length;
  const score = Math.round((passedCount / rules.length) * 100);
  const isValid = passedCount >= 3;

  return {
    score,
    isValid,
    rules,
  };
}

/**
 * Boolean validator helpers
 */
export function isValidEmail(email: string): boolean {
  return validateEmail(email).isValid;
}

export function isValidPhone(phone: string): boolean {
  return validatePhone(phone).isValid;
}

export function isValidSpanishTaxId(taxId: string): boolean {
  return validateSpanishTaxId(taxId).isValid;
}

export function isValidUrl(url: string): boolean {
  return validateUrl(url).isValid;
}

export function isValidNumber(value: number | string, options?: { min?: number; max?: number; integer?: boolean }): boolean {
  return validateNumber(value, options).isValid;
}

export function isValidIban(iban: string): boolean {
  return validateIban(iban).isValid;
}

