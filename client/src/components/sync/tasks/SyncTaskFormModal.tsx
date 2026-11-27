import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, X } from 'lucide-react';
import {
  SyncChannelDto,
  SyncConnectionDto,
  SyncTaskDto,
  SyncTaskTypeDto,
  syncHubService,
} from '../../../services/sync-hub.service';

interface SyncTaskFormModalProps {
  isOpen: boolean;
  editingTask: SyncTaskDto | null;
  taskTypes: SyncTaskTypeDto[];
  channels: SyncChannelDto[];
  connections: SyncConnectionDto[];
  onClose: () => void;
  onSaved: () => void;
}

const CRON_PRESETS = [
  { label: 'Cada 5 minutos', value: '*/5 * * * *' },
  { label: 'Cada 15 minutos', value: '*/15 * * * *' },
  { label: 'Cada 30 minutos', value: '*/30 * * * *' },
  { label: 'Cada hora', value: '0 * * * *' },
  { label: 'Diario (02:00)', value: '0 2 * * *' },
];

export const SyncTaskFormModal: React.FC<SyncTaskFormModalProps> = ({
  isOpen,
  editingTask,
  taskTypes,
  channels,
  connections,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [taskTypeId, setTaskTypeId] = useState('');
  const [executionType, setExecutionType] = useState<'cron' | 'manual' | 'webhook'>('cron');
  const [schedule, setSchedule] = useState('0 * * * *');
  const [enabled, setEnabled] = useState(true);
  const [sourceChannelId, setSourceChannelId] = useState('');
  const [targetChannelId, setTargetChannelId] = useState('');
  const [sourceConnectionId, setSourceConnectionId] = useState('');
  const [targetConnectionId, setTargetConnectionId] = useState('');
  const [configuration, setConfiguration] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingTask) {
      setName(editingTask.name);
      setDescription(editingTask.description || '');
      setTaskTypeId(editingTask.taskTypeId);
      setExecutionType(editingTask.executionType === 'quick' ? 'manual' : editingTask.executionType);
      setSchedule(editingTask.schedule);
      setEnabled(editingTask.enabled);
      setSourceChannelId(editingTask.sourceChannelId || '');
      setTargetChannelId(editingTask.targetChannelId || '');
      setSourceConnectionId(editingTask.sourceConnectionId || '');
      setTargetConnectionId(editingTask.targetConnectionId || '');
      setConfiguration(editingTask.configuration || {});
    } else {
      const firstType = taskTypes[0];
      setName('');
      setDescription('');
      setTaskTypeId(firstType?.id || '');
      setExecutionType('cron');
      setSchedule('0 * * * *');
      setEnabled(true);
      setSourceChannelId('');
      setTargetChannelId('');
      setSourceConnectionId('');
      setTargetConnectionId('');

      const defaults: Record<string, any> = {};
      for (const p of firstType?.parameters || []) {
        if (p.defaultValue !== undefined) defaults[p.key] = p.defaultValue;
      }
      setConfiguration(defaults);
    }
  }, [isOpen, editingTask, taskTypes]);

  const selectedTaskType = useMemo(
    () => taskTypes.find((tt) => tt.id === taskTypeId),
    [taskTypes, taskTypeId]
  );

  if (!isOpen) return null;

  const handleTaskTypeChange = (nextId: string) => {
    setTaskTypeId(nextId);
    const nextType = taskTypes.find((tt) => tt.id === nextId);
    const defaults: Record<string, any> = {};
    for (const p of nextType?.parameters || []) {
      if (p.defaultValue !== undefined) defaults[p.key] = p.defaultValue;
    }
    setConfiguration(defaults);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name,
        description,
        taskTypeId,
        executionType,
        schedule: executionType === 'cron' ? schedule : executionType,
        enabled,
        sourceChannelId: sourceChannelId || null,
        targetChannelId: targetChannelId || null,
        sourceConnectionId: sourceConnectionId || null,
        targetConnectionId: targetConnectionId || null,
        configuration,
      };
      const res = editingTask
        ? await syncHubService.updateTask(editingTask.id, payload)
        : await syncHubService.createTask(payload);
      if (!res.success) {
        setError(res.message || 'No se pudo guardar la tarea');
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingTask ? 'Editar Tarea de Sincronización' : 'Nueva Tarea de Sincronización'}
              </h3>
              <p className="text-xs text-slate-500">
                Configura plantilla, conexiones origen/destino, programación y parámetros dinámicos
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre de la Tarea
              </label>
              <input
                required
                type="text"
                placeholder="Ej: Sincronizar Stock a3ERP -> Shopify (Cada 15m)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Definición / Tipo de Tarea
              </label>
              <select
                required
                value={taskTypeId}
                onChange={(e) => handleTaskTypeChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              >
                {taskTypes.map((tt) => (
                  <option key={tt.id} value={tt.id}>
                    {tt.name} ({tt.dataEntityType} · {tt.direction})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Disparo
              </label>
              <select
                value={executionType}
                onChange={(e) => setExecutionType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              >
                <option value="cron">Programada (Cron)</option>
                <option value="manual">Manual (Bajo demanda)</option>
                <option value="webhook">Evento Webhook</option>
              </select>
            </div>

            {executionType === 'cron' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expresión Cron
                </label>
                <input
                  required
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {CRON_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setSchedule(p.value)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Canal Origen (Opcional)
              </label>
              <select
                value={sourceChannelId}
                onChange={(e) => setSourceChannelId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              >
                <option value="">DAMA-CRM / Sin canal</option>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Canal Destino (Opcional)
              </label>
              <select
                value={targetChannelId}
                onChange={(e) => setTargetChannelId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              >
                <option value="">DAMA-CRM / Sin canal</option>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Conexión Origen (Opcional)
              </label>
              <select
                value={sourceConnectionId}
                onChange={(e) => setSourceConnectionId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              >
                <option value="">Ninguna</option>
                {connections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.channel?.name} · {c.environment?.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Conexión Destino (Opcional)
              </label>
              <select
                value={targetConnectionId}
                onChange={(e) => setTargetConnectionId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              >
                <option value="">Ninguna</option>
                {connections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.channel?.name} · {c.environment?.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Parameters from TaskType */}
          {selectedTaskType && selectedTaskType.parameters.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                Parámetros de {selectedTaskType.name}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedTaskType.parameters.map((p) => {
                  const currentVal = configuration[p.key] ?? p.defaultValue ?? '';
                  return (
                    <div key={p.key}>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {p.name} {p.required && <span className="text-rose-500">*</span>}
                      </label>
                      {p.type === 'boolean' ? (
                        <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                          <input
                            type="checkbox"
                            checked={Boolean(currentVal)}
                            onChange={(e) =>
                              setConfiguration((prev) => ({ ...prev, [p.key]: e.target.checked }))
                            }
                          />
                          <span>{p.description || 'Activado'}</span>
                        </label>
                      ) : p.type === 'select' && p.options && p.options.length > 0 ? (
                        <select
                          required={p.required}
                          value={String(currentVal)}
                          onChange={(e) =>
                            setConfiguration((prev) => ({ ...prev, [p.key]: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                        >
                          {p.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          required={p.required}
                          type={p.type === 'number' ? 'number' : 'text'}
                          value={currentVal}
                          onChange={(e) =>
                            setConfiguration((prev) => ({
                              ...prev,
                              [p.key]: p.type === 'number' ? Number(e.target.value) : e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                        />
                      )}
                      {p.description && p.type !== 'boolean' && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{p.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            <span>Habilitar tarea al guardar</span>
          </label>

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
              {saving ? 'Guardando...' : editingTask ? 'Guardar Cambios' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
