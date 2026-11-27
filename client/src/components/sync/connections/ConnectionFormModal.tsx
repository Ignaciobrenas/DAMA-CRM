import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Plug, ShieldCheck, TestTube2, X, XCircle } from 'lucide-react';
import {
  CapabilityConfigFieldDto,
  SyncChannelDto,
  SyncChannelTypeDto,
  SyncConnectionDto,
  SyncEnvironmentDto,
  syncHubService,
} from '../../../services/sync-hub.service';

interface ConnectionFormModalProps {
  isOpen: boolean;
  editingConnection: SyncConnectionDto | null;
  environments: SyncEnvironmentDto[];
  channels: SyncChannelDto[];
  channelTypes: SyncChannelTypeDto[];
  capabilitySchema: Record<string, CapabilityConfigFieldDto[]>;
  onClose: () => void;
  onSaved: () => void;
}

const API_AUTH_TYPES = [
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic_auth', label: 'Basic Auth (Username / Password)' },
  { value: 'api_key', label: 'API Key (Custom Header)' },
  { value: 'api_key_body', label: 'API Key (JSON Body Field)' },
  { value: 'oauth_client_credentials', label: 'OAuth 2.0 Client Credentials' },
  { value: 'oauth_authorization_code', label: 'OAuth 2.0 Authorization Code' },
  { value: 'oauth_password', label: 'OAuth 2.0 Password / ERP Login' },
  { value: 'soap_session', label: 'SOAP Session' },
  { value: 'custom', label: 'Custom Headers' },
];

const TRANSPORT_TYPES = [
  { value: 'api', label: 'REST / GraphQL API' },
  { value: 'webhook', label: 'Webhook Endpoint' },
  { value: 'database', label: 'Database' },
  { value: 'sftp', label: 'SFTP' },
  { value: 'ftp', label: 'FTP' },
  { value: 'file', label: 'Local / Shared File' },
];

function readDotPath(obj: Record<string, any>, dotPath: string): any {
  return dotPath.split('.').reduce((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), obj);
}

function writeDotPath(obj: Record<string, any>, dotPath: string, value: any): Record<string, any> {
  const clone = structuredClone(obj || {});
  const parts = dotPath.split('.');
  let cursor = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cursor[parts[i]] || typeof cursor[parts[i]] !== 'object') {
      cursor[parts[i]] = {};
    }
    cursor = cursor[parts[i]];
  }
  cursor[parts[parts.length - 1]] = value;
  return clone;
}

