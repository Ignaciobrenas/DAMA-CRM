import { defineBackground } from "wxt/utils/define-background";
import { browser } from "wxt/browser";
import {
  ensureConnected,
  setTimer,
  requestTimer,
  disconnectTimer,
} from "@/lib/timer-connection";
import { updateBadge } from "@/lib/badge";
import { getStoredTimer } from "@/lib/storage";
import { onMessage } from "@/lib/messaging";
import {
  trySubscribePush,
  unsubscribePush,
  pollNotifications,
  handlePushPayload,
  resolveClickTarget,
  showOsNotification,
} from "@/lib/push";

// reconnect socket + refresh badge + poll notifications. Notifications also
// arrive near-instantly over the socket (see timer-connection.ts
// "notification:new"), so this tick only has to catch what that misses (e.g.
// the worker was suspended when it fired) — piggybacking on the existing
// 30s tick instead of a separate, slower alarm keeps that gap as small as
// MV3's alarm granularity allows.
const KEEPALIVE_ALARM = "keepalive";

export default defineBackground(() => {
  // --- Startup: rehydrate state, connect, arm transports -----------------
  async function boot() {
    const timer = await getStoredTimer();
    await updateBadge(timer);
    await ensureConnected();
    // Try web push (Chromium); on failure polling covers it.
    await trySubscribePush().catch(() => false);
    await pollNotifications().catch(() => {});
  }
  void boot();

  // Live badge tick: `timer:state` is only broadcast on start/pause/resume/stop
  // (not every second, see client/contexts/TimerContext.tsx timerSignature), so
  // without this the badge would sit frozen between those events while running.
  // Re-reading storage every second also self-heals any transient stale badge
  // paint (e.g. a keepalive alarm reading storage mid-write) within ~1s.
  setInterval(() => {
    void getStoredTimer().then(updateBadge);
  }, 1000);

  // --- Alarms: MV3 workers idle-suspend, so we reconcile on each tick ----
  browser.alarms.create(KEEPALIVE_ALARM, { periodInMinutes: 0.5 });

  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === KEEPALIVE_ALARM) {
      await ensureConnected();
      requestTimer();
      await updateBadge(await getStoredTimer());
      await pollNotifications().catch(() => {});
    }
  });

  // --- Popup <-> worker messages -----------------------------------------
  onMessage(async (msg) => {
    switch (msg.type) {
      case "AUTH_CHANGED":
        await ensureConnected();
        await trySubscribePush().catch(() => false);
        await pollNotifications().catch(() => {});
        return { ok: true };
      case "LOGOUT":
        await unsubscribePush().catch(() => {});
        disconnectTimer();
        await updateBadge(null);
        return { ok: true };
      case "TIMER_GET":
        requestTimer();
        return { timer: await getStoredTimer() };
      case "TIMER_SET":
        await setTimer(msg.timer);
        return { ok: true };
      default:
        return undefined;
    }
  });

  // --- Web Push event (Chromium service worker) --------------------------
  self.addEventListener("push", (event: any) => {
    const raw = event?.data ? event.data.text() : null;
    event?.waitUntil?.(handlePushPayload(raw));
  });

  // --- Notification click -> open the deep link --------------------------
  browser.notifications.onClicked.addListener(async (notificationId) => {
    const url = await resolveClickTarget(notificationId);
    if (url) await browser.tabs.create({ url });
    browser.notifications.clear(notificationId);
  });

  // React to auth/token changes made by the popup (storage is the sync bus).
  browser.storage.onChanged.addListener(async (changes, area) => {
    if (area !== "local") return;
    if (changes.token) {
      await ensureConnected();
    }
  });

  // Keep a reference so bundlers don't tree-shake showOsNotification (used by
  // push + polling paths).
  void showOsNotification;
});
