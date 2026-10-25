import { useEffect, useState, useCallback } from "react";
import { browser } from "wxt/browser";
import {
  Timer as TimerIcon,
  Play,
  Pause,
  Square,
  ExternalLink,
  Briefcase,
  CheckSquare,
  DollarSign,
  RotateCcw,
} from "lucide-react";
import type {
  ActiveTimerState,
  HarvestClockStatus,
  TrackableProject,
  TrackableTask,
} from "@/types/api";
import { getStoredTimer, getActiveServerUrl } from "@/lib/storage";
import { sendToBackground, onMessage } from "@/lib/messaging";
import { elapsedSeconds, recordToActiveTimerState } from "@/lib/badge";
import {
  getHarvestClockStatus,
  getTrackableTasks,
  startHarvestTimer,
  pauseHarvestTimer,
  resumeHarvestTimer,
  stopHarvestTimer,
  ApiError,
} from "@/lib/api-client";
import { DEFAULT_WEB_URL } from "@/lib/config";

function formatHMS(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function TimerView() {
  const [timer, setTimer] = useState<ActiveTimerState | null>(null);
  const [clockStatus, setClockStatus] = useState<HarvestClockStatus | null>(null);
  const [projects, setProjects] = useState<TrackableProject[]>([]);
  const [tasks, setTasks] = useState<TrackableTask[]>([]);

  // Harvest start/switch form state
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedReason, setSelectedReason] = useState<string>("OFFICE");
  const [isBillable, setIsBillable] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>("");
  const [showTaskForm, setShowTaskForm] = useState<boolean>(false);

  const [, forceTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncWithServer = useCallback(async () => {
    try {
      const [statusData, tasksData] = await Promise.all([
        getHarvestClockStatus(),
        getTrackableTasks(),
      ]);
      setClockStatus(statusData);
      setProjects(tasksData.projects || []);
      setTasks(tasksData.tasks || []);

      const activeState = statusData?.isClockedIn
        ? recordToActiveTimerState(statusData.activeRecord)
        : null;
      setTimer(activeState);
      void sendToBackground({ type: "TIMER_SET", timer: activeState });
    } catch {
      // Fallback to cached storage timer
    }
  }, []);

  useEffect(() => {
    void getStoredTimer().then(setTimer);
    void sendToBackground({ type: "TIMER_GET" });
    void syncWithServer();

    onMessage((msg) => {
      if (msg.type === "TIMER_STATE") setTimer(msg.timer);
    });
  }, [syncWithServer]);

  // 1-second live counter tick while running
  useEffect(() => {
    if (!timer || timer.isPaused) return;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const filteredTasks = selectedProjectId
    ? tasks.filter((t) => t.projectId === selectedProjectId)
    : tasks;

  function handleSelectTask(taskId: string) {
    setSelectedTaskId(taskId);
    if (taskId) {
      const found = tasks.find((t) => t.id === taskId);
      if (found?.projectId) setSelectedProjectId(found.projectId);
    }
  }

  async function handleStart(override?: {
    projectId?: string | null;
    projectName?: string | null;
    taskId?: string | null;
    taskTitle?: string | null;
    reason?: string | null;
    notes?: string | null;
    isBillable?: boolean;
    switchTask?: boolean;
  }) {
    setBusy(true);
    setError(null);
    try {
      const proj = projects.find(
        (p) => p.id === (override?.projectId ?? selectedProjectId),
      );
      const tsk = tasks.find(
        (t) => t.id === (override?.taskId ?? selectedTaskId),
      );

      const rec = await startHarvestTimer({
        projectId: (override?.projectId ?? selectedProjectId) || null,
        projectName: override?.projectName ?? proj?.name ?? null,
        taskId: (override?.taskId ?? selectedTaskId) || null,
        taskTitle:
          override?.taskTitle ?? (tsk ? `[${tsk.key}] ${tsk.title}` : null),
        reason: override?.reason ?? selectedReason,
        notes: (override?.notes ?? notes).trim() || undefined,
        isBillable: override?.isBillable ?? isBillable,
        switchTask: override?.switchTask ?? Boolean(timer),
      });

      const nextState = recordToActiveTimerState(rec);
      setTimer(nextState);
      setShowTaskForm(false);
      setNotes("");
      void sendToBackground({ type: "TIMER_SET", timer: nextState });
      await syncWithServer();
    } catch (err: unknown) {
      setError(
        err instanceof ApiError ? err.message : "Error al iniciar el timer",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handlePause() {
    if (!timer || timer.isPaused) return;
    setBusy(true);
    setError(null);
    try {
      const rec = await pauseHarvestTimer();
      const next = recordToActiveTimerState(rec);
      setTimer(next);
      void sendToBackground({ type: "TIMER_SET", timer: next });
      await syncWithServer();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Error al pausar");
    } finally {
      setBusy(false);
    }
  }

  async function handleResume() {
    if (!timer || !timer.isPaused) return;
    setBusy(true);
    setError(null);
    try {
      const rec = await resumeHarvestTimer();
      const next = recordToActiveTimerState(rec);
      setTimer(next);
      void sendToBackground({ type: "TIMER_SET", timer: next });
      await syncWithServer();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Error al reanudar");
    } finally {
      setBusy(false);
    }
  }

  async function handleStop() {
    if (!timer) return;
    setBusy(true);
    setError(null);
    try {
      await stopHarvestTimer(notes.trim() || undefined);
      setTimer(null);
      void sendToBackground({ type: "TIMER_SET", timer: null });
      await syncWithServer();
    } catch (err: unknown) {
      setError(
        err instanceof ApiError ? err.message : "Error al finalizar el fichaje",
      );
    } finally {
      setBusy(false);
    }
  }

  async function openWebApp() {
    const srv = await getActiveServerUrl();
    const targetUrl = srv.includes(":3000")
      ? DEFAULT_WEB_URL + "/#/my-time"
      : srv + "/#/my-time";
    await browser.tabs.create({ url: targetUrl });
  }

  const secs = timer ? elapsedSeconds(timer) : 0;
  const todayMins = clockStatus?.todayMinutes || 0;
  const todayCompleted = (clockStatus?.todayRecords || []).filter(
    (r) => r.clockOut,
  );

  return (
    <div>
      {/* Top Summary Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
          fontSize: 11,
          color: "var(--muted)",
        }}
      >
        <span>
          Total hoy:{" "}
          <strong style={{ color: "var(--text)", fontFamily: "monospace" }}>
            {Math.floor(todayMins / 60)}h {String(todayMins % 60).padStart(2, "0")}m
          </strong>
        </span>
        <button
          type="button"
          className="link"
          onClick={openWebApp}
          title="Abrir Mi Tiempo en DAMA-CRM"
        >
          Abrir en DAMA <ExternalLink size={11} />
        </button>
      </div>

      {/* Active Running/Paused Timer Box */}
      {timer && !showTaskForm ? (
        <>
          <div className="timer-box">
            <div className="timer-status-row">
              <div className="timer-status-left">
                <span className="timer-icon-wrap">
                  <TimerIcon size={14} />
                  <span
                    className={`timer-status-dot ${timer.isPaused ? "paused" : "running"}`}
                  />
                </span>
                <span className="timer-status-label">
                  {timer.isPaused
                    ? "Timer en pausa (Persistido)"
                    : "Contando en servidor"}
                </span>
              </div>
              {timer.isBillable && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: "var(--surface-2)",
                    color: "var(--text)",
                  }}
                >
                  $ Facturable
                </span>
              )}
            </div>

            <div className="timer-badge-row">
              <span className="timer-badge">{timer.taskKey}</span>
              <button
                className="timer-open-btn"
                onClick={openWebApp}
                title="Abrir en DAMA-CRM"
              >
                <ExternalLink size={13} />
              </button>
            </div>
            <p className="timer-task-title">{timer.taskTitle}</p>
            {timer.notes && (
              <p
                className="muted"
                style={{ margin: "4px 0 0", fontSize: 11 }}
              >
                {timer.notes}
              </p>
            )}
          </div>

          <div className="timer-box">
            <div className="timer-time">{formatHMS(secs)}</div>

            <div className="timer-actions">
              <button
                className="timer-action-btn play"
                onClick={handleResume}
                disabled={!timer.isPaused || busy}
              >
                <Play size={13} /> Reanudar
              </button>
              <button
                className="timer-action-btn pause"
                onClick={handlePause}
                disabled={timer.isPaused || busy}
              >
                <Pause size={13} /> Pausar
              </button>
              <button
                className="timer-action-btn send"
                onClick={handleStop}
                disabled={busy}
                title="Detener timer y guardar registro en tarea y jornada"
              >
                <Square size={12} /> {busy ? "…" : "Finalizar"}
              </button>
            </div>

            <button
              type="button"
              className="btn outline"
              style={{ marginTop: 10, padding: "6px 10px", fontSize: 12 }}
              onClick={() => setShowTaskForm(true)}
            >
              Cambiar de Tarea / Proyecto
            </button>

            {error && <div className="error">{error}</div>}
          </div>
        </>
      ) : (
        /* Start New Harvest Timer Form */
        <div className="timer-box">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {timer ? "Cambiar a Nueva Tarea" : "Iniciar Timer (Estilo Harvest)"}
            </span>
            <button
              type="button"
              onClick={() => setIsBillable((b) => !b)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: isBillable ? "var(--primary)" : "var(--surface-2)",
                color: isBillable ? "#fff" : "var(--muted)",
                cursor: "pointer",
              }}
            >
              <DollarSign size={11} />
              {isBillable ? "Facturable" : "No facturable"}
            </button>
          </div>

          <div className="field">
            <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Briefcase size={12} /> Proyecto / Tablero
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedTaskId("");
              }}
            >
              <option value="">General / Sin proyecto específico</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <CheckSquare size={12} /> Tarea Asignada
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => handleSelectTask(e.target.value)}
            >
              <option value="">Jornada general / Sin tarea</option>
              {filteredTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.key}] {t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Modalidad</label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
            >
              <option value="OFFICE">Oficina Central</option>
              <option value="REMOTE">Teletrabajo / Remoto</option>
              <option value="CLIENT_VISIT">Visita Comercial</option>
              <option value="OVERTIME">Horas Extra</option>
            </select>
          </div>

          <div className="field">
            <label>Notas / ¿En qué estás trabajando?</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Diseño de informe PDF, soporte cliente..."
            />
          </div>

          {error && <div className="error">{error}</div>}

          <div className="btn-row" style={{ marginTop: 10 }}>
            {timer && (
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowTaskForm(false)}
              >
                Cancelar
              </button>
            )}
            <button
              type="button"
              className="btn"
              onClick={() => handleStart({ switchTask: Boolean(timer) })}
              disabled={busy}
            >
              <Play size={14} />
              {busy
                ? "Iniciando…"
                : timer
                  ? "Cambiar e Iniciar Timer"
                  : "Fichar Hora / Iniciar Timer"}
            </button>
          </div>
        </div>
      )}

      {/* Today's Completed Entries (Harvest 1-Click Resume) */}
      {todayCompleted.length > 0 && (
        <div className="timer-box" style={{ marginTop: 12, padding: 12 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: 8,
              letterSpacing: "0.04em",
            }}
          >
            Entradas de Hoy ({todayCompleted.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {todayCompleted.slice(0, 4).map((rec) => (
              <div
                key={rec.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "6px 8px",
                  borderRadius: 8,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  fontSize: 12,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {rec.taskTitle || rec.projectName || rec.reason || "Jornada"}
                  </div>
                  {rec.notes && (
                    <div
                      className="muted"
                      style={{
                        fontSize: 10,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {rec.notes}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
                    {formatHMS(
                      rec.elapsedSeconds || (rec.durationMinutes || 1) * 60,
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleStart({
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
                    title="Reanudar esta tarea con un nuevo timer"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      borderRadius: 6,
                      width: 24,
                      height: 24,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
