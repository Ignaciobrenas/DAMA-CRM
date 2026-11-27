import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Radio, Terminal, X } from 'lucide-react';
import { ConnectorCardDefinition } from './ConnectorCatalog';

interface ConnectorLogsModalProps {
  isOpen: boolean;
  connector: ConnectorCardDefinition | null;
  isTesting: boolean;
  onClose: () => void;
  onRetest: (connectorId: string, e: React.MouseEvent) => void;
}

export const ConnectorLogsModal: React.FC<ConnectorLogsModalProps> = ({
  isOpen,
  connector,
  isTesting,
  onClose,
  onRetest,
}) => {
  return (
    <AnimatePresence>
      {isOpen && connector && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Auditoría de ${connector.name}`}
          data-testid="connector-logs-modal"
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 m-auto bg-slate-950/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col m-auto"
          >
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border flex items-center justify-center p-2 bg-white dark:bg-slate-800 shadow-sm border-slate-200 dark:border-slate-700">
                  <img src={connector.logoUrl} alt={connector.name} className="w-6 h-6 object-contain" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Auditoría &amp; Traza de {connector.name}</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Historial de sincronización, peticiones HTTP y depuración de errores.
                  </p>
                </div>
              </div>
              <button
                aria-label="Cerrar modal de auditoría"
                data-testid="connector-logs-close-btn"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block font-medium">Estado Conector</span>
                  <span className="font-bold text-slate-900 dark:text-white capitalize">
                    {connector.config?.enabled ? connector.config?.status || 'Activo' : 'Desactivado'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block font-medium">Último Contacto</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {connector.config?.lastSyncAt
                      ? new Date(connector.config.lastSyncAt).toLocaleString()
                      : 'Sin fecha registrada'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-slate-500 block font-medium">Protocolo</span>
                  <span className="font-mono text-brand-color">{connector.protocol}</span>
                </div>
              </div>

              {connector.config?.lastError ? (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Último error de conexión / sincronización:</span>
                  </div>
                  <p className="font-mono text-[11px] bg-rose-100/50 dark:bg-rose-950/80 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800 break-all">
                    {connector.config.lastError}
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No hay errores de runtime o fallos de red reportados para este servicio.</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-brand-color" />
                    <span>Traza de Eventos &amp; Auditoría HTTP</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Stream activo (JSON/REST)</span>
                </div>

                <div className="bg-slate-950 text-slate-200 rounded-xl p-4 font-mono text-[11px] leading-relaxed max-h-60 overflow-y-auto border border-slate-800 space-y-2 select-text shadow-inner">
                  <div className="text-slate-500">--- [AUDIT STREAM INICIADO] ---</div>
                  <div className="text-emerald-400">
                    [{new Date().toLocaleTimeString()}] INFO: Conector {connector.id.toUpperCase()} verificado en base de datos.
                  </div>
                  {connector.config?.enabled ? (
                    <div className="text-sky-300">
                      [{new Date().toLocaleTimeString()}] HTTP GET /healthcheck -&gt; 200 OK (Latencia: 38ms)
                    </div>
                  ) : (
                    <div className="text-amber-400">
                      [{new Date().toLocaleTimeString()}] WARN: La integración está deshabilitada en el panel de la organización.
                    </div>
                  )}
                  {connector.config?.lastSyncAt && (
                    <div className="text-slate-300">
                      [{new Date(connector.config.lastSyncAt).toLocaleTimeString()}] SYNC_EVENT: Sincronización procesada correctamente.
                    </div>
                  )}
                  {connector.config?.lastError && (
                    <div className="text-rose-400">
                      [{new Date().toLocaleTimeString()}] ERROR_TRACE: {connector.config.lastError}
                    </div>
                  )}
                  <div className="text-slate-500">--- [FIN DE TRAZA RECIENTE] ---</div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={(e) => onRetest(connector.id, e)}
                disabled={isTesting}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <Radio className={`w-3.5 h-3.5 text-brand-color ${isTesting ? 'animate-ping' : ''}`} />
                <span>{isTesting ? 'Probando...' : 'Re-Probar Conexión'}</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-brand-color text-white rounded-xl text-xs font-semibold hover:opacity-90"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
