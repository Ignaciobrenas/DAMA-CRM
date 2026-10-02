import { io, type Socket } from "socket.io-client";
import type { ActiveTimerState } from "@shared/types";
import { getSession, setStoredTimer } from "./storage";
import { SERVER_URL } from "./config";
import { broadcast } from "./messaging";
import { updateBadge } from "./badge";
import { deliverIncoming } from "./push";

// Owns the socket.io connection to the dama-agile-planner `/ws` timer channel from the
// background worker. Mirrors client/lib/timer-socket.ts but targets an explicit
// server URL (the extension is not same-origin) and drives the badge + storage.
//
// MV3 note: the worker is killed when idle, dropping the socket. `ensureConnected`
// is safe to call repeatedly (on wake / alarm) and reconnects + resyncs.

let socket: Socket | null = null;
let currentToken: string | null = null;

async function applyState(timer: ActiveTimerState | null): Promise<void> {
  await setStoredTimer(timer);
  await updateBadge(timer);
  broadcast({ type: "TIMER_STATE", timer });
}

export async function ensureConnected(): Promise<void> {
  const { token } = await getSession();
  if (!token || !SERVER_URL) {
    disconnectTimer();
    return;
  }

  // Recreate the socket if credentials changed (e.g. re-login as another user).
  if (socket && currentToken !== token) {
    disconnectTimer();
  }

  if (!socket) {
    currentToken = token;
    socket = io(SERVER_URL, {
      path: "/ws",
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("timer:state", (timer: ActiveTimerState | null) => {
      void applyState(timer ?? null);
    });

    // Primary notification channel — see server/realtime/timer-socket.ts
    // notifyNewNotification(). Near-instant and needs no VAPID config, unlike
    // Web Push; the poll alarm only has to catch what this misses.
    socket.on(
      "notification:new",
      (n: { id: string; title: string; message: string; actionUrl?: string | null }) => {
        void deliverIncoming(n);
      },
    );

    socket.on("connect", () => {
      // Resync from the server on (re)connect.
      socket?.emit("timer:get");
    });

    socket.on("connect_error", (err) => {
      // Unauthorized -> token likely expired; the API layer / auth flow handles
      // re-login. Just log here.
      console.warn("[timer] connect_error", err?.message);
    });
  } else if (!socket.connected) {
    socket.connect();
    socket.emit("timer:get");
  }
}

/** Push a new timer state to the server (and reflect it locally immediately). */
export async function setTimer(timer: ActiveTimerState | null): Promise<void> {
  await ensureConnected();
  socket?.emit("timer:set", timer);
  await applyState(timer);
}

export function requestTimer(): void {
  socket?.emit("timer:get");
}

export function disconnectTimer(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  currentToken = null;
}
