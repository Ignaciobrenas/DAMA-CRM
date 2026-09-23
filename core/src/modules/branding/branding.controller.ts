import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { wsService } from '../../services/websocket.service';

const BRANDING_FILE = path.join(__dirname, '..', '..', '..', 'branding.json');

const DEFAULT_BRANDING = {
  companyName: 'DAMA-CRM',
  logoUrl: '',
  primaryColor: '#2563EB',
  borderRadius: 'md',
};

export function getBranding(req: Request, res: Response): void {
  try {
    if (fs.existsSync(BRANDING_FILE)) {
      const data = JSON.parse(fs.readFileSync(BRANDING_FILE, 'utf-8'));
      res.json({ success: true, data: { ...DEFAULT_BRANDING, ...data } });
      return;
    }
  } catch {
    // fallback to defaults on read error
  }
  res.json({ success: true, data: DEFAULT_BRANDING });
}

export function updateBranding(req: Request, res: Response): void {
  try {
    const { companyName, logoUrl, primaryColor, borderRadius } = req.body;
    let current = { ...DEFAULT_BRANDING };
    if (fs.existsSync(BRANDING_FILE)) {
      try {
        current = { ...current, ...JSON.parse(fs.readFileSync(BRANDING_FILE, 'utf-8')) };
      } catch {
        // continue with defaults
      }
    }

    const updated = {
      ...current,
      ...(companyName !== undefined ? { companyName: String(companyName).trim() } : {}),
      ...(logoUrl !== undefined ? { logoUrl: String(logoUrl).trim() } : {}),
      ...(primaryColor !== undefined ? { primaryColor: String(primaryColor).trim() } : {}),
      ...(borderRadius !== undefined ? { borderRadius } : {}),
    };

    fs.writeFileSync(BRANDING_FILE, JSON.stringify(updated, null, 2), 'utf-8');

    wsService.broadcast('branding:update', updated);

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
