import { browser } from "wxt/browser";
import type { ActiveTimerState } from "@shared/types";

// Typed runtime message contracts between the popup UI and the background worker.
// The worker owns the socket + authoritative timer; the popup sends intents and
// receives state broadcasts.

export type RuntimeMessage =
  // popup -> background
  | { type: "AUTH_CHANGED" } // token changed (login/2FA): (re)connect socket + push
  | { type: "LOGOUT" } // clear socket, unsubscribe push
  | { type: "TIMER_GET" } // request current timer state
  | { type: "TIMER_SET"; timer: ActiveTimerState | null } // update timer
  // background -> popup
  | { type: "TIMER_STATE"; timer: ActiveTimerState | null }
  | { type: "AUTH_EXPIRED" };

export function sendToBackground(msg: RuntimeMessage): Promise<any> {
  return browser.runtime.sendMessage(msg).catch(() => undefined);
}

export function broadcast(msg: RuntimeMessage): void {
  // Best-effort broadcast to any open popup; ignore "no receiver" errors.
  browser.runtime.sendMessage(msg).catch(() => undefined);
}

export function onMessage(
  handler: (msg: RuntimeMessage) => void | Promise<any>,
): void {
  browser.runtime.onMessage.addListener((msg: any) => {
    return handler(msg as RuntimeMessage);
  });
}
