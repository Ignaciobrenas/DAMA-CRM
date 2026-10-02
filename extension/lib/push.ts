import { browser } from "wxt/browser";
import {
  getVapidPublicKey,
  savePushSubscription,
  deletePushSubscription,
  getNotifications,
} from "./api-client";
import {
  getSession,
  getLastSeenNotificationId,
  setLastSeenNotificationId,
} from "./storage";
import { SERVER_URL } from "./config";
import { buildDeepLink } from "./deep-link";
import type { ServerNotification } from "@/types/api";

// Notification delivery with three transports that converge on the same OS
// notification + click->deep-link behaviour, and the same de-dup marker
// (lastSeenNotificationId) so whichever arrives first wins:
//   1) Socket ("notification:new" on the /ws connection, see timer-connection.ts)
//      — near-instant, needs no config, works in every browser. Primary path.
//   2) Web Push (VAPID) — Chromium only, requires server-side VAPID keys.
//   3) Polling fallback — periodically diff /api/notifications; catches
//      anything missed while the socket was disconnected or push unconfigured.

// notificationId -> URL to open on click. Persisted so a killed worker can still
// resolve clicks after waking.
const CLICK_TARGETS_KEY = "notifClickTargets";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

async function rememberClickTarget(id: string, url: string | null): Promise<void> {
  if (!url) return;
  const r = await browser.storage.local.get(CLICK_TARGETS_KEY);
  const map = (r[CLICK_TARGETS_KEY] as Record<string, string>) ?? {};
  map[id] = url;
  await browser.storage.local.set({ [CLICK_TARGETS_KEY]: map });
}

export async function resolveClickTarget(id: string): Promise<string | null> {
  const r = await browser.storage.local.get(CLICK_TARGETS_KEY);
  const map = (r[CLICK_TARGETS_KEY] as Record<string, string>) ?? {};
  return map[id] ?? null;
}

export async function showOsNotification(n: {
  id: string;
  title: string;
  message: string;
  actionUrl?: string | null;
}): Promise<void> {
  const url = buildDeepLink(SERVER_URL, n.actionUrl);
  await rememberClickTarget(n.id, url);
  try {
    await browser.notifications.create(n.id, {
      type: "basic",
      iconUrl: browser.runtime.getURL("/icon/128.png"),
      title: n.title,
      message: n.message,
    });
  } catch (err) {
    console.warn("[push] notifications.create failed", err);
  }
}

// ---- Web Push subscription (Chromium) ----------------------------------

export async function trySubscribePush(): Promise<boolean> {
  try {
    // Firefox event pages don't expose a usable service-worker pushManager.
    const reg = (self as any).registration as ServiceWorkerRegistration | undefined;
    if (!reg?.pushManager) return false;

    const { publicKey } = await getVapidPublicKey();
    if (!publicKey) return false;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
    }

    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

    await savePushSubscription({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    });
    return true;
  } catch (err) {
    console.warn("[push] subscribe failed, will rely on polling", err);
    return false;
  }
}

export async function unsubscribePush(): Promise<void> {
  try {
    const reg = (self as any).registration as ServiceWorkerRegistration | undefined;
    const sub = await reg?.pushManager?.getSubscription();
    if (sub) {
      await deletePushSubscription(sub.endpoint).catch(() => {});
      await sub.unsubscribe().catch(() => {});
    }
  } catch {
    /* ignore */
  }
}

// Show an incoming notification unless another transport already delivered
// this exact id (tracked via lastSeenNotificationId) — the socket, push and
// polling fallback all funnel through here so only one OS notification ever
// appears per server-side notification, however many transports fire for it.
export async function deliverIncoming(n: {
  id: string;
  title: string;
  message: string;
  actionUrl?: string | null;
}): Promise<void> {
  if ((await getLastSeenNotificationId()) === n.id) return;
  await showOsNotification(n);
  await setLastSeenNotificationId(n.id);
}

// Parse an incoming push payload and show it. Called from the SW 'push' event.
export async function handlePushPayload(raw: string | null): Promise<void> {
  let data: any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { title: "dama-agile-planner", message: raw ?? "" };
  }
  if (!data.id) {
    // No id to de-dupe against (shouldn't happen server-side) — show as-is.
    await showOsNotification({
      id: `push-${Date.now()}`,
      title: data.title ?? "dama-agile-planner",
      message: data.message ?? "",
      actionUrl: data.actionUrl ?? null,
    });
    return;
  }
  await deliverIncoming({
    id: data.id,
    title: data.title ?? "dama-agile-planner",
    message: data.message ?? "",
    actionUrl: data.actionUrl ?? null,
  });
}

// ---- Polling fallback ---------------------------------------------------

export async function pollNotifications(): Promise<void> {
  const { token } = await getSession();
  if (!token || !SERVER_URL) return;

  let list: ServerNotification[];
  try {
    list = await getNotifications();
  } catch {
    return; // offline / auth error handled elsewhere
  }
  if (!Array.isArray(list) || list.length === 0) return;

  // API returns newest-first. Surface unread notifications newer than the last
  // one we showed.
  const lastSeen = await getLastSeenNotificationId();
  const newest = list[0];

  const fresh: ServerNotification[] = [];
  for (const n of list) {
    if (n.id === lastSeen) break;
    if (!n.read) fresh.push(n);
  }

  // First run (no lastSeen yet): just set the marker, don't spam old items.
  if (lastSeen === null) {
    await setLastSeenNotificationId(newest.id);
    return;
  }

  // Show oldest-first so the newest ends up on top.
  for (const n of fresh.reverse()) {
    await deliverIncoming({
      id: n.id,
      title: n.title,
      message: n.message,
      actionUrl: n.actionUrl,
    });
  }

  await setLastSeenNotificationId(newest.id);
}
