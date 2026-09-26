import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { wsClient } from '../services/websocket';

export interface BrandingConfig {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  borderRadius: 'sm' | 'md' | 'lg' | 'full';
}

const DEFAULT_BRANDING: BrandingConfig = {
  companyName: 'DAMA-CRM',
  logoUrl: '/assets/logos/dama-symbol-dark.svg',
  primaryColor: '#2563EB',
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
  updateBranding: (newConfig: Partial<BrandingConfig>) => void;
  resetBranding: () => void;
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

  useEffect(() => {
    // Apply dynamic CSS variables to root HTML
    const root = document.documentElement;
    root.style.setProperty('--brand-color', branding.primaryColor);
    root.style.setProperty('--custom-radius', RADIUS_MAP[branding.borderRadius] || '0.85rem');

    // Create lighter tint for badges and highlights
    root.style.setProperty('--brand-tint', `${branding.primaryColor}1A`);

    try {
      localStorage.setItem('dama_crm_branding', JSON.stringify(branding));
    } catch {
      // Storage quota or private browsing
    }
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

  return (
    <BrandingContext.Provider value={{ branding, updateBranding, resetBranding }}>
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
