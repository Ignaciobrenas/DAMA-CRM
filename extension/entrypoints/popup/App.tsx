import { useEffect, useState, useCallback } from "react";
import { browser } from "wxt/browser";
import { Timer, Pin, Bell, Settings } from "lucide-react";
import { getSession, setSession as saveSession, type StoredSession } from "@/lib/storage";
import { onMessage } from "@/lib/messaging";
import { buildAssetUrl } from "@/lib/deep-link";
import { verifyToken } from "@/lib/api-client";
import { getAppearance, applyAppearance } from "@/lib/appearance";
import { SERVER_URL } from "@/lib/config";
import { LoginView } from "./views/LoginView";
import { TimerView } from "./views/TimerView";
import { NotesView } from "./views/NotesView";
import { NotificationsView } from "./views/NotificationsView";
import { SettingsView } from "./views/SettingsView";

type Tab = "timer" | "notes" | "notifications" | "settings";

export function App() {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("timer");

  const refresh = useCallback(async () => {
    setSession(await getSession());
    setLoading(false);
  }, []);

  // Applied before auth resolves too, so theme/width/compact mode are already
  // correct on the login screen instead of flashing defaults first.
  useEffect(() => {
    void getAppearance().then(applyAppearance);
  }, []);

  useEffect(() => {
    void refresh();
    // Keep the popup in sync with background/storage changes.
    onMessage((msg) => {
      if (msg.type === "AUTH_EXPIRED") void refresh();
    });
    const listener = (_c: unknown, area: string) => {
      if (area === "local") void refresh();
    };
    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  }, [refresh]);

  // Pull the latest profile (name/avatar) from the server each time the popup
  // opens — the stored session.user is only ever written at login time, so a
  // profile photo changed on the web would otherwise never show up here.
  // Guarded on token (not the whole session object) so writing the refreshed
  // user back to storage doesn't retrigger this via storage.onChanged.
  useEffect(() => {
    if (!session?.token) return;
    let cancelled = false;
    void (async () => {
      try {
        const { user } = await verifyToken();
        if (cancelled) return;
        if (JSON.stringify(user) !== JSON.stringify(session.user)) {
          await saveSession({ user });
          setSession((prev) => (prev ? { ...prev, user } : prev));
        }
      } catch {
        // Ignore — an expired/invalid token is already handled by apiFetch.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.token]);

  if (loading) return <div className="center">Cargando…</div>;

  if (!SERVER_URL) {
    return (
      <div className="center">
        Extensión mal configurada: falta la URL del servidor.
        <br />
        Añade WXT_SERVER_URL al construir la extensión.
      </div>
    );
  }

  if (!session?.token) {
    return <LoginView onDone={refresh} />;
  }

  const userName = session?.user?.name ?? session?.user?.email ?? "";
  const avatarUrl = buildAssetUrl(SERVER_URL, session?.user?.avatar);
  const userInitials = (() => {
    const parts = userName.split(" ").filter((p) => p.length > 0);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  return (
    <>
      <div className="header">
        <img src="/dama_agile_planner_logo.png" className="header-logo" alt="dama-agile-planner" />
        <div className="user">
          <span className="user-name">{userName}</span>
          <span className="user-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" />
            ) : (
              userInitials
            )}
          </span>
        </div>
      </div>
      <div className="tabs">
        <button className={`tab ${tab === "timer" ? "active" : ""}`} onClick={() => setTab("timer")}>
          <Timer size={14} /> Timer
        </button>
        <button className={`tab ${tab === "notes" ? "active" : ""}`} onClick={() => setTab("notes")}>
          <Pin size={14} /> Notas
        </button>
        <button
          className={`tab ${tab === "notifications" ? "active" : ""}`}
          onClick={() => setTab("notifications")}
        >
          <Bell size={14} /> Avisos
        </button>
        <button className={`tab ${tab === "settings" ? "active" : ""}`} onClick={() => setTab("settings")}>
          <Settings size={14} />
        </button>
      </div>
      <div className="content">
        {tab === "timer" && <TimerView />}
        {tab === "notes" && <NotesView />}
        {tab === "notifications" && <NotificationsView />}
        {tab === "settings" && <SettingsView session={session!} onChange={refresh} />}
      </div>
    </>
  );
}
