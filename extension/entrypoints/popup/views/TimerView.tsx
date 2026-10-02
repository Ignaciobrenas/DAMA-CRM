import { useEffect, useState } from "react";
import { browser } from "wxt/browser";
import { Timer as TimerIcon, X, Play, Pause, ExternalLink } from "lucide-react";
import type { ActiveTimerState } from "@shared/types";
import { getStoredTimer } from "@/lib/storage";
import { sendToBackground, onMessage } from "@/lib/messaging";
import { elapsedSeconds } from "@/lib/badge";
import { sendTaskToHarvest, getTask, ApiError } from "@/lib/api-client";
import { buildDeepLink } from "@/lib/deep-link";
import { SERVER_URL } from "@/lib/config";

function formatHMS(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function TimerView() {
  const [timer, setTimer] = useState<ActiveTimerState | null>(null);
  const [, forceTick] = useState(0);
  const [sending, setSending] = useState(false);
  const [openingTask, setOpeningTask] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  useEffect(() => {
    void getStoredTimer().then(setTimer);
    void sendToBackground({ type: "TIMER_GET" });
    onMessage((msg) => {
      if (msg.type === "TIMER_STATE") setTimer(msg.timer);
    });
  }, []);

  // Live tick while running.
  useEffect(() => {
    if (!timer || timer.isPaused) return;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  if (!timer) {
    return (
      <div className="center">
        No hay ningún timer activo.
        <br />
        Inicia uno desde una tarea en la web.
      </div>
    );
  }

  const secs = elapsedSeconds(timer);

  // `elapsed` is milliseconds (shared contract with the web client). Mirror
  // TimerContext's pauseTimer/resumeTimer: pausing freezes elapsed without
  // touching startTime, resuming shifts startTime so startTime+elapsed stays
  // continuous.
  function resume() {
    if (!timer || !timer.isPaused) return;
    const next: ActiveTimerState = {
      ...timer,
      isPaused: false,
      startTime: Date.now() - (timer.elapsed || 0),
    };
    setTimer(next);
    void sendToBackground({ type: "TIMER_SET", timer: next });
  }

  function pause() {
    if (!timer || timer.isPaused) return;
    const next: ActiveTimerState = {
      ...timer,
      isPaused: true,
      elapsed: Date.now() - timer.startTime,
    };
    setTimer(next);
    void sendToBackground({ type: "TIMER_SET", timer: next });
  }

  // The stored timer only has taskId/taskKey/taskTitle (no project id), so the
  // board deep link — /projects/:projectId/board?task=:id, same convention as
  // the web's own "copy task link" — needs one lookup first.
  async function openTask() {
    if (!timer || openingTask) return;
    setOpeningTask(true);
    setError(null);
    try {
      const task = await getTask(timer.taskId);
      const url = buildDeepLink(
        SERVER_URL,
        `/projects/${task.projectId}/board?task=${task.id}`,
      );
      if (url) await browser.tabs.create({ url });
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "No se pudo abrir la tarea");
    } finally {
      setOpeningTask(false);
    }
  }

  function confirmDiscard() {
    setTimer(null);
    setConfirmingDiscard(false);
    void sendToBackground({ type: "TIMER_SET", timer: null });
  }

  async function send() {
    if (!timer) return;
    setError(null);

    // Mirror TimerContext.sendToHarvest: use the freshest elapsed (live if
    // running, frozen if paused) converted to decimal hours.
    const elapsedMs = timer.isPaused ? timer.elapsed : Date.now() - timer.startTime;
    const decimalHours = Math.round((elapsedMs / 3600000) * 100) / 100;
    if (decimalHours <= 0) {
      setError("No hay tiempo que enviar");
      return;
    }

    setSending(true);
    try {
      await sendTaskToHarvest(timer.taskId, decimalHours);
      setTimer(null);
      void sendToBackground({ type: "TIMER_SET", timer: null });
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Error al enviar a Harvest");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="slide-clip">
      <div className={`slide-track${confirmingDiscard ? " show-second" : ""}`}>
        <div className="slide-panel">
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
                  {timer.isPaused ? "Timer pausado" : "Timer activo"}
                </span>
              </div>
              <button
                className="timer-discard-btn"
                onClick={() => setConfirmingDiscard(true)}
                disabled={sending}
                title="Descartar sin enviar"
              >
                <X size={13} />
              </button>
            </div>

            <div className="timer-badge-row">
              <span className="timer-badge">{timer.taskKey}</span>
              <button
                className="timer-open-btn"
                onClick={openTask}
                disabled={openingTask}
                title="Ver tarea"
              >
                <ExternalLink size={13} />
              </button>
            </div>
            <p className="timer-task-title">{timer.taskTitle}</p>
          </div>

          <div className="timer-box">
            <div className="timer-time">{formatHMS(secs)}</div>

            <div className="timer-actions">
              <button
                className="timer-action-btn play"
                onClick={resume}
                disabled={!timer.isPaused || sending}
              >
                <Play size={13} /> Reanudar
              </button>
              <button
                className="timer-action-btn pause"
                onClick={pause}
                disabled={timer.isPaused || sending}
              >
                <Pause size={13} /> Pausar
              </button>
              <button
                className="timer-action-btn send"
                onClick={send}
                disabled={sending}
              >
                {sending ? "…" : "Enviar"}
              </button>
            </div>

            {error && <div className="error">{error}</div>}
          </div>
        </div>

        <div className="slide-panel">
          <div className="timer-box">
            <p className="confirm-title">¿Descartar timer?</p>
            <p className="confirm-desc">
              Se descartarán <strong>{formatHMS(secs)}</strong> de tiempo registrado
              para la tarea <strong>{timer.taskKey}</strong>. El tiempo no se
              reportará a Harvest. Esta acción no se puede deshacer.
            </p>
            <div className="btn-row" style={{ marginTop: 14 }}>
              <button
                className="btn secondary"
                onClick={() => setConfirmingDiscard(false)}
              >
                Cancelar
              </button>
              <button className="btn danger" onClick={confirmDiscard}>
                Descartar timer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
