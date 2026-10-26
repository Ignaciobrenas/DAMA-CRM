import { useEffect, useState, useCallback } from "react";
import { browser } from "wxt/browser";
import { Timer, Pin, Bell, Settings } from "lucide-react";
import { getSession, setSession as saveSession, type StoredSession } from "@/lib/storage";
import { onMessage } from "@/lib/messaging";
import { buildAssetUrl } from "@/lib/deep-link";
import { verifyToken } from "@/lib/api-client";
import { getAppearance, applyAppearance } from "@/lib/appearance";
import { DEFAULT_SERVER_URL } from "@/lib/config";
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

  useEffect(() => {
    void getAppearance().then(applyAppearance);
  }, []);

  useEffect(() => {
    void refresh();
    onMessage((msg) => {
      if (msg.type === "AUTH_EXPIRED") void refresh();
    });
    const listener = (_c: unknown, area: string) => {
      if (area === "local") void refresh();
    };
    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  }, [refresh]);

  useEffect(() => {
    if (!session?.token) return;
    let cancelled = false;
    void (async () => {
      try {
        const { user } = await verifyToken();
        if (cancelled || !user) return;
        if (JSON.stringify(user) !== JSON.stringify(session.user)) {
          await saveSession({ user });
          setSession((prev) => (prev ? { ...prev, user } : prev));
        }
      } catch {
        // Handled by apiFetch
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.token]);

  if (loading) return <div className="center">Cargando DAMA-CRM…</div>;

  if (!session?.token) {
    return <LoginView onDone={refresh} />;
  }

  const serverUrl = session.serverUrl || DEFAULT_SERVER_URL;
  const userName = session?.user?.name ?? session?.user?.email ?? "Usuario";
  const avatarUrl = buildAssetUrl(serverUrl, session?.user?.avatar);
  const userInitials = (() => {
    const parts = userName.split(" ").filter((p) => p.length > 0);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  return (
    <>
      <div className="header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img
            src="/assets/logos/dama-logo-white.png"
            className="header-logo"
            alt="DAMA-CRM"
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 5,
              background: "rgba(255,255,255,0.1)",
              color: "#e2e8f0",
              letterSpacing: "0.04em",
            }}
          >
            HARVEST TIMER
          </span>
        </div>
        <div className="user">
          <span className="user-name">{userName}</span>
          <span className="user-avatar">
            {avatarUrl ? <img src={avatarUrl} alt="" /> : userInitials}
          </span>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${tab === "timer" ? "active" : ""}`}
          onClick={() => setTab("timer")}
        >
          <Timer size={14} /> Fichar / Timer
        </button>
        <button
          className={`tab ${tab === "notes" ? "active" : ""}`}
          onClick={() => setTab("notes")}
        >
          <Pin size={14} /> Notas
        </button>
        <button
          className={`tab ${tab === "notifications" ? "active" : ""}`}
          onClick={() => setTab("notifications")}
        >
          <Bell size={14} /> Avisos
        </button>
        <button
          className={`tab ${tab === "settings" ? "active" : ""}`}
          onClick={() => setTab("settings")}
          title="Ajustes de cuenta y servidor"
        >
          <Settings size={14} />
        </button>
      </div>

      <div className="content">
        {tab === "timer" && <TimerView />}
        {tab === "notes" && <NotesView />}
        {tab === "notifications" && <NotificationsView />}
        {tab === "settings" && (
          <SettingsView session={session!} onChange={refresh} />
        )}
      </div>
    </>
  );
}
