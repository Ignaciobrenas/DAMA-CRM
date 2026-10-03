import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  CheckSquare,
  Clock,
  Zap,
  User as UserIcon,
  Folder,
  CheckCircle,
  Smartphone,
  Trash2,
  Users,
  MessageSquare,
  Image as ImageIcon,
  Send,
  Timer,
  FileCode,
  Tag,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { apiRequest, downloadFile } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { PermissionGate } from '../components/common/PermissionGate';

export const AgilePlanner: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'board' | 'sprints' | 'my-tasks' | 'projects' | 'reminders' | 'releases' | 'templates'>('board');
  const [tasks, setTasks] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [workspaceUsers, setWorkspaceUsers] = useState<any[]>([]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Selected Task Details Modal state
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [taskComments, setTaskComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentImageUrl, setNewCommentImageUrl] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Time logging in Task Modal
  const [isLogTimeOpen, setIsLogTimeOpen] = useState(false);
  const [logHours, setLogHours] = useState('1.5');
  const [logDescription, setLogDescription] = useState('');
  const [taskWorkLogs, setTaskWorkLogs] = useState<any[]>([]);

  // Project Members Modal state
  const [selectedProjectForMembers, setSelectedProjectForMembers] = useState<any | null>(null);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('DEVELOPER');
  const [newMemberHourlyRate, setNewMemberHourlyRate] = useState('35');

  // Task Creation Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskPoints, setTaskPoints] = useState('3');
  const [taskHours, setTaskHours] = useState('6');

  // Project Creation Modal
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectPriority, setProjectPriority] = useState('MEDIUM');
  const [projectBudget, setProjectBudget] = useState('10000');

  // Custom Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    onConfirm: () => {},
  });

  const loadData = async () => {
    setIsLoading(true);
    const [resTasks, resMyTasks, resProjects, resUsers] = await Promise.all([
      apiRequest('/projects/tasks/all'),
      apiRequest('/projects/my-tasks'),
      apiRequest('/projects'),
      apiRequest('/users'),
    ]);

    if (resTasks.success && Array.isArray(resTasks.data)) {
      const seen = new Set();
      const uniqueTasks = resTasks.data.filter((t: any) => {
        if (!t || !t.id || seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
      setTasks(uniqueTasks);
    }
    if (resMyTasks.success && Array.isArray(resMyTasks.data)) {
      const seen = new Set();
      const uniqueMyTasks = resMyTasks.data.filter((t: any) => {
        if (!t || !t.id || seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
      setMyTasks(uniqueMyTasks);
    }
    if (resUsers.success) setWorkspaceUsers(resUsers.data || []);
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

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.stopPropagation();
    try {
      e.dataTransfer.setData('text/plain', taskId);
    } catch {
      // Ignore if dataTransfer is unavailable
    }
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = draggedTaskId || e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    // Optimistic UI Update with strict deduplication
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === taskId ? { ...t, status } : t));
      const seen = new Set();
      return updated.filter((item) => {
        if (!item || !item.id || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    });

    setDraggedTaskId(null);

    try {
      await apiRequest(`/projects/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleOpenTaskDetails = async (task: any) => {
    setSelectedTask(task);
    setIsLogTimeOpen(false);
    const [resComments, resLogs] = await Promise.all([
      apiRequest(`/projects/tasks/${task.id}/comments`),
      apiRequest(`/projects/tasks/${task.id}/worklogs`),
    ]);
    if (resComments.success) setTaskComments(resComments.data || []);
    if (resLogs.success) setTaskWorkLogs(resLogs.data || []);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || (!newCommentText.trim() && !newCommentImageUrl.trim())) return;

    setIsSubmittingComment(true);
    try {
      const res = await apiRequest(`/projects/tasks/${selectedTask.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: newCommentText,
          imageUrl: newCommentImageUrl.trim() || undefined,
        }),
      });
      if (res.success && res.data) {
        setTaskComments((prev) => [...prev, res.data]);
        setNewCommentText('');
        setNewCommentImageUrl('');
        toast.success('Comentario añadido', 'Tu nota ha sido guardada en la tarea');
      } else {
        toast.error('Error', res.message || 'No se pudo guardar el comentario');
      }
    } catch {
      toast.error('Error', 'Fallo de conexión al enviar comentario');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLogWorkTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      const res = await apiRequest(`/projects/tasks/${selectedTask.id}/worklogs`, {
        method: 'POST',
        body: JSON.stringify({
          hours: parseFloat(logHours) || 0,
          description: logDescription,
        }),
      });
      if (res.success) {
        toast.success('Tiempo reportado', `${logHours}h registradas correctamente`);
        setIsLogTimeOpen(false);
        setLogDescription('');
        // Reload work logs and task data
        const resLogs = await apiRequest(`/projects/tasks/${selectedTask.id}/worklogs`);
        if (resLogs.success) setTaskWorkLogs(resLogs.data || []);
        loadData();
      } else {
        toast.error('Error', res.message || 'Error al reportar horas');
      }
    } catch {
      toast.error('Error', 'Fallo de conexión');
    }
  };

  const handleOpenProjectMembers = async (project: any) => {
    setSelectedProjectForMembers(project);
    const res = await apiRequest(`/projects/${project.id}/members`);
    if (res.success) {
      setProjectMembers(res.data || []);
    }
  };

  const handleAddProjectMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForMembers || !newMemberUserId) return;

    const res = await apiRequest(`/projects/${selectedProjectForMembers.id}/members`, {
      method: 'POST',
      body: JSON.stringify({
        userId: newMemberUserId,
        role: newMemberRole,
        hourlyRate: parseFloat(newMemberHourlyRate) || 0,
      }),
    });

    if (res.success) {
      toast.success('Miembro asignado', 'El colaborador ahora forma parte del proyecto');
      const resMembers = await apiRequest(`/projects/${selectedProjectForMembers.id}/members`);
      if (resMembers.success) setProjectMembers(resMembers.data || []);
      setNewMemberUserId('');
    } else {
      toast.error('Error', res.message || 'Error al asignar miembro');
    }
  };

  const handleRemoveProjectMember = (userId: string, userName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Desvincular miembro',
      message: `¿Estás seguro de que deseas retirar a "${userName}" de este proyecto?`,
      variant: 'warning',
      confirmLabel: 'Desvincular',
      onConfirm: async () => {
        if (!selectedProjectForMembers) return;
        const res = await apiRequest(`/projects/${selectedProjectForMembers.id}/members/${userId}`, {
          method: 'DELETE',
        });
        if (res.success) {
          toast.success('Miembro retirado', 'El usuario ya no pertenece al proyecto');
          setProjectMembers((prev) => prev.filter((m) => m.userId !== userId));
        }
      },
    });
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskProjectId) return;

    const res = await apiRequest('/projects/tasks', {
      method: 'POST',
      body: JSON.stringify({
        projectId: taskProjectId,
        title: taskTitle,
        description: taskDescription,
        assigneeId: taskAssigneeId || undefined,
        priority: taskPriority,
        storyPoints: parseInt(taskPoints, 10),
        estimatedHours: parseFloat(taskHours),
      }),
    });

    if (res.success) {
      toast.success(t('success'), 'Tarea técnica creada');
      setIsTaskModalOpen(false);
      setTaskTitle('');
      setTaskDescription('');
      setTaskAssigneeId('');
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

  const handleDeleteProject = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: t('deleteProject'),
      message: `¿Estás seguro de que deseas eliminar el proyecto "${name}" y todas sus tareas asociadas? Esta acción no se puede deshacer.`,
      variant: 'danger',
      confirmLabel: 'Eliminar Proyecto',
      onConfirm: async () => {
        const res = await apiRequest(`/projects/${id}`, { method: 'DELETE' });
        if (res.success) {
          toast.success(t('success'), res.message || 'Proyecto eliminado');
          loadData();
        } else {
          toast.error(t('error'), res.message || 'Error al eliminar');
        }
      },
    });
  };

  const handleExportCSV = async () => {
    try {
      await downloadFile('/projects/export/csv', `proyectos_agile_${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success(t('success', 'Éxito'), t('agile.exportCsvSuccess', 'Proyectos y tareas exportados a Excel correctamente'));
    } catch {
      toast.error(t('error', 'Error'), t('agile.exportError', 'Error al exportar proyectos'));
    }
  };

  const handleExportPDF = async () => {
    try {
      await downloadFile('/projects/export/pdf', `informe_proyectos_agile_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(t('success', 'Éxito'), t('agile.exportPdfSuccess', 'Informe PDF generado correctamente'));
    } catch {
      toast.error(t('error', 'Error'), t('agile.exportError', 'Error al exportar'));
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

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Export & Odoo Sync buttons */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg border border-gray-200 dark:border-slate-700">
            <button
              onClick={async () => {
                try {
                  toast.info('Odoo ERP', 'Iniciando sincronización con Odoo...');
                  const res = await apiRequest('/planner/odoo/sync', { method: 'POST' });
                  if (res.success) {
                    toast.success('Odoo ERP', res.message || 'Sincronización finalizada correctamente');
                    loadData();
                  } else {
                    toast.error('Error Odoo', res.message || 'Error al conectar con Odoo');
                  }
                } catch (err: any) {
                  toast.error('Error', err.message || 'Fallo de conexión');
                }
              }}
              className="px-2.5 py-1.5 rounded-md text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-white dark:hover:bg-slate-700 transition flex items-center gap-1.5"
              title="Sincronizar proyectos y tareas con la instancia Odoo conectada en DAMA-CRM"
            >
              <Zap className="w-3.5 h-3.5 text-purple-600" />
              <span>Sincronizar Odoo</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 rounded-md text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition flex items-center gap-1.5"
              title="Exportar Proyectos a Excel (CSV)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-2.5 py-1.5 rounded-md text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition flex items-center gap-1.5"
              title="Descargar Informe de Proyectos en PDF"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF</span>
            </button>
          </div>

          {/* Tab Navigation Pill */}
          <div className="flex flex-wrap bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg border border-gray-200 dark:border-slate-700 gap-0.5">
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
              onClick={() => setActiveTab('sprints')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'sprints'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              Sprints & Backlog
            </button>
            <button
              onClick={() => setActiveTab('my-tasks')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                activeTab === 'my-tasks'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
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
            <button
              onClick={() => setActiveTab('reminders')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'reminders'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              Recordatorios
            </button>
            <button
              onClick={() => setActiveTab('releases')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'releases'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              Releases
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'templates'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              Plantillas
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
        <div className="space-y-3">
          {/* Quick Search & Priority Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar tareas por título, código o contenido..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">Prioridad:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer transition-all"
              >
                <option value="ALL">Todas las prioridades</option>
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente ⚠️</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
            {columns.map((col) => {
              const colTasks = tasks.filter((t, idx, arr) => {
                if (t.status !== col.id || arr.findIndex((x) => x.id === t.id) !== idx) return false;
                if (priorityFilter !== 'ALL' && (t.priority || 'MEDIUM').toUpperCase() !== priorityFilter) return false;
                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase();
                  const matchTitle = (t.title || '').toLowerCase().includes(q);
                  const matchKey = (t.key || '').toLowerCase().includes(q);
                  const matchDesc = (t.description || '').toLowerCase().includes(q);
                  if (!matchTitle && !matchKey && !matchDesc) return false;
                }
                return true;
              });
              return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
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
                  <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-200">
                    {colTasks.length}
                  </span>
                </div>

                {/* Tasks List */}
                <div className="space-y-2 flex-1">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => handleOpenTaskDetails(task)}
                      className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700/80 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all space-y-2 group"
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

                      <div className="text-[10px] text-slate-600 dark:text-slate-300 flex items-center space-x-1 font-medium">
                        <Folder className="w-3 h-3 text-slate-400 dark:text-slate-400" />
                        <span className="truncate">{task.project?.name || 'Proyecto'}</span>
                      </div>

                      {task.assignee && (
                        <div className="text-[10px] text-slate-700 dark:text-slate-200 flex items-center space-x-1 font-medium">
                          <UserIcon className="w-3 h-3 text-blue-500" />
                          <span>{task.assignee.name}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-gray-400">
                        <div className="flex items-center space-x-1 font-mono font-medium text-slate-500 dark:text-slate-400">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>{task.storyPoints || 1} pts</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{task.loggedHours || 0}h / {task.estimatedHours || 0}h</span>
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
                Optimizada para interacción táctil y reporte rápido desde cualquier dispositivo
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
                <div className="space-y-1 cursor-pointer flex-1 mr-3" onClick={() => handleOpenTaskDetails(t)}>
                  <div className="text-xs font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                    {t.title}
                  </div>
                  <div className="text-[10px] text-gray-500 flex items-center space-x-2">
                    <span>{t.project?.name}</span>
                    <span>•</span>
                    <span className="font-mono">{t.storyPoints || 1} pts</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenTaskDetails(t)}
                    className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 rounded-lg text-xs"
                    title="Ver detalles y reportar tiempo"
                  >
                    <Timer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      await apiRequest(`/projects/tasks/${t.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ status: 'DONE' }),
                      });
                      toast.success('Completada', `Tarea "${t.title}" finalizada`);
                      loadData();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1 shadow-xs transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{t('agile.completeTaskBtn')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {myTasks.length === 0 && (
            <div className="text-center py-10 text-xs text-gray-400">
              No tienes tareas pendientes asignadas actualmente.
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
                    onClick={() => handleOpenProjectMembers(p)}
                    className="p-1 text-gray-400 hover:text-indigo-500 rounded"
                    title="Gestionar miembros del proyecto"
                  >
                    <Users className="w-3.5 h-3.5" />
                  </button>
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
          {projects.length === 0 && (
            <div className="col-span-3 text-center py-10 text-xs text-gray-400">
              No existen proyectos configurados actualmente. Haz clic en "+ Nuevo Proyecto" para comenzar.
            </div>
          )}
        </div>
      )}

      {/* Tab: Sprints & Backlog */}
      {activeTab === 'sprints' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Sprints e Iteraciones Scrum
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Planificación de ciclos de trabajo, velocidad de desarrollo y estimación de puntos de historia.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Sprint Activo (Sprint 12)</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">EN CURSO</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-300">
                Objetivo: Consolidación de módulos de facturación y testing de permisos RBAC.
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-slate-800">
                <span>Tareas: 8 completadas de 12</span>
                <span className="font-semibold text-blue-600">66% Velocidad</span>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">{t('agile.backlog', 'Backlog General')}</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">PENDIENTE</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-300">
                Historias de usuario y tareas pendientes de asignación a un sprint activo.
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-slate-800">
                <span>Puntos Totales: 42 pts</span>
                <span className="font-semibold text-slate-600">{tasks.length} items</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Recordatorios & Notas */}
      {activeTab === 'reminders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Recordatorios y Notas Fijables (Pinnable Notes)
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Avisos automáticos, aplazamiento (snooze) y tablero de notas personales.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300">📌 Revisión de Sprint</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">Fijado</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Reunión con equipo de QA el viernes a las 10:00 AM para preparar la release 1.4.0.
              </p>
            </div>
            <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/40 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-300">📌 Presupuesto Harvest</span>
                <span className="text-[10px] bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded font-bold">Fijado</span>
              </div>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Verificar alerta del 90% alcanzado en el proyecto de Integraciones CRM.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Releases & Changelog */}
      {activeTab === 'releases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Historial de Versiones y Changelog (Releases)
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Registro de mejoras, correcciones y nuevas funcionalidades por versión.
              </p>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-gray-900 dark:text-white">v1.0.0 — Versión Inicial DAMA Agile Planner</span>
              <span className="text-[10px] text-gray-400 font-mono">01 Oct 2026</span>
            </div>
            <ul className="text-xs text-gray-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Integración completa de tableros Kanban, Scrum y Sprints.</li>
              <li>Sistema RBAC granular con restricción de roles por columna.</li>
              <li>Reportes de tiempo y conexión con Harvest y alertas de presupuesto.</li>
              <li>Soporte multi-tenant isolation y modales centrados oficiales DAMA.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab: Plantillas */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" />
                Plantillas de Tareas Reutilizables
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Formatos predefinidos para especificación de Historias de Usuario, Bugs y Tareas de investigación.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-2">
              <span className="text-xs font-bold text-gray-900 dark:text-white">🐛 Reporte de Bug Estándar</span>
              <p className="text-xs text-gray-500">Pasos para reproducir, comportamiento esperado y captura adjunta.</p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-2">
              <span className="text-xs font-bold text-gray-900 dark:text-white">📖 Historia de Usuario (Como / Quiero / Para)</span>
              <p className="text-xs text-gray-500">Formato estándar de especificación con criterios de aceptación.</p>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal (Interactive with Markdown, Comments & WorkLogs) */}
      <Modal
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        title={`Tarea: ${selectedTask?.title || ''}`}
        size="lg"
      >
        {selectedTask && (
          <div className="space-y-4">
            {/* Quick Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Estado</span>
                <select
                  value={selectedTask.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    setSelectedTask({ ...selectedTask, status: newStatus });
                    await apiRequest(`/projects/tasks/${selectedTask.id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ status: newStatus }),
                    });
                    loadData();
                  }}
                  className="mt-0.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 text-xs font-semibold"
                >
                  <option value="TODO">Por Hacer</option>
                  <option value="IN_PROGRESS">En Progreso</option>
                  <option value="REVIEW">En Revisión</option>
                  <option value="DONE">Completada</option>
                </select>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Prioridad</span>
                <div className="font-bold text-gray-900 dark:text-white mt-1">{selectedTask.priority}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Estimación</span>
                <div className="font-bold text-gray-900 dark:text-white mt-1">{selectedTask.estimatedHours || 0}h ({selectedTask.storyPoints || 1} pts)</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Horas Reportadas</span>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-1">{selectedTask.loggedHours || 0}h</div>
              </div>
            </div>

            {/* Description / Markdown */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-900 dark:text-white flex items-center space-x-1.5">
                  <FileCode className="w-3.5 h-3.5 text-blue-500" />
                  <span>Descripción de la tarea (Markdown soportado)</span>
                </label>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-gray-800 dark:text-slate-200 min-h-[60px] whitespace-pre-wrap font-sans">
                {selectedTask.description || 'Sin descripción detallada.'}
              </div>
            </div>

            {/* WorkLog Time Reporting Section */}
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200/60 dark:border-blue-900/40">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5">
                  <Timer className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Reporte de Horas</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLogTimeOpen(!isLogTimeOpen)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
                >
                  {isLogTimeOpen ? 'Cerrar Formulario' : '+ Reportar Horas'}
                </button>
              </div>

              {isLogTimeOpen && (
                <form onSubmit={handleLogWorkTime} className="space-y-2 mt-3 pt-3 border-t border-blue-200 dark:border-blue-900/60">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300">Horas trabajadas *</label>
                      <input
                        type="number"
                        step="0.25"
                        min="0.25"
                        required
                        value={logHours}
                        onChange={(e) => setLogHours(e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300">¿Qué has realizado?</label>
                      <input
                        type="text"
                        placeholder="p.ej. Implementación de endpoints y testing"
                        value={logDescription}
                        onChange={(e) => setLogDescription(e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
                    >
                      Guardar Reporte
                    </button>
                  </div>
                </form>
              )}

              {taskWorkLogs.length > 0 && (
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto pr-1">
                  {taskWorkLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between text-[11px] bg-white/80 dark:bg-slate-900/60 px-2 py-1 rounded border border-slate-200/50 dark:border-slate-800">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-blue-600">{log.hours}h</span>
                        <span className="text-gray-700 dark:text-slate-300 truncate">{log.description || 'Sin notas'}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">{new Date(log.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments Thread (Markdown & Image previews) */}
            <div className="space-y-2">
              <div className="flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-bold text-gray-900 dark:text-white">Comentarios y Archivos ({taskComments.length})</span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {taskComments.map((c) => (
                  <div key={c.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-gray-900 dark:text-white">{c.user?.name || 'Compañero'}</span>
                      <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-xs text-gray-800 dark:text-slate-200 whitespace-pre-wrap">{c.content}</div>
                    {c.imageUrl && (
                      <div className="mt-1">
                        <img
                          src={c.imageUrl}
                          alt="Adjunto"
                          className="max-h-36 max-w-full rounded-lg border border-slate-200 dark:border-slate-700 object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
                {taskComments.length === 0 && (
                  <div className="text-center py-4 text-[11px] text-gray-400">
                    Sin comentarios todavía. Escribe abajo para dejar notas o imágenes de avance.
                  </div>
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <textarea
                  rows={2}
                  placeholder="Escribe un comentario (formato Markdown soportado)..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      placeholder="URL de imagen adjunta (opcional)..."
                      value={newCommentImageUrl}
                      onChange={(e) => setNewCommentImageUrl(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                    />
                    <ImageIcon className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2 pointer-events-none" />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingComment || (!newCommentText.trim() && !newCommentImageUrl.trim())}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Enviar</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Modal>

      {/* Project Members Modal */}
      <Modal
        isOpen={Boolean(selectedProjectForMembers)}
        onClose={() => setSelectedProjectForMembers(null)}
        title={`Miembros del Proyecto: ${selectedProjectForMembers?.name || ''}`}
        size="md"
      >
        <div className="space-y-4">
          <form onSubmit={handleAddProjectMember} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="text-xs font-bold text-gray-900 dark:text-white">Asignar Nuevo Miembro</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                required
                value={newMemberUserId}
                onChange={(e) => setNewMemberUserId(e.target.value)}
                className="px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-gray-900 dark:text-white"
              >
                <option value="">Seleccionar usuario...</option>
                {workspaceUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                className="px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-gray-900 dark:text-white"
              >
                <option value="DEVELOPER">Desarrollador</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
                <option value="DESIGNER">Diseñador</option>
                <option value="QA">QA / Tester</option>
                <option value="VIEWER">Observador</option>
              </select>
              <input
                type="number"
                placeholder="Tarifa €/h"
                value={newMemberHourlyRate}
                onChange={(e) => setNewMemberHourlyRate(e.target.value)}
                className="px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
              >
                Asignar al Proyecto
              </button>
            </div>
          </form>

          {/* Members list */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {projectMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs">
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">{m.user?.name}</div>
                  <div className="text-[10px] text-gray-500">{m.role} • {m.hourlyRate} €/h</div>
                </div>
                <button
                  onClick={() => handleRemoveProjectMember(m.userId, m.user?.name || '')}
                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
                  title="Eliminar del proyecto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {projectMembers.length === 0 && (
              <div className="text-center py-6 text-xs text-gray-400">
                Aún no hay miembros asignados explícitamente a este proyecto.
              </div>
            )}
          </div>
        </div>
      </Modal>

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
              {t('taskTitle')} *
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
              Descripción / Especificaciones (Markdown)
            </label>
            <textarea
              rows={3}
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Detalla los requisitos, pasos o notas técnicas..."
              className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                Proyecto *
              </label>
              <select
                value={taskProjectId}
                onChange={(e) => setTaskProjectId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
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
                Empleado Asignado
              </label>
              <select
                value={taskAssigneeId}
                onChange={(e) => setTaskAssigneeId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="">Sin asignar</option>
                {workspaceUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
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
              {t('projectName')} *
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

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
