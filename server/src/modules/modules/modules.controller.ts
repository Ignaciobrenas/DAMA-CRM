import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import { logAudit } from '../../middlewares/audit.middleware';
import { wsService } from '../../services/websocket.service';

export interface CompanyModulesConfig {
  portalEmpleado: boolean;
  tickets: boolean;
  expenses: boolean;
  pipeline: boolean;
  agile: boolean;
  contacts: boolean;
  companies: boolean;
  invoicing: boolean;
  inventory: boolean;
  workflows: boolean;
  omnichannel: boolean;
  integrations: boolean;
  leadCapture: boolean;
  reports: boolean;
  clientPortal: boolean;
}

export const DEFAULT_MODULES_CONFIG: CompanyModulesConfig = {
  portalEmpleado: true,
  tickets: true,
  expenses: true,
  pipeline: true,
  agile: true,
  contacts: true,
  companies: true,
  invoicing: true,
  inventory: true,
  workflows: true,
  omnichannel: true,
  integrations: true,
  leadCapture: true,
  reports: true,
  clientPortal: true,
};

/**
 * Resolve tenant slug/ID based on user context or God SuperAdmin query param
 */
function resolveTenant(req: Request): string {
  const user = (req as any).user;
  const isSuperAdmin = user?.role === 'ADMIN' || user?.email === 'ignaciobrenas@gmail.com' || user?.email === 'admin@dama-crm.local';
  
  if (isSuperAdmin && req.query.tenantId) {
    return String(req.query.tenantId);
  }
  return user?.tenantId || (req.headers['x-tenant-id'] as string) || 'master';
}

/**
 * Check if the user is a Company Administrator or God SuperAdmin
 */
function isUserCompanyAdmin(user: any): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN' || user.email === 'ignaciobrenas@gmail.com' || user.email === 'admin@dama-crm.local') {
    return true;
  }
  return user.role === 'COMPANY_ADMIN' || user.role === 'OWNER';
}

/**
 * GET /api/modules
 * Retrieve active module configuration for the current company/tenant
 */
