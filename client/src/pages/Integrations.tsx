import React, { useState, useEffect } from 'react';
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
  HelpCircle,
  Key,
  Globe,
  Radio,
  Sliders,
  X,
} from 'lucide-react';
import { integrationsService, IntegrationsResponseData, IntegrationsEndpoints } from '../services/integrations.service';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { soundService } from '../services/sound';

export const Integrations: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<IntegrationsResponseData | null>(null);
  const [endpoints, setEndpoints] = useState<IntegrationsEndpoints | null>(null);
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal editing state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>({});
  const [testing, setTesting] = useState(false);
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
    setModalOpen(true);
    soundService.play('action');
  };

  const handleSaveConfig = async () => {
    if (!selectedConnector) return;
    try {
      setTesting(true);
      await integrationsService.updateConfig(selectedConnector, editingConfig);
      toast.success('Configuración guardada', `Se han actualizado los parámetros de ${selectedConnector.toUpperCase()}`);
      soundService.play('success');
      setModalOpen(false);
      fetchIntegrations();
    } catch (err: any) {
      toast.error('Error al guardar', err.message);
      soundService.play('error');
    } finally {
      setTesting(false);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedConnector) return;
    try {
      setTesting(true);
      setTestResult(null);
      const res = await integrationsService.testConnection(selectedConnector, editingConfig);
      setTestResult(res);
      if (res.success) {
        soundService.play('success');
        toast.success('Conexión Exitosa', res.message);
      } else {
        soundService.play('error');
        toast.error('Fallo de Conexión', res.message);
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
      soundService.play('error');
      toast.error('Error', err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleSyncNow = async (connector: string) => {
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

  const connectorsList = [
    {
      id: 'odoo',
      name: 'Odoo ERP',
      icon: Building2,
      category: 'ERP & Contabilidad',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
      description: 'Sincronización bidireccional de contactos, presupuestos, facturas y catálogo con Odoo Community & Enterprise.',
      supported: ['Contactos', 'Facturas', 'Productos', 'Impuestos'],
      config: integrations?.odoo,
    },
    {
      id: 'woocommerce',
      name: 'WooCommerce',
      icon: ShoppingBag,
      category: 'Comercio Electrónico',
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
      description: 'Importación automática de pedidos como tratos y clientes en tiempo real vía Webhooks y REST API.',
      supported: ['Pedidos', 'Clientes', 'Webhooks en tiempo real', 'Stock'],
      config: integrations?.woocommerce,
    },
    {
      id: 'shopify',
      name: 'Shopify Store',
      icon: Globe,
      category: 'Comercio Electrónico',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
      description: 'Conexión con tiendas Shopify con verificación criptográfica HMAC-SHA256 y creación de oportunidades automáticas.',
      supported: ['Pedidos', 'Clientes', 'HMAC SHA-256', 'Catálogo'],
      config: integrations?.shopify,
    },
    {
      id: 'n8n',
      name: 'n8n Workflow Automation',
      icon: Zap,
      category: 'Automatización & Flujos',
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
      description: 'Disparador de eventos salientes del CRM y receptor de acciones entrantes para pipelines ilimitados en n8n.',
      supported: ['Eventos Webhook', 'Acciones Inbound', 'API Keys', 'Triggers'],
      config: integrations?.n8n,
    },
    {
      id: 'unopim',
      name: 'UnoPIM (Catálogo & PIM)',
      icon: Boxes,
      category: 'Gestión de Productos',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
      description: 'Recepción de catálogo de productos, sincronización nocturna e integración con inventario central.',
      supported: ['Catálogo', 'Variantes', 'Stock automático'],
      isSystem: true,
      endpointUrl: endpoints?.unopimWebhook,
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Cloud (Meta API)',
      icon: MessageSquare,
      category: 'Mensajería Omnicanal',
      badgeColor: 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300',
      description: 'Bandeja unificada para conversaciones, mensajes de plantilla verificados y webhooks directos de Meta Cloud.',
      supported: ['Chat 24/7', 'Webhooks Meta', 'Plantillas HSM'],
      isSystem: true,
      endpointUrl: endpoints?.whatsappWebhook,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-color to-brand-color/80 text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
              <Plug className="w-3.5 h-3.5" />
              <span>{t('integrations.ecosystemTitle', 'Ecosistema de Integraciones Conectadas')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {t('integrations.title', 'Conectores & Automatizaciones')}
            </h1>
            <p className="text-white/80 max-w-2xl text-sm sm:text-base">
              {t(
                'integrations.subtitle',
                'Conecta DAMA-CRM con tus plataformas de comercio electrónico, sistemas ERP y motores de flujos n8n para sincronización omnicanal automática.'
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchIntegrations}
              disabled={loading}
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-sm font-medium transition-all flex items-center gap-2 active:scale-95 text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('integrations.refresh', 'Actualizar Estados')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Connectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connectorsList.map((item) => {
          const isConnected = item.config?.status === 'connected' || item.isSystem;
          const isEnabled = item.config?.enabled ?? true;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              {/* Connector Card Header */}
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-brand-color group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${item.badgeColor}`}>
                      {item.category}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isConnected
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      {isConnected ? t('integrations.connected', 'Conectado') : t('integrations.disconnected', 'Inactivo')}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{item.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {item.description}
                </p>

                {/* Badges of capabilities */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {item.supported.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-xs rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                {item.isSystem ? (
                  <div className="w-full flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">{t('integrations.nativeEngine', 'Motor Nativo')}</span>
                    {item.endpointUrl && (
                      <button
                        onClick={() => handleCopy(item.endpointUrl!, item.id)}
                        className="text-xs text-brand-color hover:underline flex items-center gap-1 font-medium"
                      >
                        {copiedKey === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === item.id ? 'Copiado' : 'Copiar Webhook'}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => openConfigModal(item.id)}
                      className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>{t('integrations.configure', 'Configurar')}</span>
                    </button>

                    {(item.id === 'odoo' || item.id === 'woocommerce' || item.id === 'shopify') && (
                      <button
                        onClick={() => handleSyncNow(item.id)}
                        disabled={syncing === item.id}
                        className="py-2 px-3 bg-brand-color/10 hover:bg-brand-color/20 text-brand-color rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        title={t('integrations.syncNow', 'Sincronizar ahora')}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncing === item.id ? 'animate-spin' : ''}`} />
                        <span>{syncing === item.id ? '...' : t('integrations.sync', 'Sincronizar')}</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Configuration Modal */}
      <AnimatePresence>
        {modalOpen && selectedConnector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-color/10 text-brand-color flex items-center justify-center font-bold">
                    <Plug className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                      {t('integrations.configureModalTitle', 'Configuración de')} {selectedConnector.toUpperCase()}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {t('integrations.modalSubtitle', 'Establece credenciales y parámetros de sincronización en tiempo real.')}
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
                {/* Enable toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {t('integrations.enableConnector', 'Habilitar Conector Activo')}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {t('integrations.enableDesc', 'Permite la comunicación automática con este servicio.')}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingConfig.enabled ?? false}
                      onChange={(e) => setEditingConfig({ ...editingConfig, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-color"></div>
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
                        placeholder="https://mi-empresa.odoo.com"
                        value={editingConfig.url || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, url: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Base de Datos
                        </label>
                        <input
                          type="text"
                          placeholder="odoo_db"
                          value={editingConfig.db || ''}
                          onChange={(e) => setEditingConfig({ ...editingConfig, db: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Usuario / Email API
                        </label>
                        <input
                          type="text"
                          placeholder="admin@mi-empresa.com"
                          value={editingConfig.username || ''}
                          onChange={(e) => setEditingConfig({ ...editingConfig, username: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        API Key / Contraseña
                      </label>
                      <input
                        type="password"
                        placeholder={editingConfig.hasApiKey ? '•••••••• (Preservada)' : 'Clave de acceso Odoo'}
                        value={editingConfig.apiKey || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, apiKey: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none font-mono"
                      />
                    </div>
                    <div className="pt-2 space-y-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Entidades a Sincronizar</span>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingConfig.syncContacts ?? true}
                            onChange={(e) => setEditingConfig({ ...editingConfig, syncContacts: e.target.checked })}
                            className="rounded text-brand-color"
                          />
                          <span>Contactos</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingConfig.syncInvoices ?? true}
                            onChange={(e) => setEditingConfig({ ...editingConfig, syncInvoices: e.target.checked })}
                            className="rounded text-brand-color"
                          />
                          <span>Facturas</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
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
                        placeholder="https://tienda.com"
                        value={editingConfig.storeUrl || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, storeUrl: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Consumer Key (ck_...)
                      </label>
                      <input
                        type="password"
                        placeholder={editingConfig.hasConsumerKey ? '•••••••• (Preservada)' : 'ck_xxxxxxxxxxxx'}
                        value={editingConfig.consumerKey || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, consumerKey: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Consumer Secret (cs_...)
                      </label>
                      <input
                        type="password"
                        placeholder={editingConfig.hasConsumerSecret ? '•••••••• (Preservada)' : 'cs_xxxxxxxxxxxx'}
                        value={editingConfig.consumerSecret || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, consumerSecret: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none font-mono"
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
                        placeholder="mi-tienda.myshopify.com"
                        value={editingConfig.shopDomain || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, shopDomain: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Admin API Access Token (shpat_...)
                      </label>
                      <input
                        type="password"
                        placeholder={editingConfig.hasAccessToken ? '•••••••• (Preservada)' : 'shpat_xxxxxxxxxxxx'}
                        value={editingConfig.accessToken || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, accessToken: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Webhook Secret (HMAC-SHA256)
                      </label>
                      <input
                        type="password"
                        placeholder="shpss_xxxxxxxxxxxx"
                        value={editingConfig.webhookSecret || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, webhookSecret: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none font-mono"
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
                        URL de Webhook n8n (Flujo de entrada)
                      </label>
                      <input
                        type="url"
                        placeholder="https://n8n.mi-servidor.com/webhook/crm-trigger"
                        value={editingConfig.webhookUrl || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, webhookUrl: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        API Key n8n (Opcional)
                      </label>
                      <input
                        type="password"
                        placeholder={editingConfig.hasApiKey ? '•••••••• (Preservada)' : 'n8n_api_key_xxxxxxxx'}
                        value={editingConfig.apiKey || ''}
                        onChange={(e) => setEditingConfig({ ...editingConfig, apiKey: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none font-mono"
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
                        <pre className="mt-1 font-mono text-[11px] opacity-90 overflow-x-auto">
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
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors active:scale-95"
                >
                  <Radio className={`w-3.5 h-3.5 ${testing ? 'animate-ping' : ''}`} />
                  <span>{testing ? 'Comprobando...' : t('integrations.testConnection', 'Probar Conexión')}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {t('common.cancel', 'Cancelar')}
                  </button>
                  <button
                    onClick={handleSaveConfig}
                    disabled={testing}
                    className="px-5 py-2 bg-brand-color text-white rounded-xl text-xs font-semibold hover:opacity-95 transition-opacity active:scale-95 shadow-sm"
                  >
                    {t('common.save', 'Guardar Configuración')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
