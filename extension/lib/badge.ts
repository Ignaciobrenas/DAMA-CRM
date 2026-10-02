import { browser } from "wxt/browser";
import type { ActiveTimerState } from "@shared/types";

// Toolbar badge reflects the timer: green when running, amber when paused,
// cleared when there's no active timer. Text is compact (mm or h:mm) because the
// badge only fits ~4 chars.

const GREEN = "#16a34a";
const AMBER = "#d97706";

/**
 * Total elapsed seconds for a timer. `timer.elapsed` is milliseconds (shared
 * contract with the web client, see client/contexts/TimerContext.tsx): while
 * running the source of truth is `startTime`, while paused it's the frozen
 * `elapsed` snapshot. The two are not additive.
 */
export function elapsedSeconds(timer: ActiveTimerState): number {
  if (timer.isPaused) {
    return Math.max(0, Math.floor((timer.elapsed || 0) / 1000));
  }
  return Math.max(0, Math.floor((Date.now() - timer.startTime) / 1000));
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
    await action.setTitle?.({ title: "dama-agile-planner" });
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
