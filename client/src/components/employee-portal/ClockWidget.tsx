import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock,
  Play,
  Pause,
  Square,
  CheckCircle2,
  Briefcase,
  CheckSquare,
  DollarSign,
  RotateCcw,
  X,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

export interface ActiveTimerRecord {
  id: string;
  clockIn: string;
  clockOut?: string | null;
  lastResumedAt?: string | null;
  pausedAt?: string | null;
  accumulatedSeconds?: number;
  elapsedSeconds?: number;
  isPaused?: boolean;
  reason?: string;
  notes?: string;
  projectId?: string | null;
  projectName?: string | null;
  taskId?: string | null;
  taskTitle?: string | null;
  isBillable?: boolean;
  durationMinutes?: number;
}

export interface ClockStatus {
  isClockedIn: boolean;
  activeRecord: ActiveTimerRecord | null;
  todayMinutes: number;
  todaySeconds?: number;
  todayRecordCount: number;
  todayRecords?: ActiveTimerRecord[];
  serverTimestamp?: string;
}

interface TrackableProject {
  id: string;
  name: string;
  key?: string;
  source: string;
}

interface TrackableTask {
  id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  projectId: string;
  projectName: string;
  source: string;
}

const LOCAL_TIMER_BACKUP_KEY = 'dama_harvest_active_timer';

/**
 * Compute live elapsed seconds from a TimeRecord's server timestamps.
 * Works across browser close, refresh, and PC shutdown because timestamps come from PostgreSQL.
 */
export function computeLiveSeconds(record: ActiveTimerRecord | null | undefined): number {
  if (!record) return 0;
  const accumulated = record.accumulatedSeconds || 0;
  if (record.clockOut) {
    return accumulated > 0 ? accumulated : (record.durationMinutes || 0) * 60;
  }
  if (record.isPaused) {
    return Math.max(0, accumulated);
  }
  const baseStart = new Date(record.lastResumedAt || record.clockIn).getTime();
  const runningDiff = Math.max(0, Math.floor((Date.now() - baseStart) / 1000));
  return accumulated + runningDiff;
}

