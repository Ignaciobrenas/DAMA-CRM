import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { login, verifyTwoFactor } from "@/lib/api-client";
import { setSession, getPendingTwoFactor, setPendingTwoFactor } from "@/lib/storage";
import { sendToBackground } from "@/lib/messaging";
import type { LoginResponse } from "@/types/api";

// Login flow: email/password -> optional 2FA code. The server URL is baked in
// at build time (see lib/config.ts) — this only ever talks to one server, so
// there's nothing to ask the user for or request host permission on.

export function LoginView({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [twoFactorMethod, setTwoFactorMethod] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // The popup is destroyed (losing all React state) whenever it loses focus —
  // e.g. switching tabs to read a 2FA code from email. Rehydrate the pending
  // 2FA step from storage so reopening resumes at "enter code" instead of
  // restarting the whole login.
  useEffect(() => {
    void getPendingTwoFactor().then((pending) => {
      if (!pending) return;
      setPendingToken(pending.pendingToken);
      setTwoFactorMethod(pending.method);
    });
  }, []);

  async function finishLogin(user: any, token: string) {
    await setSession({ token, user });
    await sendToBackground({ type: "AUTH_CHANGED" });
    onDone();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res: LoginResponse = await login(email, password);

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
      setError(err?.message ?? "Error al iniciar sesión");
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
        <img src="/dama_agile_planner_logo.png" className="header-logo" alt="dama-agile-planner" />
      </div>

      {pendingToken ? (
        <form onSubmit={handleVerify}>
          <p className="muted">
            {twoFactorMethod === "email"
              ? "Te hemos enviado un código por email. Introdúcelo para continuar."
              : "Introduce el código de tu app de autenticación (2FA)."}
          </p>
          <div className="field">
            <label>Código</label>
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
            {busy ? "Verificando…" : "Verificar"}
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
            <ArrowLeft size={13} /> Volver
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button className="btn" disabled={busy}>
            {busy ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>
      )}
    </div>
  );
}
