import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { wsClient } from '../services/websocket';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useLanguage } from './LanguageContext';

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

export const DEFAULT_MODULES: CompanyModulesConfig = {
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

interface ModulesContextType {
  modules: CompanyModulesConfig;
  isModuleEnabled: (moduleKey: keyof CompanyModulesConfig | string) => boolean;
  toggleModule: (moduleKey: keyof CompanyModulesConfig, enabled: boolean) => Promise<boolean>;
  updateModules: (newConfig: Partial<CompanyModulesConfig>) => Promise<boolean>;
  isCompanyAdmin: boolean;
  isLoading: boolean;
  refreshModules: () => Promise<void>;
}

const ModulesContext = createContext<ModulesContextType | undefined>(undefined);

export const ModulesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  const [modules, setModules] = useState<CompanyModulesConfig>(DEFAULT_MODULES);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchModules = async () => {
    if (!isAuthenticated) {
      setModules(DEFAULT_MODULES);
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiRequest('/modules');
      if (res.success && res.data) {
        setModules({ ...DEFAULT_MODULES, ...res.data });
        setIsCompanyAdmin(Boolean(res.isCompanyAdmin));
      }
    } catch {
      // Keep default on network fail
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [isAuthenticated, user?.id]);

  // Real-time WebSocket listener for module activation/deactivation
  useEffect(() => {
    const handleModulesUpdated = (event: CustomEvent) => {
      const data = event.detail;
      if (data?.modules) {
        setModules((prev) => ({ ...prev, ...data.modules }));
        toast.info(t('modules.updatedRealtime', 'La configuración de módulos de la empresa ha sido actualizada'));
      }
    };

    window.addEventListener('ws:modules:updated' as any, handleModulesUpdated as any);
    return () => {
      window.removeEventListener('ws:modules:updated' as any, handleModulesUpdated as any);
    };
  }, [t, toast]);

  const isModuleEnabled = (moduleKey: keyof CompanyModulesConfig | string): boolean => {
    if (!(moduleKey in modules)) return true;
    return Boolean(modules[moduleKey as keyof CompanyModulesConfig]);
  };

  const updateModules = async (newConfig: Partial<CompanyModulesConfig>): Promise<boolean> => {
    const merged = { ...modules, ...newConfig };
    setModules(merged); // Optimistic UI update

    try {
      const res = await apiRequest('/modules', {
        method: 'PATCH',
        body: JSON.stringify(newConfig),
      });

      if (res.success && res.data) {
        setModules({ ...DEFAULT_MODULES, ...res.data });
        toast.success(t('modules.savedSuccess', 'Módulos guardados en la base de datos'));
        return true;
      } else {
        toast.error(res.message || t('modules.savedError', 'Error al guardar módulos'));
        await fetchModules(); // Revert
        return false;
      }
    } catch {
      toast.error(t('modules.savedError', 'Error al guardar módulos'));
      await fetchModules();
      return false;
    }
  };

  const toggleModule = async (moduleKey: keyof CompanyModulesConfig, enabled: boolean): Promise<boolean> => {
    return await updateModules({ [moduleKey]: enabled });
  };

  return (
    <ModulesContext.Provider
      value={{
        modules,
        isModuleEnabled,
        toggleModule,
        updateModules,
        isCompanyAdmin,
        isLoading,
        refreshModules: fetchModules,
      }}
    >
      {children}
    </ModulesContext.Provider>
  );
};

export const useModules = (): ModulesContextType => {
  const context = useContext(ModulesContext);
  if (!context) {
    throw new Error('useModules must be used within a ModulesProvider');
  }
  return context;
};