export const ConnectionFormModal: React.FC<ConnectionFormModalProps> = ({
  isOpen,
  editingConnection,
  environments,
  channels,
  channelTypes,
  capabilitySchema,
  onClose,
  onSaved,
}) => {
  const [channelMode, setChannelMode] = useState<'new' | 'existing'>('new');
  const [existingChannelId, setExistingChannelId] = useState('');
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [channelTypeId, setChannelTypeId] = useState('');
  const [channelVersionId, setChannelVersionId] = useState('');

  const [environmentId, setEnvironmentId] = useState('');
  const [transportType, setTransportType] = useState<SyncConnectionDto['type']>('api');
  const [endpoint, setEndpoint] = useState('');
  const [rateLimitMax, setRateLimitMax] = useState(1000);
  const [credentials, setCredentials] = useState<Record<string, any>>({ auth_type: 'bearer' });
  const [config, setConfig] = useState<Record<string, any>>({});

  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTestResult(null);
    setErrorMessage(null);

    if (editingConnection) {
      setChannelMode('existing');
      setExistingChannelId(editingConnection.channelId);
      setEnvironmentId(editingConnection.environmentId);
      setTransportType(editingConnection.type);
      setEndpoint(editingConnection.endpoint);
      setRateLimitMax(editingConnection.rateLimitMax || 1000);
      setCredentials(editingConnection.credentials || { auth_type: 'bearer' });
      setConfig(editingConnection.config || {});
    } else {
      const defaultEnv = environments[0]?.id || '';
      const defaultType = channelTypes[0];
      setChannelMode('new');
      setExistingChannelId(channels[0]?.id || '');
      setChannelName('');
      setChannelDescription('');
      setChannelTypeId(defaultType?.id || '');
      setChannelVersionId(defaultType?.versions?.[0]?.id || '');
      setEnvironmentId(defaultEnv);
      setTransportType('api');
      setEndpoint('');
      setRateLimitMax(1000);
      setCredentials({ auth_type: 'bearer' });
      setConfig({});
    }
  }, [isOpen, editingConnection, environments, channelTypes, channels]);

  const activeChannelType = useMemo(() => {
    if (editingConnection) {
      return editingConnection.channel?.channelType;
    }
    if (channelMode === 'existing') {
      return channels.find((c) => c.id === existingChannelId)?.channelType;
    }
    return channelTypes.find((ct) => ct.id === channelTypeId);
  }, [editingConnection, channelMode, existingChannelId, channels, channelTypes, channelTypeId]);

  const availableVersions = useMemo(() => {
    const ct = channelTypes.find((t) => t.id === channelTypeId);
    return ct?.versions || [];
  }, [channelTypes, channelTypeId]);

  const activeCapabilityFields = useMemo(() => {
    const caps = activeChannelType?.capabilities;
    if (!caps) return [];
    const fields: Array<{ capability: string; field: CapabilityConfigFieldDto }> = [];
    for (const [capKey, capFields] of Object.entries(capabilitySchema)) {
      if (caps[capKey]) {
        for (const f of capFields) {
          fields.push({ capability: capKey, field: f });
        }
      }
    }
    return fields;
  }, [activeChannelType, capabilitySchema]);

  if (!isOpen) return null;

  const updateCredentialField = (key: string, value: any) => {
    setCredentials((prev) => ({ ...prev, [key]: value }));
  };

  const handleTestDraft = async () => {
    setTesting(true);
    setTestResult(null);
    setErrorMessage(null);
    try {
      const res = await syncHubService.testDraftConnection({
        endpoint,
        type: transportType,
        credentials,
        config,
        connectorKey: activeChannelType?.connectorKey || undefined,
      });
      setTestResult({
        success: Boolean(res.success),
        message: res.message || (res.success ? 'Conexión verificada correctamente' : 'Fallo en la verificación'),
      });
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Error al probar la conexión' });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);

    try {
      const res = editingConnection
        ? await syncHubService.updateConnection(editingConnection.id, {
            endpoint,
            type: transportType,
            environmentId,
            rateLimitMax: Number(rateLimitMax) || 1000,
            credentials,
            config,
          })
        : await syncHubService.createConnection({
            endpoint,
            type: transportType,
            environmentId,
            rateLimitMax: Number(rateLimitMax) || 1000,
            credentials,
            config,
            ...(channelMode === 'existing'
              ? { channelId: existingChannelId }
              : {
                  channel: {
                    name: channelName,
                    description: channelDescription,
                    typeId: channelTypeId,
                    versionId: channelVersionId,
                  },
                }),
          });

      if (!res.success) {
        setErrorMessage(res.message || 'No se pudo guardar la conexión');
        return;
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error inesperado al guardar la conexión');
    } finally {
      setSaving(false);
    }
  };

  const authType = credentials.auth_type || 'bearer';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 m-auto bg-slate-900/55 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Plug className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingConnection ? 'Editar Conexión' : 'Nueva Conexión de Canal'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Credenciales cifradas AES-256-GCM y configuración declarativa por capacidades
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Atomic Channel Creation or Existing Channel Selection */}
          {!editingConnection && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Canal Asociado
                </span>
                <div className="inline-flex rounded-lg bg-slate-200/80 dark:bg-slate-900 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setChannelMode('new')}
                    className={`px-3 py-1 rounded-md font-semibold transition-all ${
                      channelMode === 'new'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Crear Canal + Conexión
                  </button>
                  <button
                    type="button"
                    disabled={channels.length === 0}
                    onClick={() => setChannelMode('existing')}
                    className={`px-3 py-1 rounded-md font-semibold transition-all disabled:opacity-40 ${
                      channelMode === 'existing'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Canal Existente ({channels.length})
                  </button>
                </div>
              </div>

              {channelMode === 'existing' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Seleccionar Canal
                  </label>
                  <select
                    required
                    value={existingChannelId}
                    onChange={(e) => setExistingChannelId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {channels.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.name} ({ch.channelType?.name} {ch.versionType?.version})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nombre del Canal
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Ej: Tienda Shopify España, a3ERP Central..."
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tipo de Canal (Plataforma)
                    </label>
                    <select
                      required
                      value={channelTypeId}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        setChannelTypeId(nextId);
                        const ct = channelTypes.find((t) => t.id === nextId);
                        setChannelVersionId(ct?.versions?.[0]?.id || '');
                      }}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      {channelTypes.map((ct) => (
                        <option key={ct.id} value={ct.id}>
                          {ct.name} [{ct.type}]
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Versión de API / Protocolo
                    </label>
                    <select
                      required
                      value={channelVersionId}
                      onChange={(e) => setChannelVersionId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      {availableVersions.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.version} {v.description ? `— ${v.description}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transport, Environment & Endpoint */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Entorno Destino
              </label>
              <select
                required
                value={environmentId}
                onChange={(e) => setEnvironmentId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                {environments.map((env) => (
                  <option key={env.id} value={env.id}>
                    {env.name} ({env.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Transporte
              </label>
              <select
                value={transportType}
                onChange={(e) => setTransportType(e.target.value as SyncConnectionDto['type'])}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                {TRANSPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Endpoint / URL Base
              </label>
              <input
                required
                type="text"
                placeholder="https://tienda.myshopify.com o https://erp.miempresa.es:8443"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Credentials Section */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Autenticación y Credenciales
              </span>
              {editingConnection && (
                <span className="text-[11px] text-slate-500">
                  Los campos mostrados como *** conservan el secreto almacenado
                </span>
              )}
            </div>

            {transportType === 'api' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Esquema de Autenticación API
                  </label>
                  <select
                    value={authType}
                    onChange={(e) => updateCredentialField('auth_type', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {API_AUTH_TYPES.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>

                {authType === 'bearer' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Bearer Token
                    </label>
                    <input
                      type="password"
                      placeholder="shpat_... o JWT token"
                      value={credentials.token || ''}
                      onChange={(e) => updateCredentialField('token', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                )}

                {(authType === 'basic_auth' || authType === 'oauth_password' || authType === 'soap_session') && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Usuario / Consumer Key
                      </label>
                      <input
                        type="text"
                        value={credentials.username || ''}
                        onChange={(e) => updateCredentialField('username', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Contraseña / Consumer Secret
                      </label>
                      <input
                        type="password"
                        value={credentials.password || ''}
                        onChange={(e) => updateCredentialField('password', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </>
                )}

                {(authType === 'api_key' || authType === 'api_key_body') && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {authType === 'api_key' ? 'Nombre de Cabecera' : 'Campo en Body JSON'}
                      </label>
                      <input
                        type="text"
                        placeholder={authType === 'api_key' ? 'X-API-Key' : 'API_KEY'}
                        value={
                          authType === 'api_key'
                            ? credentials.header_name || ''
                            : credentials.body_field_name || ''
                        }
                        onChange={(e) =>
                          updateCredentialField(
                            authType === 'api_key' ? 'header_name' : 'body_field_name',
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Clave API (Secreta)
                      </label>
                      <input
                        type="password"
                        value={credentials.key || ''}
                        onChange={(e) => updateCredentialField('key', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </>
                )}

                {(authType === 'oauth_client_credentials' ||
                  authType === 'oauth_authorization_code' ||
                  authType === 'oauth_password') && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Token URL
                      </label>
                      <input
                        type="text"
                        placeholder="https://.../oauth/token"
                        value={credentials.token_url || ''}
                        onChange={(e) => updateCredentialField('token_url', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Client ID
                      </label>
                      <input
                        type="text"
                        value={credentials.client_id || ''}
                        onChange={(e) => updateCredentialField('client_id', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Client Secret
                      </label>
                      <input
                        type="password"
                        value={credentials.client_secret || ''}
                        onChange={(e) => updateCredentialField('client_secret', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {(transportType === 'database' || transportType === 'ftp' || transportType === 'sftp') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Host
                  </label>
                  <input
                    required
                    type="text"
                    value={credentials.host || ''}
                    onChange={(e) => updateCredentialField('host', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Puerto
                  </label>
                  <input
                    required
                    type="number"
                    value={credentials.port || (transportType === 'database' ? 5432 : 22)}
                    onChange={(e) => updateCredentialField('port', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Usuario
                  </label>
                  <input
                    required
                    type="text"
                    value={credentials.username || ''}
                    onChange={(e) => updateCredentialField('username', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={credentials.password || ''}
                    onChange={(e) => updateCredentialField('password', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                  />
                </div>
                {transportType === 'database' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Base de Datos
                    </label>
                    <input
                      required
                      type="text"
                      value={credentials.database || ''}
                      onChange={(e) => updateCredentialField('database', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                )}
              </div>
            )}

            {transportType === 'file' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ruta de Archivo
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="/var/sync/imports"
                    value={credentials.path || ''}
                    onChange={(e) => updateCredentialField('path', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Formato
                  </label>
                  <select
                    value={credentials.format || 'csv'}
                    onChange={(e) => updateCredentialField('format', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                  >
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                    <option value="xml">XML</option>
                    <option value="xlsx">XLSX</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Capability-Driven Configuration */}
          {activeCapabilityFields.length > 0 && (
            <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/25 border border-indigo-200/80 dark:border-indigo-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Configuración por Capacidades ({activeChannelType?.name})
                </span>
                <span className="text-[11px] text-indigo-600/80 dark:text-indigo-400">
                  Esquema dinámico del servidor
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeCapabilityFields.map(({ field }) => {
                  const val = readDotPath(config, field.path) ?? field.default;
                  return (
                    <div key={field.path} className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {field.label}
                      </label>
                      {field.type === 'select' && field.options ? (
                        <select
                          value={String(val)}
                          onChange={(e) => setConfig((prev) => writeDotPath(prev, field.path, e.target.value))}
                          className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                        >
                          {field.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'boolean' ? (
                        <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 pt-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(val)}
                            onChange={(e) =>
                              setConfig((prev) => writeDotPath(prev, field.path, e.target.checked))
                            }
                            className="rounded border-slate-300 text-blue-600"
                          />
                          <span>{field.description}</span>
                        </label>
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : 'text'}
                          value={val ?? ''}
                          onChange={(e) =>
                            setConfig((prev) =>
                              writeDotPath(
                                prev,
                                field.path,
                                field.type === 'number' ? Number(e.target.value) : e.target.value
                              )
                            )
                          }
                          className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                        />
                      )}
                      {field.type !== 'boolean' && (
                        <p className="text-[11px] text-slate-500">{field.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Inline Draft Probe Feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              disabled={testing || !endpoint.trim()}
              onClick={handleTestDraft}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              <TestTube2 className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Probando...' : 'Probar Conexión'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                {saving ? 'Guardando...' : editingConnection ? 'Guardar Cambios' : 'Crear Conexión'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
