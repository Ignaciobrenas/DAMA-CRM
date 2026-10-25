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
  Activity,
  Kanban,
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
  color?: string;
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
    { id: 'dashboard', label: t('dashboard', 'Panel Principal'), icon: LayoutDashboard, route: '/', category: 'main' },
    { id: 'calendar', label: t('sidebar.calendar', 'Calendario & Agenda'), icon: Calendar, route: '/calendar', category: 'main', resource: 'calendar' },
    { id: 'appointments', label: t('sidebar.appointments', 'Citas & Servicios'), icon: CalendarCheck, route: '/appointments', category: 'main', resource: 'appointments', moduleKey: 'appointments' },
    { id: 'my-time', label: t('sidebar.myTime', 'Mi Tiempo'), icon: Clock, route: '/my-time', category: 'main' },
    { id: 'logistics', label: t('sidebar.logistics', 'Logística & Envíos'), icon: Truck, route: '/logistics', category: 'main', resource: 'logistics', moduleKey: 'logistics' },

    // Category 2: Gestión Comercial
    { id: 'pipeline', label: t('pipeline', 'Oportunidades & Pipeline'), icon: TrendingUp, route: '/pipeline', category: 'commercial', resource: 'deals', moduleKey: 'pipeline' },
    { id: 'contacts', label: t('contacts', 'Contactos & Leads'), icon: Users, route: '/contacts', category: 'commercial', resource: 'contacts', moduleKey: 'contacts' },
    { id: 'companies', label: t('companies', 'Empresas & Cuentas'), icon: Building2, route: '/companies', category: 'commercial', resource: 'companies', moduleKey: 'companies' },
    { id: 'lead-capture', label: t('leadCapture', 'Captura de Leads'), icon: Zap, route: '/lead-capture', category: 'commercial', resource: 'contacts', moduleKey: 'leadCapture' },

    // Category 3: Operaciones & Finanzas
    { id: 'invoicing', label: t('invoicing', 'Facturación & Cobros'), icon: Receipt, route: '/invoicing', category: 'operations', resource: 'invoices', moduleKey: 'invoicing' },
    { id: 'expenses', label: t('sidebar.expenses', 'Gastos & Compras'), icon: WalletCards, route: '/expenses', category: 'operations', resource: 'expenses', moduleKey: 'expenses' },
    { id: 'inventory', label: t('inventory', 'Inventario & Stock'), icon: Package, route: '/inventory', category: 'operations', resource: 'inventory', moduleKey: 'inventory' },
    { id: 'agile', label: t('agile', 'Proyectos & Tareas'), icon: CheckSquare, route: '/agile', category: 'operations', resource: 'projects', moduleKey: 'agile' },
    { id: 'planner', label: 'Planificador & Sprints', icon: Kanban, route: '/planner', category: 'operations', resource: 'projects', moduleKey: 'agile' },
    { id: 'portal-empleado', label: t('sidebar.employeePortal', 'Portal del Empleado'), icon: UserCheck, route: '/portal-empleado', category: 'operations', resource: 'employees', moduleKey: 'portalEmpleado' },

    // Category 4: Comunicación & Servicios
    { id: 'tickets', label: t('sidebar.tickets', 'Mesa de Ayuda / Tickets'), icon: Ticket, route: '/tickets', category: 'communication', resource: 'tickets', moduleKey: 'tickets' },
    { id: 'omnichannel', label: t('omnichannel', 'Omnicanal / WhatsApp'), icon: MessageSquare, route: '/omnichannel', category: 'communication', resource: 'omnichannel', moduleKey: 'omnichannel' },
    { id: 'workflows', label: t('workflows', 'Flujos de Trabajo'), icon: Cpu, route: '/workflows', category: 'communication', resource: 'workflows', moduleKey: 'workflows' },
    { id: 'integrations', label: t('integrations', 'Conectores & Integraciones'), icon: Blocks, route: '/integrations', category: 'communication', resource: 'integrations', moduleKey: 'integrations' },

    // Category 5: Sistema & Recursos
    ...(user?.role === 'ADMIN' || user?.role === 'god'
      ? [{ id: 'admin-bi', label: 'BI & Analítica (Admin)', icon: Activity, route: '/admin-bi', category: 'system' as const, resource: 'reports' }]
      : []),
    { id: 'reports', label: t('reportsBI', 'Informes BI & Analytics'), icon: BarChart3, route: '/reports', category: 'system', resource: 'reports', moduleKey: 'reports' },
    { id: 'settings', label: t('settings', 'Configuración'), icon: Settings, route: '/settings', category: 'system' },
    { id: 'portal', label: t('clientPortal', 'Portal Cliente'), icon: ExternalLink, route: '/portal', category: 'system', resource: 'invoices', moduleKey: 'clientPortal' },
    { id: 'faq', label: t('faq', 'Preguntas Frecuentes'), icon: HelpCircle, route: '/faq', category: 'system' },
    { id: 'privacy', label: t('privacyPolicy', 'Política de Privacidad'), icon: Lock, route: '/privacy', category: 'system' },
  ];

  const categories: Array<{ id: NavItemDefinition['category']; label: string }> = [
    { id: 'main', label: 'Principal & Agenda' },
    { id: 'commercial', label: 'Gestión Comercial' },
    { id: 'operations', label: 'Operaciones & Finanzas' },
    { id: 'communication', label: 'Comunicación & Servicios' },
    { id: 'system', label: 'Sistema & Recursos' },
  ];

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
          data-testid="sidebar-mobile-backdrop"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        data-testid="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 bg-slate-50/95 dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 flex flex-col transition-all duration-200 ease-out md:translate-x-0 select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-16' : 'w-60'}`}
      >
        {/* Brand Header */}
        <div
          className={`flex items-center ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          } h-14 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0`}
        >
          <button
            type="button"
            onClick={() => {
              onNavigate('/');
              onClose();
            }}
            className="flex items-center gap-2.5 truncate text-left focus:outline-none group cursor-pointer"
          >
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <img
                src={getLogo('symbol')}
                alt={branding.companyName}
                className="w-7 h-7 object-contain"
              />
            </div>
            {!isCollapsed && (
              <div className="truncate min-w-0">
                <span className="font-bold text-[13px] tracking-tight text-slate-900 dark:text-white truncate block leading-tight">
                  {branding.companyName}
                </span>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 block leading-tight">
                  Enterprise Workspace
                </span>
              </div>
            )}
          </button>

          {!isCollapsed && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg md:hidden text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              aria-label={t('close')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Items Organized by Categories */}
        <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
          {categories.map((cat) => {
            const categoryItems = orderedItems.filter((item) => item.category === cat.id);

            const visibleCategoryItems = categoryItems.filter((item) => {
              if (item.id === 'dashboard' || item.id === 'settings') return true;
              if (userHiddenItems.includes(item.id)) return false;
              if (item.moduleKey && !isModuleEnabled(item.moduleKey)) return false;
              if (!isGod && item.resource && !hasPermission(item.resource, 'read')) return false;
              return true;
            });

            if (visibleCategoryItems.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-0.5">
                {!isCollapsed ? (
                  <div className="px-2.5 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {cat.label}
                  </div>
                ) : (
                  <div className="border-t border-slate-200/80 dark:border-slate-800/70 my-1.5 mx-2" />
                )}

                {visibleCategoryItems.map((item) => {
                  const isActive = currentRoute === item.route;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`sidebar-nav-${item.id}`}
                      onClick={() => {
                        soundService.play('navigation');
                        onNavigate(item.route);
                        onClose();
                      }}
                      title={item.label}
                      className={`group relative w-full flex items-center transition-all duration-150 cursor-pointer ${
                        isCollapsed
                          ? 'w-10 h-10 mx-auto justify-center rounded-xl'
                          : 'gap-2.5 px-2.5 py-1.5 rounded-xl text-[12.5px]'
                      } ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 font-medium'
                      }`}
                    >
                      <span className="w-5 h-5 flex items-center justify-center shrink-0">
                        <DynamicIcon
                          icon={item.icon}
                          variant="bounce"
                          size={16}
                          active={isActive}
                          className={
                            isActive
                              ? 'text-white dark:text-slate-900'
                              : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100'
                          }
                        />
                      </span>
                      {!isCollapsed && (
                        <>
                          <span className="truncate flex-1 text-left">{item.label}</span>
                          {isActive && (
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: branding.primaryColor || '#3B82F6' }}
                            />
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* System Footer & Collapse/Expand Toggle */}
        <div className="px-3 py-2.5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
          {!isCollapsed && (
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-mono text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                v1.6.0 · {t('systemStatusActive')}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              soundService.play('toggle');
              updatePreferences({ sidebarCollapsed: !isCollapsed });
            }}
            className={`w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors hidden md:flex items-center justify-center cursor-pointer ${
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
