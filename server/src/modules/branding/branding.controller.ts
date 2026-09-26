import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../../prisma';
import { wsService } from '../../services/websocket.service';
import { logAudit } from '../../middlewares/audit.middleware';

const BRANDING_FILE = path.join(__dirname, '..', '..', '..', 'branding.json');

export interface BrandingConfig {
  companyName: string;
  logoUrl: string;
  logoLightUrl?: string;
  logoDarkUrl?: string;
  primaryColor: string;
  borderRadius: string;
  companyTaxId?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  currency?: string;
  defaultTaxRate?: number;
  invoicePrefix?: string;
  quotePrefix?: string;
  paymentTerms?: string;
  bankAccount?: string;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  companyName: 'DAMA CRM',
  logoUrl: '',
  logoLightUrl: '',
  logoDarkUrl: '',
  primaryColor: '#072053',
  borderRadius: 'md',
  companyTaxId: 'B-12345678',
  companyAddress: 'Avenida Tecnológica 42, 28046 Madrid, España',
  companyEmail: 'contacto@dama-crm.com',
  companyPhone: '+34 910 000 000',
  companyWebsite: 'https://damacrm.com',
  currency: 'EUR',
  defaultTaxRate: 21,
  invoicePrefix: 'FAC-2026-',
  quotePrefix: 'PRE-2026-',
  paymentTerms: 'Transferencia bancaria a 30 días',
  bankAccount: 'ES91 2100 0418 4502 0005 1332',
};

export function getBrandingConfig(): BrandingConfig {
  try {
    if (fs.existsSync(BRANDING_FILE)) {
      const data = JSON.parse(fs.readFileSync(BRANDING_FILE, 'utf-8'));
      return { ...DEFAULT_BRANDING, ...data };
    }
  } catch {
    // fallback to defaults on read error
  }
  return { ...DEFAULT_BRANDING };
}

export async function getBranding(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = (req as any).user?.tenantId || (req.headers['x-tenant-id'] as string) || 'master';
    
    // Attempt to load from Tenant in DB
    try {
      const tenant = await prisma.tenant.findFirst({
        where: {
          OR: [{ id: tenantId }, { slug: tenantId }],
        },
        select: { branding: true },
      });

      if (tenant?.branding) {
        const dbBranding = JSON.parse(tenant.branding);
        res.json({ success: true, data: { ...DEFAULT_BRANDING, ...dbBranding } });
        return;
      }
    } catch {
      // Fall back to file/memory if database table is initializing
    }

    res.json({ success: true, data: getBrandingConfig() });
  } catch (error: any) {
    res.json({ success: true, data: getBrandingConfig() });
  }
}

export async function updateBranding(req: Request, res: Response): Promise<void> {
  try {
    const current = getBrandingConfig();
    const updated: BrandingConfig = {
      ...current,
      ...req.body,
    };

    // 1. Persist to local JSON config fallback
    try {
      fs.writeFileSync(BRANDING_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not write branding.json fallback:', err);
    }

    // 2. Persist to Tenant in PostgreSQL / SQLite DB
    const tenantId = (req as any).user?.tenantId || (req.headers['x-tenant-id'] as string) || 'master';
    try {
      const existingTenant = await prisma.tenant.findFirst({
        where: {
          OR: [{ id: tenantId }, { slug: tenantId }],
        },
      });

      if (existingTenant) {
        await prisma.tenant.update({
          where: { id: existingTenant.id },
          data: {
            branding: JSON.stringify(updated),
            name: updated.companyName || existingTenant.name,
          },
        });
      } else {
        await prisma.tenant.create({
          data: {
            id: tenantId === 'master' ? 'master' : undefined,
            slug: tenantId,
            name: updated.companyName || 'DAMA Enterprise',
            branding: JSON.stringify(updated),
          },
        });
      }
    } catch (dbErr) {
      console.warn('Could not update Tenant branding in DB:', dbErr);
    }

    // 3. Log audit action
    const userId = (req as any).user?.id || null;
    await logAudit(userId, 'UPDATE_BRANDING', 'Tenant', tenantId, updated, req.ip);

    // 4. Real-time broadcast
    wsService.broadcast('branding:update', updated);

    res.json({ success: true, data: updated, message: 'Identidad y datos corporativos actualizados correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

