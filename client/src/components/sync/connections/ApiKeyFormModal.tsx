import React, { useState } from 'react';
import { Check, Copy, KeyRound, X } from 'lucide-react';
import {
  SyncConnectionDto,
  SyncEnvironmentDto,
  syncHubService,
} from '../../../services/sync-hub.service';

interface ApiKeyFormModalProps {
  isOpen: boolean;
  environments: SyncEnvironmentDto[];
  connections: SyncConnectionDto[];
  onClose: () => void;
  onCreated: () => void;
}

const DEFAULT_SCOPES = [
  { category: 'sync', resource: 'tasks', action: 'execute', granted: true },
  { category: 'sync', resource: 'connections', action: 'read', granted: true },
  { category: 'sync', resource: 'operations', action: 'write', granted: true },
  { category: 'webhooks', resource: 'callbacks', action: 'post', granted: true },
];

export const ApiKeyFormModal: React.FC<ApiKeyFormModalProps> = ({
  isOpen,
  environments,
  connections,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'api_key' | 'bearer' | 'webhook' | 'oauth'>('api_key');
  const [environmentId, setEnvironmentId] = useState('');
  const [connectionId, setConnectionId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [scopes, setScopes] = useState(DEFAULT_SCOPES);
  const [saving, setSaving] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await syncHubService.createApiKey({
        name,
        type,
        environmentId: environmentId || undefined,
        connectionId: connectionId || undefined,
        expiresAt: expiresAt || undefined,
        permissions: scopes,
      });
      if (res.success && res.data?.keyValue) {
        setRevealedKey(res.data.keyValue);
        onCreated();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCopyKey = () => {
    if (!revealedKey) return;
    navigator.clipboard.writeText(revealedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAndClose = () => {
    setName('');
    setRevealedKey(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 m-auto bg-slate-900/55 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Emitir Clave API Entrante
              </h3>
              <p className="text-xs text-slate-500">
                Credencial segura para orquestadores y webhooks entrantes
              </p>
            </div>
          </div>
          <button type="button" onClick={resetAndClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {revealedKey ? (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Clave generada — guárdala ahora (solo se muestra una vez)
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2.5 rounded-lg bg-white dark:bg-slate-950 border border-emerald-200 dark:border-emerald-800 text-xs font-mono break-all text-slate-900 dark:text-emerald-200">
                  {revealedKey}
                </code>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="px-3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copiada' : 'Copiar'}</span>
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={resetAndClose}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              >
                Finalizar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre Descriptivo
              </label>
              <input
                required
                type="text"
                placeholder="Ej: Orquestador Nocturno ERP"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Credencial
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                >
                  <option value="api_key">API Key</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="webhook">Webhook Token</option>
                  <option value="oauth">OAuth Service</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha de Expiración (Opcional)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Entorno (Opcional)
                </label>
                <select
                  value={environmentId}
                  onChange={(e) => setEnvironmentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                >
                  <option value="">Todos los entornos</option>
                  {environments.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Conexión (Opcional)
                </label>
                <select
                  value={connectionId}
                  onChange={(e) => setConnectionId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                >
                  <option value="">Sin restricción de conexión</option>
                  {connections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.channel?.name || c.endpoint}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Permisos Concedidos
              </span>
              <div className="grid grid-cols-2 gap-2">
                {scopes.map((sc, idx) => (
                  <label
                    key={`${sc.resource}-${sc.action}`}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={sc.granted}
                      onChange={(e) =>
                        setScopes((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, granted: e.target.checked } : item))
                        )
                      }
                    />
                    <span className="font-mono text-[11px]">
                      {sc.category}.{sc.resource}.{sc.action}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={resetAndClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]"
              >
                {saving ? 'Generando...' : 'Generar Clave API'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
