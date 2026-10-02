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
  ChevronLeft,
  BarChart3,
  Zap,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Blocks,
  HelpCircle,
  Ticket,
  WalletCards,
  UserCheck,
  Clock,
  Calendar,
  Settings,
  CalendarCheck,
  Truck,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import { useModules, CompanyModulesConfig } from '../../context/ModulesContext';
import { DynamicIcon, IconAnimationVariant } from '../ui/DynamicIcon';
import { soundService } from '../../services/sound';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export interface NavItemDefinition {
  id: string;
  label: string;
  icon: any;
  route: string;
  category: 'main' | 'commercial' | 'operations' | 'communication' | 'system';
  resource?: string;
  moduleKey?: keyof CompanyModulesConfig;
  animation?: IconAnimationVariant;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const { user, hasPermission, updatePreferences } = useAuth();
  const { branding, getLogo } = useBranding();
  const { isModuleEnabled } = useModules();

  const isCollapsed = Boolean(user?.preferences?.sidebarCollapsed);
  const userHiddenItems = user?.preferences?.sidebarHiddenItems || [];
  const userOrder = user?.preferences?.sidebarOrder || [];

  const rawNavItems: NavItemDefinition[] = [
    // Category 1: Principal & Agenda
    { id: 'dashboard', label: t('dashboard', 'Panel Principal'), icon: LayoutDashboard, route: '/', category: 'main', animation: 'elastic' },
    { id: 'calendar', label: t('sidebar.calendar', 'Calendario & Agenda'), icon: Calendar, route: '/calendar', category: 'main', animation: 'bounce' },
    { id: 'appointments', label: t('sidebar.appointments', 'Citas & Servicios'), icon: CalendarCheck, route: '/appointments', category: 'main', moduleKey: 'appointments', animation: 'wiggle' },
    { id: 'my-time', label: t('sidebar.myTime', 'Mi Tiempo'), icon: Clock, route: '/my-time', category: 'main', animation: 'pulse' },
    { id: 'logistics', label: t('sidebar.logistics', 'Logística & Envíos'), icon: Truck, route: '/logistics', category: 'main', moduleKey: 'logistics', animation: 'tilt' },

    // Category 2: Gestión Comercial
    { id: 'pipeline', label: t('pipeline', 'Oportunidades & Pipeline'), icon: TrendingUp, route: '/pipeline', category: 'commercial', resource: 'deals', moduleKey: 'pipeline', animation: 'bounce' },
    { id: 'contacts', label: t('contacts', 'Contactos & Leads'), icon: Users, route: '/contacts', category: 'commercial', resource: 'contacts', moduleKey: 'contacts', animation: 'float' },
    { id: 'companies', label: t('companies', 'Empresas & Cuentas'), icon: Building2, route: '/companies', category: 'commercial', resource: 'companies', moduleKey: 'companies', animation: 'glow' },
    { id: 'lead-capture', label: t('leadCapture', 'Captura de Leads'), icon: Zap, route: '/lead-capture', category: 'commercial', moduleKey: 'leadCapture', animation: 'shimmer' },

    // Category 3: Operaciones & Finanzas
    { id: 'invoicing', label: t('invoicing', 'Facturación & Cobros'), icon: Receipt, route: '/invoicing', category: 'operations', resource: 'invoices', moduleKey: 'invoicing', animation: 'glow' },
    { id: 'expenses', label: t('sidebar.expenses', 'Gastos & Compras'), icon: WalletCards, route: '/expenses', category: 'operations', resource: 'expenses', moduleKey: 'expenses', animation: 'flip' },
    { id: 'inventory', label: t('inventory', 'Inventario & Stock'), icon: Package, route: '/inventory', category: 'operations', resource: 'inventory', moduleKey: 'inventory', animation: 'tilt' },
    { id: 'agile', label: t('agile', 'Proyectos & Tareas'), icon: CheckSquare, route: '/agile', category: 'operations', resource: 'projects', moduleKey: 'agile', animation: 'elastic' },
    { id: 'portal-empleado', label: t('sidebar.employeePortal', 'Portal del Empleado'), icon: UserCheck, route: '/portal-empleado', category: 'operations', moduleKey: 'portalEmpleado', animation: 'float' },

    // Category 4: Comunicación & Servicios
    { id: 'tickets', label: t('sidebar.tickets', 'Mesa de Ayuda / Tickets'), icon: Ticket, route: '/tickets', category: 'communication', resource: 'tickets', moduleKey: 'tickets', animation: 'wiggle' },
    { id: 'omnichannel', label: t('omnichannel', 'Omnicanal / WhatsApp'), icon: MessageSquare, route: '/omnichannel', category: 'communication', resource: 'omnichannel', moduleKey: 'omnichannel', animation: 'pulse' },
    { id: 'workflows', label: t('workflows', 'Flujos de Trabajo'), icon: Cpu, route: '/workflows', category: 'communication', resource: 'workflows', moduleKey: 'workflows', animation: 'spin' },
    { id: 'integrations', label: t('integrations', 'Conectores & Integraciones'), icon: Blocks, route: '/integrations', category: 'communication', moduleKey: 'integrations', animation: 'spin' },

    // Category 5: Sistema & Recursos
    { id: 'reports', label: t('reportsBI', 'Informes BI & Analytics'), icon: BarChart3, route: '/reports', category: 'system', resource: 'reports', moduleKey: 'reports', animation: 'bounce' },
    { id: 'settings', label: t('settings', 'Configuración'), icon: Settings, route: '/settings', category: 'system', resource: 'users', animation: 'spin' },
    { id: 'portal', label: t('clientPortal', 'Portal Cliente'), icon: ExternalLink, route: '/portal', category: 'system', resource: 'invoices', moduleKey: 'clientPortal', animation: 'float' },
    { id: 'faq', label: t('faq', 'Preguntas Frecuentes'), icon: HelpCircle, route: '/faq', category: 'system', animation: 'bounce' },
    { id: 'privacy', label: t('privacyPolicy', 'Política de Privacidad'), icon: Lock, route: '/privacy', category: 'system', animation: 'tilt' },
  ];

  // Category definitions
  const categories: Array<{ id: NavItemDefinition['category']; label: string }> = [
    { id: 'main', label: 'PRINCIPAL & AGENDA' },
    { id: 'commercial', label: 'GESTIÓN COMERCIAL' },
    { id: 'operations', label: 'OPERACIONES & FINANZAS' },
    { id: 'communication', label: 'COMUNICACIÓN & SERVICIOS' },
    { id: 'system', label: 'SISTEMA & RECURSOS' },
  ];

  // Apply custom ordering if present
  let orderedItems = [...rawNavItems];
  if (userOrder && Array.isArray(userOrder) && userOrder.length > 0) {
    orderedItems.sort((a, b) => {
      const idxA = userOrder.indexOf(a.id);
      const idxB = userOrder.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }

  const isGod =
    user?.tenantId === 'god' ||
    user?.role === 'GOD' ||
    user?.role === 'ADMIN' ||
    user?.email === 'ignaciobrenas@gmail.com' ||
    user?.email === 'admin@dama-crm.local';

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
        className={`fixed top-0 bottom-0 left-0 z-40 bg-slate-50/95 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-16' : 'w-60'}`}
      >
        {/* Brand Header (NO boxes or frames around logo, NO Enterprise text) */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'} h-16 border-b border-gray-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50`}>
          <div className="flex items-center space-x-3 truncate">
            <div className="w-9 h-9 flex items-center justify-center shrink-0">
              <img
                src={getLogo('symbol')}
                alt={branding.companyName}
                className="w-full h-full object-contain filter drop-shadow-xs"
              />
            </div>
            {!isCollapsed && (
              <div className="truncate min-w-0">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white truncate block">
                  {branding.companyName}
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label={t('close')}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items Organized by Categories */}
        <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
          {categories.map((cat) => {
            const categoryItems = orderedItems.filter((item) => item.category === cat.id);

            // Filter items by RBAC, module enabled status, and user hidden preferences
            const visibleCategoryItems = categoryItems.filter((item) => {
              // Always show essential core items (dashboard, settings) to admin/god
              if (item.id === 'dashboard' || item.id === 'settings') return true;

              // Check if user explicitly hid this item in Settings
              if (userHiddenItems.includes(item.id)) return false;

              // Check if company module is enabled by admin
              if (item.moduleKey && !isModuleEnabled(item.moduleKey)) {
                return false;
              }

              // Check resource RBAC permission (god bypasses RBAC)
              if (!isGod && item.resource && !hasPermission(item.resource, 'read')) {
                return false;
              }

              return true;
            });

            if (visibleCategoryItems.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-1">
                {/* Category Header Label (when expanded) */}
                {!isCollapsed && (
                  <div className="px-3 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                    {cat.label}
                  </div>
                )}
                {isCollapsed && <div className="border-t border-slate-200 dark:border-slate-800/60 my-1.5 mx-2" />}

                {/* Module Items */}
                {visibleCategoryItems.map((item) => {
                  const isActive = currentRoute === item.route;

                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ x: isCollapsed ? 0 : 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        soundService.play('navigation');
                        onNavigate(item.route);
                        onClose();
                      }}
                      title={item.label}
                      className={`relative w-full flex items-center ${
                        isCollapsed ? 'justify-center px-2 py-2.5' : 'space-x-3 px-3 py-2'
                      } rounded-lg text-xs font-semibold transition-colors ${
                        isActive
                          ? 'text-white font-bold'
                          : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeSidebarIndicator"
                          className="absolute inset-0 rounded-lg shadow-sm"
                          style={{ backgroundColor: branding.primaryColor }}
                          transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                        />
                      )}
                      <span className={`relative z-10 flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3 truncate'}`}>
                        <DynamicIcon
                          icon={item.icon}
                          variant={item.animation || 'bounce'}
                          size={16}
                          active={isActive}
                          className={isActive ? 'text-white' : 'text-slate-700 dark:text-slate-400'}
                        />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* System Footer & Collapse/Expand Toggle */}
        <div className="p-2.5 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-gray-400 dark:text-slate-500">
          {!isCollapsed && (
            <div className="flex items-center space-x-1.5 truncate">
              <span className="font-mono font-semibold">v1.2.0-staging</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-mono text-[9px]">
                {t('systemStatusActive')}
              </span>
            </div>
          )}

          <button
            onClick={() => {
              soundService.play('toggle');
              updatePreferences({ sidebarCollapsed: !isCollapsed });
            }}
            className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors hidden md:flex items-center justify-center ${
              isCollapsed ? 'mx-auto' : ''
            }`}
            title={isCollapsed ? t('expandSidebar') : t('collapseSidebar')}
            aria-label={isCollapsed ? t('expandSidebar') : t('collapseSidebar')}
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
};
