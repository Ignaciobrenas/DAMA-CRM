import { SyncHttpError } from '../types/sync.types';

const BLOCKED_HOSTS = new Set<string>([
  '169.254.169.254',
  '169.254.170.2',
  '100.100.100.200',
  '0.0.0.0',
  'metadata.google.internal',
  'metadata.goog',
  'fd00:ec2::254',
  '[fd00:ec2::254]',
]);

/**
 * Minimal outbound URL guard preventing SSRF against cloud metadata endpoints
 * and non-HTTP(S) schemes while still allowing private LAN / loopback ERPs and tunnels.
 */
export function assertSafeOutboundUrl(rawUrl: string): URL {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new SyncHttpError(400, 'Outbound URL is required');
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new SyncHttpError(400, `Invalid URL format: "${rawUrl}"`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new SyncHttpError(
      400,
      `Disallowed URL protocol "${parsed.protocol}". Only http: and https: are permitted`
    );
  }

  const normalizedHost = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(normalizedHost) || normalizedHost.startsWith('169.254.')) {
    throw new SyncHttpError(
      400,
      `Blocked outbound destination "${parsed.hostname}" for security reasons`
    );
  }

  return parsed;
}
