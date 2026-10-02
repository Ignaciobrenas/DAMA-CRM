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
  Tag,
  Kanban,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useModules } from '../context/ModulesContext';

import { AccessibilitySettings } from '../components/settings/AccessibilitySettings';
import { ModulesSettings } from '../components/settings/ModulesSettings';
import { ProfileSettings } from '../components/settings/ProfileSettings';
import { CompanySettings } from '../components/settings/CompanySettings';
import { SecuritySettings } from '../components/settings/SecuritySettings';
import { UsersSettings } from '../components/settings/UsersSettings';
import { IntegrationsSettings } from '../components/settings/IntegrationsSettings';
import { SystemSettings } from '../components/settings/SystemSettings';
import { CustomFieldsSettings } from '../components/settings/CustomFieldsSettings';
import { AgilePlannerSettings } from '../components/settings/AgilePlannerSettings';

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
    'profile' | 'security' | 'accessibility' | 'modules' | 'company' | 'agile_planner' | 'custom_fields' | 'users' | 'integrations' | 'system'
  >('profile');

  const personalTabs = [
    { id: 'profile', label: t('settings.tabProfile', 'Mi Perfil'), icon: UserIcon },
    { id: 'security', label: t('settings.tabSecurity', 'Seguridad & 2FA'), icon: ShieldCheck },
    { id: 'accessibility', label: t('settings.tabAccessibility', 'Apariencia & Accesibilidad'), icon: Sliders },
  ];

  const workspaceTabs = [
    { id: 'modules', label: t('settings.tabModules', 'Módulos Activos'), icon: Blocks },
    { id: 'company', label: t('settings.tabCompany', 'Empresa & Facturación'), icon: Building2 },
    { id: 'users', label: t('settings.tabUsers', 'Usuarios & Roles'), icon: Users },
  ];

  const advancedTabs = [
    { id: 'integrations', label: t('settings.tabIntegrations', 'Conectores & Apps'), icon: Plug },
    { id: 'agile_planner', label: t('settings.tabAgilePlanner', 'Agile Planner'), icon: Kanban },
    { id: 'custom_fields', label: t('settings.tabCustomFields', 'Campos Personalizados'), icon: Tag },
    { id: 'system', label: t('settings.tabSystem', 'Sistema & Backups'), icon: Server },
  ];

  const renderTabButton = (tab: any) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    return (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] ${
          isActive
            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700/80'
            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/40 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300 border border-transparent'
        }`}
      >
        <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
        <span>{tab.label}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Sidebar Settings Navigation */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-6 overflow-y-auto hide-scrollbar pr-2 pb-12">
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-2">
            Ajustes Personales
          </h3>
          <div className="space-y-1">
            {personalTabs.map(renderTabButton)}
          </div>
        </div>

        {canManageCompany && (
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-2">
              Espacio de Trabajo
            </h3>
            <div className="space-y-1">
              {workspaceTabs.map(renderTabButton)}
            </div>
          </div>
        )}

        {canManageCompany && (
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-2">
              Avanzado
            </h3>
            <div className="space-y-1">
              {advancedTabs.map(renderTabButton)}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col relative z-0">
        <div className="flex-1 overflow-y-auto hide-scrollbar p-6 lg:p-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="max-w-4xl mx-auto w-full relative z-10"
            >
              {activeTab === 'accessibility' && <AccessibilitySettings />}
              {activeTab === 'modules' && canManageCompany && <ModulesSettings />}
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'company' && canManageCompany && <CompanySettings />}
              {activeTab === 'agile_planner' && canManageCompany && <AgilePlannerSettings />}
              {activeTab === 'custom_fields' && canManageCompany && <CustomFieldsSettings />}
              {activeTab === 'security' && <SecuritySettings />}
              {activeTab === 'users' && canManageCompany && <UsersSettings />}
              {activeTab === 'integrations' && canManageCompany && <IntegrationsSettings />}
              {activeTab === 'system' && canManageCompany && <SystemSettings />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
