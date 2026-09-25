import React from 'react';
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
  Zap,
  Lock,
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
  const { hasPermission } = useAuth();
  const { branding } = useBranding();

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
    { id: 'lead-capture', label: t('leadCapture'), icon: Zap, route: '/lead-capture' },
    { id: 'reports', label: t('reportsBI'), icon: BarChart3, route: '/reports', resource: 'reports' },
    { id: 'settings', label: t('settings'), icon: ShieldCheck, route: '/settings', resource: 'users' },
    { id: 'portal', label: t('clientPortal'), icon: ExternalLink, route: '/portal', resource: 'invoices' },
    { id: 'privacy', label: t('privacyPolicy'), icon: Lock, route: '/privacy' },
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
        className={`fixed top-0 bottom-0 left-0 z-40 w-60 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200 dark:border-slate-800">
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
            <div className="truncate">
              <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-white truncate block">
                {branding.companyName}
              </span>
              <span
                className="block text-[9px] font-semibold uppercase tracking-wider"
                style={{ color: branding.primaryColor }}
              >
                {t('enterpriseCrm')}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (item.resource && !hasPermission(item.resource, 'read')) {
              return null;
            }

            const isActive = currentRoute === item.route;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.route);
                  onClose();
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'text-white shadow-xs font-semibold'
                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/70 hover:text-gray-900 dark:hover:text-white'
                }`}
                style={isActive ? { backgroundColor: branding.primaryColor } : {}}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400 dark:text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* System & Version Badge */}
        <div className="p-3 border-t border-gray-200 dark:border-slate-800 text-[10px] text-gray-400 dark:text-slate-500 flex items-center justify-between">
          <span>v1.0.0 Self-Hosted</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-mono text-[9px]">
            Zero-Cost
          </span>
        </div>
      </aside>
    </>
  );
};
