// ==============================================================================
// DAMA-CRM Client Validation Utilities
// ==============================================================================

export const PHONE_REGEX = /^\+?[0-9\s\-().]{7,20}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PasswordRule {
  id: string;
  label: string;
  passed: boolean;
}

export interface PasswordCheckResult {
  isValid: boolean;
  score: number; // 0 to 5
  percentage: number; // 0 to 100
  rules: PasswordRule[];
  label: string;
  colorClass: string;
}

/**
 * Validador reactivo de contraseña con desglose de requisitos de seguridad:
 * - Mínimo 8 caracteres
 * - Al menos una letra mayúscula (A-Z)
 * - Al menos una letra minúscula (a-z)
 * - Al menos un número (0-9)
 * - Al menos un carácter especial o símbolo (!@#$%...)
 */
export function checkPasswordStrength(password: string): PasswordCheckResult {
  const pwd = password || '';

  const rules: PasswordRule[] = [
    {
      id: 'length',
      label: 'Mínimo 8 caracteres',
      passed: pwd.length >= 8,
    },
    {
      id: 'uppercase',
      label: 'Al menos una letra mayúscula (A-Z)',
      passed: /[A-Z]/.test(pwd),
    },
    {
      id: 'lowercase',
      label: 'Al menos una letra minúscula (a-z)',
      passed: /[a-z]/.test(pwd),
    },
    {
      id: 'number',
      label: 'Al menos un número (0-9)',
      passed: /[0-9]/.test(pwd),
    },
    {
      id: 'symbol',
      label: 'Al menos un símbolo especial (!@#$%^&*...)',
      passed: /[^A-Za-z0-9]/.test(pwd),
    },
  ];

  const score = rules.filter((r) => r.passed).length;
  const percentage = Math.round((score / rules.length) * 100);

  let label = 'Muy Débil';
  let colorClass = 'bg-red-500 text-red-700 dark:text-red-400';

  if (score === 5) {
    label = 'Excelente (Muy Segura)';
    colorClass = 'bg-emerald-500 text-emerald-700 dark:text-emerald-400';
  } else if (score >= 4) {
    label = 'Segura';
    colorClass = 'bg-emerald-500 text-emerald-600 dark:text-emerald-400';
  } else if (score >= 3) {
    label = 'Aceptable';
    colorClass = 'bg-amber-500 text-amber-600 dark:text-amber-400';
  } else if (score >= 2) {
    label = 'Débil';
    colorClass = 'bg-orange-500 text-orange-600 dark:text-orange-400';
  }

  return {
    isValid: score === 5,
    score,
    percentage,
    rules,
    label,
    colorClass,
  };
}

/**
 * Validador de formato de correo electrónico
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validador de formato de número de teléfono (nacional o internacional)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  return PHONE_REGEX.test(phone.trim());
}