export async function getCompanyModules(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as any).user;
    const tenantSlug = resolveTenant(req);

    // Look up tenant or create fallback entry
    let tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant && tenantSlug === 'master') {
      tenant = await prisma.tenant.create({
        data: {
          slug: 'master',
          name: 'Master Enterprise',
          isGodTenant: true,
          settings: JSON.stringify({ modules: DEFAULT_MODULES_CONFIG }),
        },
      });
    }

    let activeModules = { ...DEFAULT_MODULES_CONFIG };
    if (tenant?.settings) {
      try {
        const parsed = JSON.parse(tenant.settings);
        if (parsed.modules && typeof parsed.modules === 'object') {
          activeModules = { ...DEFAULT_MODULES_CONFIG, ...parsed.modules };
        }
      } catch {
        activeModules = { ...DEFAULT_MODULES_CONFIG };
      }
    }

    res.json({
      success: true,
      data: activeModules,
      tenant: {
        id: tenant?.id || tenantSlug,
        slug: tenant?.slug || tenantSlug,
        name: tenant?.name || 'Empresa Principal',
      },
      isCompanyAdmin: isUserCompanyAdmin(user),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PATCH /api/modules
 * Activate or deactivate functional modules for the company (Company Admin only)
 */
export async function updateCompanyModules(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as any).user;
    if (!isUserCompanyAdmin(user)) {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado: Solo el Administrador de la empresa puede modificar los módulos activos.',
      });
      return;
    }

    const tenantSlug = resolveTenant(req);
    const updates: Partial<CompanyModulesConfig> = req.body;

    // Fetch existing settings
    let tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    let currentSettings: any = {};
    if (tenant?.settings) {
      try {
        currentSettings = JSON.parse(tenant.settings);
      } catch {
        currentSettings = {};
      }
    }

    const currentModules = currentSettings.modules || DEFAULT_MODULES_CONFIG;
    const mergedModules: CompanyModulesConfig = {
      ...DEFAULT_MODULES_CONFIG,
      ...currentModules,
      ...updates,
    };

    const updatedSettings = {
      ...currentSettings,
      modules: mergedModules,
      updatedAt: new Date().toISOString(),
    };

    if (tenant) {
      tenant = await prisma.tenant.update({
        where: { slug: tenantSlug },
        data: {
          settings: JSON.stringify(updatedSettings),
        },
      });
    } else {
      tenant = await prisma.tenant.create({
        data: {
          slug: tenantSlug,
          name: tenantSlug,
          settings: JSON.stringify(updatedSettings),
        },
      });
    }

    await logAudit(
      user.id,
      'UPDATE_MODULES',
      'Tenant',
      tenant.id,
      { tenantSlug, modules: mergedModules },
      req.ip
    );

    // Notify all connected clients in this tenant in real-time
    wsService.broadcast('modules:updated', {
      tenantId: tenantSlug,
      modules: mergedModules,
    });

    res.json({
      success: true,
      message: 'Configuración de módulos actualizada correctamente',
      data: mergedModules,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/modules/export-backup
 * Export full JSON data backup for current company
 */
export async function exportCompanyBackup(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as any).user;
    if (!isUserCompanyAdmin(user)) {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo administradores pueden exportar copias de seguridad.',
      });
      return;
    }

    const isSuperAdmin = user?.role === 'ADMIN' || user?.email === 'ignaciobrenas@gmail.com' || user?.email === 'admin@dama-crm.local';
    const tenantSlug = resolveTenant(req);
    const tenantFilter: any = isSuperAdmin && !req.query.tenantId ? {} : { tenantId: tenantSlug };

    const [
      contacts,
      companies,
      deals,
      invoices,
      projects,
      tasks,
      tickets,
      timeRecords,
    ] = await Promise.all([
      prisma.contact.findMany({ where: tenantFilter, take: 5000 }).catch(() => []),
      prisma.company.findMany({ where: tenantFilter, take: 5000 }).catch(() => []),
      prisma.deal.findMany({ where: tenantFilter, take: 5000 }).catch(() => []),
      prisma.invoice.findMany({ where: tenantFilter, take: 5000 }).catch(() => []),
      prisma.project.findMany({ where: tenantFilter, take: 5000 }).catch(() => []),
      prisma.task.findMany({ where: tenantFilter, take: 5000 }).catch(() => []),
      prisma.ticket.findMany({ where: tenantFilter, take: 5000 }).catch(() => []),
      prisma.timeRecord.findMany({ where: tenantFilter, take: 5000 }).catch(() => []),
    ]);

    const backupData = {
      version: '1.2.0',
      exportedAt: new Date().toISOString(),
      exportedBy: user.email,
      tenantId: isSuperAdmin && !req.query.tenantId ? 'ALL_TENANTS' : tenantSlug,
      counts: {
        contacts: contacts.length,
        companies: companies.length,
        deals: deals.length,
        invoices: invoices.length,
        projects: projects.length,
        tasks: tasks.length,
        tickets: tickets.length,
        timeRecords: timeRecords.length,
      },
      data: {
        contacts,
        companies,
        deals,
        invoices,
        projects,
        tasks,
        tickets,
        timeRecords,
      },
    };

    await logAudit(user.id, 'EXPORT_BACKUP', 'System', tenantSlug, { records: backupData.counts, tenantId: tenantSlug }, req.ip);

    res.setHeader('Content-Disposition', `attachment; filename=dama_crm_backup_${tenantSlug}_${Date.now()}.json`);
    res.setHeader('Content-Type', 'application/json');
    res.json(backupData);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/modules/system-status
 * Diagnostics and storage health check
 */
export async function getSystemHealth(req: Request, res: Response): Promise<void> {
  try {
    const [userCount, companyCount, invoiceCount] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.company.count().catch(() => 0),
      prisma.invoice.count().catch(() => 0),
    ]);

    res.json({
      success: true,
      data: {
        status: 'ONLINE',
        dbProvider: 'PostgreSQL / SQLite Docker Engine',
        dbConnected: true,
        uptimeSeconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
        metrics: {
          users: userCount,
          companies: companyCount,
          invoices: invoiceCount,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
