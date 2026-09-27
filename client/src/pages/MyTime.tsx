import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Play,
  Square,
  CheckCircle2,
  Calendar,
  Layers,
  FileSpreadsheet,
  MapPin,
  Coffee,
  Briefcase,
  TrendingUp,
  AlertCircle,
  Plus,
  Trash2,
  Filter,
  X,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { soundService } from '../services/sound';
import { LoadingState } from '../components/ui/LoadingState';
import { FriendlyErrorState } from '../components/ui/FriendlyErrorState';

export const MyTime: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'attendance' | 'worklogs'>('attendance');
  const [clockStatus, setClockStatus] = useState<any>(null);
  const [timeRecords, setTimeRecords] = useState<any[]>([]);
  const [taskWorkLogs, setTaskWorkLogs] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClocking, setIsClocking] = useState(false);

  // Clock in form state
  const [clockReason, setClockReason] = useState('Oficina Central');
  const [clockType, setClockType] = useState('WORK');
  const [clockNotes, setClockNotes] = useState('');

  // Report time on task modal state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logTaskId, setLogTaskId] = useState('');
  const [logHours, setLogHours] = useState('1');
  const [logDescription, setLogDescription] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLogging, setIsLogging] = useState(false);

  // Live timer for active clock-in
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resStatus, resHistory, resWorkLogs, resTasks] = await Promise.all([
        apiRequest('/employees/time-tracking/status'),
        apiRequest('/employees/time-tracking/history?limit=30'),
        apiRequest('/projects/my-worklogs'),
        apiRequest('/projects/my-tasks'),
      ]);

      if (resStatus.success) setClockStatus(resStatus.data);
      if (resHistory.success) setTimeRecords(resHistory.data || []);
      if (resWorkLogs.success) setTaskWorkLogs(resWorkLogs.data || []);
      if (resTasks.success) setMyTasks(resTasks.data || []);
    } catch {
      toast.error('Error', 'No se pudieron cargar los datos de tiempo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update live timer when clocked in
  useEffect(() => {
    if (!clockStatus?.isClockedIn || !clockStatus?.activeRecord?.clockIn) {
      setLiveElapsedSeconds(0);
      return;
    }

    const clockInTime = new Date(clockStatus.activeRecord.clockIn).getTime();
    const updateTimer = () => {
      const now = Date.now();
      setLiveElapsedSeconds(Math.max(0, Math.floor((now - clockInTime) / 1000)));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [clockStatus]);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleClockIn = async () => {
    setIsClocking(true);
    soundService.play('action');
    try {
      const res = await apiRequest('/employees/time-tracking/clock-in', {
        method: 'POST',
        body: JSON.stringify({
          type: clockType,
          reason: clockReason,
          notes: clockNotes,
        }),
      });

      if (res.success) {
        soundService.play('success');
        toast.success('Jornada Iniciada', 'Fichaje de entrada registrado correctamente');
        loadData();
      } else {
        toast.error('Error', res.message || 'No se pudo registrar el fichaje');
      }
    } catch (err: any) {
      toast.error('Error', err.message || 'Error de conexión');
    } finally {
      setIsClocking(false);
    }
  };

  const handleClockOut = async () => {
    setIsClocking(true);
    soundService.play('action');
    try {
      const res = await apiRequest('/employees/time-tracking/clock-out', {
        method: 'POST',
        body: JSON.stringify({ notes: clockNotes }),
      });

      if (res.success) {
        soundService.play('success');
        toast.success('Jornada Finalizada', res.message || 'Fichaje de salida registrado');
        setClockNotes('');
        loadData();
      } else {
        toast.error('Error', res.message || 'No se pudo cerrar el fichaje');
      }
    } catch (err: any) {
      toast.error('Error', err.message || 'Error de conexión');
    } finally {
      setIsClocking(false);
    }
  };

  const handleLogTaskHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTaskId) {
      toast.error('Selecciona una tarea', 'Debes elegir la tarea en la que reportar tiempo');
      return;
    }

    setIsLogging(true);
    soundService.play('action');
    try {
      const res = await apiRequest(`/projects/tasks/${logTaskId}/worklogs`, {
        method: 'POST',
        body: JSON.stringify({
          hours: parseFloat(logHours),
          description: logDescription,
          date: logDate,
        }),
      });

      if (res.success) {
        soundService.play('success');
        toast.success('Horas Reportadas', `Se han registrado ${logHours}h en la tarea`);
        setIsLogModalOpen(false);
        setLogDescription('');
        setLogHours('1');
        loadData();
      } else {
        toast.error('Error', res.message || 'No se pudieron registrar las horas');
      }
    } catch (err: any) {
      toast.error('Error', err.message || 'Error al conectar');
    } finally {
      setIsLogging(false);
    }
  };

  const totalReportedHours = taskWorkLogs.reduce((acc, l) => acc + l.hours, 0);
  const todayClockedMinutes = clockStatus?.todayMinutes || 0;
  const todayClockedHours = (todayClockedMinutes / 60).toFixed(1);

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Mi Tiempo y Fichajes
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Control de jornada laboral, fichajes oficiales y registro de tiempo en tareas de proyectos
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm shadow-blue-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Reportar Horas en Tarea</span>
          </button>
        </div>
      </div>

      {/* Main Clock-In Control Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Col 1: Status & Live Timer */}
          <div className="space-y-2 text-center md:text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Estado de Jornada
            </span>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <span
                className={`w-3 h-3 rounded-full ${
                  clockStatus?.isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {clockStatus?.isClockedIn ? 'Jornada en Curso' : 'Fuera de Jornada / Desconectado'}
              </span>
            </div>

            {clockStatus?.isClockedIn && (
              <div className="font-mono text-3xl font-extrabold text-blue-600 dark:text-blue-400 pt-1">
                {formatTimer(liveElapsedSeconds)}
              </div>
            )}
          </div>

          {/* Col 2: Context / Reasons */}
          {!clockStatus?.isClockedIn ? (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Lugar / Modalidad de Trabajo
              </label>
              <select
                value={clockReason}
                onChange={(e) => setClockReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="Oficina Central">Oficina Central</option>
                <option value="Teletrabajo / Remoto">Teletrabajo / Remoto</option>
                <option value="Visita Comercial">Visita Comercial</option>
                <option value="Formación">Formación</option>
                <option value="Viaje de Trabajo">Viaje de Trabajo</option>
              </select>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="text-slate-500">Modalidad: <span className="font-semibold text-slate-800 dark:text-slate-200">{clockStatus?.activeRecord?.reason || 'Oficina'}</span></div>
              <div className="text-slate-500">Hora de inicio: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{new Date(clockStatus?.activeRecord?.clockIn).toLocaleTimeString()}</span></div>
            </div>
          )}

          {/* Col 3: Actions */}
          <div className="flex justify-center md:justify-end">
            {!clockStatus?.isClockedIn ? (
              <button
                type="button"
                onClick={handleClockIn}
                disabled={isClocking}
                className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Fichar Entrada</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClockOut}
                disabled={isClocking}
                className="w-full md:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-rose-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Fichar Salida</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Fichado Hoy</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
            {todayClockedHours}h
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Jornada computable legal</p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Reportado en Tareas</span>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-1">
            {totalReportedHours.toFixed(1)}h
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{taskWorkLogs.length} registros en proyectos</p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Mis Tareas Activas</span>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono mt-1">
            {myTasks.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Asignadas en sprints</p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Cumplimiento RGPD</span>
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Registro Conforme</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Estatuto de los Trabajadores</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl max-w-md border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'attendance'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Registro de Fichajes
        </button>
        <button
          onClick={() => setActiveTab('worklogs')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'worklogs'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Tiempo en Tareas y Proyectos ({taskWorkLogs.length})
        </button>
      </div>

      {/* TAB 1: ATTENDANCE RECORDS */}
      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Historial de Fichajes y Horarios
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">{timeRecords.length} registros</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 font-semibold">
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Entrada</th>
                  <th className="py-3 px-4">Salida</th>
                  <th className="py-3 px-4">Duración</th>
                  <th className="py-3 px-4">Modalidad</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {timeRecords.length > 0 ? (
                  timeRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {new Date(r.clockIn).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {new Date(r.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {r.clockOut ? new Date(r.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'En curso'}
                      </td>
                      <td className="py-3 px-4 font-bold font-mono text-blue-600 dark:text-blue-400">
                        {r.durationMinutes ? `${Math.floor(r.durationMinutes / 60)}h ${r.durationMinutes % 60}m` : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.reason || 'Oficina'}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {r.status || 'Válido'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                      No hay registros de fichaje todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TASK WORKLOGS */}
      {activeTab === 'worklogs' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Desglose de Tiempo Reportado en Proyectos
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">Total: {totalReportedHours.toFixed(1)}h</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 font-semibold">
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Proyecto</th>
                  <th className="py-3 px-4">Tarea</th>
                  <th className="py-3 px-4">Horas</th>
                  <th className="py-3 px-4">Descripción / Resumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {taskWorkLogs.length > 0 ? (
                  taskWorkLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {new Date(log.date || log.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-indigo-600 dark:text-indigo-400">
                        {log.task?.project?.name || 'Proyecto General'}
                      </td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">
                        {log.task?.title || 'Tarea'}
                      </td>
                      <td className="py-3 px-4 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {log.hours}h
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {log.description || 'Reporte estándar'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                      No has reportado horas en tareas todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Report Hours on Task */}
      {isLogModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setIsLogModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Reportar Horas de Trabajo</span>
              </h3>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogTaskHours} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Seleccionar Tarea *</label>
                <select
                  value={logTaskId}
                  onChange={(e) => setLogTaskId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  required
                >
                  <option value="">-- Selecciona una tarea --</option>
                  {myTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.project?.name || 'Proyecto'}] {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Horas dedicadas *</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    value={logHours}
                    onChange={(e) => setLogHours(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Fecha *</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Resumen / Trabajo Realizado</label>
                <textarea
                  rows={3}
                  value={logDescription}
                  onChange={(e) => setLogDescription(e.target.value)}
                  placeholder="Descripción de la tarea o avance..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLogging}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
                >
                  {isLogging ? 'Guardando...' : 'Guardar Horas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
