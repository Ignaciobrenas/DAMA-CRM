import React from 'react';
import { motion } from 'framer-motion';
import {
  Blocks,
  ShieldCheck,
  UserCheck,
  Ticket,
  WalletCards,
  TrendingUp,
  CheckSquare,
  Users,
  Building2,
  Receipt,
  Package,
  Cpu,
  MessageSquare,
  Zap,
  BarChart3,
  ExternalLink,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useModules, CompanyModulesConfig } from '../../context/ModulesContext';
import { DynamicIcon } from '../ui/DynamicIcon';

export const ModulesSettings: React.FC = () => {
  const { t } = useLanguage();
  const { modules, toggleModule, isCompanyAdmin, isLoading } = useModules();

  const moduleDefinitions: Array<{
    key: keyof CompanyModulesConfig;
    name: string;
    description: string;
    icon: any;
    color: string;
    badge: string;
  }> = [
    {
      key: 'portalEmpleado',
      name: t('modules.namePortalEmpleado', 'Portal del Empleado'),
      description: t('modules.descPortalEmpleado', 'Control horario de jornada laboral (Art. 34.9 ET), nóminas salariales y sincronización Odoo'),
      icon: UserCheck,
      color: 'from-blue-500 to-indigo-600',
      badge: t('modules.badgeHR', 'RRHH & Laboral'),
    },
    {
      key: 'tickets',
      name: t('modules.nameTickets', 'Mesa de Ayuda & Tickets'),
      description: t('modules.descTickets', 'Gestión de incidencias de soporte técnico, acuerdos SLA y notas internas confidenciales'),
      icon: Ticket,
      color: 'from-violet-500 to-purple-600',
      badge: t('modules.badgeSupport', 'Soporte'),
    },
    {
      key: 'expenses',
      name: t('modules.nameExpenses', 'Control de Gastos & P&L'),
      description: t('modules.descExpenses', 'Registro de gastos deducibles, modelo 303 de IVA, balance de pérdidas y ganancias e informe Dunning'),
      icon: WalletCards,
      color: 'from-emerald-500 to-teal-600',
      badge: t('modules.badgeFinance', 'Finanzas'),
    },
    {
      key: 'pipeline',
      name: t('modules.namePipeline', 'Embudo de Ventas (Pipeline)'),
      description: t('modules.descPipeline', 'Seguimiento visual de oportunidades comerciales, pronóstico de ingresos y fases de venta'),
      icon: TrendingUp,
      color: 'from-blue-600 to-cyan-600',
      badge: t('modules.badgeSales', 'Comercial'),
    },
    {
      key: 'agile',
      name: t('modules.nameAgile', 'Planificador Ágil (Kanban)'),
      description: t('modules.descAgile', 'Tableros Kanban, gestión de sprints y tareas por proyecto para equipos ágiles'),
      icon: CheckSquare,
      color: 'from-amber-500 to-orange-600',
      badge: t('modules.badgeOperations', 'Operaciones'),
    },
    {
      key: 'contacts',
      name: t('modules.nameContacts', 'Directorio de Contactos'),
      description: t('modules.descContacts', 'Libreta unificada de clientes, proveedores y personas clave con historial de interacciones'),
      icon: Users,
      color: 'from-sky-500 to-blue-600',
      badge: t('modules.badgeCRM', 'CRM'),
    },
    {
      key: 'companies',
      name: t('modules.nameCompanies', 'Empresas & Cuentas'),
      description: t('modules.descCompanies', 'Fichas corporativas de clientes B2B, CIF/NIF, facturación asociada y volumen de negocio'),
      icon: Building2,
      color: 'from-indigo-500 to-blue-700',
      badge: t('modules.badgeCRM', 'CRM'),
    },
    {
      key: 'invoicing',
      name: t('modules.nameInvoicing', 'Facturación & Presupuestos'),
      description: t('modules.descInvoicing', 'Emisión de facturas oficiales, presupuestos con firma digital pública y exportación PDF ISO'),
      icon: Receipt,
      color: 'from-emerald-600 to-green-700',
      badge: t('modules.badgeBilling', 'Facturación'),
    },
    {
      key: 'inventory',
      name: t('modules.nameInventory', 'Catálogo de Inventario (UnoPIM)'),
      description: t('modules.descInventory', 'Gestión de productos, existencias en almacén, códigos SKU y webhook con UnoPIM'),
      icon: Package,
      color: 'from-amber-600 to-yellow-600',
      badge: t('modules.badgeStock', 'Stock'),
    },
    {
      key: 'workflows',
      name: t('modules.nameWorkflows', 'Automatizaciones (Workflows)'),
      description: t('modules.descWorkflows', 'Disparadores inteligentes por eventos, webhooks automatizados y reglas de negocio'),
      icon: Cpu,
      color: 'from-fuchsia-500 to-pink-600',
      badge: t('modules.badgeAutomation', 'Automatización'),
    },
    {
      key: 'omnichannel',
      name: t('modules.nameOmnichannel', 'Mensajería Omnicanal'),
      description: t('modules.descOmnichannel', 'Bandeja unificada con WhatsApp Cloud API, chat en vivo y redes de mensajería'),
      icon: MessageSquare,
      color: 'from-teal-500 to-emerald-600',
      badge: t('modules.badgeComms', 'Comunicación'),
    },
    {
      key: 'integrations',
      name: t('modules.nameIntegrations', 'Conectores & Integraciones'),
      description: t('modules.descIntegrations', 'Conexión con Odoo ERP, WooCommerce, Shopify, Stripe y plataformas de automatización n8n'),
      icon: Blocks,
      color: 'from-indigo-600 to-purple-700',
      badge: t('modules.badgeEcosystem', 'Ecosistema'),
    },
    {
      key: 'leadCapture',
      name: t('modules.nameLeadCapture', 'Puntos de Captura de Leads'),
      description: t('modules.descLeadCapture', 'Formularios web embebibles y widgets flotantes para captura automática de prospectos'),
      icon: Zap,
      color: 'from-yellow-500 to-amber-600',
      badge: t('modules.badgeMarketing', 'Marketing'),
    },
    {
      key: 'reports',
      name: t('modules.nameReports', 'Informes & Business Intelligence'),
      description: t('modules.descReports', 'Cuadros de mando analíticos, métricas de rendimiento, embudos de conversión y exportación'),
      icon: BarChart3,
      color: 'from-rose-500 to-red-600',
      badge: t('modules.badgeAnalytics', 'Analítica'),
    },
    {
      key: 'clientPortal',
      name: t('modules.nameClientPortal', 'Portal del Cliente B2B'),
      description: t('modules.descClientPortal', 'Área de autoservicio para clientes para consulta y descarga de sus facturas y presupuestos'),
      icon: ExternalLink,
      color: 'from-cyan-500 to-blue-600',
      badge: t('modules.badgePortal', 'Autoservicio'),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header card with Admin notice */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-blue-500/10 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0">
            <Blocks className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              {t('modules.title', 'Gestión de Módulos & Funcionalidades')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {t('modules.subtitle', 'Active o desactive módulos del sistema en tiempo real. Los cambios se guardan permanentemente en la base de datos.')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center space-x-1.5 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isCompanyAdmin ? t('modules.adminAccess', 'Admin de Empresa') : t('modules.readOnly', 'Solo Lectura')}</span>
          </span>
        </div>
      </div>

      {!isCompanyAdmin && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-300 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{t('modules.onlyAdminNotice', 'Solo los administradores de la empresa pueden modificar los módulos activos.')}</span>
        </div>
      )}

      {/* Grid of Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {moduleDefinitions.map((mod) => {
          const isEnabled = modules[mod.key] ?? true;
          const Icon = mod.icon;

          return (
            <motion.div
              key={mod.key}
              layout
              className={`relative bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-xs transition-all ${
                isEnabled
                  ? 'border-gray-200 dark:border-slate-800 hover:border-blue-400/50 dark:hover:border-blue-600/50'
                  : 'border-gray-200/60 dark:border-slate-800/60 opacity-60 bg-gray-50/50 dark:bg-slate-950/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${mod.color} text-white shadow-xs`}>
                    <DynamicIcon icon={Icon} variant="bounce" size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 block">
                      {mod.badge}
                    </span>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                      {mod.name}
                    </h3>
                  </div>
                </div>

                {/* Animated Switch Toggle */}
                <button
                  type="button"
                  disabled={!isCompanyAdmin || isLoading}
                  onClick={() => toggleModule(mod.key, !isEnabled)}
                  title={isEnabled ? t('modules.clickToDisable', 'Desactivar módulo') : t('modules.clickToEnable', 'Activar módulo')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    !isCompanyAdmin ? 'cursor-not-allowed opacity-50' : ''
                  } ${isEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-700'}`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  >
                    {isEnabled ? (
                      <Check className="w-3 h-3 text-blue-600" />
                    ) : (
                      <X className="w-3 h-3 text-gray-400" />
                    )}
                  </span>
                </button>
              </div>

              <p className="mt-3 text-xs text-gray-500 dark:text-slate-400 leading-relaxed min-h-[36px]">
                {mod.description}
              </p>

              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-gray-400 font-medium">
                  {t('status')}:
                </span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-md ${
                    isEnabled
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-500'
                  }`}
                >
                  {isEnabled ? t('active', 'Activo') : t('inactive', 'Desactivado')}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
