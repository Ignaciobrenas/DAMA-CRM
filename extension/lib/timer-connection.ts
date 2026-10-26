import type { ActiveTimerState } from "@/types/api";
import { getSession, setStoredTimer, getActiveServerUrl } from "./storage";
import { broadcast } from "./messaging";
import { updateBadge, recordToActiveTimerState } from "./badge";
import { deliverIncoming } from "./push";
import { getHarvestClockStatus } from "./api-client";

// Owns the persistent connection & server sync to DAMA-CRM's `/ws` WebSocket
// and `/api/employees/time-tracking/status` PostgreSQL endpoint.
// Because the timer timestamps are stored in PostgreSQL on the server,
// closing the browser or shutting down the PC never loses the active timer.

let ws: WebSocket | null = null;
let currentToken: string | null = null;

async function applyState(timer: ActiveTimerState | null): Promise<void> {
  await setStoredTimer(timer);
  await updateBadge(timer);
  broadcast({ type: "TIMER_STATE", timer });
}

/**
 * Reconcile extension timer state with PostgreSQL server truth
 */
export async function syncTimerFromServer(): Promise<ActiveTimerState | null> {
  const { token } = await getSession();
  if (!token) {
    await applyState(null);
    return null;
  }
  try {
    const status = await getHarvestClockStatus();
    const timer = status?.isClockedIn
      ? recordToActiveTimerState(status.activeRecord)
      : null;
    await applyState(timer);
    return timer;
  } catch {
    return null;
  }
}

export async function ensureConnected(): Promise<void> {
  const { token } = await getSession();
  const serverUrl = await getActiveServerUrl();
  if (!token || !serverUrl) {
    disconnectTimer();
    return;
  }

  // Always sync immediately from PostgreSQL REST API
  await syncTimerFromServer();

  if (ws && currentToken !== token) {
    disconnectTimer();
  }

  if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
    try {
      currentToken = token;
      const wsUrl = serverUrl.replace(/^http/i, "ws") + "/ws";
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        try {
          ws?.send(
            JSON.stringify({
              event: "auth:identify",
              data: { token },
            }),
          );
        } catch {
          // ignore
        }
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(String(evt.data));
          if (
            msg.event === "timer:updated" ||
            msg.event === "attendance:clock_in" ||
            msg.event === "attendance:clock_out"
          ) {
            void syncTimerFromServer();
          } else if (msg.event === "notification:new" && msg.data) {
            void deliverIncoming(msg.data);
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        ws = null;
      };

      ws.onerror = () => {
        ws = null;
      };
    } catch {
      ws = null;
    }
  }
}

export async function setTimer(timer: ActiveTimerState | null): Promise<void> {
  await applyState(timer);
}

export function requestTimer(): void {
  void syncTimerFromServer();
}

export function disconnectTimer(): void {
  if (ws) {
    try {
      ws.close();
    } catch {
      // ignore
    }
    ws = null;
  }
  currentToken = null;
}
