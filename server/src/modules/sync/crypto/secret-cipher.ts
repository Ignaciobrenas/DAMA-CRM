import crypto from 'crypto';

const CIPHER_PREFIX = 'gcmv1:';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_SALT = 'dama-crm-sync-secret-cipher-v1';

/**
 * Explicit allowlist of non-secret credential fields that may be exposed
 * in plain text when returning sanitized connection payloads to the client.
 * Every other field is treated as sensitive and masked as "***".
 */
const SAFE_CREDENTIAL_FIELDS = new Set<string>([
  'host',
  'port',
  'username',
  'database',
  'path',
  'format',
  'url',
  'method',
  'client_id',
  'token_url',
  'auth_url',
  'redirect_uri',
  'scope',
  'header_name',
  'body_field_name',
  'expires_at',
  'auth_type',
  'use_json_body',
  'skip_grant_type',
  'skip_body_credentials',
  'raw_token_response',
  'token_response_field',
]);

let cachedKey: Buffer | null = null;
let cachedSecretSource: string | null = null;

function resolveEncryptionKey(): Buffer {
  const source =
    process.env.SYNC_CREDENTIALS_SECRET ||
    process.env.JWT_SECRET ||
    'dama-crm-default-sync-credentials-key';

  if (cachedKey && cachedSecretSource === source) {
    return cachedKey;
  }

  cachedKey = crypto.scryptSync(source, KEY_SALT, 32);
  cachedSecretSource = source;
  return cachedKey;
}

export class SecretCipher {
  public static encryptString(plainText: string): string {
    if (!plainText) return '';
    if (plainText.startsWith(CIPHER_PREFIX)) return plainText;

    const key = resolveEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${CIPHER_PREFIX}${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  public static decryptString(payload: string | null | undefined): string {
    if (!payload) return '';
    if (!payload.startsWith(CIPHER_PREFIX)) {
      return payload;
    }

    const parts = payload.slice(CIPHER_PREFIX.length).split(':');
    if (parts.length !== 3) {
      throw new Error('Malformed encrypted credential payload');
    }

    const [ivB64, tagB64, dataB64] = parts;
    const key = resolveEncryptionKey();
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(tagB64, 'base64');
    const encrypted = Buffer.from(dataB64, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }

  public static encryptCredentials(credentials: Record<string, unknown> | null | undefined): string | null {
    if (!credentials || Object.keys(credentials).length === 0) {
      return null;
    }
    return this.encryptString(JSON.stringify(credentials));
  }

  public static decryptCredentials(encryptedPayload: string | null | undefined): Record<string, unknown> {
    if (!encryptedPayload) return {};
    try {
      const json = this.decryptString(encryptedPayload);
      const parsed = JSON.parse(json);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }

  /**
   * Masks every field outside the explicit safe allowlist.
   * Nested maps (such as custom headers or extra token fields) have their values masked too.
   */
  public static sanitizeCredentials(
    credentials: Record<string, unknown> | null | undefined
  ): Record<string, unknown> {
    if (!credentials || typeof credentials !== 'object') {
      return {};
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(credentials)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }

      if (SAFE_CREDENTIAL_FIELDS.has(key)) {
        sanitized[key] = value;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        const nestedMasked: Record<string, string> = {};
        for (const [nestedKey, nestedVal] of Object.entries(value as Record<string, unknown>)) {
          if (nestedVal !== undefined && nestedVal !== null && nestedVal !== '') {
            nestedMasked[nestedKey] = '***';
          }
        }
        sanitized[key] = nestedMasked;
      } else {
        sanitized[key] = '***';
      }
    }

    return sanitized;
  }

  /**
   * Merges incoming credentials with existing decrypted credentials.
   * Empty strings or masked placeholders ("***") keep the stored secret intact.
   */
  public static mergeCredentialsPreservingSecrets(
    existing: Record<string, unknown>,
    incoming: Record<string, unknown> | null | undefined
  ): Record<string, unknown> {
    if (!incoming) return { ...existing };

    const merged: Record<string, unknown> = { ...existing };
    for (const [key, value] of Object.entries(incoming)) {
      if (value === undefined) continue;

      if (value === '***' || value === '') {
        if (!SAFE_CREDENTIAL_FIELDS.has(key) && existing[key] !== undefined) {
          merged[key] = existing[key];
        } else if (value === '') {
          delete merged[key];
        }
        continue;
      }

      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        typeof existing[key] === 'object' &&
        existing[key] !== null &&
        !Array.isArray(existing[key])
      ) {
        const existingMap = existing[key] as Record<string, unknown>;
        const incomingMap = value as Record<string, unknown>;
        const mergedMap: Record<string, unknown> = {};
        for (const [nestedKey, nestedVal] of Object.entries(incomingMap)) {
          if ((nestedVal === '***' || nestedVal === '') && existingMap[nestedKey] !== undefined) {
            mergedMap[nestedKey] = existingMap[nestedKey];
          } else if (nestedVal !== undefined && nestedVal !== '') {
            mergedMap[nestedKey] = nestedVal;
          }
        }
        merged[key] = mergedMap;
      } else {
        merged[key] = value;
      }
    }

    return merged;
  }

  public static generateApiKey(prefix = 'dama'): { plainKey: string; maskedKey: string } {
    const raw = `${prefix}_${crypto.randomBytes(24).toString('hex')}`;
    return {
      plainKey: raw,
      maskedKey: this.maskKeyValue(raw),
    };
  }

  public static maskKeyValue(rawKey: string): string {
    if (!rawKey || rawKey.length <= 8) return '***';
    return `${rawKey.slice(0, 4)}***${rawKey.slice(-4)}`;
  }
}
