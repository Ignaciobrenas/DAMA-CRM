/**
 * Utility to extract company / tenant slug from subdomain
 * Supports:
 * - god.dama.com -> 'god'
 * - ignacio-corp.dama.com -> 'ignacio-corp'
 * - empresa.damacrm.local -> 'empresa'
 * - god.localhost:3000 -> 'god'
 */
export function getSubdomainTenant(): string | null {
  if (typeof window === 'undefined') return null;

  const hostname = window.location.hostname.toLowerCase();

  // Root domains or local development without subdomains
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === 'dama.com' ||
    hostname === 'damacrm.local' ||
    hostname === 'www.dama.com' ||
    hostname === 'app.dama.com'
  ) {
    return null;
  }

  // Handle *.dama.com, *.damacrm.local, *.localhost
  if (
    hostname.endsWith('.dama.com') ||
    hostname.endsWith('.damacrm.local') ||
    hostname.endsWith('.localhost')
  ) {
    const parts = hostname.split('.');
    const subdomain = parts[0];
    if (
      subdomain &&
      subdomain !== 'www' &&
      subdomain !== 'api' &&
      subdomain !== 'mail' &&
      subdomain !== 'traefik'
    ) {
      return subdomain;
    }
  }

  return null;
}

/**
 * Build the full subdomain URL for a company slug
 * Example: buildCompanyUrl('god') -> 'http://god.dama.com'
 */
export function buildCompanyUrl(slug: string, port?: string): string {
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'dama.com';
  const effectivePort = port || (typeof window !== 'undefined' && window.location.port ? `:${window.location.port}` : '');

  if (currentHost.includes('dama.com')) {
    return `${protocol}//${slug}.dama.com${effectivePort}`;
  }

  if (currentHost.includes('damacrm.local')) {
    return `${protocol}//${slug}.damacrm.local${effectivePort}`;
  }

  if (currentHost.includes('localhost')) {
    return `${protocol}//${slug}.localhost${effectivePort}`;
  }

  return `${protocol}//${slug}.dama.com${effectivePort}`;
}
