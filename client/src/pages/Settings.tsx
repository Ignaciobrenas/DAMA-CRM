import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sliders,
  Blocks,
  User as UserIcon,
  Building2,
  ShieldCheck,
  Users,
  Plug,
  Server,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useModules } from '../context/ModulesContext';

// Subcomponents for each settings domain
import { AccessibilitySettings } from '../components/settings/AccessibilitySettings';
import { ModulesSettings } from '../components/settings/ModulesSettings';
import { ProfileSettings } from '../components/settings/ProfileSettings';
import { CompanySettings } from '../components/settings/CompanySettings';
import { SecuritySettings } from '../components/settings/SecuritySettings';
import { UsersSettings } from '../components/settings/UsersSettings';
import { IntegrationsSettings } from '../components/settings/IntegrationsSettings';
import { SystemSettings } from '../components/settings/SystemSettings';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isCompanyAdmin } = useModules();

  const isSuperAdmin =
    user?.role === 'ADMIN' ||
    user?.email === 'ignaciobrenas@gmail.com' ||
    user?.email === 'admin@dama-crm.local';

  const canManageCompany = isCompanyAdmin || isSuperAdmin;

  const [activeTab, setActiveTab] = useState<
    'accessibility' | 'modules' | 'profile' | 'company' | 'security' | 'users' | 'integrations' | 'system'
  >('accessibility');

  const settingsTabs = [
    {
      id: 'accessibility',
      label: t('settings.tabAccessibility', 'Personalización & Accesibilidad'),
      icon: Sliders,
    },
    ...(canManageCompany
      ? [
          {
            id: 'modules',
            label: t('settings.tabModules', 'Módulos & Funcionalidades'),
            icon: Blocks,
          },
        ]
      : []),
    {
      id: 'profile',
      label: t('settings.tabProfile', 'Mi Perfil & Preferencias'),
      icon: UserIcon,
    },
    ...(canManageCompany
      ? [
          {
            id: 'company',
            label: t('settings.tabCompany', 'Identidad & Facturación'),
            icon: Building2,
          },
        ]
      : []),
    {
      id: 'security',
      label: t('settings.tabSecurity', 'Seguridad & Permisos RBAC'),
      icon: ShieldCheck,
    },
    ...(canManageCompany
      ? [
          {
            id: 'users',
            label: t('settings.tabUsers', 'Cuentas de Usuarios'),
            icon: Users,
          },
          {
            id: 'integrations',
            label: t('settings.tabIntegrations', 'Conectores & Integraciones'),
            icon: Plug,
          },
          {
            id: 'system',
            label: t('settings.tabSystem', 'Sistema & Copias de Seguridad'),
            icon: Server,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t('settings', 'Configuración')}
        </h1>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Personalización visual, gestión modular, seguridad 2FA, identidad corporativa y copias de seguridad
        </p>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-2">
        {settingsTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeSettingsTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab Views */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'accessibility' && <AccessibilitySettings />}
          {activeTab === 'modules' && canManageCompany && <ModulesSettings />}
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'company' && canManageCompany && <CompanySettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'users' && canManageCompany && <UsersSettings />}
          {activeTab === 'integrations' && canManageCompany && <IntegrationsSettings />}
          {activeTab === 'system' && canManageCompany && <SystemSettings />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
