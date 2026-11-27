export type ToastKind = 'success' | 'error' | 'warning' | 'info';

const BURST_ERROR_TITLES = new Set<string>([
  'fallo de red',
  'error del servidor',
  'sesión expirada',
  'sesion expirada',
  'permiso denegado',
  'error en la solicitud',
]);

export function normalizeToastText(value?: string): string {
  if (!value) return '';
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/g, '');
}

/**
 * Generates deduplication keys for a toast notification.
 * - Exact key prevents identical (type, title, message) bursts.
 * - Message signature key for error/warning prevents double alerts when both
 *   api.ts global error handler and a component catch block emit the same error message.
 * - Category burst key collapses concurrent network / 5xx / 401 storms into one alert.
 */
export function buildToastDedupeKeys(
  type: ToastKind,
  title: string,
  message?: string
): string[] {
  const normTitle = normalizeToastText(title);
  const normMessage = normalizeToastText(message);
  const keys = [`${type}::exact::${normTitle}::${normMessage}`];

  if ((type === 'error' || type === 'warning') && normMessage.length >= 6) {
    keys.push(`${type}::msg::${normMessage}`);
  }

  if (type === 'error' && BURST_ERROR_TITLES.has(normTitle)) {
    keys.push(`${type}::cat::${normTitle}`);
  }

  return keys;
}

export interface DedupeCheckResult {
  allowed: boolean;
  keys: string[];
  existingId?: string;
}

interface ActiveKeyEntry {
  toastId: string;
  expiresAt: number;
}

/**
 * Pure, deterministic toast deduplicator preventing stacked duplicate alerts
 * during parallel request failures or double error handlers.
 */
export class ToastDeduplicator {
  private readonly cooldownMs: number;
  private readonly keyMap = new Map<string, ActiveKeyEntry>();
  private readonly idToKeys = new Map<string, string[]>();

  constructor(cooldownMs = 4000) {
    this.cooldownMs = cooldownMs;
  }

  public pruneExpired(now = Date.now()): void {
    for (const [key, entry] of this.keyMap.entries()) {
      if (entry.expiresAt <= now) {
        this.keyMap.delete(key);
      }
    }
  }

  public check(
    type: ToastKind,
    title: string,
    message?: string,
    now = Date.now()
  ): DedupeCheckResult {
    this.pruneExpired(now);
    const keys = buildToastDedupeKeys(type, title, message);

    for (const key of keys) {
      const existing = this.keyMap.get(key);
      if (existing && existing.expiresAt > now) {
        return { allowed: false, keys, existingId: existing.toastId };
      }
    }

    return { allowed: true, keys };
  }

  public register(
    toastId: string,
    keys: string[],
    durationMs?: number,
    now = Date.now()
  ): void {
    const ttl = Math.max(this.cooldownMs, durationMs ?? this.cooldownMs);
    const expiresAt = now + ttl;
    for (const key of keys) {
      this.keyMap.set(key, { toastId, expiresAt });
    }
    this.idToKeys.set(toastId, keys);
  }

  public release(toastId: string): void {
    const keys = this.idToKeys.get(toastId);
    if (!keys) return;
    for (const key of keys) {
      const current = this.keyMap.get(key);
      if (current && current.toastId === toastId) {
        this.keyMap.delete(key);
      }
    }
    this.idToKeys.delete(toastId);
  }

  public clear(): void {
    this.keyMap.clear();
    this.idToKeys.clear();
  }
}
