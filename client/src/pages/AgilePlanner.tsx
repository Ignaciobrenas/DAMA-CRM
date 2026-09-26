import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, Clock, Zap, User, Folder, CheckCircle, Smartphone, X, Trash2 } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/common/Modal';
import { PermissionGate } from '../components/common/PermissionGate';

export const AgilePlanner: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'board' | 'my-tasks' | 'projects'>('board');
  const [tasks, setTasks] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Task Creation Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskPoints, setTaskPoints] = useState('3');
  const [taskHours, setTaskHours] = useState('6');

  // Project Creation Modal
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectPriority, setProjectPriority] = useState('MEDIUM');
  const [projectBudget, setProjectBudget] = useState('10000');

  const loadData = async () => {
    setIsLoading(true);
    const [resTasks, resMyTasks, resProjects] = await Promise.all([
      apiRequest('/projects/tasks/all'),
      apiRequest('/projects/my-tasks'),
      apiRequest('/projects'),
    ]);

    if (resTasks.success) setTasks(resTasks.data || []);
    if (resMyTasks.success) setMyTasks(resMyTasks.data || []);
    if (resProjects.success) {
      setProjects(resProjects.data || []);
      if (resProjects.data.length > 0 && !taskProjectId) {
        setTaskProjectId(resProjects.data[0].id);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns = [
    { id: 'TODO', label: t('todo'), color: '#94A3B8' },
    { id: 'IN_PROGRESS', label: t('inProgress'), color: '#3B82F6' },
    { id: 'REVIEW', label: t('review'), color: '#F59E0B' },
    { id: 'DONE', label: t('done'), color: '#10B981' },
  ];

  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: string) => {
    if (!draggedTaskId) return;

    // Optimistic UI Update
    setTasks((prev) =>
      prev.map((t) => (t.id === draggedTaskId ? { ...t, status } : t))
    );

    const taskId = draggedTaskId;
    setDraggedTaskId(null);

    await apiRequest(`/projects/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    loadData();
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskProjectId) return;

    const res = await apiRequest('/projects/tasks', {
      method: 'POST',
      body: JSON.stringify({
        projectId: taskProjectId,
        title: taskTitle,
        priority: taskPriority,
        storyPoints: parseInt(taskPoints, 10),
        estimatedHours: parseFloat(taskHours),
      }),
    });

    if (res.success) {
      toast.success(t('success'), 'Tarea técnica creada');
      setIsTaskModalOpen(false);
      setTaskTitle('');
      loadData();
    } else {
      toast.error(t('error'), res.message || 'Error al crear tarea');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: projectName,
        description: projectDescription,
        priority: projectPriority,
        budget: parseFloat(projectBudget) || 0,
      }),
    });

    if (res.success) {
      toast.success(t('success'), 'Proyecto creado correctamente');
      setIsProjectModalOpen(false);
      setProjectName('');
      setProjectDescription('');
      loadData();
    } else {
      toast.error(t('error'), res.message || 'Error al crear proyecto');
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!window.confirm(`${t('confirmDeleteProject')} (${name})`)) return;
    const res = await apiRequest(`/projects/${id}`, { method: 'DELETE' });
    if (res.success) {
      toast.success(t('success'), res.message || 'Proyecto eliminado');
      loadData();
    } else {
      toast.error(t('error'), res.message || 'Error al eliminar');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('agile')}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {t('agileSubtitle')}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Tab Navigation Pill */}
          <div className="flex bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg border border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('board')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'board'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setActiveTab('my-tasks')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                activeTab === 'my-tasks'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3 h-3 text-emerald-500" />
              <span>{t('myTasks')} ({myTasks.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'projects'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              Proyectos ({projects.length})
            </button>
          </div>

          <PermissionGate resource="projects" action="create">
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('newProject')}</span>
            </button>
          </PermissionGate>

          <PermissionGate resource="tasks" action="create">
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('newTask')}</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Tab: Kanban Board */}
      {activeTab === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(col.id)}
                className="bg-gray-100/70 dark:bg-slate-900/60 rounded-xl p-3 border border-gray-200 dark:border-slate-800 min-h-[460px] flex flex-col"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: col.color }}
                    />
                    <h3 className="text-xs font-bold text-gray-800 dark:text-slate-200">
                      {col.label}
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                {/* Tasks List */}
                <div className="space-y-2 flex-1">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700/80 shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing transition-all space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2">
                          {task.title}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0 ${
                            task.priority === 'URGENT'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : task.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <div className="text-[10px] text-gray-500 dark:text-slate-400 flex items-center space-x-1">
                        <Folder className="w-3 h-3 text-gray-400" />
                        <span className="truncate">{task.project?.name || 'Proyecto'}</span>
                      </div>

                      <div className="pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-gray-400">
                        <div className="flex items-center space-x-1 font-mono font-medium text-slate-500 dark:text-slate-400">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>{task.storyPoints || 1} pts</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{task.estimatedHours || 0}h</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="h-28 border border-dashed border-gray-300 dark:border-slate-800 rounded-lg flex items-center justify-center text-[11px] text-gray-400">
                      Arrastrar aquí
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: My Tasks (Touch / Mobile Friendly) */}
      {activeTab === 'my-tasks' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                <span>{t('agile.myPendingTasks')}</span>
              </h2>
              <p className="text-[11px] text-gray-500">
                Optimizada para interacción táctil y reporte rápido desde móvil
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
              {myTasks.length} activas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {myTasks.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 hover:bg-gray-100/60 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-gray-900 dark:text-white">{t.title}</div>
                  <div className="text-[10px] text-gray-500 flex items-center space-x-2">
                    <span>{t.project?.name}</span>
                    <span>•</span>
                    <span className="font-mono">{t.storyPoints} pts</span>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    await apiRequest(`/projects/tasks/${t.id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ status: 'DONE' }),
                    });
                    toast.success('¡Completada!', `Tarea "${t.title}" finalizada`);
                    loadData();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1 shadow-xs transition-colors shrink-0"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{t('agile.completeTaskBtn')}</span>
                </button>
              </div>
            ))}
          </div>

          {myTasks.length === 0 && (
            <div className="text-center py-10 text-xs text-gray-400">
              🎉 ¡Enhorabuena! No tienes tareas pendientes asignadas actualmente.
            </div>
          )}
        </div>
      )}

      {/* Tab: Projects List */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white">{p.name}</h3>
                  <p className="text-[11px] text-gray-500 line-clamp-1">{p.description || 'Sin descripción'}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    {p.status}
                  </span>
                  <button
                    onClick={() => handleDeleteProject(p.id, p.name)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                    title={t('deleteProject')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-[11px] text-gray-500 dark:text-slate-400 mb-1">
                  <span>Progreso: {p.metrics?.completedTasks || 0}/{p.metrics?.totalTasks || 0} tareas</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{p.metrics?.progressPercent || 0}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${p.metrics?.progressPercent || 0}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400">
                <span>Horas: {p.metrics?.totalLoggedHours || 0}h / {p.metrics?.totalEstimatedHours || 0}h</span>
                <span>Puntos: {p.metrics?.totalStoryPoints || 0} pts</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Creation Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title={t('newTask')}
        size="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              {t('taskTitle')}
            </label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder={t('agile.taskTitlePlaceholder')}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Proyecto
            </label>
            <select
              value={taskProjectId}
              onChange={(e) => setTaskProjectId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Story Points
              </label>
              <input
                type="number"
                value={taskPoints}
                onChange={(e) => setTaskPoints(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Horas Estimadas
              </label>
              <input
                type="number"
                value={taskHours}
                onChange={(e) => setTaskHours(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              {t('priority')}
            </label>
            <select
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
            >
              <option value="LOW">{t('low')}</option>
              <option value="MEDIUM">{t('medium')}</option>
              <option value="HIGH">{t('high')}</option>
              <option value="URGENT">{t('urgent')}</option>
            </select>
          </div>

          <div className="pt-3 flex justify-end space-x-2 border-t border-gray-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 rounded-lg"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
              {t('save')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Project Creation Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title={t('newProject')}
        size="md"
      >
        <form onSubmit={handleCreateProject} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              {t('projectName')}
            </label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={t('agile.projectTitlePlaceholder')}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Descripción
            </label>
            <textarea
              rows={2}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder={t('agile.projectScopePlaceholder')}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('priority')}
              </label>
              <select
                value={projectPriority}
                onChange={(e) => setProjectPriority(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="LOW">{t('low')}</option>
                <option value="MEDIUM">{t('medium')}</option>
                <option value="HIGH">{t('high')}</option>
                <option value="URGENT">{t('urgent')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('budget')}
              </label>
              <input
                type="number"
                value={projectBudget}
                onChange={(e) => setProjectBudget(e.target.value)}
                placeholder="10000"
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end space-x-2 border-t border-gray-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsProjectModalOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 rounded-lg"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              {t('create')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
