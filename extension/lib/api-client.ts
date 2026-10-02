import { getSession, clearAuth } from "./storage";
import { broadcast } from "./messaging";
import { SERVER_URL } from "./config";
import type {
  ServerNotification,
  Note,
  LoginResponse,
  AuthUser,
} from "@/types/api";

// Thin fetch wrapper: prepends the (build-time, see lib/config.ts) server base
// URL, attaches the JWT as a Bearer token, and treats any 401 as an expired
// session (clears the token and notifies the UI to route back to login).

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean; // default true
  tokenOverride?: string;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  if (!SERVER_URL) throw new ApiError(0, "Server URL not configured");

  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const useAuth = opts.auth !== false;
  const token = opts.tokenOverride ?? (await getSession()).token;
  if (useAuth && token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(joinUrl(SERVER_URL, path), {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 && useAuth) {
    await clearAuth();
    broadcast({ type: "AUTH_EXPIRED" });
    throw new ApiError(401, "Session expired");
  }

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// ---- Auth ---------------------------------------------------------------

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export function verifyTwoFactor(
  pendingToken: string,
  code: string,
): Promise<{ user: AuthUser; token: string }> {
  return apiFetch("/api/auth/2fa/verify", {
    method: "POST",
    body: { pendingToken, code },
    auth: false,
  });
}

export function verifyToken(): Promise<{ user: AuthUser }> {
  return apiFetch<{ user: AuthUser }>("/api/auth/verify");
}

// ---- Notifications ------------------------------------------------------

export function getNotifications(): Promise<ServerNotification[]> {
  return apiFetch<ServerNotification[]>("/api/notifications");
}

export function markNotificationRead(id: string): Promise<unknown> {
  return apiFetch(`/api/notifications/${id}/read`, { method: "POST" });
}

export function markAllNotificationsRead(): Promise<unknown> {
  return apiFetch("/api/notifications/read-all", { method: "POST" });
}

// ---- Notes --------------------------------------------------------------

export function getNotes(): Promise<Note[]> {
  return apiFetch<Note[]>("/api/notes");
}

export function createNote(input: {
  content: string;
  title?: string | null;
  color?: string;
  pinned?: boolean;
}): Promise<Note> {
  return apiFetch<Note>("/api/notes", { method: "POST", body: input });
}

export function updateNote(
  id: string,
  input: Partial<Pick<Note, "title" | "content" | "color" | "pinned" | "order">>,
): Promise<Note> {
  return apiFetch<Note>(`/api/notes/${id}`, { method: "PUT", body: input });
}

export function togglePinNote(id: string): Promise<Note> {
  return apiFetch<Note>(`/api/notes/${id}/pin`, { method: "POST" });
}

export function deleteNote(id: string): Promise<unknown> {
  return apiFetch(`/api/notes/${id}`, { method: "DELETE" });
}

// ---- Timer / Harvest ------------------------------------------------------

export function getTask(id: string): Promise<{ id: string; projectId: string }> {
  return apiFetch(`/api/tasks/${id}`);
}

export function sendTaskToHarvest(
  taskId: string,
  hours: number,
): Promise<{ success: boolean }> {
  return apiFetch(`/api/tasks/${taskId}/send-to-harvest`, {
    method: "POST",
    body: { hours },
  });
}

// ---- Push ---------------------------------------------------------------

export function getVapidPublicKey(): Promise<{ publicKey: string }> {
  return apiFetch<{ publicKey: string }>("/api/push/vapid-public-key");
}

export function savePushSubscription(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<{ id: string }> {
  return apiFetch("/api/push/subscriptions", { method: "POST", body: sub });
}

export function deletePushSubscription(endpoint: string): Promise<unknown> {
  return apiFetch("/api/push/subscriptions", {
    method: "DELETE",
    body: { endpoint },
  });
}
