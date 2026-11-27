import { ChannelCapabilities } from '../types/sync.types';
import {
  CAPABILITY_CONFIG_SCHEMA,
  CapabilityConfigField,
} from './capability-config.schema';

export function getNestedValue(
  obj: Record<string, unknown> | null | undefined,
  dotPath: string
): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = dotPath.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function setNestedValue(
  obj: Record<string, unknown>,
  dotPath: string,
  value: unknown
): Record<string, unknown> {
  const parts = dotPath.split('.');
  let cursor = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!cursor[part] || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) {
      cursor[part] = {};
    }
    cursor = cursor[part] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
  return obj;
}

/**
 * Resolves a capability config field from Connection.config, falling back
 * to the field's declared default when omitted or invalid.
 */
export function readCapabilityValue<T = unknown>(
  config: Record<string, unknown> | null | undefined,
  field: CapabilityConfigField
): T {
  const raw = getNestedValue(config, field.path);
  if (raw === undefined || raw === null) {
    return field.default as T;
  }

  if (field.type === 'select' && field.options) {
    const allowed = field.options.map((opt) => opt.value);
    if (!allowed.includes(String(raw))) {
      return field.default as T;
    }
    return String(raw) as T;
  }

  if (field.type === 'boolean') {
    return Boolean(raw) as T;
  }

  if (field.type === 'number') {
    const num = Number(raw);
    return (Number.isFinite(num) ? num : field.default) as T;
  }

  return String(raw) as T;
}

/**
 * Returns the active capability config fields applicable to a ChannelType's capabilities.
 */
export function getSchemaForCapabilities(
  capabilities: Partial<ChannelCapabilities> | null | undefined
): Record<string, readonly CapabilityConfigField[]> {
  if (!capabilities) return {};
  const active: Record<string, readonly CapabilityConfigField[]> = {};
  for (const [capabilityKey, fields] of Object.entries(CAPABILITY_CONFIG_SCHEMA)) {
    if ((capabilities as Record<string, boolean | undefined>)[capabilityKey]) {
      active[capabilityKey] = fields;
    }
  }
  return active;
}

/**
 * Validates backend-owned capability configuration fields on connection save.
 */
export function validateCapabilityConfig(
  capabilities: Partial<ChannelCapabilities> | null | undefined,
  config: Record<string, unknown> | null | undefined
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!config || typeof config !== 'object') {
    return { valid: true, errors };
  }

  const activeSchema = getSchemaForCapabilities(capabilities);
  for (const fields of Object.values(activeSchema)) {
    for (const field of fields) {
      if (field.readBy !== 'backend') continue;
      const value = getNestedValue(config, field.path);
      if (value === undefined || value === null || value === '') continue;

      if (field.type === 'select' && field.options) {
        const validValues = field.options.map((o) => o.value);
        if (!validValues.includes(String(value))) {
          errors.push(
            `Invalid value "${value}" for "${field.path}". Allowed values: ${validValues.join(', ')}`
          );
        }
      } else if (field.type === 'number') {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue) || numericValue < 0) {
          errors.push(`Field "${field.path}" must be a non-negative number`);
        }
      } else if (field.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`Field "${field.path}" must be a boolean`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
