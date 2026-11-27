import React, { useCallback, useEffect, useState } from 'react';
import {
  Copy,
  Database,
  Edit3,
  FolderKanban,
  Layers,
  Lock,
  Plus,
  RefreshCw,
  Tag,
  Trash2,
  Workflow,
} from 'lucide-react';
import {
  SyncChannelDto,
  SyncChannelTypeDto,
  SyncMetadataDefinitionDto,
  SyncTaskCategoryDto,
  SyncTaskTypeDto,
  syncHubService,
} from '../../../services/sync-hub.service';
import { useToast } from '../../../context/ToastContext';
import { ChannelTypeFormModal } from './ChannelTypeFormModal';
import { TaskTypeFormModal } from './TaskTypeFormModal';

interface DefinitionsWorkspaceProps {
  isAdmin: boolean;
}

export const DefinitionsWorkspace: React.FC<DefinitionsWorkspaceProps> = ({ isAdmin }) => {
  const toast = useToast();
  const [subTab, setSubTab] = useState<'task-types' | 'task-categories' | 'channel-types' | 'metadata'>('task-types');
  const [loading, setLoading] = useState(true);

  const [channelTypes, setChannelTypes] = useState<SyncChannelTypeDto[]>([]);
  const [channels, setChannels] = useState<SyncChannelDto[]>([]);
  const [categories, setCategories] = useState<SyncTaskCategoryDto[]>([]);
  const [taskTypes, setTaskTypes] = useState<SyncTaskTypeDto[]>([]);
  const [metadataDefs, setMetadataDefs] = useState<SyncMetadataDefinitionDto[]>([]);

  const [channelTypeModalOpen, setChannelTypeModalOpen] = useState(false);
  const [editingChannelType, setEditingChannelType] = useState<SyncChannelTypeDto | null>(null);
  const [taskTypeModalOpen, setTaskTypeModalOpen] = useState(false);
  const [editingTaskType, setEditingTaskType] = useState<SyncTaskTypeDto | null>(null);

  // Quick inline forms for Version, Category, Metadata
  const [versionInputs, setVersionInputs] = useState<Record<string, string>>({});
  const [newCategory, setNewCategory] = useState({ key: '', name: '', description: '' });
  const [newMeta, setNewMeta] = useState({
    channelId: '',
    entityType: 'product',
    key: '',
    label: '',
    dataType: 'string',
    namespace: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [types, chs, cats, tts, metas] = await Promise.all([
        syncHubService.listChannelTypes(),
        syncHubService.listChannels(),
        syncHubService.listTaskCategories(),
        syncHubService.listTaskTypes(),
        syncHubService.listMetadataDefinitions(),
      ]);
      setChannelTypes(types);
      setChannels(chs);
      setCategories(cats);
      setTaskTypes(tts);
      setMetadataDefs(metas);
      if (!newMeta.channelId && chs.length > 0) {
        setNewMeta((prev) => ({ ...prev, channelId: chs[0].id }));
      }
    } finally {
      setLoading(false);
    }
  }, [newMeta.channelId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddVersion = async (typeId: string) => {
    const version = (versionInputs[typeId] || '').trim();
    if (!version) return;
    const res = await syncHubService.createChannelVersion({ typeId, version });
    if (res.success) {
      toast.success('Versión registrada', version);
      setVersionInputs((prev) => ({ ...prev, [typeId]: '' }));
      loadData();
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await syncHubService.createTaskCategory(newCategory);
    if (res.success) {
      toast.success('Categoría creada', newCategory.name);
      setNewCategory({ key: '', name: '', description: '' });
      loadData();
    }
  };

  const handleCreateMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await syncHubService.createMetadataDefinition(newMeta);
    if (res.success) {
      toast.success('Metadato creado', newMeta.key);
      setNewMeta((prev) => ({ ...prev, key: '', label: '', namespace: '' }));
      loadData();
    }
  };

  return (
    <div className="space-y-5">
      {/* Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'task-types', label: `Tipos de Tarea (${taskTypes.length})`, icon: Workflow },
            { id: 'task-categories', label: `Categorías (${categories.length})`, icon: FolderKanban },
            { id: 'channel-types', label: `Tipos de Canal (${channelTypes.length})`, icon: Layers },
            { id: 'metadata', label: `Metadatos (${metadataDefs.length})`, icon: Database },
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

          {isAdmin && subTab === 'task-types' && (
            <button
              onClick={() => {
                setEditingTaskType(null);
                setTaskTypeModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Tipo de Tarea</span>
            </button>
          )}
          {isAdmin && subTab === 'channel-types' && (
            <button
              onClick={() => {
                setEditingChannelType(null);
                setChannelTypeModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Tipo de Canal</span>
            </button>
          )}
        </div>
      </div>

      {/* Task Types Tab */}
      {subTab === 'task-types' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {taskTypes.map((tt) => (
            <div
              key={tt.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{tt.name}</h4>
                    {tt.isSystem && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        Sistema
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                      {tt.dataEntityType} · {tt.direction}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{tt.description}</p>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    tt.isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                  }`}
                >
                  {tt.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300">
                  {tt.operationType}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {tt.parameters.length} parámetros
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Usado {tt.usageCount} veces
                </span>
              </div>

              {tt.parameters.length > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex flex-wrap gap-1.5">
                  {tt.parameters.map((p) => (
                    <span
                      key={p.key}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-600 dark:text-slate-300"
                    >
                      {p.key}:{p.type}
                      {p.required ? '*' : ''}
                    </span>
                  ))}
                </div>
              )}

              {isAdmin && (
                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={async () => {
                      const res = await syncHubService.duplicateTaskType(tt.id);
                      if (res.success) {
                        toast.success('Plantilla duplicada', res.data?.name || tt.name);
                        loadData();
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicar</span>
                  </button>
                  {!tt.isSystem && (
                    <>
                      <button
                        onClick={() => {
                          setEditingTaskType(tt);
                          setTaskTypeModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          const res = await syncHubService.deleteTaskType(tt.id);
                          if (res.success) {
                            toast.success('Tipo eliminado', tt.name);
                            loadData();
                          }
                        }}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Task Categories Tab */}
      {subTab === 'task-categories' && (
        <div className="space-y-4">
          {isAdmin && (
            <form
              onSubmit={handleCreateCategory}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Clave</label>
                <input
                  required
                  placeholder="ej: pricing"
                  value={newCategory.key}
                  onChange={(e) => setNewCategory((p) => ({ ...p, key: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Nombre</label>
                <input
                  required
                  placeholder="Ej: Tarifas Especiales"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Descripción</label>
                <input
                  placeholder="Descripción breve"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
              >
                Añadir Categoría
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{cat.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {cat.key}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{cat.description}</p>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>{cat.taskTypeCount ?? 0} tipos de tarea</span>
                  {isAdmin && (cat.taskTypeCount ?? 0) === 0 && (
                    <button
                      onClick={async () => {
                        await syncHubService.deleteTaskCategory(cat.id);
                        loadData();
                      }}
                      className="text-rose-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Channel Types & Versions Tab */}
      {subTab === 'channel-types' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {channelTypes.map((ct) => {
            const enabledCaps = Object.entries(ct.capabilities || {})
              .filter(([, v]) => Boolean(v))
              .map(([k]) => k);
            return (
              <div
                key={ct.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{ct.name}</h4>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                        {ct.type}
                      </span>
                      {ct.connectorKey && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                          connector:{ct.connectorKey}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{ct.description}</p>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setEditingChannelType(ct);
                        setChannelTypeModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Capabilities */}
                <div className="flex flex-wrap gap-1">
                  {enabledCaps.map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                    >
                      {cap}
                    </span>
                  ))}
                </div>

                {/* Versions + Inline Add */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Versiones Registradas ({ct.versions.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ct.versions.map((v) => (
                      <span
                        key={v.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-200"
                      >
                        <Tag className="w-3 h-3 text-blue-500" />
                        {v.version}
                      </span>
                    ))}
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Nueva versión (ej: 2026-10)"
                        value={versionInputs[ct.id] || ''}
                        onChange={(e) =>
                          setVersionInputs((prev) => ({ ...prev, [ct.id]: e.target.value }))
                        }
                        className="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddVersion(ct.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      >
                        + Versión
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Channel Metadata Definitions Tab */}
      {subTab === 'metadata' && (
        <div className="space-y-4">
          {isAdmin && channels.length > 0 && (
            <form
              onSubmit={handleCreateMetadata}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Canal</label>
                <select
                  required
                  value={newMeta.channelId}
                  onChange={(e) => setNewMeta((p) => ({ ...p, channelId: e.target.value }))}
                  className="w-full px-2.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Entidad</label>
                <select
                  value={newMeta.entityType}
                  onChange={(e) => setNewMeta((p) => ({ ...p, entityType: e.target.value }))}
                  className="w-full px-2.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="product">product</option>
                  <option value="customer">customer</option>
                  <option value="company">company</option>
                  <option value="order">order</option>
                  <option value="invoice">invoice</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Clave</label>
                <input
                  required
                  placeholder="_billing_nif / sage.code"
                  value={newMeta.key}
                  onChange={(e) => setNewMeta((p) => ({ ...p, key: e.target.value }))}
                  className="w-full px-2.5 py-2 rounded-xl text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Etiqueta</label>
                <input
                  required
                  placeholder="NIF Facturación"
                  value={newMeta.label}
                  onChange={(e) => setNewMeta((p) => ({ ...p, label: e.target.value }))}
                  className="w-full px-2.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo</label>
                <select
                  value={newMeta.dataType}
                  onChange={(e) => setNewMeta((p) => ({ ...p, dataType: e.target.value }))}
                  className="w-full px-2.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="json">json</option>
                  <option value="date">date</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
              >
                + Metadato
              </button>
            </form>
          )}

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            {metadataDefs.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Database className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Sin definiciones de metadatos registradas
                </p>
                <p className="text-xs text-slate-500">
                  {channels.length === 0
                    ? 'Primero crea al menos un canal en la pestaña "Conexiones & Entornos".'
                    : 'Declara metafields B2B (ej. sage.customer_code) o campos fiscales (_billing_nif) por canal.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3">Canal</th>
                    <th className="px-4 py-3">Entidad</th>
                    <th className="px-4 py-3">Clave</th>
                    <th className="px-4 py-3">Etiqueta</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {metadataDefs.map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-3 font-semibold">{m.channel?.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{m.entityType}</td>
                      <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">{m.key}</td>
                      <td className="px-4 py-3">{m.label}</td>
                      <td className="px-4 py-3 font-mono">{m.dataType}</td>
                      <td className="px-4 py-3 text-right">
                        {isAdmin && (
                          <button
                            onClick={async () => {
                              await syncHubService.deleteMetadataDefinition(m.id);
                              loadData();
                            }}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <ChannelTypeFormModal
        isOpen={channelTypeModalOpen}
        editingType={editingChannelType}
        onClose={() => setChannelTypeModalOpen(false)}
        onSaved={loadData}
      />
      <TaskTypeFormModal
        isOpen={taskTypeModalOpen}
        editingTaskType={editingTaskType}
        categories={categories}
        channelTypes={channelTypes}
        onClose={() => setTaskTypeModalOpen(false)}
        onSaved={loadData}
      />
    </div>
  );
};
