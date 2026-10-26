import { useEffect, useState } from "react";
import { browser } from "wxt/browser";
import { ArrowLeft, ChevronRight, Palette, Globe } from "lucide-react";
import {
  clearAuth,
  getActiveServerUrl,
  setActiveServerUrl,
  type StoredSession,
} from "@/lib/storage";
import { sendToBackground } from "@/lib/messaging";
import {
  getAppearance,
  setAppearance,
  applyAppearance,
  type AppearanceSettings,
} from "@/lib/appearance";

export function SettingsView({
  session,
  onChange,
}: {
  session: StoredSession;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [appearance, setAppearanceState] = useState<AppearanceSettings | null>(
    null,
  );
  const [serverUrl, setServerUrlState] = useState("http://localhost:3000");
  const [savedMsg, setSavedMsg] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);

  useEffect(() => {
    void getAppearance().then(setAppearanceState);
    void getActiveServerUrl().then(setServerUrlState);
  }, []);

  async function updateAppearance(patch: Partial<AppearanceSettings>) {
    const next = await setAppearance(patch);
    setAppearanceState(next);
    applyAppearance(next);
  }

  async function handleSaveServerUrl() {
    await setActiveServerUrl(serverUrl);
    await sendToBackground({ type: "AUTH_CHANGED" });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  }

  async function logout() {
    setBusy(true);
    await sendToBackground({ type: "LOGOUT" });
    await clearAuth();
    onChange();
  }

  const version = browser.runtime.getManifest().version;

  return (
    <div className="slide-clip">
      <div className={`slide-track${showAppearance ? " show-second" : ""}`}>
        <div className="slide-panel">
          <div className="field">
            <label>Cuenta DAMA-CRM</label>
            <input value={session.user?.email ?? ""} disabled />
          </div>

          <div className="field">
            <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Globe size={12} /> URL del Servidor DAMA-CRM
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={serverUrl}
                onChange={(e) => setServerUrlState(e.target.value)}
                placeholder="http://localhost:3000"
              />
              <button
                type="button"
                className="btn secondary"
                style={{ width: "auto", padding: "0 12px" }}
                onClick={handleSaveServerUrl}
              >
                {savedMsg ? "✓" : "Guardar"}
              </button>
            </div>
          </div>

          <button
            type="button"
            className="nav-btn"
            style={{ marginTop: 10, marginBottom: 10 }}
            onClick={() => setShowAppearance(true)}
          >
            <span className="nav-btn-label">
              <Palette size={14} /> Apariencia (Claro / Oscuro)
            </span>
            <ChevronRight size={15} />
          </button>

          <button className="btn danger" onClick={logout} disabled={busy}>
            Cerrar sesión
          </button>

          <p className="muted" style={{ marginTop: 14 }}>
            DAMA-CRM Harvest Timer Extension v{version} (Chrome & Firefox)
          </p>
        </div>

        <div className="slide-panel">
          <div className="settings-subheader">
            <button
              type="button"
              className="settings-back-btn"
              onClick={() => setShowAppearance(false)}
              title="Volver"
            >
              <ArrowLeft size={14} />
            </button>
            <h2>Apariencia</h2>
          </div>

          {appearance && (
            <>
              <div className="field">
                <label>Tema</label>
                <select
                  value={appearance.theme}
                  onChange={(e) =>
                    void updateAppearance({
                      theme: e.target.value as AppearanceSettings["theme"],
                    })
                  }
                >
                  <option value="dark">Oscuro (Carbon Slate)</option>
                  <option value="light">Claro (Soft Slate)</option>
                </select>
              </div>

              <div className="field">
                <label>Ancho de extensión</label>
                <select
                  value={appearance.width}
                  onChange={(e) =>
                    void updateAppearance({
                      width: e.target.value as AppearanceSettings["width"],
                    })
                  }
                >
                  <option value="default">Por defecto</option>
                  <option value="compact">Compacto</option>
                  <option value="wide">Amplio</option>
                </select>
              </div>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={appearance.compact}
                  onChange={(e) =>
                    void updateAppearance({ compact: e.target.checked })
                  }
                />
                Modo compacto
              </label>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
