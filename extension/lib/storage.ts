import { browser } from "wxt/browser";
import type { AuthUser, ActiveTimerState } from "@/types/api";
import { DEFAULT_SERVER_URL } from "./config";

// Single source of truth for cross-context state, held in browser.storage.local.

export interface StoredSession {
  token: string | null;
  user: AuthUser | null;
  serverUrl?: string;
}

export interface ExtensionState {
  session: StoredSession;
  timer: ActiveTimerState | null;
  lastSeenNotificationId: string | null;
}

export interface PendingTwoFactor {
  pendingToken: string;
  method: string | null;
}

const KEYS = {
  token: "token",
  user: "user",
  serverUrl: "serverUrl",
  timer: "timer",
  lastSeenNotificationId: "lastSeenNotificationId",
  pendingTwoFactor: "pendingTwoFactor",
} as const;

export async function getSession(): Promise<StoredSession> {
  const r = await browser.storage.local.get([KEYS.token, KEYS.user, KEYS.serverUrl]);
  return {
    token: (r[KEYS.token] as string) ?? null,
    user: (r[KEYS.user] as AuthUser) ?? null,
    serverUrl: ((r[KEYS.serverUrl] as string) || DEFAULT_SERVER_URL).replace(/\/$/, ""),
  };
}

export async function setSession(patch: Partial<StoredSession>): Promise<void> {
  const data: Record<string, unknown> = {};
  if ("token" in patch) data[KEYS.token] = patch.token;
  if ("user" in patch) data[KEYS.user] = patch.user;
  if ("serverUrl" in patch && patch.serverUrl) {
    data[KEYS.serverUrl] = patch.serverUrl.replace(/\/$/, "");
  }
  await browser.storage.local.set(data);
}

export async function getActiveServerUrl(): Promise<string> {
  const r = await browser.storage.local.get(KEYS.serverUrl);
  return ((r[KEYS.serverUrl] as string) || DEFAULT_SERVER_URL).replace(/\/$/, "");
}

export async function setActiveServerUrl(url: string): Promise<void> {
  await browser.storage.local.set({ [KEYS.serverUrl]: url.replace(/\/$/, "") });
}

export async function clearAuth(): Promise<void> {
  await browser.storage.local.remove([
    KEYS.token,
    KEYS.user,
    KEYS.timer,
    KEYS.pendingTwoFactor,
  ]);
}

export async function getStoredTimer(): Promise<ActiveTimerState | null> {
  const r = await browser.storage.local.get(KEYS.timer);
  return (r[KEYS.timer] as ActiveTimerState) ?? null;
}

export async function setStoredTimer(
  timer: ActiveTimerState | null,
): Promise<void> {
  await browser.storage.local.set({ [KEYS.timer]: timer });
}

export async function getPendingTwoFactor(): Promise<PendingTwoFactor | null> {
  const r = await browser.storage.local.get(KEYS.pendingTwoFactor);
  return (r[KEYS.pendingTwoFactor] as PendingTwoFactor) ?? null;
}

export async function setPendingTwoFactor(
  pending: PendingTwoFactor | null,
): Promise<void> {
  await browser.storage.local.set({ [KEYS.pendingTwoFactor]: pending });
}

export async function getLastSeenNotificationId(): Promise<string | null> {
  const r = await browser.storage.local.get(KEYS.lastSeenNotificationId);
  return (r[KEYS.lastSeenNotificationId] as string) ?? null;
}

export async function setLastSeenNotificationId(id: string): Promise<void> {
  await browser.storage.local.set({ [KEYS.lastSeenNotificationId]: id });
}

export const storageKeys = KEYS;
