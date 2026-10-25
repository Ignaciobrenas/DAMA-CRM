import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';
import { wsClient } from '../services/websocket';

export type PdfTemplateStyle = 'MODERN_STRIPE' | 'CORPORATE_SAGE' | 'CLASSIC_EXECUTIVE' | 'MINIMAL_SWISS';

export interface BrandingConfig {
  companyName: string;
  logoUrl: string;
  logoDarkUrl?: string;
  logoLightUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  borderRadius: 'sm' | 'md' | 'lg' | 'full';
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
  logoDarkUrl: '',
  logoLightUrl: '',
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

const RADIUS_MAP: Record<string, string> = {
  sm: '0.5rem',
  md: '0.85rem',
  lg: '1.25rem',
  full: '1.75rem',
};

interface BrandingContextType {
  branding: BrandingConfig;
  updateBranding: (newConfig: Partial<BrandingConfig>) => Promise<void>;
  resetBranding: () => Promise<void>;
  getLogo: (variant?: 'symbol' | 'full' | 'vertical', forceDark?: boolean) => string;
  isCustomLogo: boolean;
  isDarkMode: boolean;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingConfig>(() => {
    try {
      const saved = localStorage.getItem('dama_crm_branding');
      return saved ? { ...DEFAULT_BRANDING, ...JSON.parse(saved) } : DEFAULT_BRANDING;
    } catch {
      return DEFAULT_BRANDING;
    }
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-color', branding.primaryColor || '#2563EB');
    root.style.setProperty('--custom-radius', RADIUS_MAP[branding.borderRadius] || '0.85rem');
    root.style.setProperty('--brand-tint', `${branding.primaryColor || '#2563EB'}1A`);

    try {
      localStorage.setItem('dama_crm_branding', JSON.stringify(branding));
    } catch {}
  }, [branding]);

  useEffect(() => {
    apiRequest('/branding')
      .then((res) => {
        if (res.success && res.data) {
          setBranding((prev) => {
            const merged = { ...prev, ...res.data };
            try {
              localStorage.setItem('dama_crm_branding', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      })
      .catch(() => {});

    const unsub = wsClient.on('branding:update', (updated: BrandingConfig) => {
      if (updated) {
        setBranding((prev) => {
          const merged = { ...prev, ...updated };
          try {
            localStorage.setItem('dama_crm_branding', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    });

    return () => unsub();
  }, []);

  const updateBranding = async (newConfig: Partial<BrandingConfig>) => {
    setBranding((prev) => {
      const merged = { ...prev, ...newConfig };
      try {
        localStorage.setItem('dama_crm_branding', JSON.stringify(merged));
      } catch {}
      return merged;
    });

    try {
      await apiRequest('/branding', {
        method: 'PATCH',
        body: JSON.stringify(newConfig),
      });
    } catch {}
  };

  const resetBranding = async () => {
    setBranding(DEFAULT_BRANDING);
    try {
      localStorage.removeItem('dama_crm_branding');
    } catch {}

    try {
      await apiRequest('/branding', {
        method: 'PATCH',
        body: JSON.stringify(DEFAULT_BRANDING),
      });
    } catch {}
  };

  const isCustomLogo =
    Boolean(branding.logoUrl) &&
    !branding.logoUrl.includes('dama-symbol') &&
    !branding.logoUrl.includes('dama-logo');

  const getLogo = useCallback(
    (variant: 'symbol' | 'full' | 'vertical' = 'symbol', forceDark?: boolean): string => {
      const dark = forceDark !== undefined ? forceDark : isDarkMode;

      if (isCustomLogo) {
        if (dark && branding.logoDarkUrl) return branding.logoDarkUrl;
        if (!dark && branding.logoLightUrl) return branding.logoLightUrl;
        return branding.logoUrl;
      }

      // Official immutable DAMA logo placeholders from client/public/assets/logos/
      if (variant === 'full') {
        return dark ? './assets/logos/dama-logo-white.png' : './assets/logos/dama-logo-dark.png';
      }
      if (variant === 'vertical') {
        return dark ? './assets/logos/dama-logo-vertical-white.png' : './assets/logos/dama-logo-vertical-dark.png';
      }
      return dark ? './assets/logos/dama-symbol-white.png' : './assets/logos/dama-symbol-dark.png';
    },
    [branding, isDarkMode, isCustomLogo]
  );

  return (
    <BrandingContext.Provider value={{ branding, updateBranding, resetBranding, getLogo, isCustomLogo, isDarkMode }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = (): BrandingContextType => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
