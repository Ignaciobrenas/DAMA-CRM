import { browser } from "wxt/browser";
import type { ActiveTimerState, HarvestTimeRecord } from "@/types/api";

// Toolbar badge reflects the timer: green when running, amber when paused,
// cleared when there's no active timer.

const GREEN = "#16a34a";
const AMBER = "#d97706";

/**
 * Total elapsed seconds for a timer, accounting for server-persisted accumulatedSeconds
 * and current running segment startTime.
 */
export function elapsedSeconds(timer: ActiveTimerState): number {
  const acc = timer.accumulatedSeconds || 0;
  if (timer.isPaused) {
    if (acc > 0) return acc;
    return Math.max(0, Math.floor((timer.elapsed || 0) / 1000));
  }
  const runningDiff = Math.max(0, Math.floor((Date.now() - timer.startTime) / 1000));
  return acc + runningDiff;
}

/**
 * Convert a server HarvestTimeRecord into the extension's ActiveTimerState
 */
export function recordToActiveTimerState(rec: HarvestTimeRecord | null | undefined): ActiveTimerState | null {
  if (!rec || rec.clockOut) return null;
  const startMs = new Date(rec.lastResumedAt || rec.clockIn).getTime();
  const accSec = rec.accumulatedSeconds || 0;
  const isPaused = Boolean(rec.isPaused);
  const currentElapsedSec = isPaused
    ? accSec
    : accSec + Math.max(0, Math.floor((Date.now() - startMs) / 1000));

  return {
    id: rec.id,
    taskId: rec.taskId || rec.id,
    taskKey: rec.projectName || rec.reason || "JORNADA",
    taskTitle: rec.taskTitle || rec.notes || rec.reason || "Jornada en curso",
    projectId: rec.projectId || null,
    projectName: rec.projectName || null,
    reason: rec.reason || "OFFICE",
    notes: rec.notes || null,
    isBillable: rec.isBillable ?? true,
    startTime: startMs,
    clockInIso: rec.clockIn,
    accumulatedSeconds: accSec,
    elapsed: currentElapsedSec * 1000,
    isPaused,
  };
}

function compactLabel(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}h` : `${h}:${String(rem).padStart(2, "0")}`;
}

export async function updateBadge(timer: ActiveTimerState | null): Promise<void> {
  const action = browser.action ?? (browser as any).browserAction;
  if (!action) return;

  if (!timer) {
    await action.setBadgeText({ text: "" });
    await action.setTitle?.({ title: "DAMA-CRM — Harvest Timer" });
    return;
  }

  const secs = elapsedSeconds(timer);
  await action.setBadgeText({ text: compactLabel(secs) });
  await action.setBadgeBackgroundColor?.({
    color: timer.isPaused ? AMBER : GREEN,
  });
  await action.setTitle?.({
    title: `${timer.isPaused ? "⏸ " : "▶ "}${timer.taskKey} — ${timer.taskTitle}`,
  });
}
