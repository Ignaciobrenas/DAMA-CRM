import { ApiAuthType, ConnectionTransportType } from '../types/sync.types';
import { assertSafeOutboundUrl } from './ssrf-guard';

export const VALID_CONNECTION_TYPES: readonly ConnectionTransportType[] = [
  'api',
  'database',
  'ftp',
  'sftp',
  'webhook',
  'file',
];

export const VALID_API_AUTH_TYPES: readonly ApiAuthType[] = [
  'bearer',
  'basic_auth',
  'api_key',
  'api_key_body',
  'oauth_client_credentials',
  'oauth_authorization_code',
  'oauth_password',
  'soap_session',
  'custom',
];

export interface CredentialValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateConnectionCredentials(
  connectionType: ConnectionTransportType,
  credentials: Record<string, unknown> | null | undefined,
  options: { allowEmpty?: boolean } = {}
): CredentialValidationResult {
  const errors: string[] = [];

  if (!VALID_CONNECTION_TYPES.includes(connectionType)) {
    errors.push(`Unsupported connection type "${connectionType}"`);
    return { valid: false, errors };
  }

  if (!credentials || Object.keys(credentials).length === 0) {
    if (options.allowEmpty) return { valid: true, errors: [] };
    if (connectionType === 'api' || connectionType === 'webhook') {
      return { valid: true, errors: [] };
    }
    errors.push(`Credentials are required for connection type "${connectionType}"`);
    return { valid: false, errors };
  }

  switch (connectionType) {
    case 'api': {
      const authType = credentials.auth_type as ApiAuthType | undefined;
      if (authType && !VALID_API_AUTH_TYPES.includes(authType)) {
        errors.push(`Unsupported API auth_type "${authType}"`);
      }
      if (authType === 'oauth_client_credentials' || authType === 'oauth_authorization_code') {
        if (credentials.token_url && typeof credentials.token_url === 'string') {
          try {
            assertSafeOutboundUrl(credentials.token_url);
          } catch (err: any) {
            errors.push(`Invalid token_url: ${err.message}`);
          }
        }
        if (credentials.auth_url && typeof credentials.auth_url === 'string') {
          try {
            assertSafeOutboundUrl(credentials.auth_url);
          } catch (err: any) {
            errors.push(`Invalid auth_url: ${err.message}`);
          }
        }
      }
      if (authType === 'oauth_password' && credentials.token_url && typeof credentials.token_url === 'string') {
        try {
          assertSafeOutboundUrl(credentials.token_url);
        } catch (err: any) {
          errors.push(`Invalid token_url: ${err.message}`);
        }
      }
      break;
    }

    case 'database': {
      if (!credentials.host || typeof credentials.host !== 'string') {
        errors.push('Database credentials require a valid host');
      }
      const port = Number(credentials.port);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        errors.push('Database credentials require a valid port between 1 and 65535');
      }
      if (!credentials.username || typeof credentials.username !== 'string') {
        errors.push('Database credentials require a username');
      }
      if (!credentials.database || typeof credentials.database !== 'string') {
        errors.push('Database credentials require a database name');
      }
      break;
    }

    case 'ftp':
    case 'sftp': {
      if (!credentials.host || typeof credentials.host !== 'string') {
        errors.push(`${connectionType.toUpperCase()} credentials require a valid host`);
      }
      const port = Number(credentials.port);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        errors.push(`${connectionType.toUpperCase()} credentials require a valid port between 1 and 65535`);
      }
      if (!credentials.username || typeof credentials.username !== 'string') {
        errors.push(`${connectionType.toUpperCase()} credentials require a username`);
      }
      break;
    }

    case 'webhook': {
      if (credentials.url && typeof credentials.url === 'string') {
        try {
          assertSafeOutboundUrl(credentials.url);
        } catch (err: any) {
          errors.push(`Invalid webhook URL: ${err.message}`);
        }
      }
      if (
        credentials.method &&
        !['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(String(credentials.method).toUpperCase())
      ) {
        errors.push(`Invalid webhook HTTP method "${credentials.method}"`);
      }
      break;
    }

    case 'file': {
      if (!credentials.path || typeof credentials.path !== 'string') {
        errors.push('File credentials require a path');
      }
      if (!credentials.format || typeof credentials.format !== 'string') {
        errors.push('File credentials require a format (e.g. csv, json, xml)');
      }
      break;
    }
  }

  return { valid: errors.length === 0, errors };
}
