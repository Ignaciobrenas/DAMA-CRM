import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';
import { wsClient } from '../services/websocket';

export interface BrandingConfig {
  companyName: string;
  logoUrl: string;
  logoDarkUrl?: string;
  logoLightUrl?: string;
  primaryColor: string;
  borderRadius: 'sm' | 'md' | 'lg' | 'full';
}

const DEFAULT_BRANDING: BrandingConfig = {
  companyName: 'DAMA-CRM',
  logoUrl: '', // Empty means using DAMA default placeholder
  logoDarkUrl: '',
  logoLightUrl: '',
  primaryColor: '#072053',
  borderRadius: 'md',
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
    // Observe dark class changes on <html>
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
    // Apply dynamic CSS variables to root HTML
    const root = document.documentElement;
    root.style.setProperty('--brand-color', branding.primaryColor || '#072053');
    root.style.setProperty('--custom-radius', RADIUS_MAP[branding.borderRadius] || '0.85rem');
    root.style.setProperty('--brand-tint', `${branding.primaryColor || '#072053'}1A`);

    try {
      localStorage.setItem('dama_crm_branding', JSON.stringify(branding));
    } catch {}
  }, [branding]);

  useEffect(() => {
    // Fetch persisted branding from server
    apiRequest('/branding')
      .then((res) => {
        if (res.success && res.data) {
          setBranding((prev) => ({ ...prev, ...res.data }));
          try {
            localStorage.setItem('dama_crm_branding', JSON.stringify({ ...branding, ...res.data }));
          } catch {}
        }
      })
      .catch(() => {});

    // Listen to real-time branding updates via WebSocket
    const unsub = wsClient.on('branding:update', (updated: BrandingConfig) => {
      if (updated) {
        setBranding((prev) => ({ ...prev, ...updated }));
        try {
          localStorage.setItem('dama_crm_branding', JSON.stringify(updated));
        } catch {}
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

  const getLogo = useCallback(
    (variant: 'symbol' | 'full' | 'vertical' = 'symbol', forceDark?: boolean): string => {
      const dark = forceDark !== undefined ? forceDark : isDarkMode;

      // If user has a custom logo specified, use it
      const hasCustomLogo =
        Boolean(branding.logoUrl) &&
        !branding.logoUrl.includes('dama-symbol') &&
        !branding.logoUrl.includes('dama-logo');

      if (hasCustomLogo) {
        if (dark && branding.logoDarkUrl) return branding.logoDarkUrl;
        if (!dark && branding.logoLightUrl) return branding.logoLightUrl;
        return branding.logoUrl;
      }

      // Default DAMA logo placeholders
      if (variant === 'full') {
        return dark ? '/assets/logos/dama-logo-white.svg' : '/assets/logos/dama-logo-dark.svg';
      }
      if (variant === 'vertical') {
        return dark ? '/assets/logos/dama-logo-vertical-white.svg' : '/assets/logos/dama-logo-vertical-dark.svg';
      }
      return dark ? '/assets/logos/dama-symbol-white.svg' : '/assets/logos/dama-symbol-dark.svg';
    },
    [branding, isDarkMode]
  );

  return (
    <BrandingContext.Provider value={{ branding, updateBranding, resetBranding, getLogo, isDarkMode }}>
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
