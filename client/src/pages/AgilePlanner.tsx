import React, { useState, useEffect, useMemo } from 'react';
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
  Sparkles,
  FileSpreadsheet,
  FileText,
  Pin,
  Layers,
  Target,
  TrendingUp,
  Calendar,
  Copy,
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
  const [sprints, setSprints] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [releases, setReleases] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [workspaceUsers, setWorkspaceUsers] = useState<any[]>([]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');

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
  const [taskSprintId, setTaskSprintId] = useState('');
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

  // Sprint Creation Modal
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [sprintName, setSprintName] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');
  const [sprintProjectId, setSprintProjectId] = useState('');
  const [sprintStartDate, setSprintStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [sprintEndDate, setSprintEndDate] = useState(() => new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));

  // Note Creation Modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('amber');
  const [notePinned, setNotePinned] = useState(true);

  // Release Creation Modal
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [releaseVersion, setReleaseVersion] = useState('');
  const [releaseTitle, setReleaseTitle] = useState('');
  const [releaseEntryText, setReleaseEntryText] = useState('');

  // Template Creation Modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplDescription, setTplDescription] = useState('');
  const [tplContent, setTplContent] = useState('');

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
    const [resTasks, resMyTasks, resProjects, resUsers, resSprints, resNotes, resReleases, resTemplates] =
      await Promise.all([
        apiRequest('/projects/tasks/all'),
        apiRequest('/projects/my-tasks'),
        apiRequest('/projects'),
        apiRequest('/users'),
        apiRequest('/projects/sprints/all'),
        apiRequest('/planner/notes'),
        apiRequest('/planner/releases'),
        apiRequest('/planner/templates'),
      ]);

    if (resTasks.success && Array.isArray(resTasks.data)) {
      const seen = new Set();
      const uniqueTasks = resTasks.data.filter((tItem: any) => {
        if (!tItem || !tItem.id || seen.has(tItem.id)) return false;
        seen.add(tItem.id);
        return true;
      });
      setTasks(uniqueTasks);
    }
    if (resMyTasks.success && Array.isArray(resMyTasks.data)) {
      const seen = new Set();
      const uniqueMyTasks = resMyTasks.data.filter((tItem: any) => {
        if (!tItem || !tItem.id || seen.has(tItem.id)) return false;
        seen.add(tItem.id);
        return true;
      });
      setMyTasks(uniqueMyTasks);
    }
    if (resUsers.success) setWorkspaceUsers(resUsers.data || []);
    if (resProjects.success && Array.isArray(resProjects.data)) {
      setProjects(resProjects.data);
      if (resProjects.data.length > 0) {
        if (!taskProjectId) setTaskProjectId(resProjects.data[0].id);
        if (!sprintProjectId) setSprintProjectId(resProjects.data[0].id);
      }
    }
    if (resSprints.success && Array.isArray(resSprints.data)) setSprints(resSprints.data);
    if (resNotes.success && Array.isArray(resNotes.data)) setNotes(resNotes.data);
    if (resReleases.success && Array.isArray(resReleases.data)) setReleases(resReleases.data);
    if (resTemplates.success && Array.isArray(resTemplates.data)) setTemplates(resTemplates.data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get('taskId') || params.get('id');
    const projectId = params.get('projectId');
    const q = params.get('q');
    const isNew = params.get('new') === 'true';

    if (q) setSearchQuery(q);
    if (projectId) {
      setProjectFilter(projectId);
      setActiveTab('projects');
    }
    if (taskId && tasks.length > 0) {
      const found = tasks.find((t: any) => t.id === taskId);
      if (found) setSelectedTask(found);
    }
    if (isNew) {
      if (params.get('type') === 'project') setIsProjectModalOpen(true);
      else setIsTaskModalOpen(true);
    }
  }, [tasks, projects]);

  const kpis = useMemo(() => {
    const totalTasksCount = tasks.length;
    const doneCount = tasks.filter((x) => x.status === 'DONE').length;
    const velocityPct = totalTasksCount > 0 ? Math.round((doneCount / totalTasksCount) * 100) : 0;
    const totalPoints = tasks.reduce((acc, x) => acc + (Number(x.storyPoints) || 0), 0);
    const totalLogged = tasks.reduce((acc, x) => acc + (Number(x.loggedHours) || 0), 0);
    const totalEstimated = tasks.reduce((acc, x) => acc + (Number(x.estimatedHours) || 0), 0);
    return {
      projectsCount: projects.length,
      totalTasksCount,
      doneCount,
      velocityPct,
      totalPoints,
      totalLogged: Math.round(totalLogged * 10) / 10,
      totalEstimated: Math.round(totalEstimated * 10) / 10,
    };
  }, [tasks, projects]);

  const columns = [
    { id: 'TODO', label: t('todo', 'Por Hacer'), color: '#94A3B8' },
    { id: 'IN_PROGRESS', label: t('inProgress', 'En Progreso'), color: '#3B82F6' },
    { id: 'REVIEW', label: t('review', 'En Revisión'), color: '#F59E0B' },
    { id: 'DONE', label: t('done', 'Completado'), color: '#10B981' },
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

  const handleQuickStatusChange = async (taskId: string, newStatus: string) => {
    setTasks((prev) => prev.map((item) => (item.id === taskId ? { ...item, status: newStatus } : item)));
    try {
      await apiRequest(`/projects/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success('Estado actualizado', `Tarea movida a ${newStatus}`);
    } catch {
      toast.error('Error', 'No se pudo actualizar el estado de la tarea');
    }
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = draggedTaskId || e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    setDraggedTaskId(null);
    await handleQuickStatusChange(taskId, status);
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
    const targetPid = taskProjectId || projects[0]?.id;
    if (!targetPid) return;

    const res = await apiRequest('/projects/tasks', {
      method: 'POST',
      body: JSON.stringify({
        projectId: targetPid,
        sprintId: taskSprintId || undefined,
        title: taskTitle,
        description: taskDescription,
        assigneeId: taskAssigneeId || undefined,
        priority: taskPriority,
        storyPoints: parseInt(taskPoints, 10) || 1,
        estimatedHours: parseFloat(taskHours) || 0,
      }),
    });

    if (res.success) {
      toast.success(t('success', 'Éxito'), 'Tarea técnica creada correctamente');
      setIsTaskModalOpen(false);
      setTaskTitle('');
      setTaskDescription('');
      setTaskAssigneeId('');
      setTaskSprintId('');
      loadData();
    } else {
      toast.error(t('error', 'Error'), res.message || 'Error al crear tarea');
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
      toast.success(t('success', 'Éxito'), 'Proyecto creado correctamente');
      setIsProjectModalOpen(false);
      setProjectName('');
      setProjectDescription('');
      loadData();
    } else {
      toast.error(t('error', 'Error'), res.message || 'Error al crear proyecto');
    }
  };

  const handleDeleteProject = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: t('deleteProject', 'Eliminar Proyecto'),
      message: `¿Estás seguro de que deseas eliminar el proyecto "${name}" y todas sus tareas asociadas? Esta acción no se puede deshacer.`,
      variant: 'danger',
      confirmLabel: 'Eliminar Proyecto',
      onConfirm: async () => {
        const res = await apiRequest(`/projects/${id}`, { method: 'DELETE' });
        if (res.success) {
          toast.success(t('success', 'Éxito'), res.message || 'Proyecto eliminado');
          loadData();
        } else {
          toast.error(t('error', 'Error'), res.message || 'Error al eliminar');
        }
      },
    });
  };

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    const pid = sprintProjectId || projects[0]?.id;
    if (!pid || !sprintName.trim()) return;

    const res = await apiRequest(`/projects/${pid}/sprints`, {
      method: 'POST',
      body: JSON.stringify({
        name: sprintName.trim(),
        goal: sprintGoal.trim() || null,
        startDate: sprintStartDate,
        endDate: sprintEndDate,
      }),
    });
    if (res.success) {
      toast.success('Sprint creado', `Iteración "${sprintName}" iniciada correctamente`);
      setIsSprintModalOpen(false);
      setSprintName('');
      setSprintGoal('');
      loadData();
    } else {
      toast.error('Error', res.message || 'No se pudo crear el sprint');
    }
  };

  const handleDeleteSprint = async (sprintId: string) => {
    const res = await apiRequest(`/projects/sprints/${sprintId}`, { method: 'DELETE' });
    if (res.success) {
      toast.success('Sprint eliminado', 'El sprint se ha eliminado y sus tareas han vuelto al backlog');
      loadData();
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    const res = await apiRequest('/planner/notes', {
      method: 'POST',
      body: JSON.stringify({
        title: noteTitle.trim() || 'Nota Rápida',
        content: noteContent.trim(),
        color: noteColor,
        pinned: notePinned,
      }),
    });
    if (res.success) {
      toast.success('Nota guardada', 'Recordatorio fijado en tu tablero personal');
      setIsNoteModalOpen(false);
      setNoteTitle('');
      setNoteContent('');
      loadData();
    }
  };

  const handleTogglePinNote = async (note: any) => {
    await apiRequest(`/planner/notes/${note.id}`, {
      method: 'PUT',
      body: JSON.stringify({ pinned: !note.pinned }),
    });
    loadData();
  };

  const handleDeleteNote = async (noteId: string) => {
    await apiRequest(`/planner/notes/${noteId}`, { method: 'DELETE' });
    toast.info('Nota eliminada', 'El recordatorio ha sido descartado');
    loadData();
  };

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!releaseVersion.trim()) return;
    const lines = releaseEntryText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((description) => ({ category: 'feature', description }));

    const res = await apiRequest('/planner/releases', {
      method: 'POST',
      body: JSON.stringify({
        version: releaseVersion.trim(),
        title: releaseTitle.trim() || 'Nueva versión publicada',
        entries: lines.length > 0 ? lines : [{ category: 'feature', description: releaseTitle.trim() || 'Mejoras generales' }],
      }),
    });
    if (res.success) {
      toast.success('Release publicada', `Versión ${releaseVersion} registrada en el Changelog`);
      setIsReleaseModalOpen(false);
      setReleaseVersion('');
      setReleaseTitle('');
      setReleaseEntryText('');
      loadData();
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplName.trim() || !tplContent.trim()) return;
    const res = await apiRequest('/planner/templates', {
      method: 'POST',
      body: JSON.stringify({
        name: tplName.trim(),
        description: tplDescription.trim() || null,
        content: tplContent.trim(),
        scope: 'general',
      }),
    });
    if (res.success) {
      toast.success('Plantilla guardada', 'Plantilla reutilizable disponible para todo el equipo');
      setIsTemplateModalOpen(false);
      setTplName('');
      setTplDescription('');
      setTplContent('');
      loadData();
    }
  };

  const handleUseTemplate = (tpl: any) => {
    setTaskTitle(tpl.name);
    setTaskDescription(tpl.content || tpl.description || '');
    setIsTaskModalOpen(true);
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('agile', 'Planificador Ágil, Sprints & Proyectos')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('agileSubtitle', 'Gestión Scrum/Kanban, velocidad de Sprints, imputación horaria e integración ERP')}
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Export & Odoo Sync buttons */}
          <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              data-testid="btn-agile-sync-odoo"
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
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5"
              title="Sincronizar proyectos y tareas con la instancia Odoo conectada en DAMA-CRM"
            >
              <Zap className="w-3.5 h-3.5 text-purple-600" />
              <span>Sincronizar Odoo</span>
            </button>
            <button
              type="button"
              data-testid="btn-agile-export-csv"
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5"
              title="Exportar Proyectos a Excel (CSV)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              data-testid="btn-agile-export-pdf"
              onClick={handleExportPDF}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5"
              title="Descargar Informe de Proyectos en PDF"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF</span>
            </button>
          </div>

          <PermissionGate resource="projects" action="create">
            <button
              type="button"
              data-testid="btn-new-project"
              onClick={() => setIsProjectModalOpen(true)}
              className="inline-flex items-center space-x-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-[0.98] shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('newProject', 'Nuevo Proyecto')}</span>
            </button>
          </PermissionGate>

          <PermissionGate resource="tasks" action="create">
            <button
              type="button"
              data-testid="btn-new-task"
              onClick={() => setIsTaskModalOpen(true)}
              className="inline-flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-[0.98] shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('newTask', 'Nueva Tarea')}</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Executive KPI Strip (Anti-Glare Micro-Contrast) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="agile-kpi-strip">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Proyectos Activos</span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{kpis.projectsCount}</div>
            <span className="text-[10px] text-blue-600 font-semibold">{sprints.length} Sprints registrados</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
            <Folder className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Backlog & Story Points</span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {kpis.totalTasksCount} <span className="text-xs font-mono text-amber-600">({kpis.totalPoints} pts)</span>
            </div>
            <span className="text-[10px] text-slate-500">{myTasks.length} asignadas a ti</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Imputación Horaria</span>
            <div className="text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5">
              {kpis.totalLogged}h <span className="text-xs font-normal text-slate-400">/ {kpis.totalEstimated}h</span>
            </div>
            <span className="text-[10px] text-purple-600 font-semibold">Partes de trabajo activos</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Tasa de Entrega (DONE)</span>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{kpis.velocityPct}%</div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
              {kpis.doneCount} de {kpis.totalTasksCount} completadas
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Accessible WAI-ARIA Tab Navigation */}
      <div
        role="tablist"
        aria-label="Secciones del Planificador Ágil"
        className="flex flex-wrap bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs gap-1"
      >
        {[
          { id: 'board', label: 'Tablero Kanban' },
          { id: 'sprints', label: `Sprints & Backlog (${sprints.length})` },
          { id: 'my-tasks', label: `${t('myTasks', 'Mis Tareas')} (${myTasks.length})` },
          { id: 'projects', label: `Proyectos (${projects.length})` },
          { id: 'reminders', label: `Notas & Recordatorios (${notes.length})` },
          { id: 'releases', label: `Releases (${releases.length})` },
          { id: 'templates', label: `Plantillas (${templates.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            data-testid={`tab-agile-${tab.id}`}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-[0.98] ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: KANBAN BOARD */}
      {activeTab === 'board' && (
        <div className="space-y-3" data-testid="section-agile-board">
          {/* Quick Search, Project & Priority Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                data-testid="input-agile-search"
                aria-label="Buscar tareas en el tablero"
                placeholder="Buscar tareas por título, proyecto o descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                aria-label="Filtrar tareas por proyecto"
                data-testid="select-agile-project-filter"
                className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="ALL">Todos los proyectos ({projects.length})</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                aria-label="Filtrar tareas por prioridad"
                data-testid="select-agile-priority-filter"
                className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="ALL">Todas las prioridades</option>
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
            {columns.map((col) => {
              const colTasks = tasks.filter((taskItem, idx, arr) => {
                if (taskItem.status !== col.id || arr.findIndex((x) => x.id === taskItem.id) !== idx) return false;
                if (projectFilter !== 'ALL' && taskItem.projectId !== projectFilter) return false;
                if (priorityFilter !== 'ALL' && (taskItem.priority || 'MEDIUM').toUpperCase() !== priorityFilter) return false;
                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase();
                  const matchTitle = (taskItem.title || '').toLowerCase().includes(q);
                  const matchDesc = (taskItem.description || '').toLowerCase().includes(q);
                  const matchProj = (taskItem.project?.name || '').toLowerCase().includes(q);
                  if (!matchTitle && !matchDesc && !matchProj) return false;
                }
                return true;
              });
              return (
                <div
                  key={col.id}
                  data-testid={`kanban-col-${col.id}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className="bg-slate-200/55 dark:bg-slate-900/60 rounded-2xl p-3 border border-slate-200/90 dark:border-slate-800 min-h-[460px] flex flex-col"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">{col.label}</h3>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-2.5 flex-1">
                    {colTasks.map((task) => (
                      <div
                        key={task.id}
                        data-testid={`task-card-${task.id}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => handleOpenTaskDetails(task)}
                        className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                            {task.title}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                              task.priority === 'URGENT'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                : task.priority === 'HIGH'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-600 dark:text-slate-300 flex items-center justify-between gap-1 font-medium">
                          <span className="flex items-center gap-1 truncate">
                            <Folder className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{task.project?.name || 'Proyecto'}</span>
                          </span>
                          {task.sprint?.name && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[9px] font-semibold truncate max-w-[110px]">
                              {task.sprint.name}
                            </span>
                          )}
                        </div>

                        {task.assignee && (
                          <div className="text-[10px] text-slate-700 dark:text-slate-200 flex items-center space-x-1 font-medium">
                            <UserIcon className="w-3 h-3 text-blue-500" />
                            <span>{task.assignee.name}</span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-500">
                          <div className="flex items-center space-x-2">
                            <span className="flex items-center gap-0.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                              <Zap className="w-3 h-3" />
                              {task.storyPoints || 1}p
                            </span>
                            <span className="flex items-center gap-0.5 font-mono">
                              <Clock className="w-3 h-3" />
                              {task.loggedHours || 0}h/{task.estimatedHours || 0}h
                            </span>
                          </div>

                          {/* Accessible Quick Stage Selector for Touch / Keyboard */}
                          <select
                            value={task.status}
                            aria-label={`Cambiar estado de ${task.title}`}
                            data-testid={`select-task-status-${task.id}`}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleQuickStatusChange(task.id, e.target.value);
                            }}
                            className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-0.5 text-slate-700 dark:text-slate-300"
                          >
                            {columns.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}

                    {colTasks.length === 0 && (
                      <div className="h-28 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                        Sin tareas en esta etapa
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SPRINTS & BACKLOG (REAL DATABASE PERSISTENCE) */}
      {activeTab === 'sprints' && (
        <div className="space-y-4" data-testid="section-agile-sprints">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                <span>Sprints e Iteraciones Scrum Activas</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Planificación de ciclos de trabajo en base de datos, velocidad de equipo y asignación de puntos de historia.
              </p>
            </div>
            <button
              type="button"
              data-testid="btn-new-sprint"
              onClick={() => setIsSprintModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Nuevo Sprint</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sprints.map((sp) => {
              const spTasks = sp.tasks || tasks.filter((x) => x.sprintId === sp.id);
              const doneSp = spTasks.filter((x: any) => x.status === 'DONE').length;
              const pct = spTasks.length > 0 ? Math.round((doneSp / spTasks.length) * 100) : 0;
              const pts = spTasks.reduce((s: number, x: any) => s + (x.storyPoints || 0), 0);

              return (
                <div
                  key={sp.id}
                  data-testid={`sprint-card-${sp.id}`}
                  className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{sp.name}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {sp.status || 'ACTIVE'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Proyecto: {sp.project?.name || 'General'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSprint(sp.id)}
                      aria-label={`Eliminar sprint ${sp.name}`}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {sp.goal || 'Sin objetivo de sprint definido.'}
                  </p>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>
                        Avance: {doneSp}/{spTasks.length} tareas ({pts} pts)
                      </span>
                      <span className="font-bold text-indigo-600">{pct}% Velocidad</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {sp.startDate && sp.endDate && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(sp.startDate).toLocaleDateString('es-ES')} — {new Date(sp.endDate).toLocaleDateString('es-ES')}
                      </span>
                      <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">{spTasks.length} historias</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MY TASKS */}
      {activeTab === 'my-tasks' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3" data-testid="section-agile-my-tasks">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                <span>{t('agile.myPendingTasks', 'Mis Tareas Asignadas')}</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Optimizada para interacción táctil y reporte rápido desde cualquier dispositivo
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
              {myTasks.length} activas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {myTasks.map((tItem) => (
              <div
                key={tItem.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/70 transition-colors flex items-center justify-between"
              >
                <div className="space-y-1 cursor-pointer flex-1 mr-3" onClick={() => handleOpenTaskDetails(tItem)}>
                  <div className="text-xs font-bold text-slate-900 dark:text-white hover:text-blue-600">
                    {tItem.title}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center space-x-2">
                    <span>{tItem.project?.name}</span>
                    <span>•</span>
                    <span className="font-mono">{tItem.storyPoints || 1} pts</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenTaskDetails(tItem)}
                    aria-label={`Reportar tiempo en ${tItem.title}`}
                    className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 rounded-lg text-xs"
                    title="Ver detalles y reportar tiempo"
                  >
                    <Timer className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await apiRequest(`/projects/tasks/${tItem.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ status: 'DONE' }),
                      });
                      toast.success('Completada', `Tarea "${tItem.title}" finalizada`);
                      loadData();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1 shadow-xs transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{t('agile.completeTaskBtn', 'Completar')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {myTasks.length === 0 && (
            <div className="text-center py-10 text-xs text-slate-400">
              No tienes tareas pendientes asignadas actualmente.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PROJECTS LIST */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3" data-testid="section-agile-projects">
          {projects.map((p) => (
            <div
              key={p.id}
              data-testid={`project-card-${p.id}`}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</h3>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{p.description || 'Sin descripción'}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    {p.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenProjectMembers(p)}
                    aria-label={`Gestionar miembros de ${p.name}`}
                    className="p-1 text-slate-400 hover:text-indigo-500 rounded"
                    title="Gestionar miembros del proyecto"
                  >
                    <Users className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(p.id, p.name)}
                    aria-label={`Eliminar proyecto ${p.name}`}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded"
                    title={t('deleteProject', 'Eliminar proyecto')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  <span>
                    Progreso: {p.metrics?.completedTasks || 0}/{p.metrics?.totalTasks || 0} tareas
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">{p.metrics?.progressPercent || 0}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${p.metrics?.progressPercent || 0}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>
                  Horas: {p.metrics?.totalLoggedHours || 0}h / {p.metrics?.totalEstimatedHours || 0}h
                </span>
                <span>Puntos: {p.metrics?.totalStoryPoints || 0} pts</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: PINNABLE NOTES & REMINDERS (REAL DB PERSISTENCE) */}
      {activeTab === 'reminders' && (
        <div className="space-y-4" data-testid="section-agile-reminders">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Pin className="w-4 h-4 text-amber-500" />
                <span>Notas Fijables & Recordatorios de Equipo</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tablero persistente de notas rápidas, avisos de revisión y puntos críticos de entrega.
              </p>
            </div>
            <button
              type="button"
              data-testid="btn-new-note"
              onClick={() => setIsNoteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Nota / Recordatorio</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {notes.map((n) => (
              <div
                key={n.id}
                data-testid={`note-card-${n.id}`}
                className={`p-4 rounded-2xl border shadow-2xs space-y-2 ${
                  n.color === 'blue'
                    ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40'
                    : n.color === 'emerald'
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40'
                    : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    <Pin className="w-3.5 h-3.5 inline mr-1 text-amber-500 shrink-0" />{n.title || 'Nota de Proyecto'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleTogglePinNote(n)}
                      aria-label="Alternar fijado de nota"
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        n.pinned ? 'bg-amber-200 text-amber-900' : 'bg-white/80 text-slate-600'
                      }`}
                    >
                      {n.pinned ? 'Fijado' : 'Fijar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(n.id)}
                      aria-label="Eliminar nota"
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: RELEASES & CHANGELOG (REAL DB PERSISTENCE) */}
      {activeTab === 'releases' && (
        <div className="space-y-4" data-testid="section-agile-releases">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Historial de Versiones y Changelog (Releases)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registro oficial de despliegues, nuevas funcionalidades y parches de producción.
              </p>
            </div>
            <button
              type="button"
              data-testid="btn-new-release"
              onClick={() => setIsReleaseModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publicar Nueva Release</span>
            </button>
          </div>

          <div className="space-y-3">
            {releases.map((rel) => (
              <div
                key={rel.id}
                data-testid={`release-card-${rel.id}`}
                className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {rel.version}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{rel.title}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(rel.releasedAt || rel.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                  {(rel.entries || []).map((entry: any) => (
                    <li key={entry.id}>{entry.description}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: REUSABLE TASK TEMPLATES (REAL DB PERSISTENCE) */}
      {activeTab === 'templates' && (
        <div className="space-y-4" data-testid="section-agile-templates">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Plantillas de Especificación Reutilizables</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Estandariza la creación de Historias de Usuario, Reportes de Bug y Auditorías QA.
              </p>
            </div>
            <button
              type="button"
              data-testid="btn-new-template"
              onClick={() => setIsTemplateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Plantilla</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                data-testid={`template-card-${tpl.id}`}
                className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{tpl.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold">
                      {tpl.scope === 'general' ? 'Global' : 'Personal'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{tpl.description || 'Plantilla técnica estructurada'}</p>
                  <pre className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-mono whitespace-pre-wrap line-clamp-3">
                    {tpl.content}
                  </pre>
                </div>
                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    data-testid={`btn-use-template-${tpl.id}`}
                    onClick={() => handleUseTemplate(tpl)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-all active:scale-[0.98]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Usar en Nueva Tarea</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: TASK DETAILS */}
      <Modal
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        title={`Tarea: ${selectedTask?.title || ''}`}
        size="lg"
      >
        {selectedTask && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Estado</span>
                <select
                  aria-label="Estado de la tarea"
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
                <div className="font-bold text-slate-900 dark:text-white mt-1">{selectedTask.priority}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Estimación</span>
                <div className="font-bold text-slate-900 dark:text-white mt-1">
                  {selectedTask.estimatedHours || 0}h ({selectedTask.storyPoints || 1} pts)
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Horas Reportadas</span>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-1">{selectedTask.loggedHours || 0}h</div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5 mb-1">
                <FileCode className="w-3.5 h-3.5 text-blue-500" />
                <span>Descripción de la tarea (Markdown soportado)</span>
              </label>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-200 min-h-[60px] whitespace-pre-wrap font-sans">
                {selectedTask.description || 'Sin descripción detallada.'}
              </div>
            </div>

            {/* WorkLog Time Reporting Section */}
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200/60 dark:border-blue-900/40">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5">
                  <Timer className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Reporte de Horas</span>
                </div>
                <button
                  type="button"
                  data-testid="btn-toggle-worklog"
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
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Horas trabajadas *
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min="0.25"
                        required
                        aria-label="Horas trabajadas"
                        value={logHours}
                        onChange={(e) => setLogHours(e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        ¿Qué has realizado?
                      </label>
                      <input
                        type="text"
                        aria-label="Descripción del trabajo realizado"
                        placeholder="p.ej. Implementación de endpoints y testing"
                        value={logDescription}
                        onChange={(e) => setLogDescription(e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      data-testid="btn-save-worklog"
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
                    <div
                      key={log.id}
                      className="flex items-center justify-between text-[11px] bg-white/80 dark:bg-slate-900/60 px-2 py-1 rounded border border-slate-200/50 dark:border-slate-800"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-blue-600">{log.hours}h</span>
                        <span className="text-slate-700 dark:text-slate-300 truncate">{log.description || 'Sin notas'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments Thread */}
            <div className="space-y-2">
              <div className="flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Comentarios y Archivos ({taskComments.length})
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {taskComments.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-900 dark:text-white">{c.user?.name || 'Compañero'}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{c.content}</div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <textarea
                  rows={2}
                  aria-label="Nuevo comentario en la tarea"
                  placeholder="Escribe un comentario (formato Markdown soportado)..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      aria-label="URL de imagen adjunta"
                      placeholder="URL de imagen adjunta (opcional)..."
                      value={newCommentImageUrl}
                      onChange={(e) => setNewCommentImageUrl(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
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

      {/* MODAL: PROJECT MEMBERS */}
      <Modal
        isOpen={Boolean(selectedProjectForMembers)}
        onClose={() => setSelectedProjectForMembers(null)}
        title={`Miembros del Proyecto: ${selectedProjectForMembers?.name || ''}`}
        size="md"
      >
        <div className="space-y-4">
          <form onSubmit={handleAddProjectMember} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="text-xs font-bold text-slate-900 dark:text-white">Asignar Nuevo Miembro</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                required
                aria-label="Seleccionar usuario para el proyecto"
                value={newMemberUserId}
                onChange={(e) => setNewMemberUserId(e.target.value)}
                className="px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
              >
                <option value="">Seleccionar usuario...</option>
                {workspaceUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
              <select
                aria-label="Rol del miembro"
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                className="px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
              >
                <option value="DEVELOPER">Desarrollador</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
                <option value="DESIGNER">Diseñador</option>
                <option value="QA">QA / Tester</option>
                <option value="VIEWER">Observador</option>
              </select>
              <input
                type="number"
                aria-label="Tarifa por hora"
                placeholder="Tarifa €/h"
                value={newMemberHourlyRate}
                onChange={(e) => setNewMemberHourlyRate(e.target.value)}
                className="px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button type="submit" className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold">
                Asignar al Proyecto
              </button>
            </div>
          </form>

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {projectMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{m.user?.name}</div>
                  <div className="text-[10px] text-slate-500">{m.role}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveProjectMember(m.userId, m.user?.name || '')}
                  aria-label="Retirar miembro del proyecto"
                  className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* MODAL: CREATE TASK */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title={t('newTask', 'Nueva Tarea Técnica')}
        size="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-3" data-testid="form-create-task">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('taskTitle', 'Título de la Tarea')} *
            </label>
            <input
              type="text"
              required
              data-testid="input-task-title"
              aria-label="Título de la tarea"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Ej. Integrar webhook de pagos SEPA"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descripción / Especificaciones (Markdown)
            </label>
            <textarea
              rows={3}
              data-testid="input-task-desc"
              aria-label="Descripción de la tarea"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Detalla los requisitos, pasos o notas técnicas..."
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Proyecto *</label>
              <select
                aria-label="Proyecto de la tarea"
                value={taskProjectId}
                onChange={(e) => setTaskProjectId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sprint (Opcional)</label>
              <select
                aria-label="Sprint asignado"
                value={taskSprintId}
                onChange={(e) => setTaskSprintId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="">Backlog General</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Asignado a</label>
              <select
                aria-label="Empleado asignado"
                value={taskAssigneeId}
                onChange={(e) => setTaskAssigneeId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="">Sin asignar</option>
                {workspaceUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Story Points</label>
              <input
                type="number"
                aria-label="Story points"
                value={taskPoints}
                onChange={(e) => setTaskPoints(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Horas Est.</label>
              <input
                type="number"
                aria-label="Horas estimadas"
                value={taskHours}
                onChange={(e) => setTaskHours(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('priority', 'Prioridad')}
            </label>
            <select
              aria-label="Prioridad de la tarea"
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="LOW">{t('low', 'Baja')}</option>
              <option value="MEDIUM">{t('medium', 'Media')}</option>
              <option value="HIGH">{t('high', 'Alta')}</option>
              <option value="URGENT">{t('urgent', 'Urgente')}</option>
            </select>
          </div>

          <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
            >
              {t('cancel', 'Cancelar')}
            </button>
            <button
              type="submit"
              data-testid="btn-submit-task"
              className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              {t('save', 'Guardar Tarea')}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CREATE PROJECT */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title={t('newProject', 'Nuevo Proyecto Ágil')}
        size="md"
      >
        <form onSubmit={handleCreateProject} className="space-y-3" data-testid="form-create-project">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('projectName', 'Nombre del Proyecto')} *
            </label>
            <input
              type="text"
              required
              data-testid="input-project-name"
              aria-label="Nombre del proyecto"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Ej. Portal B2B Clientes Internacionales"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
            <textarea
              rows={2}
              aria-label="Descripción del proyecto"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Alcance y objetivos del proyecto..."
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('priority', 'Prioridad')}
              </label>
              <select
                aria-label="Prioridad del proyecto"
                value={projectPriority}
                onChange={(e) => setProjectPriority(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('budget', 'Presupuesto (€)')}
              </label>
              <input
                type="number"
                aria-label="Presupuesto del proyecto"
                value={projectBudget}
                onChange={(e) => setProjectBudget(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsProjectModalOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="btn-submit-project"
              className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              Crear Proyecto
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CREATE SPRINT */}
      <Modal
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        title="Planificar Nuevo Sprint Scrum"
        size="md"
      >
        <form onSubmit={handleCreateSprint} className="space-y-3" data-testid="form-create-sprint">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre del Sprint *</label>
            <input
              type="text"
              required
              data-testid="input-sprint-name"
              aria-label="Nombre del sprint"
              placeholder="Ej. Sprint 13 — Optimización Mobile & API"
              value={sprintName}
              onChange={(e) => setSprintName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Proyecto Asociado *</label>
            <select
              aria-label="Proyecto del sprint"
              value={sprintProjectId}
              onChange={(e) => setSprintProjectId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Objetivo del Sprint (Sprint Goal)</label>
            <textarea
              rows={2}
              aria-label="Objetivo del sprint"
              value={sprintGoal}
              onChange={(e) => setSprintGoal(e.target.value)}
              placeholder="Meta entregable al finalizar la iteración..."
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fecha Inicio</label>
              <input
                type="date"
                aria-label="Fecha de inicio del sprint"
                value={sprintStartDate}
                onChange={(e) => setSprintStartDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fecha Fin</label>
              <input
                type="date"
                aria-label="Fecha de fin del sprint"
                value={sprintEndDate}
                onChange={(e) => setSprintEndDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setIsSprintModalOpen(false)} className="px-3 py-1.5 text-xs font-semibold">
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="btn-submit-sprint"
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
            >
              Iniciar Sprint
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CREATE NOTE */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Nueva Nota / Recordatorio Fijable"
        size="md"
      >
        <form onSubmit={handleCreateNote} className="space-y-3" data-testid="form-create-note">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Título</label>
            <input
              type="text"
              data-testid="input-note-title"
              aria-label="Título de la nota"
              placeholder="Ej. Checklist de despliegue viernes"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contenido *</label>
            <textarea
              rows={3}
              required
              data-testid="input-note-content"
              aria-label="Contenido de la nota"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Escribe el recordatorio..."
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Color</label>
              <select
                aria-label="Color de la nota"
                value={noteColor}
                onChange={(e) => setNoteColor(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="amber">Ámbar</option>
                <option value="blue">Azul</option>
                <option value="emerald">Esmeralda</option>
              </select>
            </div>
            <div className="flex items-end pb-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={notePinned}
                  onChange={(e) => setNotePinned(e.target.checked)}
                />
                <span>Fijar en cabecera</span>
              </label>
            </div>
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setIsNoteModalOpen(false)} className="px-3 py-1.5 text-xs font-semibold">
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="btn-submit-note"
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold"
            >
              Guardar Nota
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CREATE RELEASE */}
      <Modal
        isOpen={isReleaseModalOpen}
        onClose={() => setIsReleaseModalOpen(false)}
        title="Publicar Nueva Versión (Release Changelog)"
        size="md"
      >
        <form onSubmit={handleCreateRelease} className="space-y-3" data-testid="form-create-release">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Versión *</label>
              <input
                type="text"
                required
                data-testid="input-release-version"
                aria-label="Número de versión"
                placeholder="v2.5.0"
                value={releaseVersion}
                onChange={(e) => setReleaseVersion(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Título de la Release *</label>
              <input
                type="text"
                required
                data-testid="input-release-title"
                aria-label="Título de la versión"
                placeholder="Ej. Automatización de Sprints & BI"
                value={releaseTitle}
                onChange={(e) => setReleaseTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cambios incluidos (uno por línea)
            </label>
            <textarea
              rows={3}
              aria-label="Lista de cambios de la versión"
              value={releaseEntryText}
              onChange={(e) => setReleaseEntryText(e.target.value)}
              placeholder="Nuevo motor de Sprints Scrum&#10;Integración con plantillas Markdown"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setIsReleaseModalOpen(false)} className="px-3 py-1.5 text-xs font-semibold">
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="btn-submit-release"
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
            >
              Publicar Release
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CREATE TEMPLATE */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Crear Plantilla de Tarea Reutilizable"
        size="md"
      >
        <form onSubmit={handleCreateTemplate} className="space-y-3" data-testid="form-create-template">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre de la Plantilla *</label>
            <input
              type="text"
              required
              data-testid="input-template-name"
              aria-label="Nombre de la plantilla"
              placeholder="Ej. Checklist Auditoría de Seguridad OWASP"
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Descripción Breve</label>
            <input
              type="text"
              aria-label="Descripción de la plantilla"
              value={tplDescription}
              onChange={(e) => setTplDescription(e.target.value)}
              placeholder="Para revisiones previas a despliegue..."
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Contenido / Estructura Markdown *
            </label>
            <textarea
              rows={4}
              required
              data-testid="input-template-content"
              aria-label="Contenido Markdown de la plantilla"
              value={tplContent}
              onChange={(e) => setTplContent(e.target.value)}
              placeholder="## Objetivo&#10;- [ ] Paso 1&#10;- [ ] Paso 2"
              className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={() => setIsTemplateModalOpen(false)} className="px-3 py-1.5 text-xs font-semibold">
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="btn-submit-template"
              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
            >
              Guardar Plantilla
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
