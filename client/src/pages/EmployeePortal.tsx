import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, FileText, Users, ShieldCheck, UserCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { TimeTrackingTab } from '../components/employee-portal/TimeTrackingTab';
import { PayrollsTab } from '../components/employee-portal/PayrollsTab';
import { DirectoryTab } from '../components/employee-portal/DirectoryTab';

export const EmployeePortal: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'time-tracking' | 'payrolls' | 'directory'>('time-tracking');

  const isManagerOrAdmin =
    user?.role === 'ADMIN' ||
    user?.role === 'HR_MANAGER' ||
    user?.role === 'MANAGER' ||
    user?.email === 'ignaciobrenas@gmail.com' ||
    user?.email === 'admin@dama-crm.local';

  const tabs = [
    {
      id: 'time-tracking',
      label: t('employeePortal.tabTimeTracking', 'Control Horario & Fichajes'),
      icon: Clock,
    },
    {
      id: 'payrolls',
      label: t('employeePortal.tabPayrolls', 'Mis Nóminas & Salarios'),
      icon: FileText,
    },
    {
      id: 'directory',
      label: t('employeePortal.tabDirectory', 'Directorio de Plantilla'),
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-500/10 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {t('employeePortal.title', 'Portal del Empleado')}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                {t('employeePortal.subtitle', 'Gestión de registro de jornada laboral, nóminas oficiales y plantilla')}
              </p>
            </div>
          </div>
        </div>

        {/* User Role Badge */}
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center space-x-1.5 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{user?.role || 'EMPLOYEE'}</span>
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-slate-800 pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center space-x-2 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activePortalTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'time-tracking' && (
          <motion.div
            key="time-tracking"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <TimeTrackingTab isManagerOrAdmin={isManagerOrAdmin} />
          </motion.div>
        )}

        {activeTab === 'payrolls' && (
          <motion.div
            key="payrolls"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <PayrollsTab isManagerOrAdmin={isManagerOrAdmin} />
          </motion.div>
        )}

        {activeTab === 'directory' && (
          <motion.div
            key="directory"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <DirectoryTab isManagerOrAdmin={isManagerOrAdmin} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
