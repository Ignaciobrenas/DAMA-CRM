import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Edit3,
  Globe,
  KeyRound,
  Plug,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import {
  CapabilityConfigFieldDto,
  SyncApiKeyDto,
  SyncChannelDto,
  SyncChannelTypeDto,
  SyncConnectionDto,
  SyncEnvironmentDto,
  syncHubService,
} from '../../../services/sync-hub.service';
import { useToast } from '../../../context/ToastContext';
import { ConnectionFormModal } from './ConnectionFormModal';
import { EnvironmentFormModal } from './EnvironmentFormModal';
import { ApiKeyFormModal } from './ApiKeyFormModal';

interface ConnectionsWorkspaceProps {
  isAdmin: boolean;
}

const STATUS_BADGES: Record<string, string> = {
  connected: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  disconnected: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  error: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
  warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  maintenance: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  degraded: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  unhealthy: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  expiring: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  expired: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
};

export const ConnectionsWorkspace: React.FC<ConnectionsWorkspaceProps> = ({ isAdmin }) => {
  const toast = useToast();
  const [subTab, setSubTab] = useState<'connections' | 'environments' | 'api-keys'>('connections');
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);

  const [connections, setConnections] = useState<SyncConnectionDto[]>([]);
  const [environments, setEnvironments] = useState<SyncEnvironmentDto[]>([]);
  const [channels, setChannels] = useState<SyncChannelDto[]>([]);
  const [channelTypes, setChannelTypes] = useState<SyncChannelTypeDto[]>([]);
  const [apiKeys, setApiKeys] = useState<SyncApiKeyDto[]>([]);
  const [capabilitySchema, setCapabilitySchema] = useState<Record<string, CapabilityConfigFieldDto[]>>({});

  const [envFilter, setEnvFilter] = useState<string>('all');
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<SyncConnectionDto | null>(null);
  const [envModalOpen, setEnvModalOpen] = useState(false);
  const [editingEnv, setEditingEnv] = useState<SyncEnvironmentDto | null>(null);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [conns, envs, chs, types, keys, schema] = await Promise.all([
        syncHubService.listConnections(),
        syncHubService.listEnvironments(),
        syncHubService.listChannels(),
        syncHubService.listChannelTypes(),
        syncHubService.listApiKeys(),
        syncHubService.getCapabilityConfigSchema(),
      ]);
      setConnections(conns);
      setEnvironments(envs);
      setChannels(chs);
      setChannelTypes(types);
      setApiKeys(keys);
      setCapabilitySchema(schema);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const res = await syncHubService.testConnection(id);
      if (res.success) {
        toast.success('Conexión verificada', res.message || 'Prueba completada');
      } else {
        toast.error('Error en la conexión', res.message || 'La prueba ha fallado');
      }
      await loadData();
    } finally {
      setTestingId(null);
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (!window.confirm('¿Eliminar esta conexión de forma permanente?')) return;
    const res = await syncHubService.deleteConnection(id);
    if (res.success) {
      toast.success('Conexión eliminada', 'Registro eliminado correctamente');
      await loadData();
    }
  };

  const handleCheckEnvHealth = async (id: string) => {
    const res = await syncHubService.checkEnvironmentHealth(id);
    if (res.success) {
      toast.success('Salud actualizada', `Estado: ${res.data?.summary?.health || 'healthy'}`);
      await loadData();
    }
  };

  const handleRenewKey = async (id: string) => {
    const res = await syncHubService.renewApiKey(id, { regenerateKey: true });
    if (res.success && res.data?.keyValue) {
      navigator.clipboard?.writeText(res.data.keyValue).catch(() => {});
      toast.success('Clave renovada y copiada', `Nueva máscara: ${res.data.keyMask}`);
      await loadData();
    }
  };

  const filteredConnections =
    envFilter === 'all'
      ? connections
      : connections.filter((c) => c.environmentId === envFilter);

  return (
    <div className="space-y-5">
      {/* Sub-navigation & Quick Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'connections', label: `Conexiones (${connections.length})`, icon: Plug },
            { id: 'environments', label: `Entornos (${environments.length})`, icon: Globe },
            { id: 'api-keys', label: `Claves API (${apiKeys.length})`, icon: KeyRound },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300 text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          {isAdmin && subTab === 'connections' && (
            <button
              onClick={() => {
                setEditingConnection(null);
                setConnectionModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Conexión</span>
            </button>
          )}
          {isAdmin && subTab === 'environments' && (
            <button
              onClick={() => {
                setEditingEnv(null);
                setEnvModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Entorno</span>
            </button>
          )}
          {isAdmin && subTab === 'api-keys' && (
            <button
              onClick={() => setApiKeyModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Clave API</span>
            </button>
          )}
        </div>
      </div>

      {/* Connections Tab */}
      {subTab === 'connections' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setEnvFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                envFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Todos los entornos
            </button>
            {environments.map((env) => (
              <button
                key={env.id}
                onClick={() => setEnvFilter(env.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  envFilter === env.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {env.name}
              </button>
            ))}
          </div>

          {filteredConnections.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Plug className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                No hay conexiones configuradas
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Crea una conexión vinculando un canal (Shopify, WooCommerce, PrestaShop, Sage 200, a3ERP...) a un entorno con credenciales cifradas y verificación en tiempo real.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredConnections.map((conn) => (
                <div
                  key={conn.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {conn.channel?.name || 'Canal sin nombre'}
                        </h4>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {conn.channel?.channelType?.name} {conn.channel?.versionType?.version}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                          {conn.environment?.name}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-500 truncate">{conn.endpoint}</p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize ${
                        STATUS_BADGES[conn.status] || STATUS_BADGES.disconnected
                      }`}
                    >
                      {conn.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Auth / Tipo</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {conn.type.toUpperCase()} {conn.credentials?.auth_type ? `· ${conn.credentials.auth_type}` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Latencia</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                        {conn.lastResponseTime != null ? `${conn.lastResponseTime} ms` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Disponibilidad</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                        {conn.uptimePercentage != null ? `${conn.uptimePercentage}%` : 'Sin pruebas'}
                      </span>
                    </div>
                  </div>

                  {conn.lastErrorMessage && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{conn.lastErrorMessage}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400">
                      {conn.lastTest ? `Última prueba: ${new Date(conn.lastTest).toLocaleString()}` : 'Sin probar todavía'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTestConnection(conn.id)}
                        disabled={testingId === conn.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-1"
                      >
                        <Activity className={`w-3.5 h-3.5 ${testingId === conn.id ? 'animate-spin' : ''}`} />
                        <span>Probar</span>
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setEditingConnection(conn);
                              setConnectionModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Editar conexión"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteConnection(conn.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Eliminar conexión"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Environments Tab */}
      {subTab === 'environments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {environments.map((env) => (
            <div
              key={env.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{env.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{env.description || 'Entorno operativo'}</p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${
                    STATUS_BADGES[env.health] || STATUS_BADGES.healthy
                  }`}
                >
                  {env.health}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Conexiones</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {env.connectedCount ?? 0} / {env.connectionCount ?? 0} activas
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Uptime</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {env.uptime || '100%'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleCheckEnvHealth(env.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Evaluar Salud</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditingEnv(env);
                      setEnvModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* API Keys Tab */}
      {subTab === 'api-keys' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          {apiKeys.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <KeyRound className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Sin claves API entrantes emitidas
              </p>
              <p className="text-xs text-slate-500">
                Genera credenciales con permisos granulares para webhooks y automatizaciones externas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Clave Enmascarada</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Ámbito</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {apiKeys.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{k.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{k.keyMask}</td>
                      <td className="px-4 py-3 uppercase font-semibold text-slate-500">{k.type}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {k.environment?.name || 'Global'} · {k.permissions.filter((p) => p.granted).length} permisos
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                            STATUS_BADGES[k.status] || STATUS_BADGES.active
                          }`}
                        >
                          {k.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleRenewKey(k.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 font-semibold flex items-center gap-1"
                            title="Regenerar y renovar"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Renovar</span>
                          </button>
                          {isAdmin && (
                            <button
                              onClick={async () => {
                                await syncHubService.deleteApiKey(k.id);
                                toast.success('Clave revocada', k.name);
                                loadData();
                              }}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Centered Modals */}
      <ConnectionFormModal
        isOpen={connectionModalOpen}
        editingConnection={editingConnection}
        environments={environments}
        channels={channels}
        channelTypes={channelTypes}
        capabilitySchema={capabilitySchema}
        onClose={() => setConnectionModalOpen(false)}
        onSaved={loadData}
      />
      <EnvironmentFormModal
        isOpen={envModalOpen}
        editingEnvironment={editingEnv}
        onClose={() => setEnvModalOpen(false)}
        onSaved={loadData}
      />
      <ApiKeyFormModal
        isOpen={apiKeyModalOpen}
        environments={environments}
        connections={connections}
        onClose={() => setApiKeyModalOpen(false)}
        onCreated={loadData}
      />
    </div>
  );
};
