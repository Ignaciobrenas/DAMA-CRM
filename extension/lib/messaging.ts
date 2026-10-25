import { browser } from "wxt/browser";
import type { ActiveTimerState } from "@/types/api";

// Typed runtime message contracts between the popup UI and the background worker.

export type RuntimeMessage =
  // popup -> background
  | { type: "AUTH_CHANGED" }
  | { type: "LOGOUT" }
  | { type: "TIMER_GET" }
  | { type: "TIMER_SET"; timer: ActiveTimerState | null }
  // background -> popup
  | { type: "TIMER_STATE"; timer: ActiveTimerState | null }
  | { type: "AUTH_EXPIRED" };

export function sendToBackground(msg: RuntimeMessage): Promise<any> {
  return browser.runtime.sendMessage(msg).catch(() => undefined);
}

export function broadcast(msg: RuntimeMessage): void {
  browser.runtime.sendMessage(msg).catch(() => undefined);
}

export function onMessage(
  handler: (msg: RuntimeMessage) => void | Promise<any>,
): void {
  browser.runtime.onMessage.addListener((msg: any) => {
    return handler(msg as RuntimeMessage);
  });
}
