import React, { useState, useEffect, useMemo } from 'react';
import {
  Cpu,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Plus,
  X,
  Edit2,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  AlertCircle,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

export const Workflows: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [triggerFilter, setTriggerFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Create workflow modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState('deal.won');
  const [action, setAction] = useState('create_project');
  const [createFormError, setCreateFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit workflow modal state
  const [editingWorkflow, setEditingWorkflow] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTrigger, setEditTrigger] = useState('deal.won');
  const [editAction, setEditAction] = useState('create_project');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editFormError, setEditFormError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete modal state
  const [deletingWorkflow, setDeletingWorkflow] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const [resWorkflows, resLogs] = await Promise.all([
      apiRequest('/workflows'),
      apiRequest('/workflows/logs/all'),
    ]);

    if (resWorkflows.success) setWorkflows(resWorkflows.data || []);
    if (resLogs.success) setLogs(resLogs.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTestRun = async (wf: any) => {
    toast.info('Ejecutando prueba...', `Lanzando ejecución para "${wf.name}"`);
    const res = await apiRequest(`/workflows/${wf.id}/test`, { method: 'POST' });
    if (res.success) {
      toast.success('Prueba Completada', res.message || 'Workflow ejecutado con éxito.');
      await loadData();
    } else {
      toast.error('Error en prueba', res.message || 'No se pudo ejecutar el workflow.');
      await loadData();
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    const res = await apiRequest(`/workflows/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !current }),
    });
    if (res.success) {
      toast.success(
        !current ? 'Regla Activada' : 'Regla Pausada',
        `El workflow ha sido ${!current ? 'activado' : 'desactivado'}.`
      );
      loadData();
    }
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setCreateFormError('El nombre del workflow es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    const res = await apiRequest('/workflows', {
      method: 'POST',
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || null,
        trigger,
        action,
        actionConfig: { autoTriggered: true, createdAt: new Date().toISOString() },
      }),
    });
    setIsSubmitting(false);

    if (res.success) {
      toast.success('Regla creada', `El workflow "${name}" se configuró correctamente.`);
      setIsCreateOpen(false);
      setName('');
      setDescription('');
      setCreateFormError('');
      loadData();
    } else {
      setCreateFormError(res.message || 'Error al crear la regla');
    }
  };

  const handleOpenEdit = (wf: any) => {
    setEditingWorkflow(wf);
    setEditName(wf.name || '');
    setEditDescription(wf.description || '');
    setEditTrigger(wf.trigger || 'deal.won');
    setEditAction(wf.action || 'create_project');
    setEditIsActive(Boolean(wf.isActive));
    setEditFormError('');
  };

  const handleUpdateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkflow) return;
    if (!editName.trim()) {
      setEditFormError('El nombre del workflow es obligatorio.');
      return;
    }

    setIsUpdating(true);
    const res = await apiRequest(`/workflows/${editingWorkflow.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: editName.trim(),
        description: editDescription.trim() || null,
        trigger: editTrigger,
        action: editAction,
        isActive: editIsActive,
      }),
    });
    setIsUpdating(false);

    if (res.success) {
      toast.success('Regla actualizada', `Los cambios en "${editName}" se guardaron correctamente.`);
      setEditingWorkflow(null);
      loadData();
    } else {
      setEditFormError(res.message || 'Error al actualizar el workflow');
    }
  };

  const handleDeleteWorkflow = async () => {
    if (!deletingWorkflow) return;
    setIsDeleting(true);
    const res = await apiRequest(`/workflows/${deletingWorkflow.id}`, {
      method: 'DELETE',
    });
    setIsDeleting(false);

    if (res.success) {
      toast.success('Workflow eliminado', `La regla "${deletingWorkflow.name}" ha sido eliminada.`);
      setDeletingWorkflow(null);
      loadData();
    } else {
      toast.error('Error al eliminar', res.message || 'No se pudo eliminar el workflow.');
    }
  };

  // Filtered workflows
  const filteredWorkflows = useMemo(() => {
    return workflows.filter((wf) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const n = (wf.name || '').toLowerCase();
        const d = (wf.description || '').toLowerCase();
        const t = (wf.trigger || '').toLowerCase();
        const a = (wf.action || '').toLowerCase();
        if (!n.includes(q) && !d.includes(q) && !t.includes(q) && !a.includes(q)) {
          return false;
        }
      }

      if (triggerFilter !== 'ALL' && wf.trigger !== triggerFilter) return false;
      if (statusFilter === 'ACTIVE' && !wf.isActive) return false;
      if (statusFilter === 'INACTIVE' && wf.isActive) return false;

      return true;
    });
  }, [workflows, search, triggerFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('workflows')}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Motor de reglas automatizadas en segundo plano (Disparadores 'Si ocurre X → Ejecuta Y')
          </p>
        </div>

        <button
          onClick={() => {
            setCreateFormError('');
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center space-x-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nueva Regla Automática</span>
        </button>
      </div>

      {/* Toolbar Filters */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar regla por nombre, disparador o acción..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-purple-600"
            />
          </div>

          {/* Trigger filter */}
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={triggerFilter}
              onChange={(e) => setTriggerFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-purple-600"
            >
              <option value="ALL">Todos los disparadores</option>
              <option value="deal.won">deal.won (Venta Ganada)</option>
              <option value="deal.created">deal.created (Nueva Venta)</option>
              <option value="contact.created">contact.created (Nuevo Contacto)</option>
              <option value="invoice.paid">invoice.paid (Factura Pagada)</option>
            </select>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-purple-600"
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Activas</option>
            <option value="INACTIVE">Pausadas</option>
          </select>
        </div>
      </div>

      {/* Workflows Cards */}
      {isLoading ? (
        <div className="text-center py-12 text-xs text-gray-400">
          Cargando reglas automatizadas...
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <div className="text-center py-12 text-xs text-gray-400 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800">
          No se encontraron reglas coincidentes con los filtros.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWorkflows.map((wf) => (
            <div
              key={wf.id}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-3 flex flex-col justify-between hover:border-purple-300 dark:hover:border-purple-900/50 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                        {wf.name}
                      </h3>
                      <span className="text-[10px] text-gray-500 dark:text-slate-400">
                        Disparador: <span className="font-mono text-purple-600 dark:text-purple-400">{wf.trigger}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* Active Switch */}
                    <button
                      onClick={() => handleToggle(wf.id, wf.isActive)}
                      title={wf.isActive ? 'Pausar regla' : 'Activar regla'}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                        wf.isActive ? 'bg-purple-600 justify-end' : 'bg-gray-300 dark:bg-slate-700 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(wf)}
                      title="Editar regla"
                      className="p-1 rounded text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingWorkflow(wf)}
                      title="Eliminar regla"
                      className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="mt-2 text-xs text-gray-600 dark:text-slate-300 line-clamp-2">
                  {wf.description || 'Sin descripción detallada.'}
                </p>

                <div className="mt-3 p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 text-[11px] font-mono space-y-1">
                  <div>
                    <span className="text-gray-400">Acción:</span>{' '}
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">{wf.action}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Ejecuciones totales:</span>{' '}
                    <span className="text-gray-800 dark:text-slate-200 font-semibold">{wf.executionCount || 0}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-[10px] text-gray-400">
                  Última vez: {wf.lastExecutedAt ? new Date(wf.lastExecutedAt).toLocaleTimeString() : 'Nunca'}
                </span>
                <button
                  onClick={() => handleTestRun(wf)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 hover:bg-purple-100 transition-colors"
                >
                  <Play className="w-3 h-3" />
                  <span>Probar Ahora</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Execution Logs Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-900 dark:text-white">Registro de Ejecuciones en Segundo Plano</h2>
          <button onClick={loadData} className="text-[11px] text-purple-600 hover:underline">Actualizar</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-2.5">Workflow</th>
                <th className="px-4 py-2.5">Estado</th>
                <th className="px-4 py-2.5">Resultado</th>
                <th className="px-4 py-2.5 text-right">Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-400">
                    No hay registros de ejecución recientes.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2 font-semibold text-gray-900 dark:text-white">
                      {log.workflow?.name}
                    </td>
                    <td className="px-4 py-2">
                      {log.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center text-emerald-600 font-semibold text-[10px]">
                          <CheckCircle className="w-3 h-3 mr-1" /> Completado
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-red-600 font-semibold text-[10px]">
                          <XCircle className="w-3 h-3 mr-1" /> Error
                        </span>
                      )}
                    </td>
                    <td
                      className="px-4 py-2 font-mono text-[10px] text-gray-500 max-w-xs truncate"
                      title={log.errorMessage || (typeof log.resultData === 'string' ? log.resultData : JSON.stringify(log.resultData))}
                    >
                      {log.errorMessage
                        ? `Error: ${log.errorMessage}`
                        : log.resultData
                        ? typeof log.resultData === 'string'
                          ? log.resultData
                          : JSON.stringify(log.resultData)
                        : 'Acción ejecutada correctamente'}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-400 text-[10px]">
                      {new Date(log.executedAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Nueva Regla de Automatización</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {createFormError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateWorkflow} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Nombre de la regla <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Crear Proyecto al Ganar Venta"
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Objetivo o comportamiento de la regla..."
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Disparador (Trigger)
                  </label>
                  <select
                    value={trigger}
                    onChange={(e) => setTrigger(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-purple-600"
                  >
                    <option value="deal.won">deal.won</option>
                    <option value="deal.created">deal.created</option>
                    <option value="contact.created">contact.created</option>
                    <option value="invoice.paid">invoice.paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Acción Resultante
                  </label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-purple-600"
                  >
                    <option value="create_project">Crear Proyecto</option>
                    <option value="send_email">Enviar Notificación Email</option>
                    <option value="create_task">Crear Tarea Técnica</option>
                    <option value="webhook_dispatch">Disparar Webhook</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg shadow-xs"
                >
                  {isSubmitting ? 'Guardando...' : 'Crear Regla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Editar Regla</h2>
              <button onClick={() => setEditingWorkflow(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {editFormError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateWorkflow} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Nombre de la regla <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Disparador
                  </label>
                  <select
                    value={editTrigger}
                    onChange={(e) => setEditTrigger(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-purple-600"
                  >
                    <option value="deal.won">deal.won</option>
                    <option value="deal.created">deal.created</option>
                    <option value="contact.created">contact.created</option>
                    <option value="invoice.paid">invoice.paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Acción Resultante
                  </label>
                  <select
                    value={editAction}
                    onChange={(e) => setEditAction(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-purple-600"
                  >
                    <option value="create_project">Crear Proyecto</option>
                    <option value="send_email">Enviar Notificación Email</option>
                    <option value="create_task">Crear Tarea Técnica</option>
                    <option value="webhook_dispatch">Disparar Webhook</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActiveWf"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="editIsActiveWf" className="text-xs text-gray-700 dark:text-slate-300">
                  Regla activa (se ejecutará automáticamente ante eventos)
                </label>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingWorkflow(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg shadow-xs"
                >
                  {isUpdating ? 'Actualizando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">Eliminar Regla</h2>
            <p className="text-xs text-gray-600 dark:text-slate-400 mb-5">
              ¿Estás seguro de que deseas eliminar el workflow{' '}
              <strong className="text-gray-900 dark:text-white">{deletingWorkflow.name}</strong>?
              También se limpiarán sus registros de auditoría asociados.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeletingWorkflow(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteWorkflow}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-xs"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
