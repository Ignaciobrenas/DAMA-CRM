import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Workflow, X } from 'lucide-react';
import {
  SyncChannelTypeDto,
  SyncTaskCategoryDto,
  SyncTaskParameterDto,
  SyncTaskTypeDto,
  syncHubService,
} from '../../../services/sync-hub.service';

interface TaskTypeFormModalProps {
  isOpen: boolean;
  editingTaskType: SyncTaskTypeDto | null;
  categories: SyncTaskCategoryDto[];
  channelTypes: SyncChannelTypeDto[];
  onClose: () => void;
  onSaved: () => void;
}

const ENTITY_TYPES = [
  'products',
  'orders',
  'stock',
  'prices',
  'customers',
  'companies',
  'contacts',
  'invoices',
  'delivery_notes',
  'shipments',
  'returns',
  'categories',
];

const OPERATION_TYPES = [
  'incremental',
  'full_sync',
  'bulk_import',
  'bulk_export',
  'api_sync',
  'reconciliation',
];

export const TaskTypeFormModal: React.FC<TaskTypeFormModalProps> = ({
  isOpen,
  editingTaskType,
  categories,
  channelTypes,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dataEntityType, setDataEntityType] = useState('products');
  const [operationType, setOperationType] = useState('incremental');
  const [direction, setDirection] = useState<'import' | 'export' | 'bidirectional'>('bidirectional');
  const [workflowMode, setWorkflowMode] = useState<'connector' | 'webhook'>('connector');
  const [connectorKey, setConnectorKey] = useState('');
  const [operationName, setOperationName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [supportedChannelTypeIds, setSupportedChannelTypeIds] = useState<string[]>([]);
  const [parameters, setParameters] = useState<SyncTaskParameterDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingTaskType) {
      setName(editingTaskType.name);
      setDescription(editingTaskType.description || '');
      setCategoryId(editingTaskType.categoryId);
      setDataEntityType(editingTaskType.dataEntityType);
      setOperationType(editingTaskType.operationType);
      setDirection(editingTaskType.direction);
      setWorkflowMode(editingTaskType.workflowConfig?.mode || 'connector');
      setConnectorKey(editingTaskType.workflowConfig?.connectorKey || '');
      setOperationName(editingTaskType.workflowConfig?.operation || '');
      setWebhookUrl(editingTaskType.workflowConfig?.webhookUrl || '');
      setSupportedChannelTypeIds(editingTaskType.supportedChannelTypeIds || []);
      setParameters(editingTaskType.parameters || []);
    } else {
      setName('');
      setDescription('');
      setCategoryId(categories[0]?.id || '');
      setDataEntityType('products');
      setOperationType('incremental');
      setDirection('bidirectional');
      setWorkflowMode('connector');
      setConnectorKey('');
      setOperationName('');
      setWebhookUrl('');
      setSupportedChannelTypeIds([]);
      setParameters([]);
    }
  }, [isOpen, editingTaskType, categories]);

  if (!isOpen) return null;

  const addParameterRow = () => {
    setParameters((prev) => [
      ...prev,
      {
        name: '',
        key: '',
        type: 'string',
        required: false,
        defaultValue: '',
        description: '',
      },
    ]);
  };

  const updateParameter = (index: number, patch: Partial<SyncTaskParameterDto>) => {
    setParameters((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const removeParameter = (index: number) => {
    setParameters((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleSupportedChannelType = (id: string) => {
    setSupportedChannelTypeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name,
        description,
        categoryId,
        dataEntityType,
        operationType,
        direction,
        supportedChannelTypeIds,
        workflowConfig:
          workflowMode === 'webhook'
            ? { mode: 'webhook', webhookUrl }
            : {
                mode: 'connector',
                connectorKey: connectorKey || undefined,
                operation: operationName || undefined,
              },
        parameters: parameters.filter((p) => p.name.trim() && p.key.trim()),
      };

      const res = editingTaskType
        ? await syncHubService.updateTaskType(editingTaskType.id, payload)
        : await syncHubService.createTaskType(payload);

      if (!res.success) {
        setError(res.message || 'No se pudo guardar el tipo de tarea');
        return;
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 m-auto bg-slate-900/55 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
              <Workflow className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingTaskType ? 'Editar Definición de Tarea' : 'Nueva Definición de Tarea (Task Type)'}
              </h3>
              <p className="text-xs text-slate-500">Plantilla reutilizable con parámetros dinámicos y canales compatibles</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
              <input
                required
                type="text"
                placeholder="Ej: Exportar Catálogo a Shopify B2B"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Entidad de Negocio</label>
              <select
                value={dataEntityType}
                onChange={(e) => setDataEntityType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              >
                {ENTITY_TYPES.map((ent) => (
                  <option key={ent} value={ent}>
                    {ent}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Operación</label>
                <select
                  value={operationType}
                  onChange={(e) => setOperationType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                >
                  {OPERATION_TYPES.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Dirección</label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                >
                  <option value="import">Import</option>
                  <option value="export">Export</option>
                  <option value="bidirectional">Bidirectional</option>
                </select>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              />
            </div>
          </div>

          {/* Workflow Binding */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
              Motor de Ejecución
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Modo</label>
                <select
                  value={workflowMode}
                  onChange={(e) => setWorkflowMode(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                >
                  <option value="connector">Conector Modular DAMA</option>
                  <option value="webhook">Orquestador Webhook Externo</option>
                </select>
              </div>

              {workflowMode === 'connector' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Conector</label>
                    <select
                      value={connectorKey}
                      onChange={(e) => setConnectorKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                    >
                      <option value="">Resolver según conexión</option>
                      <option value="a3erp">a3ERP</option>
                      <option value="sage_200">Sage 200</option>
                      <option value="prestashop">PrestaShop</option>
                      <option value="shopify">Shopify</option>
                      <option value="woocommerce">WooCommerce</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Operación Conector
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: ensure_customer, sync_stock"
                      value={operationName}
                      onChange={(e) => setOperationName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Webhook URL
                  </label>
                  <input
                    required
                    type="url"
                    placeholder="https://orchestrator.empresa.es/webhook/sync"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Compatible Channel Types */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
              Tipos de Canal Compatibles
            </span>
            <div className="flex flex-wrap gap-2">
              {channelTypes.map((ct) => {
                const selected = supportedChannelTypeIds.includes(ct.id);
                return (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => toggleSupportedChannelType(ct.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      selected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {ct.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Parameters Builder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Parámetros de Ejecución ({parameters.length})
              </span>
              <button
                type="button"
                onClick={addParameterRow}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Parámetro</span>
              </button>
            </div>

            {parameters.map((param, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 items-center"
              >
                <input
                  placeholder="Etiqueta (Ej: Lote)"
                  value={param.name}
                  onChange={(e) => updateParameter(idx, { name: e.target.value })}
                  className="col-span-3 px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                />
                <input
                  placeholder="clave_param"
                  value={param.key}
                  onChange={(e) => updateParameter(idx, { key: e.target.value })}
                  className="col-span-3 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                />
                <select
                  value={param.type}
                  onChange={(e) => updateParameter(idx, { type: e.target.value as any })}
                  className="col-span-2 px-2 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="select">select</option>
                  <option value="json">json</option>
                </select>
                <input
                  placeholder="Valor defecto"
                  value={param.defaultValue ?? ''}
                  onChange={(e) => updateParameter(idx, { defaultValue: e.target.value })}
                  className="col-span-2 px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                />
                <label className="col-span-1 flex items-center justify-center gap-1 text-[10px]">
                  <input
                    type="checkbox"
                    checked={Boolean(param.required)}
                    onChange={(e) => updateParameter(idx, { required: e.target.checked })}
                  />
                  Req
                </label>
                <button
                  type="button"
                  onClick={() => removeParameter(idx)}
                  className="col-span-1 p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 flex justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]"
            >
              {saving ? 'Guardando...' : 'Guardar Definición'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
