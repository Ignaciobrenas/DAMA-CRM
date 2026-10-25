import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../../prisma';
import { wsService } from '../../services/websocket.service';
import { logAudit } from '../../middlewares/audit.middleware';
import { generatePdfBuffer, InvoicePdfData } from '../invoices/pdf.service';
import { calculateVerifactuHash, generateVerifactuQrBuffer } from '../../services/verifactu.service';

const BRANDING_FILE = path.join(__dirname, '..', '..', '..', 'branding.json');

export type PdfTemplateStyle = 'MODERN_STRIPE' | 'CORPORATE_SAGE' | 'CLASSIC_EXECUTIVE' | 'MINIMAL_SWISS';

export interface BrandingConfig {
  companyName: string;
  logoUrl: string;
  logoLightUrl?: string;
  logoDarkUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
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
  // PDF Design Studio & Customization
  pdfTemplate?: PdfTemplateStyle;
  pdfAccentColor?: string;
  pdfSecondaryColor?: string;
  pdfShowLogo?: boolean;
  pdfLogoPosition?: 'LEFT' | 'RIGHT';
  pdfShowVerifactuQr?: boolean;
  pdfShowBankDetails?: boolean;
  pdfShowSignatureBox?: boolean;
  pdfShowWatermark?: boolean;
  pdfWatermarkText?: string;
  pdfHeaderSubtitle?: string;
  pdfMercantileRegistry?: string;
  pdfLopdText?: string;
  pdfFooterLegalText?: string;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  companyName: 'DAMA CRM',
  logoUrl: '',
  logoLightUrl: '',
  logoDarkUrl: '',
  primaryColor: '#2563EB',
  secondaryColor: '#0F172A',
  borderRadius: 'md',
  companyTaxId: 'B87654323',
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
  // PDF Design Studio Defaults
  pdfTemplate: 'MODERN_STRIPE',
  pdfAccentColor: '#2563EB',
  pdfSecondaryColor: '#0F172A',
  pdfShowLogo: true,
  pdfLogoPosition: 'LEFT',
  pdfShowVerifactuQr: true,
  pdfShowBankDetails: true,
  pdfShowSignatureBox: true,
  pdfShowWatermark: false,
  pdfWatermarkText: 'ORIGINAL · VERI*FACTU',
  pdfHeaderSubtitle: 'Sistemas de Gestión Empresarial & ERP Cloud',
  pdfMercantileRegistry: 'Inscrita en el Registro Mercantil de Madrid · Tomo 41.205 · Folio 112 · Hoja M-730412',
  pdfLopdText:
    'Protección de Datos (RGPD / LOPDGDD): Los datos personales reflejados en este documento son tratados por el emisor con la finalidad exclusiva de la gestión administrativa, contable y fiscal derivada de la relación mercantil.',
  pdfFooterLegalText:
    'Documento mercantil normalizado conforme a ISO 216, ISO 8601, ISO 4217 y Reglamento Veri*Factu (RD 1007/2023 & Orden HAC/1177/2024).',
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

export async function getTenantBranding(tenantId?: string | null): Promise<BrandingConfig> {
  const base = getBrandingConfig();
  const targetTenant = tenantId || 'master';
  try {
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [{ id: targetTenant }, { slug: targetTenant }],
      },
      select: { branding: true },
    });
    if (tenant?.branding) {
      const dbBranding = JSON.parse(tenant.branding);
      return { ...base, ...dbBranding };
    }
  } catch {
    // fallback
  }
  return base;
}

export async function getBranding(req: Request, res: Response): Promise<void> {
  try {
    const hostHeader = (req.headers['x-forwarded-host'] || req.headers.host || '') as string;
    let hostSlug = '';
    if (hostHeader) {
      const cleanHost = hostHeader.split(':')[0].toLowerCase();
      if (cleanHost.endsWith('.dama.com') || cleanHost.endsWith('.damacrm.local') || cleanHost.endsWith('.localhost')) {
        const parts = cleanHost.split('.');
        if (parts.length >= 3 && parts[0] !== 'app' && parts[0] !== 'www' && parts[0] !== 'api') {
          hostSlug = parts[0];
        }
      }
    }

    const tenantId =
      (req as any).user?.tenantId ||
      (req.headers['x-switch-tenant-id'] as string) ||
      (req.headers['x-tenant-slug'] as string) ||
      (req.headers['x-tenant-id'] as string) ||
      hostSlug ||
      'master';

    const resolved = await getTenantBranding(tenantId);
    res.json({ success: true, data: resolved });
  } catch {
    res.json({ success: true, data: getBrandingConfig() });
  }
}

