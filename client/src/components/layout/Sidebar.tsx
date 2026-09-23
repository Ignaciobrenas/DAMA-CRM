import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  TrendingUp,
  CheckSquare,
  Users,
  Building2,
  Receipt,
  Package,
  Cpu,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  ChevronLeft,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const { user, hasPermission, updatePreferences } = useAuth();
  const { branding } = useBranding();

  const isCollapsed = Boolean(user?.preferences?.sidebarCollapsed);
  const pinnedRoutes = user?.preferences?.sidebarPinnedItems;

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard, route: '/' },
    { id: 'pipeline', label: t('pipeline'), icon: TrendingUp, route: '/pipeline', resource: 'deals' },
    { id: 'agile', label: t('agile'), icon: CheckSquare, route: '/agile', resource: 'projects' },
    { id: 'contacts', label: t('contacts'), icon: Users, route: '/contacts', resource: 'contacts' },
    { id: 'companies', label: t('companies'), icon: Building2, route: '/companies', resource: 'companies' },
    { id: 'invoicing', label: t('invoicing'), icon: Receipt, route: '/invoicing', resource: 'invoices' },
    { id: 'inventory', label: t('inventory'), icon: Package, route: '/inventory', resource: 'inventory' },
    { id: 'workflows', label: t('workflows'), icon: Cpu, route: '/workflows', resource: 'workflows' },
    { id: 'omnichannel', label: t('omnichannel'), icon: MessageSquare, route: '/omnichannel', resource: 'omnichannel' },
    { id: 'reports', label: 'Informes & BI', icon: BarChart3, route: '/reports', resource: 'reports' },
    { id: 'settings', label: t('settings'), icon: ShieldCheck, route: '/settings', resource: 'users' },
    { id: 'portal', label: t('clientPortal'), icon: ExternalLink, route: '/portal', resource: 'invoices' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col transition-all duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-16' : 'w-60'}`}
      >
        {/* Brand Header */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'} h-14 border-b border-gray-200 dark:border-slate-800`}>
          <div className="flex items-center space-x-2.5 truncate">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.companyName}
                className="w-8 h-8 rounded-lg object-contain bg-white dark:bg-slate-800 p-0.5 border border-gray-200 dark:border-slate-700 shrink-0"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs shrink-0"
                style={{ backgroundColor: branding.primaryColor }}
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
            )}
            {!isCollapsed && (
              <div className="truncate">
                <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-white truncate block">
                  {branding.companyName}
                </span>
                <span
                  className="block text-[9px] font-semibold uppercase tracking-wider"
                  style={{ color: branding.primaryColor }}
                >
                  Enterprise CRM
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            if (item.resource && !hasPermission(item.resource, 'read')) {
              return null;
            }

            // Check if user has customized pinned items
            if (pinnedRoutes && Array.isArray(pinnedRoutes) && pinnedRoutes.length > 0) {
              if (item.route !== '/settings' && !pinnedRoutes.includes(item.route)) {
                return null;
              }
            }

            const isActive = currentRoute === item.route;
            const Icon = item.icon;

            return (
              <motion.button
                key={item.id}
                whileHover={{ x: isCollapsed ? 0 : 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onNavigate(item.route);
                  onClose();
                }}
                title={item.label}
                className={`relative w-full flex items-center ${
                  isCollapsed ? 'justify-center px-2 py-2.5' : 'space-x-3 px-3 py-2'
                } rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-slate-800/40'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarIndicator"
                    className="absolute inset-0 rounded-lg shadow-xs"
                    style={{ backgroundColor: branding.primaryColor }}
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <span className={`relative z-10 flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3 truncate'}`}>
                  <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-white scale-105' : 'text-gray-400 dark:text-slate-400'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </span>
              </motion.button>
            );
          })}
        </nav>

        {/* System Footer & Collapse/Expand Toggle */}
        <div className="p-2.5 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-gray-400 dark:text-slate-500">
          {!isCollapsed && (
            <div className="flex items-center space-x-1.5 truncate">
              <span>v1.0.0</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-mono text-[9px]">
                Self-Hosted
              </span>
            </div>
          )}

          <button
            onClick={() => updatePreferences({ sidebarCollapsed: !isCollapsed })}
            className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors hidden md:flex items-center justify-center ${
              isCollapsed ? 'mx-auto' : ''
            }`}
            title={isCollapsed ? 'Expandir barra lateral' : 'Minimizar barra lateral'}
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
};
