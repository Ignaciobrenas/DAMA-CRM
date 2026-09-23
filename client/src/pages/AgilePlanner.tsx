import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  CheckSquare,
  Clock,
  Zap,
  User,
  Folder,
  CheckCircle,
  Smartphone,
  X,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertCircle,
  FolderPlus,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

export const AgilePlanner: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'board' | 'my-tasks' | 'projects'>('board');
  const [tasks, setTasks] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');

  // Create Task Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskPoints, setTaskPoints] = useState('3');
  const [taskHours, setTaskHours] = useState('6');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskFormError, setTaskFormError] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Edit Task Modal
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState('MEDIUM');
  const [editTaskPoints, setEditTaskPoints] = useState('1');
  const [editTaskHours, setEditTaskHours] = useState('0');
  const [editTaskLogged, setEditTaskLogged] = useState('0');
  const [editTaskStatus, setEditTaskStatus] = useState('TODO');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskFormError, setEditTaskFormError] = useState('');
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);

  // Delete Task Modal
  const [deletingTask, setDeletingTask] = useState<any | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  // Create Project Modal
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectPriority, setProjectPriority] = useState('MEDIUM');
  const [projectBudget, setProjectBudget] = useState('');
  const [projectFormError, setProjectFormError] = useState('');
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);

  // Delete Project Modal
  const [deletingProject, setDeletingProject] = useState<any | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

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
    { id: 'TODO', label: 'Por Hacer', color: '#94A3B8' },
    { id: 'IN_PROGRESS', label: 'En Progreso', color: '#3B82F6' },
    { id: 'REVIEW', label: 'En Revisión', color: '#F59E0B' },
    { id: 'DONE', label: 'Completado', color: '#10B981' },
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

    const res = await apiRequest(`/projects/tasks/${draggedTaskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: targetStatus }),
    });

    setDraggedTaskId(null);
    if (res.success) {
      if (targetStatus === 'DONE') {
        toast.success('¡Tarea completada!', 'La tarea ha pasado a estado Completado.');
      }
      loadData();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskProjectId) {
      setTaskFormError('Proyecto y título son obligatorios (*).');
      return;
    }

    setIsSubmittingTask(true);
    const res = await apiRequest('/projects/tasks', {
      method: 'POST',
      body: JSON.stringify({
        projectId: taskProjectId,
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        priority: taskPriority,
        storyPoints: parseInt(taskPoints, 10) || 1,
        estimatedHours: parseFloat(taskHours) || 0,
      }),
    });
    setIsSubmittingTask(false);

    if (res.success) {
      toast.success('Tarea creada', `Se añadió "${taskTitle}" al proyecto.`);
      setIsTaskModalOpen(false);
      setTaskTitle('');
      setTaskDescription('');
      setTaskFormError('');
      loadData();
    } else {
      setTaskFormError(res.message || 'Error al crear la tarea');
    }
  };

  const handleOpenEditTask = (task: any) => {
    setEditingTask(task);
    setEditTaskTitle(task.title || '');
    setEditTaskPriority(task.priority || 'MEDIUM');
    setEditTaskPoints(String(task.storyPoints || 1));
    setEditTaskHours(String(task.estimatedHours || 0));
    setEditTaskLogged(String(task.loggedHours || 0));
    setEditTaskStatus(task.status || 'TODO');
    setEditTaskDescription(task.description || '');
    setEditTaskFormError('');
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if (!editTaskTitle.trim()) {
      setEditTaskFormError('El título de la tarea es obligatorio.');
      return;
    }

    setIsUpdatingTask(true);
    const res = await apiRequest(`/projects/tasks/${editingTask.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: editTaskTitle.trim(),
        priority: editTaskPriority,
        storyPoints: parseInt(editTaskPoints, 10) || 1,
        estimatedHours: parseFloat(editTaskHours) || 0,
        loggedHours: parseFloat(editTaskLogged) || 0,
        status: editTaskStatus,
        description: editTaskDescription.trim() || null,
      }),
    });
    setIsUpdatingTask(false);

    if (res.success) {
      toast.success('Tarea actualizada', 'Los cambios en la tarea se guardaron correctamente.');
      setEditingTask(null);
      loadData();
    } else {
      setEditTaskFormError(res.message || 'Error al actualizar tarea');
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTask) return;
    setIsDeletingTask(true);
    const res = await apiRequest(`/projects/tasks/${deletingTask.id}`, {
      method: 'DELETE',
    });
    setIsDeletingTask(false);

    if (res.success) {
      toast.success('Tarea eliminada', `La tarea "${deletingTask.title}" fue eliminada.`);
      setDeletingTask(null);
      loadData();
    } else {
      toast.error('Error al eliminar', res.message || 'No se pudo eliminar la tarea.');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setProjectFormError('El nombre del proyecto es obligatorio.');
      return;
    }

    setIsSubmittingProject(true);
    const res = await apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: projectName.trim(),
        description: projectDescription.trim() || null,
        priority: projectPriority,
        budget: projectBudget ? parseFloat(projectBudget) : null,
      }),
    });
    setIsSubmittingProject(false);

    if (res.success) {
      toast.success('Proyecto creado', `El proyecto "${projectName}" ha sido inicializado.`);
      setIsProjectModalOpen(false);
      setProjectName('');
      setProjectDescription('');
      setProjectBudget('');
      setProjectFormError('');
      loadData();
    } else {
      setProjectFormError(res.message || 'Error al crear proyecto');
    }
  };

  const handleDeleteProject = async () => {
    if (!deletingProject) return;
    setIsDeletingProject(true);
    const res = await apiRequest(`/projects/${deletingProject.id}`, {
      method: 'DELETE',
    });
    setIsDeletingProject(false);

    if (res.success) {
      toast.success('Proyecto eliminado', `El proyecto "${deletingProject.name}" fue eliminado.`);
      setDeletingProject(null);
      loadData();
    } else {
      toast.error('Error al eliminar', res.message || 'No se pudo eliminar el proyecto.');
    }
  };

  // Filtered Tasks for Board
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const t = (task.title || '').toLowerCase();
        const p = (task.project?.name || '').toLowerCase();
        const a = (task.assignee?.name || '').toLowerCase();
        if (!t.includes(q) && !p.includes(q) && !a.includes(q)) return false;
      }
      if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;
      if (projectFilter !== 'ALL' && task.projectId !== projectFilter) return false;
      return true;
    });
  }, [tasks, search, priorityFilter, projectFilter]);

  return (
    <div className="space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('agile')}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Gestión técnica y ejecución tras el cierre de ventas con Tablero Scrum y seguimiento móvil
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
              Tablero
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
              <span>Mis Tareas ({myTasks.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'projects'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              Proyectos ({projects.length})
            </button>
          </div>

          {activeTab === 'projects' ? (
            <button
              onClick={() => {
                setProjectFormError('');
                setIsProjectModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Nuevo Proyecto</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setTaskFormError('');
                setIsTaskModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nueva Tarea</span>
            </button>
          )}
        </div>
      </div>

      {/* Toolbar Filters for Tablero */}
      {activeTab === 'board' && (
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar tareas por título o proyecto..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Priority filter */}
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Filter className="w-3.5 h-3.5" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
              >
                <option value="ALL">Todas las prioridades</option>
                <option value="URGENT">Urgente</option>
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Media</option>
                <option value="LOW">Baja</option>
              </select>
            </div>

            {/* Project filter */}
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 max-w-[180px] truncate"
            >
              <option value="ALL">Todos los proyectos</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Tab 1: Agile Kanban Board */}
      {activeTab === 'board' && (
        <div className="flex space-x-3 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(col.id)}
                className="w-72 shrink-0 bg-gray-100/70 dark:bg-slate-900/60 rounded-xl p-3 border border-gray-200 dark:border-slate-800 flex flex-col max-h-[calc(100vh-210px)]"
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
                  {colTasks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-slate-800 rounded-lg">
                      Sin tareas en esta fase
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                        className={`p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200/80 dark:border-slate-700 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group ${
                          draggedTaskId === task.id ? 'opacity-40 scale-95' : 'opacity-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                            {task.title}
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 shrink-0">
                            <button
                              onClick={() => handleOpenEditTask(task)}
                              title="Editar tarea"
                              className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-slate-700"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setDeletingTask(task)}
                              title="Eliminar tarea"
                              className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
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
                    ))
                  )}
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
                    toast.success('¡Tarea completada!', `Has completado "${t.title}".`);
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
              className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white">{p.name}</h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {p.description || 'Sin descripción'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                      {p.status}
                    </span>
                    <button
                      onClick={() => setDeletingProject(p)}
                      title="Eliminar proyecto"
                      className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>Progreso: {p.metrics?.completedTasks || 0}/{p.metrics?.totalTasks || 0} tareas</span>
                    <span className="font-semibold">{p.metrics?.progressPercent || 0}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${p.metrics?.progressPercent || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-gray-500">
                <span>Story Points: <strong>{p.metrics?.totalStoryPoints || 0}</strong></span>
                <span>Horas: <strong>{p.metrics?.totalLoggedHours || 0}/{p.metrics?.totalEstimatedHours || 0}h</strong></span>
                {p.budget && (
                  <span className="font-semibold text-emerald-600">
                    {p.budget.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Nueva Tarea Ágil</h2>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {taskFormError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{taskFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Proyecto <span className="text-red-500">*</span>
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

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Título de la tarea <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Ej: Implementar migración de base de datos"
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Criterios de aceptación o especificaciones..."
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Prioridad</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Story Points</label>
                  <input
                    type="number"
                    min="1"
                    value={taskPoints}
                    onChange={(e) => setTaskPoints(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Horas Est.</label>
                  <input
                    type="number"
                    step="0.5"
                    value={taskHours}
                    onChange={(e) => setTaskHours(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 text-center"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs"
                >
                  {isSubmittingTask ? 'Guardando...' : 'Crear Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Editar Tarea</h2>
              <button onClick={() => setEditingTask(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {editTaskFormError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editTaskFormError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateTask} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Título de la tarea <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTaskTitle}
                  onChange={(e) => setEditTaskTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={editTaskDescription}
                  onChange={(e) => setEditTaskDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Estado</label>
                  <select
                    value={editTaskStatus}
                    onChange={(e) => setEditTaskStatus(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="TODO">Por Hacer</option>
                    <option value="IN_PROGRESS">En Progreso</option>
                    <option value="REVIEW">En Revisión</option>
                    <option value="DONE">Completado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Prioridad</label>
                  <select
                    value={editTaskPriority}
                    onChange={(e) => setEditTaskPriority(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Points</label>
                  <input
                    type="number"
                    min="1"
                    value={editTaskPoints}
                    onChange={(e) => setEditTaskPoints(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Horas Est.</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editTaskHours}
                    onChange={(e) => setEditTaskHours(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Horas Imp.</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editTaskLogged}
                    onChange={(e) => setEditTaskLogged(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 text-center"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingTask}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs"
                >
                  {isUpdatingTask ? 'Actualizando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Task Confirmation Modal */}
      {deletingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">Eliminar Tarea</h2>
            <p className="text-xs text-gray-600 dark:text-slate-400 mb-5">
              ¿Estás seguro de que deseas eliminar la tarea{' '}
              <strong className="text-gray-900 dark:text-white">{deletingTask.title}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeletingTask(null)}
                disabled={isDeletingTask}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteTask}
                disabled={isDeletingTask}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-xs"
              >
                {isDeletingTask ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Nuevo Proyecto</h2>
              <button onClick={() => setIsProjectModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {projectFormError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{projectFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Nombre del Proyecto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Ej: Despliegue CRM + Migración"
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
                  placeholder="Alcance y entregables del proyecto..."
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Prioridad</label>
                  <select
                    value={projectPriority}
                    onChange={(e) => setProjectPriority(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Presupuesto (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={projectBudget}
                    onChange={(e) => setProjectBudget(e.target.value)}
                    placeholder="12000"
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProject}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs"
                >
                  {isSubmittingProject ? 'Guardando...' : 'Crear Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">Eliminar Proyecto</h2>
            <p className="text-xs text-gray-600 dark:text-slate-400 mb-5">
              ¿Estás seguro de que deseas eliminar el proyecto{' '}
              <strong className="text-gray-900 dark:text-white">{deletingProject.name}</strong>?
              Esta acción eliminará también todas sus tareas y sprints vinculados.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeletingProject(null)}
                disabled={isDeletingProject}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={isDeletingProject}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-xs"
              >
                {isDeletingProject ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
