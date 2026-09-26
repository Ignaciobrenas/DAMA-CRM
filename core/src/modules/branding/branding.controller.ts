import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { wsService } from '../../services/websocket.service';

const BRANDING_FILE = path.join(__dirname, '..', '..', '..', 'branding.json');

export interface BrandingConfig {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  borderRadius: string;
  companyTaxId?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  paymentTerms?: string;
  bankAccount?: string;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  companyName: 'DAMA CRM Soluciones S.L.',
  logoUrl: '',
  primaryColor: '#072053',
  borderRadius: 'md',
  companyTaxId: 'B-12345678',
  companyAddress: 'Avenida Tecnológica 42, 28046 Madrid, España',
  companyEmail: 'contacto@dama-crm.com',
  companyPhone: '+34 910 000 000',
  companyWebsite: 'https://damacrm.com',
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

export function getBranding(req: Request, res: Response): void {
  res.json({ success: true, data: getBrandingConfig() });
}

export function updateBranding(req: Request, res: Response): void {
  try {
    const current = getBrandingConfig();
    const updated: BrandingConfig = {
      ...current,
      ...req.body,
    };

    fs.writeFileSync(BRANDING_FILE, JSON.stringify(updated, null, 2), 'utf-8');

    wsService.broadcast('branding:update', updated);

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

