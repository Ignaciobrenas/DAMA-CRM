/**
 * Enterprise Data Sanitizer & Sensitive Field Masking
 * Compliant with RGPD Art. 32, LOPDGDD, and OWASP ASVS 8.3 (Data Leak Prevention)
 */

const SENSITIVE_KEY_PATTERNS = [
  /password|passwd|pwd/i,
  /secret/i,
  /token/i,
  /auth(orization)?/i,
  /bearer/i,
  /apikey/i,
  /api_key/i,
  /twofactor/i,
  /2fa/i,
  /credit_?card/i,
  /card_?number/i,
  /cvv/i,
  /pin/i,
];

/**
 * Mask sensitive keys in an object or primitive recursively.
 * Never throws; returns a safe copy without altering the original.
 */
export function maskSensitiveData(data: any, depth = 0): any {
  if (depth > 6 || data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item, depth + 1));
  }

  const sanitized: Record<string, any> = {};

  for (const [key, val] of Object.entries(data)) {
    const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));

    if (isSensitiveKey) {
      if (typeof val === 'string' && val.length > 0) {
        sanitized[key] = '[REDACTED_SENSITIVE_DATA]';
      } else {
        sanitized[key] = '[REDACTED]';
      }
      continue;
    }

    // Mask IBAN/Bank accounts partially if found in a value
    if (key.toLowerCase().includes('iban') || key.toLowerCase().includes('bankaccount')) {
      if (typeof val === 'string' && val.length >= 8) {
        sanitized[key] = `${val.slice(0, 4)} **** **** **** ${val.slice(-4)}`;
      } else {
        sanitized[key] = '[REDACTED_IBAN]';
      }
      continue;
    }

    // Mask Spanish DNI / NIE / CIF if explicitly flagged as passport/national ID in sensitive contexts
    if (key.toLowerCase() === 'dnipassport') {
      sanitized[key] = '***PROCESADO***';
      continue;
    }

    // Recursively sanitize nested objects
    if (typeof val === 'object' && val !== null) {
      sanitized[key] = maskSensitiveData(val, depth + 1);
    } else {
      sanitized[key] = val;
    }
  }

  return sanitized;
}