export async function updateBranding(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = (req as any).user?.tenantId || (req.headers['x-tenant-id'] as string) || 'master';
    const current = await getTenantBranding(tenantId);
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

    // 2. Persist to Tenant in PostgreSQL DB
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
      console.warn('Could not persist branding to tenant table:', dbErr);
    }

    wsService.broadcast('branding:update', updated);
    await logAudit((req as any).user?.id, 'UPDATE_BRANDING', 'Branding', 'global', updated);

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function downloadSamplePdf(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = (req as any).user?.tenantId || (req.headers['x-tenant-id'] as string) || 'master';
    const savedBranding = await getTenantBranding(tenantId);

    // Allow query overrides so live preview downloads reflect unsaved studio adjustments
    const customTemplate = (req.query.template as PdfTemplateStyle) || savedBranding.pdfTemplate || 'MODERN_STRIPE';
    const customAccent = (req.query.accentColor as string) || savedBranding.pdfAccentColor || savedBranding.primaryColor || '#2563EB';

    const branding: BrandingConfig = {
      ...savedBranding,
      pdfTemplate: customTemplate,
      pdfAccentColor: customAccent,
    };

    const issuerNif = branding.companyTaxId || 'B87654323';
    const vf = calculateVerifactuHash({
      issuerNif,
      invoiceNumber: `${branding.invoicePrefix || 'FAC-2026-'}0042`,
      issueDate: new Date(),
      invoiceType: 'F1',
      taxAmount: 514.5,
      totalAmount: 2964.5,
      previousRecordHash: '8F434346648F6B96DF89DDA901C5176B10A6D83961DD3C1AC88B59B2DC327AA4',
    });
    const qrBuffer = await generateVerifactuQrBuffer(vf.qrUrl);

    const sampleData: InvoicePdfData = {
      invoiceNumber: `${branding.invoicePrefix || 'FAC-2026-'}0042`,
      type: 'FACTURA',
      invoiceType: 'F1',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: 'PAID',
      companyName: branding.companyName || 'DAMA CRM',
      companyTaxId: branding.companyTaxId || 'B87654323',
      companyAddress: branding.companyAddress || 'Avenida Tecnológica 42, 28046 Madrid, España',
      companyEmail: branding.companyEmail || 'contacto@dama-crm.com',
      companyPhone: branding.companyPhone || '+34 910 000 000',
      companyWebsite: branding.companyWebsite || 'https://damacrm.com',
      logoUrl: branding.logoUrl,
      primaryColor: branding.pdfAccentColor || branding.primaryColor || '#2563EB',
      secondaryColor: branding.pdfSecondaryColor || branding.secondaryColor || '#0F172A',
      clientName: 'Industrias Aeroespaciales Ibéricas S.A.',
      clientTaxId: 'A28015865',
      clientAddress: 'Parque Empresarial La Finca, Edificio 4, 28223 Pozuelo de Alarcón (Madrid)',
      clientEmail: 'facturacion@aeroiberica.es',
      clientPhone: '+34 913 456 789',
      items: [
        {
          description: 'Licencia Corporativa DAMA-CRM Enterprise Multi-Almacén (Anual - 50 Usuarios)',
          quantity: 1,
          unitPrice: 1650.0,
          amount: 1650.0,
        },
        {
          description: 'Módulo de Certificación Criptográfica Veri*Factu (RD 1007/2023 & Orden HAC/1177/2024)',
          quantity: 1,
          unitPrice: 450.0,
          amount: 450.0,
        },
        {
          description: 'Consultoría de Implantación Logística & Traspasos Sage LOTT',
          quantity: 4,
          unitPrice: 87.5,
          amount: 350.0,
        },
      ],
      subtotal: 2450.0,
      taxRate: branding.defaultTaxRate ?? 21,
      taxAmount: 514.5,
      total: 2964.5,
      currency: branding.currency || 'EUR',
      notes: 'Factura de muestra generada desde el Estudio de Diseño PDF de DAMA-CRM. Cumple con normativa Veri*Factu.',
      paymentTerms: branding.paymentTerms || 'Transferencia bancaria a 30 días',
      bankAccount: branding.bankAccount || 'ES91 2100 0418 4502 0005 1332',
      verifactuQrBuffer: qrBuffer,
      verifactuHash: vf.hash,
      previousInvoiceHash: '8F434346648F6B96DF89DDA901C5176B10A6D83961DD3C1AC88B59B2DC327AA4',
      verifactuQrUrl: vf.qrUrl,
      issuerNif,
      isVerifactu: true,
      // Studio design overrides
      pdfTemplate: branding.pdfTemplate || 'MODERN_STRIPE',
      pdfShowLogo: branding.pdfShowLogo !== false,
      pdfLogoPosition: branding.pdfLogoPosition || 'LEFT',
      pdfShowVerifactuQr: branding.pdfShowVerifactuQr !== false,
      pdfShowBankDetails: branding.pdfShowBankDetails !== false,
      pdfShowSignatureBox: branding.pdfShowSignatureBox !== false,
      pdfShowWatermark: Boolean(branding.pdfShowWatermark),
      pdfWatermarkText: branding.pdfWatermarkText || 'ORIGINAL · VERI*FACTU',
      pdfHeaderSubtitle: branding.pdfHeaderSubtitle,
      pdfMercantileRegistry: branding.pdfMercantileRegistry,
      pdfLopdText: branding.pdfLopdText,
      pdfFooterLegalText: branding.pdfFooterLegalText,
    };

    const buffer = await generatePdfBuffer(sampleData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="Muestra-Diseno-DAMA-CRM.pdf"');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error al generar PDF de muestra' });
  }
}
