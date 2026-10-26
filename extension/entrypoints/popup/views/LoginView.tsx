import { useEffect, useState } from "react";
import { ArrowLeft, Globe, LogIn } from "lucide-react";
import { login, verifyTwoFactor } from "@/lib/api-client";
import {
  setSession,
  getPendingTwoFactor,
  setPendingTwoFactor,
  getActiveServerUrl,
  setActiveServerUrl,
} from "@/lib/storage";
import { sendToBackground } from "@/lib/messaging";
import type { LoginResponse } from "@/types/api";

export function LoginView({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverUrl, setServerUrlState] = useState("http://localhost:3000");
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [code, setCode] = useState("");
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [twoFactorMethod, setTwoFactorMethod] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getActiveServerUrl().then(setServerUrlState);
    void getPendingTwoFactor().then((pending) => {
      if (!pending) return;
      setPendingToken(pending.pendingToken);
      setTwoFactorMethod(pending.method);
    });
  }, []);

  async function finishLogin(user: any, token: string) {
    await setActiveServerUrl(serverUrl);
    await setSession({ token, user, serverUrl });
    await sendToBackground({ type: "AUTH_CHANGED" });
    onDone();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await setActiveServerUrl(serverUrl);
      const res: LoginResponse = await login(email.trim(), password, serverUrl);

      if ("token" in res && res.token) {
        await finishLogin(res.user, res.token);
        return;
      }
      if ("requires2FA" in res && res.requires2FA) {
        setTwoFactorMethod(res.method ?? null);
        setPendingToken(res.pendingToken);
        await setPendingTwoFactor({
          pendingToken: res.pendingToken,
          method: res.method ?? null,
        });
        setBusy(false);
        return;
      }
      if ("requires2FASetup" in res && res.requires2FASetup) {
        setError(
          "Debes completar la configuración de 2FA en la web antes de usar la extensión.",
        );
        setBusy(false);
        return;
      }
      setError("Respuesta de login no reconocida");
    } catch (err: any) {
      setError(err?.message ?? "Error al iniciar sesión con tu cuenta de DAMA-CRM");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingToken) return;
    setError(null);
    setBusy(true);
    try {
      const { user, token } = await verifyTwoFactor(pendingToken, code.trim());
      await setPendingTwoFactor(null);
      await finishLogin(user, token);
    } catch (err: any) {
      setError(err?.message ?? "Código incorrecto");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="content">
      <div className="header login-header">
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
            }}
          >
            HARVEST TIMER
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowServerConfig((s) => !s)}
          title="Configurar URL del servidor DAMA-CRM"
          style={{
            background: "transparent",
            border: "1px solid #334155",
            color: "#94a3b8",
            borderRadius: 6,
            padding: "4px 7px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
          }}
        >
          <Globe size={12} /> Servidor
        </button>
      </div>

      {pendingToken ? (
        <form onSubmit={handleVerify}>
          <p className="muted">
            {twoFactorMethod === "email"
              ? "Te hemos enviado un código por email. Introdúcelo para continuar."
              : "Introduce el código de verificación 2FA de tu cuenta DAMA."}
          </p>
          <div className="field">
            <label>Código 2FA</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              inputMode="numeric"
              placeholder="123456"
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button className="btn" disabled={busy}>
            {busy ? "Verificando…" : "Verificar y Entrar"}
          </button>
          <button
            type="button"
            className="link"
            style={{ marginTop: 10 }}
            onClick={() => {
              void setPendingTwoFactor(null);
              setPendingToken(null);
              setCode("");
              setTwoFactorMethod(null);
              setError(null);
            }}
          >
            <ArrowLeft size={13} /> Volver al inicio de sesión
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>
              Inicia sesión en DAMA-CRM
            </h2>
            <p className="muted" style={{ margin: 0 }}>
              Conecta tu cuenta para fichar horas y controlar tareas al estilo Harvest.
            </p>
          </div>

          {showServerConfig && (
            <div className="field">
              <label>Servidor API DAMA-CRM</label>
              <input
                type="url"
                value={serverUrl}
                onChange={(e) => setServerUrlState(e.target.value)}
                placeholder="http://localhost:3000"
              />
            </div>
          )}

          <div className="field">
            <label>Correo electrónico de DAMA</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@empresa.com"
              autoComplete="username"
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button className="btn" disabled={busy} style={{ marginTop: 6 }}>
            <LogIn size={14} />
            {busy ? "Conectando con DAMA…" : "Iniciar sesión con DAMA"}
          </button>
        </form>
      )}
    </div>
  );
}
