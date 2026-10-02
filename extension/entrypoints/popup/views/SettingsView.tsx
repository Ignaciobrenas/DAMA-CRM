import { useEffect, useState } from "react";
import { browser } from "wxt/browser";
import { ArrowLeft, ChevronRight, Palette } from "lucide-react";
import { clearAuth, type StoredSession } from "@/lib/storage";
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
  const [appearance, setAppearanceState] = useState<AppearanceSettings | null>(null);
  const [showAppearance, setShowAppearance] = useState(false);

  useEffect(() => {
    void getAppearance().then(setAppearanceState);
  }, []);

  async function updateAppearance(patch: Partial<AppearanceSettings>) {
    const next = await setAppearance(patch);
    setAppearanceState(next);
    applyAppearance(next);
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
            <label>Cuenta</label>
            <input value={session.user?.email ?? ""} disabled />
          </div>

          <button className="btn danger" onClick={logout} disabled={busy}>
            Cerrar sesión
          </button>

          <button
            type="button"
            className="nav-btn"
            style={{ marginTop: 14 }}
            onClick={() => setShowAppearance(true)}
          >
            <span className="nav-btn-label">
              <Palette size={14} /> Apariencia
            </span>
            <ChevronRight size={15} />
          </button>

          <p className="muted" style={{ marginTop: 14 }}>
            dama-agile-planner Extension v{version}
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
                  <option value="dark">Oscuro</option>
                  <option value="light">Claro</option>
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
                  onChange={(e) => void updateAppearance({ compact: e.target.checked })}
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
