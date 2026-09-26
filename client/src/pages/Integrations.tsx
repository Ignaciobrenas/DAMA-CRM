import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plug,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Settings2,
  Zap,
  ShoppingBag,
  Building2,
  Boxes,
  MessageSquare,
  AlertCircle,
  Key,
  Globe,
  Radio,
  Sliders,
  X,
  Search,
  Filter,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  Calendar,
  Layers,
  Sparkles,
  Link2,
} from 'lucide-react';
import {
  integrationsService,
  IntegrationsResponseData,
  IntegrationsEndpoints,
} from '../services/integrations.service';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { soundService } from '../services/sound';

interface ConnectorCardDefinition {
  id: string;
  name: string;
  category: string;
  categorySlug: 'ecommerce' | 'erp' | 'automation' | 'messaging' | 'pim' | 'payments' | 'productivity';
  icon: React.ElementType;
  badgeColor: string;
  iconBg: string;
  iconColor: string;
  protocol: string;
  syncMode: string;
  description: string;
  supported: string[];
  docsUrl: string;
  config?: any;
  isSystem?: boolean;
  endpointUrl?: string;
  canSync?: boolean;
}

export const Integrations: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const { user, hasPermission } = useAuth();

  // Permisos: Solo administradores o usuarios con permiso explícito integrations:manage pueden modificar credenciales
  const isAdmin = user?.role === 'ADMIN' || hasPermission('integrations', 'manage');

  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<IntegrationsResponseData | null>(null);
  const [endpoints, setEndpoints] = useState<IntegrationsEndpoints | null>(null);
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Filtros y Búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [onlyConfigured, setOnlyConfigured] = useState<boolean>(false);

  // Estado para comprobación directa desde la tarjeta
  const [testingCardId, setTestingCardId] = useState<string | null>(null);

  // Modal editing state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>({});
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [modalTesting, setModalTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await integrationsService.getIntegrations();
      if (res && res.data) {
        setIntegrations(res.data);
        setEndpoints(res.endpoints);
      }
    } catch (err: any) {
      toast.error('Error al cargar integraciones', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    soundService.play('action');
    toast.success('Copiado al portapapeles', text);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const openConfigModal = (connectorKey: string) => {
    setSelectedConnector(connectorKey);
    const existing = (integrations as any)?.[connectorKey] || {};
    setEditingConfig({ ...existing });
    setTestResult(null);
    setShowSecret({});
    setModalOpen(true);
    soundService.play('action');
  };

  const toggleShowSecret = (field: string) => {
    setShowSecret((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSaveConfig = async () => {
    if (!isAdmin) {
      toast.error('Acceso denegado', 'Solo administradores pueden modificar credenciales.');
      return;
    }
    if (!selectedConnector) return;
    try {
      setModalTesting(true);
      await integrationsService.updateConfig(selectedConnector, editingConfig);
      toast.success('Configuración guardada', `Se han actualizado los parámetros de ${selectedConnector.toUpperCase()}`);
      soundService.play('success');
      setModalOpen(false);
      fetchIntegrations();
    } catch (err: any) {
      toast.error('Error al guardar', err.message);
      soundService.play('error');
    } finally {
      setModalTesting(false);
    }
  };

  // Comprobar conexión desde el modal
  const handleTestConnectionInModal = async () => {
    if (!isAdmin) {
      toast.error('Permiso requerido', 'Solo administradores pueden realizar pruebas de conexión.');
      return;
    }
    if (!selectedConnector) return;
    try {
      setModalTesting(true);
      setTestResult(null);
      const res = await integrationsService.testConnection(selectedConnector, editingConfig);
      setTestResult(res);
      if (res.success) {
        soundService.play('success');
        toast.success('Conexión Exitosa', res.message);
        fetchIntegrations();
      } else {
        soundService.play('error');
        toast.error('Fallo de Conexión', res.message);
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
      soundService.play('error');
      toast.error('Error', err.message);
    } finally {
      setModalTesting(false);
    }
  };

  // Comprobar conexión DIRECTAMENTE desde la tarjeta (Petición explícita del usuario)
  const handleTestConnectionFromCard = async (connectorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setTestingCardId(connectorId);
      soundService.play('action');
      const res = await integrationsService.testConnection(connectorId);
      if (res.success) {
        soundService.play('success');
        toast.success(`Conexión verificada: ${connectorId.toUpperCase()}`, res.message);
        fetchIntegrations();
      } else {
        soundService.play('error');
        toast.error(`Fallo de conexión: ${connectorId.toUpperCase()}`, res.message);
      }
    } catch (err: any) {
      soundService.play('error');
      toast.error('Error al probar conexión', err.message);
    } finally {
      setTestingCardId(null);
    }
  };

  const handleSyncNow = async (connector: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setSyncing(connector);
      soundService.play('action');
      const res = await integrationsService.syncNow(connector);
      if (res.success) {
        soundService.play('success');
        toast.success('Sincronización completada', res.message);
        fetchIntegrations();
      } else {
        toast.error('Error de sincronización', res.message);
      }
    } catch (err: any) {
      toast.error('Error', err.message);
    } finally {
      setSyncing(null);
    }
  };

  // Catálogo integral de conectores con capacidades, protocolos y enlaces oficiales
  const connectorsList: ConnectorCardDefinition[] = [
    {
      id: 'odoo',
      name: 'Odoo ERP & CRM',
      category: 'ERP & Contabilidad',
      categorySlug: 'erp',
      icon: Building2,
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      iconBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800/50',
      iconColor: 'text-purple-600 dark:text-purple-400',
      protocol: 'XML-RPC / JSON-RPC 2.0',
      syncMode: 'Bidireccional / En cola',
      description: 'Sincronización de contactos (res.partner), presupuestos, facturas (account.move) e inventario con Odoo Community & Enterprise.',
      supported: ['Contactos', 'Facturas', 'Presupuestos', 'Impuestos', 'Productos'],
      docsUrl: 'https://www.odoo.com/documentation/17.0/developer/reference/external_api.html',
      config: integrations?.odoo,
      canSync: true,
    },
    {
      id: 'woocommerce',
      name: 'WooCommerce',
      category: 'Comercio Electrónico',
      categorySlug: 'ecommerce',
      icon: ShoppingBag,
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      protocol: 'REST API v3 + Webhooks',
      syncMode: 'Tiempo Real (Webhooks)',
      description: 'Importación automática de pedidos como tratos ganados y clientes en tiempo real con cálculo de stock y estados de pago.',
      supported: ['Pedidos', 'Clientes', 'Webhooks en tiempo real', 'Stock'],
      docsUrl: 'https://woocommerce.github.io/woocommerce-rest-api-docs/',
      config: integrations?.woocommerce,
      endpointUrl: endpoints?.woocommerceWebhook,
      canSync: true,
    },
    {
      id: 'shopify',
      name: 'Shopify Store',
      category: 'Comercio Electrónico',
      categorySlug: 'ecommerce',
      icon: Globe,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      protocol: 'Admin API + HMAC-SHA256',
      syncMode: 'Tiempo Real Cifrado',
      description: 'Conexión con tiendas Shopify con verificación criptográfica HMAC-SHA256, sincronización de checkout y órdenes.',
      supported: ['Pedidos', 'Clientes', 'HMAC SHA-256', 'Catálogo', 'Fulfillment'],
      docsUrl: 'https://shopify.dev/docs/api/admin-rest',
      config: integrations?.shopify,
      endpointUrl: endpoints?.shopifyWebhook,
      canSync: true,
    },
    {
      id: 'n8n',
      name: 'n8n Workflow Automation',
      category: 'Automatización & Flujos',
      categorySlug: 'automation',
      icon: Zap,
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      iconBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800/50',
      iconColor: 'text-rose-600 dark:text-rose-400',
      protocol: 'Outbound REST + Inbound Action',
      syncMode: 'Disparadores Instantáneos',
      description: 'Disparador de eventos en tiempo real desde DAMA hacia n8n y ejecutor de acciones inbound para orquestar pipelines ilimitados.',
      supported: ['Eventos Webhook', 'Acciones Inbound', 'API Keys', 'Triggers CRM'],
      docsUrl: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/',
      config: integrations?.n8n,
      endpointUrl: endpoints?.n8nActionEndpoint,
    },
    {
      id: 'stripe',
      name: 'Stripe Payments',
      category: 'Pasarelas de Pago',
      categorySlug: 'payments',
      icon: CreditCard,
      badgeColor: 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-800',
      iconBg: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-800/50',
      iconColor: 'text-violet-600 dark:text-violet-400',
      protocol: 'Stripe API v1 + Webhooks TLS 1.3',
      syncMode: 'Eventos 3D-Secure',
      description: 'Cobro de facturas y presupuestos directamente desde el portal del cliente con tarjeta de crédito, débito SEPA y Apple Pay.',
      supported: ['Checkout Sessions', 'Payment Intents', 'Suscripciones', 'SEPA'],
      docsUrl: 'https://stripe.com/docs/api',
      config: integrations?.stripe,
      endpointUrl: endpoints?.stripeWebhook,
      canSync: true,
    },
    {
      id: 'zapier',
      name: 'Zapier Webhooks',
      category: 'Automatización & Flujos',
      categorySlug: 'automation',
      icon: Sparkles,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      iconBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
      protocol: 'REST Hooks / Webhooks Inbound',
      syncMode: 'Zaps en Tiempo Real',
      description: 'Conecta DAMA-CRM con más de 5.000 aplicaciones a través de webhooks estándar de entrada y salida para flujos no-code.',
      supported: ['Disparadores Zaps', 'Acciones', 'Multi-app workflows', 'Filtros'],
      docsUrl: 'https://zapier.com/apps/webhook/integrations',
      config: integrations?.zapier,
      endpointUrl: endpoints?.zapierWebhook,
    },
    {
      id: 'google_calendar',
      name: 'Google Calendar',
      category: 'Productividad & Agenda',
      categorySlug: 'productivity',
      icon: Calendar,
      badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      iconBg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-800/50',
      iconColor: 'text-sky-600 dark:text-sky-400',
      protocol: 'Google Calendar API v3 / CalDAV',
      syncMode: 'Bidireccional 15 min',
      description: 'Sincroniza reuniones de oportunidades de venta, llamadas programadas y tareas directamente con la agenda de Google Workspace.',
      supported: ['Reuniones', 'Eventos en tiempo real', 'Recordatorios', 'Google Meet'],
      docsUrl: 'https://developers.google.com/calendar/api',
      config: integrations?.google_calendar,
      canSync: true,
    },
    {
      id: 'unopim',
      name: 'UnoPIM (Catálogo & PIM)',
      category: 'Catálogo & PIM',
      categorySlug: 'pim',
      icon: Boxes,
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      iconBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      protocol: 'Webhooks JSON + Sync Cron',
      syncMode: 'Diario Nocturno / Push',
      description: 'Recepción de catálogo de productos multivariante, sincronización nocturna e integración con inventario centralizado.',
      supported: ['Catálogo', 'Variantes', 'Stock automático', 'SKUs'],
      docsUrl: 'https://unopim.com/docs',
      isSystem: true,
      endpointUrl: endpoints?.unopimWebhook,
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Cloud (Meta API)',
      category: 'Mensajería Omnicanal',
      categorySlug: 'messaging',
      icon: MessageSquare,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      protocol: 'Meta Graph API v19.0',
      syncMode: 'Tiempo Real Webhook',
      description: 'Bandeja omnicanal unificada para atención al cliente, mensajes de plantilla HSM verificados y webhooks directos de Meta Cloud.',
      supported: ['Chat 24/7', 'Webhooks Meta', 'Plantillas HSM', 'Agentes'],
      docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
      isSystem: true,
      endpointUrl: endpoints?.whatsappWebhook,
    },
  ];

  // Métricas y conteos
  const stats = useMemo(() => {
    let connectedCount = 0;
    let availableCount = 0;
    connectorsList.forEach((c) => {
      const isConn = c.isSystem || c.config?.status === 'connected';
      if (isConn) connectedCount++;
      else availableCount++;
    });
    return {
      total: connectorsList.length,
      connected: connectedCount,
      available: availableCount,
    };
  }, [connectorsList, integrations]);

  // Lista filtrada reactiva
  const filteredConnectors = useMemo(() => {
    return connectorsList.filter((item) => {
      const isConnected = item.isSystem || item.config?.status === 'connected';

      // 1. Filtro "Solo configuradas / activas"
      if (onlyConfigured && !isConnected) {
        return false;
      }

      // 2. Filtro por categoría
      if (selectedCategory !== 'all') {
        if (item.categorySlug !== selectedCategory) return false;
      }

      // 3. Filtro por estado
      if (selectedStatus === 'connected' && !isConnected) return false;
      if (selectedStatus === 'disconnected' && isConnected) return false;

      // 4. Búsqueda por texto (nombre, categoría, descripción, tags, protocolo)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        const matchProt = item.protocol.toLowerCase().includes(q);
        const matchTags = item.supported.some((tag) => tag.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchCat && !matchProt && !matchTags) {
          return false;
        }
      }

      return true;
    });
  }, [connectorsList, onlyConfigured, selectedCategory, selectedStatus, searchQuery, integrations]);

  const categories = [
    { id: 'all', label: 'Todas las integraciones' },
    { id: 'ecommerce', label: 'E-commerce' },
    { id: 'erp', label: 'ERP & Contabilidad' },
    { id: 'automation', label: 'Automatización & Flujos' },
    { id: 'payments', label: 'Pasarelas de Pago' },
    { id: 'productivity', label: 'Productividad & Agenda' },
    { id: 'messaging', label: 'Mensajería' },
    { id: 'pim', label: 'Catálogo & PIM' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-color via-brand-color/95 to-brand-color/85 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-10 w-44 h-44 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md">
              <Plug className="w-3.5 h-3.5" />
              <span>{t('integrations.ecosystemTitle', 'Ecosistema de Integraciones Conectadas')}</span>
              <span className="px-1.5 py-0.2 bg-white/30 rounded text-[11px] font-mono">v1.2</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('integrations.title', 'Conectores & Integraciones de Terceros')}
            </h1>
            <p className="text-white/85 text-sm sm:text-base leading-relaxed">
              {t(
                'integrations.subtitle',
                'Conecta DAMA-CRM con tus plataformas de comercio electrónico, sistemas ERP, pasarelas de pago y automatizaciones n8n con verificación criptográfica y sincronización en tiempo real.'
              )}
            </p>

            {/* Public catalog badge info */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-white/80">
              <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg font-mono">
                <Link2 className="w-3 h-3" />
                <span>/api/integraciones-de-terceros</span>
              </span>
              <button
                onClick={() => handleCopy(`${window.location.origin}/api/integraciones-de-terceros`, 'api-catalog-endpoint')}
                className="hover:text-white underline decoration-dotted flex items-center gap-1 transition-colors"
              >
                {copiedKey === 'api-catalog-endpoint' ? '¡Copiado!' : 'Copiar Endpoint'}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={fetchIntegrations}
              disabled={loading}
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 active:scale-95 text-white shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('integrations.refresh', 'Actualizar Estados')}</span>
            </button>
          </div>
        </div>

        {/* Stats Row inside banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <span className="text-xs text-white/75 font-medium block">Total Conectores</span>
            <span className="text-xl font-bold text-white">{stats.total} servicios</span>
          </div>
          <div className="bg-emerald-500/20 backdrop-blur-sm rounded-xl p-3 border border-emerald-400/30">
            <span className="text-xs text-emerald-100 font-medium block">Conectados / Activos</span>
            <span className="text-xl font-bold text-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {stats.connected}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <span className="text-xs text-white/75 font-medium block">Listos para conectar</span>
            <span className="text-xl font-bold text-white">{stats.available}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <span className="text-xs text-white/75 font-medium block">Nivel de Acceso</span>
            <span className="text-sm font-bold text-white flex items-center gap-1 mt-1">
              {isAdmin ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>Admin (Gestión Total)</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-300" />
                  <span>Lectura Protegida</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Category Filters, Status and Toggle */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, protocolo o capacidad (ej: WooCommerce, REST, Facturas)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-color"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right Controls: Status filter and Toggle unconfigured */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Selector */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-color cursor-pointer"
              >
                <option value="all">Todos los estados</option>
                <option value="connected">🟢 Solo Conectados</option>
                <option value="disconnected">⚪ Solo Inactivos / Sin configurar</option>
              </select>
            </div>

            {/* Botón de ocultar lo no configurado (Requerimiento explícito del usuario) */}
            <button
              onClick={() => {
                setOnlyConfigured(!onlyConfigured);
                soundService.play('action');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
                onlyConfigured
                  ? 'bg-brand-color text-white border-brand-color shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${onlyConfigured ? 'bg-white' : 'bg-slate-400'}`} />
              <span>{onlyConfigured ? 'Mostrando solo configuradas' : 'Ocultar no configuradas'}</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                soundService.play('action');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Connectors */}
      {filteredConnectors.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
          <Sliders className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            No se encontraron integraciones
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
            No hay conectores que coincidan con los filtros aplicados. Puedes desmarcar el filtro de
            ocultar no configuradas o limpiar la búsqueda.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedStatus('all');
              setOnlyConfigured(false);
            }}
            className="px-4 py-2 bg-brand-color text-white text-xs font-semibold rounded-xl hover:opacity-90"
          >
            Restablecer todos los filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredConnectors.map((item) => {
            const isConnected = item.isSystem || item.config?.status === 'connected';
            const Icon = item.icon;
            const isTestingThisCard = testingCardId === item.id;
            const hasError = item.config?.status === 'error';

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden group"
              >
                {/* Connector Card Header */}
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl border flex items-center justify-center group-hover:scale-105 transition-transform ${item.iconBg}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium border ${item.badgeColor}`}>
                        {item.category}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          isConnected
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : hasError
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isConnected
                              ? 'bg-emerald-500 animate-pulse'
                              : hasError
                              ? 'bg-rose-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        {isConnected ? 'Conectado' : hasError ? 'Error' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{item.name}</span>
                    </h3>
                    <a
                      href={item.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-brand-color transition-colors p-1"
                      title="Ver documentación técnica oficial"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4 min-h-[40px]">
                    {item.description}
                  </p>

                  {/* Architecture & Protocol Pills */}
                  <div className="space-y-2 mb-4 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px]">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span className="font-medium text-slate-500">Arquitectura:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{item.protocol}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span className="font-medium text-slate-500">Sincronización:</span>
                      <span className="font-semibold text-brand-color">{item.syncMode}</span>
                    </div>
                    {item.config?.lastSyncAt && (
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span className="font-medium text-slate-500">Último contacto:</span>
                        <span className="font-mono text-[10px]">
                          {new Date(item.config.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Badges of capabilities */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {item.supported.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
                  {/* Webhook copy quick bar if applicable */}
                  {item.endpointUrl && (
                    <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                      <span className="text-[11px] text-slate-500 font-mono truncate mr-2">
                        {item.endpointUrl.split('/api/').pop()}
                      </span>
                      <button
                        onClick={() => handleCopy(item.endpointUrl!, item.id)}
                        className="text-xs text-brand-color hover:underline flex items-center gap-1 font-semibold shrink-0"
                      >
                        {copiedKey === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === item.id ? 'Copiado' : 'Webhook'}</span>
                      </button>
                    </div>
                  )}

                  {/* Action buttons: Direct Test Connection + Config / Sync */}
                  <div className="flex items-center gap-2">
                    {/* Botón de Comprobar Conexión EN CADA UNA DE ELLAS (Petición explícita del usuario) */}
                    <button
                      onClick={(e) => handleTestConnectionFromCard(item.id, e)}
                      disabled={isTestingThisCard}
                      className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors active:scale-95 disabled:opacity-50"
                      title="Comprobar enlace directo con el servicio"
                    >
                      <Radio className={`w-3.5 h-3.5 text-brand-color ${isTestingThisCard ? 'animate-ping' : ''}`} />
                      <span>{isTestingThisCard ? 'Comprobando...' : 'Comprobar Conexión'}</span>
                    </button>

                    {/* Sincronizar si es aplicable */}
                    {item.canSync && isConnected && (
                      <button
                        onClick={(e) => handleSyncNow(item.id, e)}
                        disabled={syncing === item.id}
                        className="py-2 px-3 bg-brand-color/10 hover:bg-brand-color/20 text-brand-color rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        title="Sincronizar datos ahora"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncing === item.id ? 'animate-spin' : ''}`} />
                        <span>{syncing === item.id ? '...' : 'Sincronizar'}</span>
                      </button>
                    )}

                    {/* Botón de configuración */}
                    {!item.isSystem ? (
                      <button
                        onClick={() => openConfigModal(item.id)}
                        className="py-2 px-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-opacity active:scale-95"
                        title={isAdmin ? 'Configurar credenciales' : 'Ver parámetros configurados'}
                      >
                        {isAdmin ? <Settings2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        <span>{isAdmin ? 'Configurar' : 'Ver'}</span>
                      </button>
                    ) : (
                      <span className="py-2 px-2.5 text-[11px] font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                        Motor Nativo
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Configuration & Credentials Modal (RBAC Guarded) */}
      <AnimatePresence>
        {modalOpen && selectedConnector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-color/10 text-brand-color flex items-center justify-center font-bold">
                    <Plug className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                      <span>Configuración de {selectedConnector.replace('_', ' ').toUpperCase()}</span>
                      {isAdmin ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold">
                          Modo Admin
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-semibold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Solo Lectura
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Establece credenciales, claves API y parámetros de sincronización en tiempo real.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 flex-1">
                {/* Permisos / RBAC Notice */}
                {!isAdmin && (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-semibold">Acceso de Configuración Protegido</p>
                      <p className="opacity-90">
                        Solo los usuarios con rol de Administrador o permisos de gestión de integraciones
                        pueden visualizar o alterar las credenciales confidenciales de este servicio.
                      </p>
                    </div>
                  </div>
                )}

                {/* Enable toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Habilitar Conector Activo
                    </h4>
                    <p className="text-xs text-slate-500">
                      Permite la comunicación automática bidireccional con este servicio.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={editingConfig.enabled ?? false}
                      onChange={(e) => setEditingConfig({ ...editingConfig, enabled: e.target.checked })}
                      className="sr-only peer disabled:cursor-not-allowed"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-color peer-disabled:opacity-50"></div>
                  </label>
                </div>

                {/* ODOO Specific Fields */}
                {selectedConnector === 'odoo' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        URL de la Instancia Odoo
                      </label>
                      <input
                        type="url"
                        disabled={!isAdmin}
                        placeholder="https://mi-empresa.odoo.com"
                        value={editingConfig.url || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, url: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Base de Datos (DB)
                        </label>
                        <input
                          type="text"
                          disabled={!isAdmin}
                          placeholder="odoo_db"
                          value={editingConfig.db || ''}
                          onChange={(e) => setEditingConfig({ ...editingConfig, db: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Usuario / Email API
                        </label>
                        <input
                          type="text"
                          disabled={!isAdmin}
                          placeholder="admin@mi-empresa.com"
                          value={editingConfig.username || ''}
                          onChange={(e) => setEditingConfig({ ...editingConfig, username: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          API Key / Contraseña
                        </label>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => toggleShowSecret('odooApiKey')}
                            className="text-xs text-slate-500 hover:text-brand-color flex items-center gap-1"
                          >
                            {showSecret['odooApiKey'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{showSecret['odooApiKey'] ? 'Ocultar' : 'Mostrar'}</span>
                          </button>
                        )}
                      </div>
                      <input
                        type={showSecret['odooApiKey'] ? 'text' : 'password'}
                        disabled={!isAdmin}
                        placeholder={editingConfig.hasApiKey ? '•••••••• (Preservada en servidor)' : 'Clave de acceso Odoo'}
                        value={editingConfig.apiKey || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, apiKey: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none font-mono disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="pt-2 space-y-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Entidades a Sincronizar</span>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={!isAdmin}
                            checked={editingConfig.syncContacts ?? true}
                            onChange={(e) => setEditingConfig({ ...editingConfig, syncContacts: e.target.checked })}
                            className="rounded text-brand-color"
                          />
                          <span>Contactos</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={!isAdmin}
                            checked={editingConfig.syncInvoices ?? true}
                            onChange={(e) => setEditingConfig({ ...editingConfig, syncInvoices: e.target.checked })}
                            className="rounded text-brand-color"
                          />
                          <span>Facturas</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={!isAdmin}
                            checked={editingConfig.syncProducts ?? true}
                            onChange={(e) => setEditingConfig({ ...editingConfig, syncProducts: e.target.checked })}
                            className="rounded text-brand-color"
                          />
                          <span>Productos</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* WOOCOMMERCE Specific Fields */}
                {selectedConnector === 'woocommerce' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        URL de la Tienda (WordPress)
                      </label>
                      <input
                        type="url"
                        disabled={!isAdmin}
                        placeholder="https://tienda.com"
                        value={editingConfig.storeUrl || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, storeUrl: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Consumer Key (ck_...)
                        </label>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => toggleShowSecret('wcKey')}
                            className="text-xs text-slate-500 hover:text-brand-color flex items-center gap-1"
                          >
                            {showSecret['wcKey'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{showSecret['wcKey'] ? 'Ocultar' : 'Mostrar'}</span>
                          </button>
                        )}
                      </div>
                      <input
                        type={showSecret['wcKey'] ? 'text' : 'password'}
                        disabled={!isAdmin}
                        placeholder={editingConfig.hasConsumerKey ? '•••••••• (Preservada en servidor)' : 'ck_xxxxxxxxxxxx'}
                        value={editingConfig.consumerKey || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, consumerKey: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none font-mono disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Consumer Secret (cs_...)
                        </label>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => toggleShowSecret('wcSecret')}
                            className="text-xs text-slate-500 hover:text-brand-color flex items-center gap-1"
                          >
                            {showSecret['wcSecret'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{showSecret['wcSecret'] ? 'Ocultar' : 'Mostrar'}</span>
                          </button>
                        )}
                      </div>
                      <input
                        type={showSecret['wcSecret'] ? 'text' : 'password'}
                        disabled={!isAdmin}
                        placeholder={editingConfig.hasConsumerSecret ? '•••••••• (Preservada en servidor)' : 'cs_xxxxxxxxxxxx'}
                        value={editingConfig.consumerSecret || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, consumerSecret: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none font-mono disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                      />
                    </div>
                    {endpoints?.woocommerceWebhook && (
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          URL de Webhook para WooCommerce:
                        </span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-brand-color font-mono break-all flex-1 select-all">
                            {endpoints.woocommerceWebhook}
                          </code>
                          <button
                            onClick={() => handleCopy(endpoints.woocommerceWebhook, 'wc-hook')}
                            className="p-1.5 bg-white dark:bg-slate-700 rounded-lg hover:bg-slate-200 text-slate-700 dark:text-slate-200"
                          >
                            {copiedKey === 'wc-hook' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* SHOPIFY Specific Fields */}
                {selectedConnector === 'shopify' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Dominio de Shopify (myshopify.com)
                      </label>
                      <input
                        type="text"
                        disabled={!isAdmin}
                        placeholder="mi-tienda.myshopify.com"
                        value={editingConfig.shopDomain || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, shopDomain: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none font-mono disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Admin API Access Token (shpat_...)
                        </label>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => toggleShowSecret('shopifyToken')}
                            className="text-xs text-slate-500 hover:text-brand-color flex items-center gap-1"
                          >
                            {showSecret['shopifyToken'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{showSecret['shopifyToken'] ? 'Ocultar' : 'Mostrar'}</span>
                          </button>
                        )}
                      </div>
                      <input
                        type={showSecret['shopifyToken'] ? 'text' : 'password'}
                        disabled={!isAdmin}
                        placeholder={editingConfig.hasAccessToken ? '•••••••• (Preservada en servidor)' : 'shpat_xxxxxxxxxxxx'}
                        value={editingConfig.accessToken || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, accessToken: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none font-mono disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Webhook Secret (HMAC-SHA256)
                      </label>
                      <input
                        type="password"
                        disabled={!isAdmin}
                        placeholder="shpss_xxxxxxxxxxxx"
                        value={editingConfig.webhookSecret || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, webhookSecret: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none font-mono disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                      />
                    </div>
                    {endpoints?.shopifyWebhook && (
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          URL de Webhook para Shopify:
                        </span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-brand-color font-mono break-all flex-1 select-all">
                            {endpoints.shopifyWebhook}
                          </code>
                          <button
                            onClick={() => handleCopy(endpoints.shopifyWebhook, 'sh-hook')}
                            className="p-1.5 bg-white dark:bg-slate-700 rounded-lg hover:bg-slate-200 text-slate-700 dark:text-slate-200"
                          >
                            {copiedKey === 'sh-hook' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* N8N Specific Fields */}
                {selectedConnector === 'n8n' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        URL de Webhook n8n (Flujo de entrada hacia n8n)
                      </label>
                      <input
                        type="url"
                        disabled={!isAdmin}
                        placeholder="https://n8n.mi-servidor.com/webhook/crm-trigger"
                        value={editingConfig.webhookUrl || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, webhookUrl: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none font-mono disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          API Key n8n (Opcional / Cabecera de autenticación)
                        </label>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => toggleShowSecret('n8nApiKey')}
                            className="text-xs text-slate-500 hover:text-brand-color flex items-center gap-1"
                          >
                            {showSecret['n8nApiKey'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{showSecret['n8nApiKey'] ? 'Ocultar' : 'Mostrar'}</span>
                          </button>
                        )}
                      </div>
                      <input
                        type={showSecret['n8nApiKey'] ? 'text' : 'password'}
                        disabled={!isAdmin}
                        placeholder={editingConfig.hasApiKey ? '•••••••• (Preservada en servidor)' : 'n8n_api_key_xxxxxxxx'}
                        value={editingConfig.apiKey || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, apiKey: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none font-mono disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                      />
                    </div>
                    {endpoints?.n8nActionEndpoint && (
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Endpoint para que n8n ejecute acciones en DAMA-CRM:
                        </span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-brand-color font-mono break-all flex-1 select-all">
                            {endpoints.n8nActionEndpoint}
                          </code>
                          <button
                            onClick={() => handleCopy(endpoints.n8nActionEndpoint, 'n8n-in')}
                            className="p-1.5 bg-white dark:bg-slate-700 rounded-lg hover:bg-slate-200 text-slate-700 dark:text-slate-200"
                          >
                            {copiedKey === 'n8n-in' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STRIPE Specific Fields */}
                {selectedConnector === 'stripe' && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Secret Key (sk_live_... / sk_test_...)
                        </label>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => toggleShowSecret('stripeSecretKey')}
                            className="text-xs text-slate-500 hover:text-brand-color flex items-center gap-1"
                          >
                            {showSecret['stripeSecretKey'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{showSecret['stripeSecretKey'] ? 'Ocultar' : 'Mostrar'}</span>
                          </button>
                        )}
                      </div>
                      <input
                        type={showSecret['stripeSecretKey'] ? 'text' : 'password'}
                        disabled={!isAdmin}
                        placeholder={editingConfig.hasSecretKey ? '•••••••• (Preservada en servidor)' : 'sk_live_xxxxxxxx'}
                        value={editingConfig.secretKey || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, secretKey: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none font-mono disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Publishable Key (pk_live_... / pk_test_...)
                      </label>
                      <input
                        type="text"
                        disabled={!isAdmin}
                        placeholder="pk_live_xxxxxxxx"
                        value={editingConfig.publishableKey || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, publishableKey: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none font-mono disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                {/* ZAPIER Specific Fields */}
                {selectedConnector === 'zapier' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        URL de Webhook de Zapier (Catch Hook)
                      </label>
                      <input
                        type="url"
                        disabled={!isAdmin}
                        placeholder="https://hooks.zapier.com/hooks/catch/xxxxxx/yyyyyy/"
                        value={editingConfig.webhookUrl || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, webhookUrl: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none font-mono disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        API Key de Integración (Opcional)
                      </label>
                      <input
                        type="password"
                        disabled={!isAdmin}
                        placeholder={editingConfig.hasApiKey ? '•••••••• (Preservada en servidor)' : 'zapier_key_xxxx'}
                        value={editingConfig.apiKey || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, apiKey: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none font-mono disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                {/* GOOGLE CALENDAR Specific Fields */}
                {selectedConnector === 'google_calendar' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Email Corporativo de Google Workspace / Calendar
                      </label>
                      <input
                        type="email"
                        disabled={!isAdmin}
                        placeholder="ventas@tuempresa.com"
                        value={editingConfig.email || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Client ID (Google Cloud Console OAuth2)
                      </label>
                      <input
                        type="text"
                        disabled={!isAdmin}
                        placeholder="xxxxxx-yyyyyy.apps.googleusercontent.com"
                        value={editingConfig.clientId || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, clientId: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none font-mono disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Client Secret
                        </label>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => toggleShowSecret('gcalSecret')}
                            className="text-xs text-slate-500 hover:text-brand-color flex items-center gap-1"
                          >
                            {showSecret['gcalSecret'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{showSecret['gcalSecret'] ? 'Ocultar' : 'Mostrar'}</span>
                          </button>
                        )}
                      </div>
                      <input
                        type={showSecret['gcalSecret'] ? 'text' : 'password'}
                        disabled={!isAdmin}
                        placeholder={editingConfig.hasClientSecret ? '•••••••• (Preservada en servidor)' : 'GOCSPX-xxxxxxxx'}
                        value={editingConfig.clientSecret || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, clientSecret: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none font-mono disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                {/* Test Feedback Banner */}
                {testResult && (
                  <div
                    className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                      testResult.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-semibold">{testResult.message}</p>
                      {testResult.details && (
                        <pre className="mt-1 font-mono text-[11px] opacity-90 overflow-x-auto bg-black/5 dark:bg-black/20 p-2 rounded-lg">
                          {JSON.stringify(testResult.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  onClick={handleTestConnectionInModal}
                  disabled={modalTesting || !isAdmin}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Radio className={`w-3.5 h-3.5 ${modalTesting ? 'animate-ping' : ''}`} />
                  <span>{modalTesting ? 'Comprobando...' : 'Probar Conexión'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {isAdmin ? 'Cancelar' : 'Cerrar'}
                  </button>
                  {isAdmin && (
                    <button
                      onClick={handleSaveConfig}
                      disabled={modalTesting}
                      className="px-5 py-2 bg-brand-color text-white rounded-xl text-xs font-semibold hover:opacity-95 transition-opacity active:scale-95 shadow-sm disabled:opacity-50"
                    >
                      Guardar Configuración
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
