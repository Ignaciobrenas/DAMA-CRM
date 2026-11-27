import React, { useState, useEffect, useMemo } from 'react';
import {
  Filter,
  Link2,
  Plug,
  Radio,
  RefreshCw,
  Search,
  Sliders,
  X,
} from 'lucide-react';
import { ThinkingOrb } from 'thinking-orbs';
import {
  integrationsService,
  IntegrationsResponseData,
  IntegrationsEndpoints,
} from '../services/integrations.service';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { soundService } from '../services/sound';
import { ApiConfiguratorModal } from '../components/integrations/ApiConfiguratorModal';
import {
  buildConnectorCatalog,
  ConnectorCardDefinition,
} from '../components/integrations/ConnectorCatalog';
import { ConnectorCard } from '../components/integrations/ConnectorCard';
import { ConnectorConfigModal } from '../components/integrations/ConnectorConfigModal';
import { ConnectorLogsModal } from '../components/integrations/ConnectorLogsModal';
import {
  MassDiagnosticBanner,
  MassTestSummary,
} from '../components/integrations/MassDiagnosticBanner';
import { PlatformExplorerModal } from '../components/integrations/PlatformExplorerModal';

const CATEGORIES = [
  { id: 'all', label: 'Todas las integraciones' },
  { id: 'ecommerce', label: 'E-commerce' },
  { id: 'erp', label: 'ERP & Contabilidad' },
  { id: 'automation', label: 'Automatización & Flujos' },
  { id: 'payments', label: 'Pasarelas de Pago' },
  { id: 'productivity', label: 'Productividad & Agenda' },
  { id: 'messaging', label: 'Mensajería' },
  { id: 'pim', label: 'Catálogo & PIM' },
];

