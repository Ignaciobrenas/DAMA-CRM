import { Request, Response } from 'express';
import { prisma } from '../../prisma';

// Helper to check if current user is SuperAdmin
export function isGodSuperAdmin(req: Request): boolean {
  if (!req.user) return false;
  return (
    req.user.role === 'ADMIN' ||
    req.user.email === 'ignaciobrenas@gmail.com' ||
    req.user.email === 'admin@dama-crm.local'
  );
}

// 1. GET /api/god/tenants - List all tenants with summary statistics
export async function getTenants(req: Request, res: Response): Promise<void> {
  try {
    if (!isGodSuperAdmin(req)) {
      res.status(403).json({ success: false, message: 'Acceso restringido: requiere permisos de SuperAdmin God Mode' });
      return;
    }

    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Compute live metrics per tenant
    const tenantsWithMetrics = await Promise.all(
      tenants.map(async (t) => {
        const [usersCount, contactsCount, dealsCount, dealsTotal, invoicesTotal, openTicketsCount] = await Promise.all([
          prisma.user.count({ where: { tenantId: t.slug } }),
          prisma.contact.count({ where: { tenantId: t.slug } }),
          prisma.deal.count({ where: { tenantId: t.slug } }),
          prisma.deal.aggregate({ where: { tenantId: t.slug }, _sum: { value: true } }),
          prisma.invoice.aggregate({ where: { tenantId: t.slug, status: 'PAID' }, _sum: { total: true } }),
          prisma.ticket.count({ where: { tenantId: t.slug, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
        ]);

        return {
          ...t,
          usersCount,
          contactsCount,
          dealsCount,
          dealsVolume: dealsTotal._sum.value || 0,
          paidInvoicesVolume: invoicesTotal._sum.total || 0,
          openTicketsCount,
        };
      })
    );

    res.json({
      success: true,
      data: tenantsWithMetrics,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al recuperar listado de tenants', error });
  }
}

// 2. POST /api/god/tenants - Provision a new tenant
export async function createTenant(req: Request, res: Response): Promise<void> {
  try {
    if (!isGodSuperAdmin(req)) {
      res.status(403).json({ success: false, message: 'Acceso restringido: requiere permisos de SuperAdmin God Mode' });
      return;
    }

    const { slug, name, domain, plan, maxUsers, branding } = req.body;

    if (!slug || !name) {
      res.status(400).json({ success: false, message: 'El identificador (slug) y nombre de la empresa son requeridos' });
      return;
    }

    const normalizedSlug = slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');

    const existing = await prisma.tenant.findFirst({
      where: {
        OR: [
          { slug: normalizedSlug },
          ...(domain ? [{ domain }] : []),
        ],
      },
    });

    if (existing) {
      res.status(409).json({ success: false, message: 'Ya existe un tenant con este slug o dominio personalizado' });
      return;
    }

    const tenant = await prisma.tenant.create({
      data: {
        slug: normalizedSlug,
        name,
        domain: domain || `${normalizedSlug}.damacrm.com`,
        plan: plan || 'PRO',
        maxUsers: Number(maxUsers) || 10,
        status: 'ACTIVE',
        branding: typeof branding === 'object' ? JSON.stringify(branding) : branding || '{}',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'CREATE_TENANT',
        entity: 'Tenant',
        entityId: tenant.id,
        details: JSON.stringify({ slug: tenant.slug, name: tenant.name, plan: tenant.plan }),
      },
    });

    res.status(201).json({
      success: true,
      data: tenant,
      message: 'Tenant creado y aprovisionado con éxito',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear nuevo tenant', error });
  }
}

// 3. PATCH /api/god/tenants/:id/status - Toggle tenant status (ACTIVE / SUSPENDED)
export async function toggleTenantStatus(req: Request, res: Response): Promise<void> {
  try {
    if (!isGodSuperAdmin(req)) {
      res.status(403).json({ success: false, message: 'Acceso restringido: requiere permisos de SuperAdmin God Mode' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      res.status(404).json({ success: false, message: 'Tenant no encontrado' });
      return;
    }

    if (tenant.isGodTenant) {
      res.status(400).json({ success: false, message: 'No es posible suspender el Tenant Maestro (God Tenant)' });
      return;
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: { status: status || (tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE') },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'TOGGLE_TENANT_STATUS',
        entity: 'Tenant',
        entityId: updated.id,
        details: JSON.stringify({ oldStatus: tenant.status, newStatus: updated.status }),
      },
    });

    res.json({
      success: true,
      data: updated,
      message: `Tenant ${updated.status === 'ACTIVE' ? 'reactivado' : 'suspendido'} correctamente`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al cambiar estado del tenant', error });
  }
}

// 4. POST /api/god/switch-tenant - Impersonate/switch tenant context for Level-3 Support
export async function switchTenant(req: Request, res: Response): Promise<void> {
  try {
    if (!isGodSuperAdmin(req)) {
      res.status(403).json({ success: false, message: 'Acceso restringido: requiere permisos de SuperAdmin God Mode' });
      return;
    }

    const { targetTenantSlug } = req.body;

    if (!targetTenantSlug) {
      res.status(400).json({ success: false, message: 'targetTenantSlug es requerido' });
      return;
    }

    const targetTenant = await prisma.tenant.findUnique({
      where: { slug: targetTenantSlug },
    });

    if (!targetTenant) {
      res.status(404).json({ success: false, message: 'Tenant destino no encontrado' });
      return;
    }

    // Register high-priority security audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'SWITCH_TENANT_IMPERSONATION',
        entity: 'Tenant',
        entityId: targetTenant.id,
        details: JSON.stringify({
          superAdminId: req.user?.id,
          superAdminEmail: req.user?.email,
          targetSlug: targetTenant.slug,
          targetName: targetTenant.name,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    res.json({
      success: true,
      data: {
        activeTenant: targetTenant,
        impersonating: targetTenant.slug !== 'master',
      },
      message: `Conmutado a contexto del tenant: ${targetTenant.name}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al cambiar de tenant', error });
  }
}

// 5. GET /api/god/stats - Global SaaS overview metrics
export async function getGlobalStats(req: Request, res: Response): Promise<void> {
  try {
    if (!isGodSuperAdmin(req)) {
      res.status(403).json({ success: false, message: 'Acceso restringido: requiere permisos de SuperAdmin God Mode' });
      return;
    }

    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalDeals,
      dealsSum,
      paidInvoicesSum,
      openTicketsCount,
      urgentTicketsCount,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count(),
      prisma.deal.count(),
      prisma.deal.aggregate({ _sum: { value: true } }),
      prisma.invoice.aggregate({ where: { status: 'PAID' }, _sum: { total: true } }),
      prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, priority: 'URGENT' } }),
    ]);

    res.json({
      success: true,
      data: {
        totalTenants,
        activeTenants,
        totalUsers,
        totalDeals,
        totalDealsValue: dealsSum._sum.value || 0,
        totalRevenue: paidInvoicesSum._sum.total || 0,
        openTicketsCount,
        urgentTicketsCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener métricas globales', error });
  }
}
