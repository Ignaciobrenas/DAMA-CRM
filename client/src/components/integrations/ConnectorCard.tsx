import React from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Copy,
  ExternalLink,
  FileText,
  Lock,
  Radio,
  RefreshCw,
  Settings2,
  Terminal,
} from 'lucide-react';
import { ConnectorCardDefinition } from './ConnectorCatalog';

interface ConnectorCardProps {
  item: ConnectorCardDefinition;
  isAdmin: boolean;
  isTesting: boolean;
  isSyncing: boolean;
  copiedKey: string | null;
  t: (key: string, fallback?: string) => string;
  onToggleEnable: (connectorId: string, currentEnabled: boolean, e: React.MouseEvent) => void;
  onTestConnection: (connectorId: string, e: React.MouseEvent) => void;
  onOpenLogs: (item: ConnectorCardDefinition, e: React.MouseEvent) => void;
  onOpenExplorer: (item: ConnectorCardDefinition, e: React.MouseEvent) => void;
  onSyncNow: (connectorId: string, e: React.MouseEvent) => void;
  onOpenConfig: (connectorId: string) => void;
  onCopy: (text: string, id: string) => void;
}

export const ConnectorCard: React.FC<ConnectorCardProps> = ({
  item,
  isAdmin,
  isTesting,
  isSyncing,
  copiedKey,
  t,
  onToggleEnable,
  onTestConnection,
  onOpenLogs,
  onOpenExplorer,
  onSyncNow,
  onOpenConfig,
  onCopy,
}) => {
  const isConnected = Boolean(item.config?.enabled && item.config?.status === 'connected');
  const hasError = item.config?.status === 'error';
  const Icon = item.icon;

  const statusText = isConnected ? 'Conectado' : hasError ? 'Error' : 'Sin configurar';
  const statusBadgeStyle = isConnected
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    : hasError
    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800'
    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
  const statusDotStyle = isConnected ? 'bg-emerald-500 animate-pulse' : hasError ? 'bg-rose-500' : 'bg-slate-400';

  return (
    <motion.div
      data-testid={`connector-card-${item.id}`}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden group"
    >
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="w-10 h-10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <img
              src={item.logoUrl}
              alt={item.name}
              className="w-9 h-9 object-contain drop-shadow-xs"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling;
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
            <Icon className="w-6 h-6 hidden text-slate-600 dark:text-slate-400" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium border ${item.badgeColor}`}>
              {item.category}
            </span>
            <button
              type="button"
              aria-label={item.config?.enabled ? `Desactivar integración ${item.name}` : `Activar integración ${item.name}`}
              data-testid={`connector-toggle-${item.id}`}
              onClick={(e) => onToggleEnable(item.id, Boolean(item.config?.enabled), e)}
              title={item.config?.enabled ? 'Desactivar integración' : 'Activar integración'}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                item.config?.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  item.config?.enabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadgeStyle}`}>
              <span className={`w-2 h-2 rounded-full ${statusDotStyle}`} />
              {statusText}
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

        <div className="space-y-2 mb-4 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px]">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="font-medium text-slate-500">{t('integrations.architecture')}</span>
            <span className="font-mono text-slate-800 dark:text-slate-200">{item.protocol}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="font-medium text-slate-500">{t('integrations.synchronization')}</span>
            <span className="font-semibold text-brand-color">{item.syncMode}</span>
          </div>
          {item.config?.lastSyncAt && (
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-500">{t('integrations.lastContact')}</span>
              <span className="font-mono text-[10px]">
                {new Date(item.config.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>

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

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
        {item.endpointUrl && (
          <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-[11px] text-slate-500 font-mono truncate mr-2">
              {item.endpointUrl.split('/api/').pop()}
            </span>
            <button
              onClick={() => onCopy(item.endpointUrl!, item.id)}
              className="text-xs text-brand-color hover:underline flex items-center gap-1 font-semibold shrink-0"
            >
              {copiedKey === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === item.id ? 'Copiado' : 'Webhook'}</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={(e) => onTestConnection(item.id, e)}
            disabled={isTesting}
            className="flex-1 py-2 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1 transition-colors active:scale-95 disabled:opacity-50"
            title="Comprobar enlace directo con el servicio"
          >
            <Radio className={`w-3.5 h-3.5 text-brand-color ${isTesting ? 'animate-ping' : ''}`} />
            <span>{isTesting ? '...' : 'Test'}</span>
          </button>

          <button
            data-testid={`connector-logs-btn-${item.id}`}
            onClick={(e) => onOpenLogs(item, e)}
            className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors active:scale-95"
            title="Revisar registros de auditoría y traza de errores"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Logs</span>
          </button>

          {item.hasPlatformExplorer && (
            <button
              data-testid={`connector-explorer-btn-${item.id}`}
              onClick={(e) => onOpenExplorer(item, e)}
              className="py-2 px-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors active:scale-95"
              title="Explorar catálogo técnico y ejecutar flujos del conector"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Flujos</span>
            </button>
          )}

          {item.canSync && isConnected && (
            <button
              onClick={(e) => onSyncNow(item.id, e)}
              disabled={isSyncing}
              className="py-2 px-2.5 bg-brand-color/10 hover:bg-brand-color/20 text-brand-color rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              title="Sincronizar datos ahora"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? '...' : 'Sync'}</span>
            </button>
          )}

          <button
            data-testid={`connector-config-btn-${item.id}`}
            onClick={() => onOpenConfig(item.id)}
            className="py-2 px-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-opacity active:scale-95"
            title={isAdmin ? 'Configurar credenciales' : 'Ver parámetros configurados'}
          >
            {isAdmin ? <Settings2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isAdmin ? 'Configurar' : 'Ver'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