export const Integrations: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const { user, hasPermission } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || hasPermission('integrations', 'manage');

  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<IntegrationsResponseData | null>(null);
  const [endpoints, setEndpoints] = useState<IntegrationsEndpoints | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [onlyConfigured, setOnlyConfigured] = useState<boolean>(false);

  // Estados operativos
  const [testingCardId, setTestingCardId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [massTestSummary, setMassTestSummary] = useState<MassTestSummary | null>(null);

  // Modales
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Record<string, any>>({});
  const [modalTesting, setModalTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [isApiConfiguratorOpen, setIsApiConfiguratorOpen] = useState(false);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [selectedLogsConnector, setSelectedLogsConnector] = useState<ConnectorCardDefinition | null>(null);
  const [explorerModalOpen, setExplorerModalOpen] = useState(false);
  const [selectedExplorerConnector, setSelectedExplorerConnector] = useState<ConnectorCardDefinition | null>(null);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modalOpen) setModalOpen(false);
        if (logsModalOpen) setLogsModalOpen(false);
        if (explorerModalOpen) setExplorerModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, logsModalOpen, explorerModalOpen]);

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

  const connectorsList = useMemo(
    () => buildConnectorCatalog(integrations, endpoints),
    [integrations, endpoints]
  );

  const handleTestAllConnections = async () => {
    if (!isAdmin) {
      toast.error('Permiso requerido', 'Solo administradores pueden realizar auditorías masivas de conexión.');
      return;
    }
    setIsTestingAll(true);
    soundService.play('action');

    const activeList = connectorsList.filter(
      (c) =>
        c.isSystem ||
        (c.config?.enabled &&
          (c.config?.status === 'connected' ||
            c.config?.hasApiKey ||
            c.config?.hasConsumerKey ||
            c.config?.hasAccessToken ||
            c.config?.hasPassword ||
            c.config?.hasWsKey ||
            c.config?.hasSubscriptionKey))
    );

    const targetList = activeList.length > 0 ? activeList : connectorsList.slice(0, 8);
    const results: MassTestSummary['results'] = {};
    let passed = 0;
    let failed = 0;
    let totalLatency = 0;

    await Promise.all(
      targetList.map(async (conn) => {
        const start = Date.now();
        try {
          const res = await integrationsService.testConnection(conn.id);
          const latency = Date.now() - start;
          results[conn.id] = {
            success: res.success,
            message: res.message || (res.success ? '200 OK' : 'Error en servicio'),
            latencyMs: latency,
          };
          if (res.success) passed++;
          else failed++;
          totalLatency += latency;
        } catch (err: any) {
          const latency = Date.now() - start;
          results[conn.id] = {
            success: false,
            message: err.message || 'Sin respuesta / Timeout',
            latencyMs: latency,
          };
          failed++;
          totalLatency += latency;
        }
      })
    );

    const avgLatencyMs = targetList.length > 0 ? Math.round(totalLatency / targetList.length) : 0;
    setMassTestSummary({ total: targetList.length, passed, failed, avgLatencyMs, results });
    setIsTestingAll(false);

    if (failed === 0) {
      soundService.play('success');
      toast.success(
        'Auditoría API Completada',
        `Todas las ${passed} conexiones probadas responden perfectamente (Latencia media: ${avgLatencyMs}ms)`
      );
    } else {
      soundService.play('error');
      toast.error('Diagnóstico de Conexiones', `${passed} activas OK, ${failed} con error.`);
    }
    fetchIntegrations();
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
        if (connector === 'google_calendar' || connector.includes('calendar')) {
          window.dispatchEvent(new Event('dama:calendar-synced'));
        }
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

  const handleToggleEnable = async (connectorId: string, currentEnabled: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) {
      toast.error('Acceso denegado', 'Solo administradores pueden activar o desactivar integraciones.');
      return;
    }
    try {
      soundService.play('action');
      const existing = (integrations as any)?.[connectorId] || {};
      const newEnabled = !currentEnabled;
      await integrationsService.updateConfig(connectorId, { ...existing, enabled: newEnabled });
      toast.success(
        newEnabled ? 'Integración Activada' : 'Integración Desactivada',
        `${connectorId.toUpperCase()} ha sido ${newEnabled ? 'activado' : 'desactivado'} con éxito.`
      );
      soundService.play(newEnabled ? 'success' : 'action');
      fetchIntegrations();
    } catch (err: any) {
      soundService.play('error');
      toast.error('Error al actualizar estado', err.message);
    }
  };

  const stats = useMemo(() => {
    let connected = 0;
    connectorsList.forEach((c) => {
      if (c.isSystem || c.config?.status === 'connected') connected++;
    });
    return {
      total: connectorsList.length,
      connected,
      available: connectorsList.length - connected,
    };
  }, [connectorsList]);

  const filteredConnectors = useMemo(() => {
    return connectorsList.filter((item) => {
      const isConfigured = Boolean(
        item.isSystem ||
          (item.config?.enabled &&
            (item.config?.status === 'connected' ||
              item.config?.hasApiKey ||
              item.config?.hasConsumerKey ||
              item.config?.hasAccessToken ||
              item.config?.hasPassword ||
              item.config?.hasWsKey ||
              item.config?.hasSubscriptionKey ||
              item.config?.apiKey))
      );

      if (onlyConfigured && !isConfigured) return false;
      if (selectedCategory !== 'all' && item.categorySlug !== selectedCategory) return false;
      if (selectedStatus === 'connected' && !isConfigured) return false;
      if (selectedStatus === 'disconnected' && isConfigured) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.protocol.toLowerCase().includes(q) ||
          item.supported.some((tag) => tag.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [connectorsList, onlyConfigured, selectedCategory, selectedStatus, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-10 w-44 h-44 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md">
              <Plug className="w-3.5 h-3.5" />
              <span>{t('integrations.ecosystemTitle', 'Ecosistema de Integraciones Conectadas')}</span>
              <span className="px-1.5 py-0.2 bg-white/30 rounded text-[11px] font-mono">v2.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('integrations.title', 'Conectores & Integraciones de Terceros')}
            </h1>
            <p className="text-white/85 text-sm sm:text-base leading-relaxed">
              {t(
                'integrations.subtitle',
                'Conecta DAMA-CRM con tus plataformas de comercio electrónico, sistemas ERP, pasarelas de pago y automatizaciones con verificación criptográfica y sincronización en tiempo real.'
              )}
            </p>
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
              onClick={handleTestAllConnections}
              disabled={isTestingAll}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-extrabold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg border border-emerald-400/40 disabled:opacity-50"
            >
              {isTestingAll ? (
                <ThinkingOrb state="connecting" size={20} {...({ dark: true } as any)} />
              ) : (
                <Radio className="w-4 h-4 text-emerald-100 animate-pulse" />
              )}
              <span>{isTestingAll ? 'Probando Conexiones...' : 'Probar Todas las Conexiones'}</span>
            </button>

            <button
              onClick={() => {
                soundService.playPopSound();
                setIsApiConfiguratorOpen(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
            >
              <Sliders className="w-4 h-4" />
              <span>Configurador de APIs &amp; Snippets</span>
            </button>

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

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <span className="text-xs text-white/75 font-medium block">{t('integrations.totalConnectors')}</span>
            <span className="text-xl font-bold text-white">{stats.total} servicios</span>
          </div>
          <div className="bg-emerald-500/20 backdrop-blur-sm rounded-xl p-3 border border-emerald-400/30">
            <span className="text-xs text-emerald-100 font-medium block">{t('integrations.connectedActive')}</span>
            <span className="text-xl font-bold text-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {stats.connected}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <span className="text-xs text-white/75 font-medium block">{t('integrations.readyToConnect')}</span>
            <span className="text-xl font-bold text-white">{stats.available}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <span className="text-xs text-white/75 font-medium block">Diagnóstico de Red</span>
            <span className="text-sm font-bold text-white flex items-center gap-1 mt-1">
              {massTestSummary ? (
                <span className="text-emerald-300 font-mono text-xs">
                  {massTestSummary.passed}/{massTestSummary.total} OK • {massTestSummary.avgLatencyMs}ms
                </span>
              ) : (
                <span className="text-white/80 text-xs">Listo para probar</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Mass Diagnostic Banner */}
      <MassDiagnosticBanner summary={massTestSummary} onClose={() => setMassTestSummary(null)} />

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              aria-label={t('integrations.searchPlaceholder') || 'Buscar integraciones'}
              data-testid="integrations-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('integrations.searchPlaceholder')}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-color"
            />
            {searchQuery && (
              <button
                aria-label="Limpiar búsqueda"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                aria-label="Filtrar por estado de conexión"
                data-testid="integrations-status-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-color cursor-pointer"
              >
                <option value="all">{t('integrations.allStatuses')}</option>
                <option value="connected">{t('integrations.onlyConnected')}</option>
                <option value="disconnected">{t('integrations.onlyInactive')}</option>
              </select>
            </div>

            <button
              data-testid="integrations-toggle-configured"
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

        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
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

      {/* Grid of Modular Connector Cards */}
      {filteredConnectors.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-xl mx-auto shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Plug className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {onlyConfigured || selectedStatus === 'connected'
              ? 'No hay nada configurado'
              : 'No se encontraron integraciones'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            {onlyConfigured || selectedStatus === 'connected'
              ? 'Aún no se ha configurado ni activado ninguna integración en el sistema. Desactiva el filtro para explorar el catálogo completo.'
              : 'No hay conectores que coincidan con la búsqueda o filtros seleccionados.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedStatus('all');
              setOnlyConfigured(false);
              soundService.play('action');
            }}
            className="px-5 py-2.5 bg-brand-color text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity active:scale-95 shadow-sm"
          >
            {onlyConfigured || selectedStatus === 'connected'
              ? 'Ver todas las integraciones disponibles'
              : 'Restablecer todos los filtros'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredConnectors.map((item) => (
            <ConnectorCard
              key={item.id}
              item={item}
              isAdmin={isAdmin}
              isTesting={testingCardId === item.id}
              isSyncing={syncing === item.id}
              copiedKey={copiedKey}
              t={t}
              onToggleEnable={handleToggleEnable}
              onTestConnection={handleTestConnectionFromCard}
              onOpenLogs={(conn, e) => {
                e.stopPropagation();
                setSelectedLogsConnector(conn);
                setLogsModalOpen(true);
                soundService.play('action');
              }}
              onOpenExplorer={(conn, e) => {
                e.stopPropagation();
                setSelectedExplorerConnector(conn);
                setExplorerModalOpen(true);
                soundService.play('action');
              }}
              onSyncNow={handleSyncNow}
              onOpenConfig={openConfigModal}
              onCopy={handleCopy}
            />
          ))}
        </div>
      )}

      {/* Modular Centered Modals */}
      <ConnectorConfigModal
        isOpen={modalOpen}
        connectorId={selectedConnector}
        config={editingConfig}
        setConfig={setEditingConfig}
        isAdmin={isAdmin}
        testing={modalTesting}
        testResult={testResult}
        endpoints={endpoints}
        copiedKey={copiedKey}
        onCopy={handleCopy}
        onTest={handleTestConnectionInModal}
        onSave={handleSaveConfig}
        onClose={() => setModalOpen(false)}
        t={t}
      />

      <ConnectorLogsModal
        isOpen={logsModalOpen}
        connector={selectedLogsConnector}
        isTesting={Boolean(selectedLogsConnector && testingCardId === selectedLogsConnector.id)}
        onClose={() => setLogsModalOpen(false)}
        onRetest={handleTestConnectionFromCard}
      />

      <ApiConfiguratorModal
        isOpen={isApiConfiguratorOpen}
        onClose={() => setIsApiConfiguratorOpen(false)}
      />

      <PlatformExplorerModal
        isOpen={explorerModalOpen}
        connector={selectedExplorerConnector}
        onClose={() => setExplorerModalOpen(false)}
      />
    </div>
  );
};
