import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Lock, Plug, Radio, ShieldAlert, X } from 'lucide-react';
import { IntegrationsEndpoints } from '../../services/integrations.service';
import { EcosystemConfigFields } from './fields/EcosystemConfigFields';
import { PlatformConfigFields } from './fields/PlatformConfigFields';

interface ConnectorConfigModalProps {
  isOpen: boolean;
  connectorId: string | null;
  config: Record<string, any>;
  setConfig: (next: Record<string, any>) => void;
  isAdmin: boolean;
  testing: boolean;
  testResult: { success: boolean; message: string; details?: any } | null;
  endpoints: IntegrationsEndpoints | null;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  onTest: () => void;
  onSave: () => void;
  onClose: () => void;
  t: (key: string, fallback?: string) => string;
}

const CORE_PLATFORM_IDS = new Set(['a3erp', 'sage_200', 'prestashop', 'shopify', 'woocommerce']);

export const ConnectorConfigModal: React.FC<ConnectorConfigModalProps> = ({
  isOpen,
  connectorId,
  config,
  setConfig,
  isAdmin,
  testing,
  testResult,
  endpoints,
  copiedKey,
  onCopy,
  onTest,
  onSave,
  onClose,
  t,
}) => {
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const toggleShowSecret = (field: string) =>
    setShowSecret((prev) => ({ ...prev, [field]: !prev[field] }));

  return (
    <AnimatePresence>
      {isOpen && connectorId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Configuración de ${connectorId}`}
          data-testid="connector-config-modal"
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 m-auto bg-slate-950/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col m-auto"
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-color/10 text-brand-color flex items-center justify-center font-bold">
                  <Plug className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                    <span>Configuración de {connectorId.replace('_', ' ').toUpperCase()}</span>
                    {isAdmin ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold">
                        Administrador
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
                aria-label="Cerrar modal de configuración"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 flex-1">
              {!isAdmin && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold">{t('integrations.protectedConfigAccess')}</p>
                    <p className="opacity-90">
                      Solo los usuarios con rol de Administrador o permisos de gestión de integraciones
                      pueden visualizar o alterar las credenciales confidenciales de este servicio.
                    </p>
                  </div>
                </div>
              )}

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
                    checked={config.enabled ?? false}
                    onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                    className="sr-only peer disabled:cursor-not-allowed"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-color peer-disabled:opacity-50" />
                </label>
              </div>

              {CORE_PLATFORM_IDS.has(connectorId) ? (
                <PlatformConfigFields
                  connectorId={connectorId}
                  config={config}
                  setConfig={setConfig}
                  isAdmin={isAdmin}
                  showSecret={showSecret}
                  toggleShowSecret={toggleShowSecret}
                  endpoints={endpoints}
                  copiedKey={copiedKey}
                  onCopy={onCopy}
                  t={t}
                />
              ) : (
                <EcosystemConfigFields
                  connectorId={connectorId}
                  config={config}
                  setConfig={setConfig}
                  isAdmin={isAdmin}
                  showSecret={showSecret}
                  toggleShowSecret={toggleShowSecret}
                  endpoints={endpoints}
                  copiedKey={copiedKey}
                  onCopy={onCopy}
                  t={t}
                />
              )}

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
                  <div className="space-y-1 flex-1 min-w-0">
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

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                onClick={onTest}
                disabled={testing || !isAdmin}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Radio className={`w-3.5 h-3.5 ${testing ? 'animate-ping' : ''}`} />
                <span>{testing ? 'Comprobando...' : 'Probar Conexión'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {isAdmin ? 'Cancelar' : 'Cerrar'}
                </button>
                {isAdmin && (
                  <button
                    data-testid="connector-save-btn"
                    onClick={onSave}
                    disabled={testing}
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
  );
};
