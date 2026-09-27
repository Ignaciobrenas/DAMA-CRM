import { Request } from 'express';
import { prisma } from '../prisma';

export interface UserContext {
  id?: string;
  email?: string;
  role?: string;
  tenantId?: string | null;
}

/**
 * Determines if a user or request has God SuperAdmin privileges
 */
export function isGodSuperAdmin(userOrReq: Request | UserContext | null | undefined): boolean {
  if (!userOrReq) return false;
  const user = 'user' in userOrReq ? (userOrReq as any).user : (userOrReq as UserContext);
  
  // If request has god slug in headers
  if ('headers' in userOrReq) {
    const headerSlug = (userOrReq as any).headers?.['x-tenant-slug'] || (userOrReq as any).headers?.['x-tenant-id'];
    if (headerSlug === 'god') return true;
  }

  if (!user) return false;

  const isAdminRole = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'GOD';
  const isGodEmail = user.email === 'ignaciobrenas@gmail.com' || user.email === 'admin@dama-crm.local';
  const isGodTenant = !user.tenantId || user.tenantId === 'master' || user.tenantId === 'god';

  return isGodEmail || user.tenantId === 'god' || user.role === 'GOD' || (isAdminRole && isGodTenant);
}

/**
 * Resolves the effective tenant slug for the current request.
 * - Non-SuperAdmins are strictly locked to their assigned `user.tenantId` (default 'master').
 * - SuperAdmins can switch context via `X-Switch-Tenant-ID` / `X-Tenant-ID` headers or query parameters.
 */
export function getRequestTenant(req: Request): string {
  const user = (req as any).user;
  const userTenant = user?.tenantId || 'master';

  if (!user) {
    // For unauthenticated/public endpoints (like lead capture or public quote sign)
    const headerTenant = req.headers['x-tenant-id'] || req.headers['x-tenant-slug'];
    if (headerTenant && typeof headerTenant === 'string' && headerTenant.trim()) {
      return headerTenant.trim().toLowerCase();
    }
    return 'master';
  }

  // If user is God SuperAdmin, allow tenant switching via header or query
  if (isGodSuperAdmin(req)) {
    const switchHeader = req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id'] || req.headers['x-tenant-slug'];
    if (switchHeader && typeof switchHeader === 'string' && switchHeader.trim()) {
      return switchHeader.trim().toLowerCase();
    }
    if (req.query.tenantId && typeof req.query.tenantId === 'string' && req.query.tenantId.trim()) {
      return req.query.tenantId.trim().toLowerCase();
    }
  }

  // Standard user is ALWAYS restricted to their own tenant
  return userTenant;
}

/**
 * Validates whether the authenticated user is allowed to access data of targetTenantId
 */
export function canAccessTenant(req: Request, targetTenantId: string | null | undefined): boolean {
  if (!targetTenantId) return true;
  if (isGodSuperAdmin(req)) return true;
  const currentTenant = getRequestTenant(req);
  return currentTenant === targetTenantId || currentTenant === 'god' || targetTenantId === 'god';
}

/**
 * Verifies if a tenant exists and is active (not suspended)
 */
export async function isTenantActive(tenantSlug: string): Promise<{ active: boolean; message?: string }> {
  if (!tenantSlug || tenantSlug === 'master' || tenantSlug === 'god') {
    return { active: true };
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { slug: true, status: true, isGodTenant: true },
    });

    if (!tenant) {
      return { active: true }; // Default to active if tenant record not yet initialized
    }

    if (tenant.isGodTenant || tenant.slug === 'god' || tenant.slug === 'master') {
      return { active: true };
    }

    if (tenant.status === 'SUSPENDED') {
      return {
        active: false,
        message: 'La cuenta de esta empresa está temporalmente suspendida por administración. Por favor contacte con soporte.',
      };
    }

    return { active: true };
  } catch {
    return { active: true };
  }
}
