import { getSession, clearAuth, getActiveServerUrl } from "./storage";
import { broadcast } from "./messaging";
import type {
  ServerNotification,
  Note,
  LoginResponse,
  AuthUser,
  HarvestClockStatus,
  HarvestTimeRecord,
  TrackableProject,
  TrackableTask,
} from "@/types/api";

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
  auth?: boolean;
  tokenOverride?: string;
  serverUrlOverride?: string;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const baseUrl = opts.serverUrlOverride || (await getActiveServerUrl());
  if (!baseUrl) throw new ApiError(0, "URL del servidor DAMA-CRM no configurada");

  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const useAuth = opts.auth !== false;
  const session = await getSession();
  const token = opts.tokenOverride ?? session.token;
  if (useAuth && token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(joinUrl(baseUrl, path), {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 && useAuth) {
    await clearAuth();
    broadcast({ type: "AUTH_EXPIRED" });
    throw new ApiError(401, "Sesión expirada. Inicia sesión de nuevo.");
  }

  if (!res.ok) {
    let msg = `Error de servidor (${res.status})`;
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
      else if (data?.error) msg = data.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// ---- Auth (Compatible with DAMA-CRM /api/auth/login & /api/auth/me) ----

export async function login(
  email: string,
  password: string,
  serverUrlOverride?: string,
): Promise<LoginResponse> {
  const raw: any = await apiFetch("/api/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
    serverUrlOverride,
  });

  const payload = raw?.data ?? raw;
  if (payload?.accessToken || payload?.token) {
    return {
      user: payload.user,
      token: payload.accessToken || payload.token,
    };
  }
  if (payload?.requiresTwoFactor || payload?.requires2FA) {
    return {
      requires2FA: true,
      method: payload.method || "email",
      pendingToken: payload.tempToken || payload.pendingToken,
      user: payload.user,
    };
  }
  return payload as LoginResponse;
}

export async function verifyTwoFactor(
  pendingToken: string,
  code: string,
): Promise<{ user: AuthUser; token: string }> {
  const raw: any = await apiFetch("/api/auth/verify-2fa", {
    method: "POST",
    body: { tempToken: pendingToken, pendingToken, code },
    auth: false,
  });
  const payload = raw?.data ?? raw;
  return {
    user: payload.user,
    token: payload.accessToken || payload.token,
  };
}

export async function verifyToken(): Promise<{ user: AuthUser }> {
  const raw: any = await apiFetch("/api/auth/me");
  const user = raw?.data ?? raw?.user ?? raw;
  return { user };
}

// ---- Harvest Persistent Time Tracking & Fichajes ------------------------

export async function getHarvestClockStatus(): Promise<HarvestClockStatus> {
  const raw: any = await apiFetch("/api/employees/time-tracking/status");
  return (raw?.data ?? raw) as HarvestClockStatus;
}

export async function getTrackableTasks(): Promise<{
  projects: TrackableProject[];
  tasks: TrackableTask[];
}> {
  const raw: any = await apiFetch("/api/employees/time-tracking/tasks");
  return (raw?.data ?? raw ?? { projects: [], tasks: [] }) as {
    projects: TrackableProject[];
    tasks: TrackableTask[];
  };
}

export async function startHarvestTimer(input: {
  projectId?: string | null;
  projectName?: string | null;
  taskId?: string | null;
  taskTitle?: string | null;
  reason?: string;
  notes?: string;
  isBillable?: boolean;
  switchTask?: boolean;
}): Promise<HarvestTimeRecord> {
  const raw: any = await apiFetch("/api/employees/time-tracking/clock-in", {
    method: "POST",
    body: input,
  });
  return (raw?.data ?? raw) as HarvestTimeRecord;
}

export async function pauseHarvestTimer(): Promise<HarvestTimeRecord> {
  const raw: any = await apiFetch("/api/employees/time-tracking/timer/pause", {
    method: "POST",
  });
  return (raw?.data ?? raw) as HarvestTimeRecord;
}

export async function resumeHarvestTimer(): Promise<HarvestTimeRecord> {
  const raw: any = await apiFetch("/api/employees/time-tracking/timer/resume", {
    method: "POST",
  });
  return (raw?.data ?? raw) as HarvestTimeRecord;
}

export async function updateHarvestTimer(input: {
  projectId?: string | null;
  projectName?: string | null;
  taskId?: string | null;
  taskTitle?: string | null;
  reason?: string;
  notes?: string;
  isBillable?: boolean;
}): Promise<HarvestTimeRecord> {
  const raw: any = await apiFetch("/api/employees/time-tracking/timer/update", {
    method: "POST",
    body: input,
  });
  return (raw?.data ?? raw) as HarvestTimeRecord;
}

export async function stopHarvestTimer(notes?: string): Promise<HarvestTimeRecord> {
  const raw: any = await apiFetch("/api/employees/time-tracking/clock-out", {
    method: "POST",
    body: { notes },
  });
  return (raw?.data ?? raw) as HarvestTimeRecord;
}

// ---- Notifications ------------------------------------------------------

export async function getNotifications(): Promise<ServerNotification[]> {
  const raw: any = await apiFetch("/api/notifications");
  return (raw?.data ?? raw ?? []) as ServerNotification[];
}

export async function markNotificationRead(id: string): Promise<unknown> {
  return apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" }).catch(() =>
    apiFetch(`/api/notifications/${id}/read`, { method: "POST" }),
  );
}

export async function markAllNotificationsRead(): Promise<unknown> {
  return apiFetch("/api/notifications/read-all", { method: "PATCH" }).catch(() =>
    apiFetch("/api/notifications/read-all", { method: "POST" }),
  );
}

// ---- Notes (/api/planner/notes) -----------------------------------------

export async function getNotes(): Promise<Note[]> {
  const raw: any = await apiFetch("/api/planner/notes");
  return (raw?.data ?? raw ?? []) as Note[];
}

export async function createNote(input: {
  content: string;
  title?: string | null;
  color?: string;
  pinned?: boolean;
}): Promise<Note> {
  const raw: any = await apiFetch("/api/planner/notes", {
    method: "POST",
    body: input,
  });
  return (raw?.data ?? raw) as Note;
}

export async function updateNote(
  id: string,
  input: Partial<Pick<Note, "title" | "content" | "color" | "pinned" | "order">>,
): Promise<Note> {
  const raw: any = await apiFetch(`/api/planner/notes/${id}`, {
    method: "PUT",
    body: input,
  });
  return (raw?.data ?? raw) as Note;
}

export async function togglePinNote(id: string): Promise<Note> {
  const raw: any = await apiFetch(`/api/planner/notes/${id}/pin`, {
    method: "POST",
  });
  return (raw?.data ?? raw) as Note;
}

export async function deleteNote(id: string): Promise<unknown> {
  return apiFetch(`/api/planner/notes/${id}`, { method: "DELETE" });
}

// ---- Legacy compatibility helpers ---------------------------------------

export async function getTask(id: string): Promise<{ id: string; projectId: string }> {
  const raw: any = await apiFetch(`/api/projects/tasks/${id}`).catch(() => ({
    id,
    projectId: "",
  }));
  return raw?.data ?? raw;
}

export async function sendTaskToHarvest(
  _taskId: string,
  _hours: number,
): Promise<{ success: boolean }> {
  await stopHarvestTimer();
  return { success: true };
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