export const ClockWidget: React.FC<{ compact?: boolean; onStatusChange?: () => void }> = ({
  compact = false,
  onStatusChange,
}) => {
  const { t } = useLanguage();
  const toast = useToast();

  // Initialize from local backup immediately so there is 0ms flash on page reload,
  // then immediately reconcile with PostgreSQL server state.
  const [status, setStatus] = useState<ClockStatus | null>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_TIMER_BACKUP_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isClockOutModalOpen, setIsClockOutModalOpen] = useState<boolean>(false);

  // Harvest form state
  const [selectedReason, setSelectedReason] = useState<string>('OFFICE');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [isBillable, setIsBillable] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  // Trackable projects & tasks from DAMA-CRM
  const [projects, setProjects] = useState<TrackableProject[]>([]);
  const [tasks, setTasks] = useState<TrackableTask[]>([]);

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() =>
    computeLiveSeconds(status?.activeRecord)
  );

  const syncFormWithActiveRecord = useCallback((rec: ActiveTimerRecord | null | undefined) => {
    if (!rec) return;
    if (rec.reason) setSelectedReason(rec.reason);
    setSelectedProjectId(rec.projectId || '');
    setSelectedTaskId(rec.taskId || '');
    setIsBillable(rec.isBillable ?? true);
    setNotes(rec.notes || '');
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiRequest('/employees/time-tracking/status');
      if (res.success && res.data) {
        setStatus(res.data);
        setElapsedSeconds(computeLiveSeconds(res.data.activeRecord));
        try {
          localStorage.setItem(LOCAL_TIMER_BACKUP_KEY, JSON.stringify(res.data));
        } catch {
          // ignore
        }
      }
    } catch {
      // Ignored in background polling
    }
  }, []);

  const fetchTrackableTasks = useCallback(async () => {
    try {
      const res = await apiRequest('/employees/time-tracking/tasks');
      if (res.success && res.data) {
        setProjects(res.data.projects || []);
        setTasks(res.data.tasks || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000); // 15s server sync

    const handleCustomSync = () => {
      fetchStatus();
    };
    window.addEventListener('dama:timer-updated', handleCustomSync);
    window.addEventListener('focus', handleCustomSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('dama:timer-updated', handleCustomSync);
      window.removeEventListener('focus', handleCustomSync);
    };
  }, [fetchStatus]);

  // Load projects & tasks when modal opens
  useEffect(() => {
    if (isModalOpen) {
      fetchTrackableTasks();
      if (status?.isClockedIn && status.activeRecord) {
        syncFormWithActiveRecord(status.activeRecord);
      }
    }
  }, [isModalOpen, fetchTrackableTasks, status?.isClockedIn, status?.activeRecord, syncFormWithActiveRecord]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalOpen) setIsModalOpen(false);
        if (isClockOutModalOpen) setIsClockOutModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isClockOutModalOpen]);

  // 1-second live tick when clocked in
  useEffect(() => {
    if (!status?.isClockedIn || !status.activeRecord) {
      setElapsedSeconds(0);
      return;
    }

    const updateElapsed = () => {
      setElapsedSeconds(computeLiveSeconds(status.activeRecord));
    };

    updateElapsed();
    if (status.activeRecord.isPaused) return;

    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [
    status?.isClockedIn,
    status?.activeRecord?.clockIn,
    status?.activeRecord?.lastResumedAt,
    status?.activeRecord?.accumulatedSeconds,
    status?.activeRecord?.isPaused,
  ]);

  const broadcastTimerSync = () => {
    window.dispatchEvent(new CustomEvent('dama:timer-updated'));
    if (onStatusChange) onStatusChange();
  };

  const formatTimer = (totalSeconds: number) => {
    const safe = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const formatMinutesShort = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${String(m).padStart(2, '0')}m`;
  };

  // Filtered tasks by selected project
  const filteredTasks = selectedProjectId
    ? tasks.filter((tk) => tk.projectId === selectedProjectId)
    : tasks;

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    if (taskId) {
      const found = tasks.find((tk) => tk.id === taskId);
      if (found && found.projectId) {
        setSelectedProjectId(found.projectId);
      }
    }
  };

  const handleClockIn = async (overridePayload?: Partial<ActiveTimerRecord & { switchTask?: boolean }>) => {
    setActionLoading(true);
    try {
      const projObj = projects.find((p) => p.id === (overridePayload?.projectId ?? selectedProjectId));
      const taskObj = tasks.find((tk) => tk.id === (overridePayload?.taskId ?? selectedTaskId));

      const res = await apiRequest('/employees/time-tracking/clock-in', {
        method: 'POST',
        body: JSON.stringify({
          reason: overridePayload?.reason ?? selectedReason,
          notes: (overridePayload?.notes ?? notes).trim() || undefined,
          projectId: (overridePayload?.projectId ?? selectedProjectId) || null,
          projectName: overridePayload?.projectName ?? projObj?.name ?? null,
          taskId: (overridePayload?.taskId ?? selectedTaskId) || null,
          taskTitle: overridePayload?.taskTitle ?? (taskObj ? `${taskObj.key} · ${taskObj.title}` : null),
          isBillable: overridePayload?.isBillable ?? isBillable,
          switchTask: overridePayload?.switchTask ?? false,
        }),
      });

      if (res.success) {
        toast.success(res.message || t('timeTracking.clockInSuccess'));
        setIsModalOpen(false);
        setNotes('');
        await fetchStatus();
        broadcastTimerSync();
      } else {
        toast.error(res.message || t('timeTracking.clockInError'));
      }
    } catch {
      toast.error(t('timeTracking.clockInError'));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePauseOrResume = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!status?.isClockedIn || !status.activeRecord) return;
    setActionLoading(true);
    try {
      const endpoint = status.activeRecord.isPaused
        ? '/employees/time-tracking/timer/resume'
        : '/employees/time-tracking/timer/pause';
      const res = await apiRequest(endpoint, { method: 'POST' });
      if (res.success) {
        toast.info(
          status.activeRecord.isPaused ? 'Timer Reanudado' : 'Timer en Pausa',
          res.message || ''
        );
        await fetchStatus();
        broadcastTimerSync();
      }
    } catch {
      toast.error('Error al cambiar estado del timer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateActiveMetadata = async () => {
    if (!status?.isClockedIn) return;
    setActionLoading(true);
    try {
      const projObj = projects.find((p) => p.id === selectedProjectId);
      const taskObj = tasks.find((tk) => tk.id === selectedTaskId);

      const res = await apiRequest('/employees/time-tracking/timer/update', {
        method: 'POST',
        body: JSON.stringify({
          reason: selectedReason,
          notes: notes.trim() || null,
          projectId: selectedProjectId || null,
          projectName: projObj?.name || null,
          taskId: selectedTaskId || null,
          taskTitle: taskObj ? `${taskObj.key} · ${taskObj.title}` : null,
          isBillable,
        }),
      });

      if (res.success) {
        toast.success('Timer Actualizado', 'Se ha actualizado la tarea y configuración del timer en curso.');
        setIsModalOpen(false);
        await fetchStatus();
        broadcastTimerSync();
      } else {
        toast.error(res.message || 'No se pudo actualizar el timer');
      }
    } catch {
      toast.error('Error al actualizar el timer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    try {
      const res = await apiRequest('/employees/time-tracking/clock-out', {
        method: 'POST',
        body: JSON.stringify({
          notes: notes.trim() || undefined,
          projectId: selectedProjectId || undefined,
          taskId: selectedTaskId || undefined,
          isBillable,
        }),
      });

      if (res.success) {
        toast.success(res.message || t('timeTracking.clockOutSuccess'));
        setIsClockOutModalOpen(false);
        setIsModalOpen(false);
        setNotes('');
        await fetchStatus();
        broadcastTimerSync();
      } else {
        toast.error(res.message || t('timeTracking.clockOutError'));
      }
    } catch {
      toast.error(t('timeTracking.clockOutError'));
    } finally {
      setActionLoading(false);
    }
  };

  const reasons = [
    { value: 'OFFICE', label: t('timeTracking.reasonOffice', 'Oficina Central') },
    { value: 'REMOTE', label: t('timeTracking.reasonRemote', 'Teletrabajo / Remoto') },
    { value: 'CLIENT_VISIT', label: t('timeTracking.reasonClientVisit', 'Visita Cliente') },
    { value: 'TRAVEL', label: t('timeTracking.reasonTravel', 'Viaje de Trabajo') },
    { value: 'MEDICAL', label: t('timeTracking.reasonMedical', 'Pausa / Médico') },
    { value: 'OVERTIME', label: t('timeTracking.reasonOvertime', 'Horas Extra') },
  ];

  const isPaused = Boolean(status?.activeRecord?.isPaused);
  const activeTaskLabel =
    status?.activeRecord?.taskTitle ||
    status?.activeRecord?.projectName ||
    status?.activeRecord?.reason ||
    'Jornada Activa';

  const renderHarvestModal = () => {
    if (!isModalOpen) return null;

    return createPortal(
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Fichaje de entrada y Timer Harvest"
        data-testid="clock-in-modal"
        onClick={() => setIsModalOpen(false)}
        className="fixed top-14 inset-x-0 bottom-0 z-40 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 m-auto overflow-y-auto animate-in fade-in duration-150"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-[95vw] sm:max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150 m-auto overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-2xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
                    {status?.isClockedIn ? 'Harvest Timer en Curso' : t('timeTracking.modalTitle', 'Iniciar Timer / Fichar Hora')}
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
                    Hoy: {formatMinutesShort(status?.todayMinutes || 0)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Persistencia en servidor activa — continúa aunque cierres el navegador o apagues el PC
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              aria-label="Cerrar ventana de timer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-6 space-y-4 overflow-y-auto">
            {/* Active Timer Live Banner when clocked in */}
            {status?.isClockedIn && status.activeRecord && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                      }`}
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {isPaused ? 'Timer en Pausa' : 'Contando en Servidor'}
                    </span>
                  </div>
                  <div
                    data-testid="harvest-modal-live-timer"
                    className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5"
                  >
                    {formatTimer(elapsedSeconds)}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
                    {activeTaskLabel}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    data-testid="harvest-modal-pause-resume-btn"
                    onClick={handlePauseOrResume}
                    disabled={actionLoading}
                    className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5"
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current text-emerald-600" />
                        <span>Reanudar</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pausar</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    data-testid="harvest-modal-stop-btn"
                    onClick={handleClockOut}
                    disabled={actionLoading}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition flex items-center gap-1.5"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Finalizar</span>
                  </button>
                </div>
              </div>
            )}

            {/* Harvest Project & Task Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>Proyecto / Tablero</span>
                </label>
                <select
                  aria-label="Seleccionar proyecto para el timer"
                  data-testid="harvest-project-select"
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    setSelectedTaskId('');
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">General / Sin proyecto específico</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tarea (Estilo Harvest)</span>
                </label>
                <select
                  aria-label="Seleccionar tarea para el timer"
                  data-testid="harvest-task-select"
                  value={selectedTaskId}
                  onChange={(e) => handleTaskSelect(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Jornada general / Sin tarea</option>
                  {filteredTasks.map((tk) => (
                    <option key={tk.id} value={tk.id}>
                      [{tk.key}] {tk.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Work Modality + Billable Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('timeTracking.selectReason', 'Modalidad / Ubicación')}
                </label>
                <button
                  type="button"
                  data-testid="harvest-billable-toggle"
                  onClick={() => setIsBillable((b) => !b)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                    isBillable
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                      : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}
                >
                  <DollarSign className="w-3 h-3" />
                  <span>{isBillable ? 'Tiempo Facturable' : 'No Facturable'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {reasons.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setSelectedReason(r.value)}
                    className={`px-3 py-2 text-xs font-medium rounded-xl border text-left transition flex items-center justify-between ${
                      selectedReason === r.value
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate">{r.label}</span>
                    {selectedReason === r.value && (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 ml-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('timeTracking.notesOptional', 'Notas / ¿En qué estás trabajando?')}
              </label>
              <textarea
                aria-label="Notas opcionales de entrada"
                data-testid="harvest-notes-input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Desarrollo de integración Veri*Factu, revisión de sprint..."
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Today's Timesheet Entries (Harvest Quick Resume) */}
            {status?.todayRecords && status.todayRecords.filter((r) => r.clockOut).length > 0 && (
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Entradas Registradas Hoy (1-Click Reanudar)
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {status.todayRecords.filter((r) => r.clockOut).length} sesiones
                  </span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {status.todayRecords
                    .filter((r) => r.clockOut)
                    .slice(0, 5)
                    .map((rec) => (
                      <div
                        key={rec.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {rec.taskTitle || rec.projectName || rec.reason || 'Jornada General'}
                          </div>
                          {rec.notes && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {rec.notes}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {formatTimer(rec.elapsedSeconds || (rec.durationMinutes || 1) * 60)}
                          </span>
                          <button
                            type="button"
                            data-testid={`harvest-resume-entry-${rec.id}`}
                            onClick={() =>
                              handleClockIn({
                                projectId: rec.projectId,
                                projectName: rec.projectName,
                                taskId: rec.taskId,
                                taskTitle: rec.taskTitle,
                                reason: rec.reason,
                                notes: rec.notes,
                                isBillable: rec.isBillable,
                                switchTask: true,
                              })
                            }
                            title="Reanudar esta tarea con un nuevo timer (Harvest)"
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/90 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              {t('cancel', 'Cancelar')}
            </button>

            <div className="flex items-center gap-2">
              {status?.isClockedIn ? (
                <>
                  <button
                    type="button"
                    data-testid="harvest-update-timer-btn"
                    onClick={handleUpdateActiveMetadata}
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition"
                  >
                    Actualizar Tarea Actual
                  </button>
                  <button
                    type="button"
                    data-testid="confirm-clock-in-btn"
                    onClick={() => handleClockIn({ switchTask: true })}
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Cambiar a Nueva Tarea</span>
                  </button>
                </>
              ) : (
                <button
                  data-testid="confirm-clock-in-btn"
                  type="button"
                  onClick={() => handleClockIn()}
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition flex items-center space-x-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{actionLoading ? t('loading') : t('timeTracking.confirmClockIn', 'Iniciar Timer')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const renderClockOutModal = () => {
    if (!isClockOutModalOpen) return null;

    return createPortal(
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Fichaje de salida"
        data-testid="clock-out-modal"
        onClick={() => setIsClockOutModalOpen(false)}
        className="fixed top-14 inset-x-0 bottom-0 z-40 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 m-auto overflow-y-auto animate-in fade-in duration-150"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-[95vw] sm:max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 m-auto"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-rose-50 dark:bg-rose-950/50 rounded-xl text-rose-600 dark:text-rose-400">
                <Square className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {t('timeTracking.clockOut', 'Finalizar Timer / Salida')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Guardar registro horario e imputación de tarea
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tiempo Computado
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                  {activeTaskLabel}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Inicio: {status?.activeRecord?.clockIn ? new Date(status.activeRecord.clockIn).toLocaleTimeString() : '--:--'}
                </span>
              </div>
              <div className="font-mono tabular-nums text-xl font-black text-slate-900 dark:text-white">
                {formatTimer(elapsedSeconds)}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('timeTracking.notesOptional', 'Notas de cierre (opcional)')}
              </label>
              <textarea
                aria-label="Notas opcionales de salida"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Resumen del trabajo completado en esta sesión..."
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsClockOutModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              {t('cancel', 'Cancelar')}
            </button>
            <button
              type="button"
              data-testid="confirm-clock-out-btn"
              onClick={handleClockOut}
              disabled={actionLoading}
              className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition flex items-center space-x-1.5"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>{actionLoading ? t('loading') : 'Confirmar Salida'}</span>
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  if (compact) {
    return (
      <div className="flex items-center" data-testid="topbar-clock-widget">
        {status?.isClockedIn ? (
          <div
            data-testid="topbar-timer-pill"
            className="h-9 flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl px-2.5 shadow-2xs"
          >
            {/* Clickable timer & task trigger to open Harvest Popup */}
            <button
              type="button"
              data-testid="topbar-timer-open-modal-btn"
              onClick={() => setIsModalOpen(true)}
              title={`Harvest Timer: ${activeTaskLabel} (Click para abrir popup)`}
              className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity pr-1"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                {!isPaused && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isPaused ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
              </span>
              <span
                data-testid="topbar-timer-elapsed"
                className="font-mono tabular-nums text-xs font-bold text-slate-900 dark:text-white"
              >
                {formatTimer(elapsedSeconds)}
              </span>
              <span className="hidden xl:inline-block text-[11px] font-medium text-slate-500 dark:text-slate-400 max-w-[130px] truncate border-l border-slate-200 dark:border-slate-800 pl-2">
                {activeTaskLabel}
              </span>
            </button>

            {/* Quick Pause / Resume button */}
            <button
              type="button"
              data-testid="topbar-timer-pause-resume-btn"
              onClick={handlePauseOrResume}
              disabled={actionLoading}
              aria-label={isPaused ? 'Reanudar Timer' : 'Pausar Timer'}
              title={isPaused ? 'Reanudar Timer' : 'Pausar Timer'}
              className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isPaused ? (
                <Play className="w-3.5 h-3.5 fill-current text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Pause className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              )}
            </button>

            {/* Quick Stop / Clock-Out button */}
            <button
              type="button"
              data-testid="topbar-timer-stop-btn"
              onClick={() => setIsClockOutModalOpen(true)}
              disabled={actionLoading}
              aria-label={t('timeTracking.clockOut', 'Fichar Salida')}
              title={t('timeTracking.clockOut', 'Fichar Salida')}
              className="p-1 text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            data-testid="topbar-clock-in-btn"
            onClick={() => setIsModalOpen(true)}
            disabled={actionLoading}
            aria-label={t('timeTracking.clockIn', 'Fichar Entrada')}
            title={t('timeTracking.clockIn', 'Fichar Entrada / Abrir Timer Harvest')}
            className="h-9 flex items-center space-x-1.5 px-3 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-2xs transition-colors"
          >
            <Play className="w-3 h-3 fill-current" />
            <span className="hidden sm:inline">{t('timeTracking.clockIn', 'Fichar Hora')}</span>
          </button>
        )}

        {renderHarvestModal()}
        {renderClockOutModal()}
      </div>
    );
  }

  // Extended view for EmployeePortal or MyTime headers
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              status?.isClockedIn
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200/80 dark:border-slate-700'
            }`}
          >
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 dark:text-white text-base">
                {status?.isClockedIn ? t('timeTracking.clockedInStatus') : t('timeTracking.notClockedInStatus')}
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                  status?.isClockedIn
                    ? isPaused
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {status?.isClockedIn ? (isPaused ? 'En Pausa' : t('active')) : t('inactive')}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {status?.isClockedIn
                ? `${activeTaskLabel}${status.activeRecord?.isBillable ? ' • Facturable' : ''}`
                : t('timeTracking.dailyLegalNotice')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {status?.isClockedIn && (
            <div className="text-right mr-2">
              <div className="font-mono tabular-nums text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatTimer(elapsedSeconds)}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                {t('timeTracking.sessionTime')}
              </div>
            </div>
          )}

          {status?.isClockedIn ? (
            <>
              <button
                type="button"
                onClick={handlePauseOrResume}
                disabled={actionLoading}
                className="px-3.5 py-2.5 rounded-xl font-semibold text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition flex items-center space-x-1.5"
              >
                {isPaused ? <Play className="w-3.5 h-3.5 fill-current text-emerald-600" /> : <Pause className="w-3.5 h-3.5 text-amber-600" />}
                <span>{isPaused ? 'Reanudar' : 'Pausar'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                disabled={actionLoading}
                className="px-3.5 py-2.5 rounded-xl font-semibold text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
              >
                Tarea / Notas
              </button>
              <button
                data-testid="clock-out-btn"
                onClick={() => setIsClockOutModalOpen(true)}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition flex items-center space-x-2"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>{actionLoading ? t('loading') : t('timeTracking.clockOut')}</span>
              </button>
            </>
          ) : (
            <button
              data-testid="clock-in-btn"
              onClick={() => setIsModalOpen(true)}
              disabled={actionLoading}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition flex items-center space-x-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{actionLoading ? t('loading') : t('timeTracking.clockIn')}</span>
            </button>
          )}
        </div>
      </div>

      {renderHarvestModal()}
      {renderClockOutModal()}
    </div>
  );
};
