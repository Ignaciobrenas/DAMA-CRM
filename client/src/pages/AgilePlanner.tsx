import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, Clock, Zap, User, Folder, CheckCircle, Smartphone, X } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { Modal } from '../components/common/Modal';
import { PermissionGate } from '../components/common/PermissionGate';

export const AgilePlanner: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'board' | 'my-tasks' | 'projects'>('board');
  const [tasks, setTasks] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskPoints, setTaskPoints] = useState('3');
  const [taskHours, setTaskHours] = useState('6');

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

  const handleDrop = async (targetStatus: string) => {
    if (!draggedTaskId) return;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === draggedTaskId ? { ...t, status: targetStatus } : t))
    );

    await apiRequest(`/projects/tasks/${draggedTaskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: targetStatus }),
    });

    setDraggedTaskId(null);
    loadData();
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskProjectId) return;

    const res = await apiRequest('/projects/tasks', {
      method: 'POST',
      body: JSON.stringify({
        projectId: taskProjectId,
        title: taskTitle,
        priority: taskPriority,
        storyPoints: parseInt(taskPoints, 10) || 1,
        estimatedHours: parseFloat(taskHours) || 0,
      }),
    });

    if (res.success) {
      setIsTaskModalOpen(false);
      setTaskTitle('');
      loadData();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Tabs */}
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
          {/* Tab selector */}
          <div className="flex bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('board')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'board'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              {t('agile')}
            </button>
            <button
              onClick={() => setActiveTab('my-tasks')}
              className={`px-3 py-1.5 rounded-md flex items-center space-x-1 transition-colors ${
                activeTab === 'my-tasks'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              <Smartphone className="w-3 h-3 mr-1" />
              <span>{t('myTasks')}</span>
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'projects'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              {t('allTasks')}
            </button>
          </div>

          <PermissionGate resource="projects" action="create">
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('newTask')}</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Tab 1: Agile Kanban Board */}
      {activeTab === 'board' && (
        <div className="flex space-x-3 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(col.id)}
                className="w-72 shrink-0 bg-gray-100/70 dark:bg-slate-900/60 rounded-xl p-3 border border-gray-200 dark:border-slate-800 flex flex-col max-h-[calc(100vh-180px)]"
              >
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-200/80 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{col.label}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      className={`p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200/80 dark:border-slate-700 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
                        draggedTaskId === task.id ? 'opacity-40 scale-95' : 'opacity-100'
                      }`}
                    >
                      <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                        {task.title}
                      </div>

                      <div className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">
                        {task.project?.name}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                        <span className="inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                          <Zap className="w-2.5 h-2.5 mr-0.5 inline" /> {task.storyPoints || 1} pts
                        </span>

                        <span className="text-gray-500 dark:text-slate-400 flex items-center">
                          <Clock className="w-2.5 h-2.5 mr-0.5 inline" /> {task.loggedHours || 0}/{task.estimatedHours || 0}h
                        </span>

                        <span
                          className={`px-1.5 py-0.5 rounded font-semibold ${
                            task.priority === 'URGENT'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                              : task.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Mobile-Optimized "Mis Tareas Pendientes" View */}
      {activeTab === 'my-tasks' && (
        <div className="max-w-xl mx-auto space-y-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs text-blue-700 dark:text-blue-300 flex items-center space-x-2">
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>Vista adaptada para pantalla táctil y app móvil Capacitor. Toca para completar.</span>
          </div>

          {myTasks.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">
              🎉 ¡Felicidades! No tienes tareas pendientes asignadas.
            </div>
          ) : (
            myTasks.map((t) => (
              <div
                key={t.id}
                className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xs flex items-center justify-between space-x-3"
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                    {t.title}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-slate-400">
                    {t.project?.name} • Prioridad: {t.priority}
                  </div>
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                    Estimación: {t.estimatedHours}h
                  </div>
                </div>

                <button
                  onClick={async () => {
                    await apiRequest(`/projects/tasks/${t.id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ status: 'DONE' }),
                    });
                    loadData();
                  }}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shrink-0 shadow-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Hecha</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Projects & Sprints */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white">{p.name}</h3>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                    {p.description}
                  </p>
                </div>
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                  {p.status}
                </span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-[11px] text-gray-500 dark:text-slate-400 mb-1">
                  <span>Progreso: {p.metrics?.completedTasks}/{p.metrics?.totalTasks} tareas</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{p.metrics?.progressPercent}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${p.metrics?.progressPercent || 0}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400">
                <span>Horas: {p.metrics?.totalLoggedHours}h / {p.metrics?.totalEstimatedHours}h</span>
                <span>Puntos: {p.metrics?.totalStoryPoints} pts</span>
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
              placeholder="Ej: Webhook UnoPIM"
              className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              {t('details')}
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
    </div>
  );
};
