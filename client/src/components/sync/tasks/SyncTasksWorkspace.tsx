import React, { useCallback, useEffect, useState } from 'react';
import {
  Copy,
  Edit3,
  GitBranch,
  History,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  SyncChannelDto,
  SyncConnectionDto,
  SyncHubStatsDto,
  SyncOperationDto,
  SyncTaskDto,
  SyncTaskTypeDto,
  syncHubService,
} from '../../../services/sync-hub.service';
import { useToast } from '../../../context/ToastContext';
import { SyncTaskFormModal } from './SyncTaskFormModal';
import { SyncTaskHistoryModal } from './SyncTaskHistoryModal';

interface SyncTasksWorkspaceProps {
  isAdmin: boolean;
}

const OP_STATUS_STYLE: Record<string, string> = {
  blocked: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
  queued: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
  submitted: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300',
  processing: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
  failed: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300',
  timeout: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400',
};

export const SyncTasksWorkspace: React.FC<SyncTasksWorkspaceProps> = ({ isAdmin }) => {
  const toast = useToast();
  const [subTab, setSubTab] = useState<'tasks' | 'operations'>('tasks');
  const [loading, setLoading] = useState(true);
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [quickExecuting, setQuickExecuting] = useState(false);

  const [stats, setStats] = useState<SyncHubStatsDto | null>(null);
  const [tasks, setTasks] = useState<SyncTaskDto[]>([]);
  const [operations, setOperations] = useState<SyncOperationDto[]>([]);
  const [taskTypes, setTaskTypes] = useState<SyncTaskTypeDto[]>([]);
  const [channels, setChannels] = useState<SyncChannelDto[]>([]);
  const [connections, setConnections] = useState<SyncConnectionDto[]>([]);

  const [executionFilter, setExecutionFilter] = useState<string>('all');
  const [quickTaskTypeId, setQuickTaskTypeId] = useState<string>('');
  const [quickConnectionId, setQuickConnectionId] = useState<string>('');

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<SyncTaskDto | null>(null);
  const [historyState, setHistoryState] = useState<{ open: boolean; taskId: string | null; taskName: string }>({
    open: false,
    taskId: null,
    taskName: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, tasksRes, opsRes, typesRes, chsRes, connsRes] = await Promise.all([
        syncHubService.getStats(),
        syncHubService.listTasks({
          executionType: executionFilter === 'all' ? undefined : executionFilter,
          limit: 50,
        }),
        syncHubService.listOperations(),
        syncHubService.listTaskTypes(),
        syncHubService.listChannels(),
        syncHubService.listConnections(),
      ]);
      setStats(statsRes);
      setTasks(tasksRes.tasks || []);
      setOperations(opsRes);
      setTaskTypes(typesRes);
      setChannels(chsRes);
      setConnections(connsRes);
      if (!quickTaskTypeId && typesRes.length > 0) {
        setQuickTaskTypeId(typesRes[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [executionFilter, quickTaskTypeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunTask = async (task: SyncTaskDto) => {
    setRunningTaskId(task.id);
    try {
      const res = await syncHubService.runTask(task.id);
      if (res.success) {
        toast.success('Ejecución completada', res.message || task.name);
      } else {
        toast.error('Ejecución fallida', res.message || 'Revisa el historial');
      }
      await loadData();
    } finally {
      setRunningTaskId(null);
    }
  };

  const handleQuickExecute = async () => {
    if (!quickTaskTypeId) return;
    setQuickExecuting(true);
    try {
      const res = await syncHubService.quickExecuteTask({
        taskTypeId: quickTaskTypeId,
        targetConnectionId: quickConnectionId || undefined,
      });
      if (res.success) {
        toast.success('Ejecución rápida completada', res.message || 'Sincronización finalizada');
      } else {
        toast.error('Ejecución rápida fallida', res.message || 'Error en la ejecución');
      }
      await loadData();
    } finally {
      setQuickExecuting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Metrics Strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-slate-400">Tareas Programadas</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {stats.activeTasks} <span className="text-xs font-normal text-slate-400">/ {stats.totalTasks}</span>
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-slate-400">Tasa de Éxito</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.successRate}%</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-slate-400">Ejecuciones Totales</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalExecutions}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-slate-400">Operaciones DAG Activas</span>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.activeOperations}</p>
          </div>
        </div>
      )}

      {/* Quick Execute Bar */}
      {isAdmin && taskTypes.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Ejecución Rápida:</span>
          </div>
          <select
            value={quickTaskTypeId}
            onChange={(e) => setQuickTaskTypeId(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            {taskTypes.map((tt) => (
              <option key={tt.id} value={tt.id}>
                {tt.name} ({tt.dataEntityType})
              </option>
            ))}
          </select>
          <select
            value={quickConnectionId}
            onChange={(e) => setQuickConnectionId(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <option value="">Conexión automática / interna</option>
            {connections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.channel?.name} ({c.environment?.name})
              </option>
            ))}
          </select>
          <button
            onClick={handleQuickExecute}
            disabled={quickExecuting}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98] disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${quickExecuting ? 'animate-spin' : ''}`} />
            <span>{quickExecuting ? 'Ejecutando...' : 'Lanzar Ahora'}</span>
          </button>
        </div>
      )}

      {/* Sub-Tabs & Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubTab('tasks')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
              subTab === 'tasks'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Tareas de Sincronización ({tasks.length})</span>
          </button>
          <button
            onClick={() => setSubTab('operations')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
              subTab === 'operations'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Operaciones Asíncronas DAG ({operations.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {subTab === 'tasks' && (
            <select
              value={executionFilter}
              onChange={(e) => setExecutionFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="all">Todos los tipos</option>
              <option value="non_temporary">Programadas y manuales</option>
              <option value="cron">Solo Cron</option>
              <option value="manual">Solo Manual</option>
              <option value="quick">Solo Ejecuciones Rápidas</option>
              <option value="webhook">Solo Webhooks</option>
            </select>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
          {isAdmin && subTab === 'tasks' && (
            <button
              onClick={() => {
                setEditingTask(null);
                setTaskModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Tarea</span>
            </button>
          )}
        </div>
      </div>

      {/* Tasks List */}
      {subTab === 'tasks' && (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-2">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                No hay tareas de sincronización configuradas
              </p>
              <p className="text-xs text-slate-500">
                Crea una tarea programada o utiliza la barra de Ejecución Rápida para sincronizar de inmediato.
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{task.name}</h4>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                      {task.taskType?.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {task.executionType} · {task.scheduleDisplay || task.schedule}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                        OP_STATUS_STYLE[task.status] || OP_STATUS_STYLE.queued
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span>Éxitos: {task.successCount}</span>
                    <span>Errores: {task.errorCount}</span>
                    <span>
                      Última ejecución:{' '}
                      {task.lastRun ? new Date(task.lastRun).toLocaleString() : 'Nunca'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleRunTask(task)}
                    disabled={runningTaskId === task.id || !task.enabled}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 disabled:opacity-40"
                  >
                    <Play className={`w-3.5 h-3.5 ${runningTaskId === task.id ? 'animate-spin' : ''}`} />
                    <span>Ejecutar</span>
                  </button>
                  <button
                    onClick={() =>
                      setHistoryState({ open: true, taskId: task.id, taskName: task.name })
                    }
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Historial ({task.executionCount ?? 0})</span>
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={async () => {
                          await syncHubService.toggleTask(task.id);
                          loadData();
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title={task.enabled ? 'Pausar tarea' : 'Activar tarea'}
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          await syncHubService.duplicateTask(task.id);
                          toast.success('Tarea duplicada', task.name);
                          loadData();
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Duplicar tarea"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingTask(task);
                          setTaskModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Editar tarea"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          await syncHubService.deleteTask(task.id);
                          toast.success('Tarea eliminada', task.name);
                          loadData();
                        }}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        title="Eliminar tarea"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Async Operations DAG Tab */}
      {subTab === 'operations' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          {operations.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <GitBranch className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Sin operaciones asíncronas registradas
              </p>
              <p className="text-xs text-slate-500">
                Las operaciones con dependencias DAG (blocked → queued → processing → completed) aparecerán aquí con su estado por entidad.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3">Operación / Entidad</th>
                    <th className="px-4 py-3">Conexión</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Entidades (OK/Fail/Total)</th>
                    <th className="px-4 py-3">Dependencias</th>
                    <th className="px-4 py-3 text-right">Transición</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {operations.map((op) => (
                    <tr key={op.id}>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 dark:text-white uppercase">
                          {op.operation}
                        </span>
                        <span className="ml-2 font-mono text-slate-500">{op.entityType}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {op.connection?.channel?.name || op.connection?.endpoint}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                            OP_STATUS_STYLE[op.status] || OP_STATUS_STYLE.queued
                          }`}
                        >
                          {op.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className="text-emerald-600">{op.succeededEntities}</span> /{' '}
                        <span className="text-rose-600">{op.failedEntities}</span> / {op.totalEntities}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {op.dependsOnIds.length > 0 ? `${op.dependsOnIds.length} prev.` : 'Raíz'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isAdmin && (op.status === 'queued' || op.status === 'processing') && (
                          <button
                            onClick={async () => {
                              await syncHubService.transitionOperationStatus(op.id, 'completed');
                              loadData();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold"
                          >
                            Completar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <SyncTaskFormModal
        isOpen={taskModalOpen}
        editingTask={editingTask}
        taskTypes={taskTypes}
        channels={channels}
        connections={connections}
        onClose={() => setTaskModalOpen(false)}
        onSaved={loadData}
      />
      <SyncTaskHistoryModal
        isOpen={historyState.open}
        taskId={historyState.taskId}
        taskName={historyState.taskName}
        onClose={() => setHistoryState((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
};
