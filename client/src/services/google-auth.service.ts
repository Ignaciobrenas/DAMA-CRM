import { apiRequest } from './api';

export interface GoogleAuthConfig {
  configured: boolean;
  clientId: string | null;
  oauthRedirectEnabled: boolean;
  callbackUrl?: string;
}

export interface GoogleTokenResult {
  accessToken?: string;
  credential?: string;
  cancelled?: boolean;
  popupBlocked?: boolean;
  errorMessage?: string;
}

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

let gisLoadPromise: Promise<boolean> | null = null;

export async function fetchGoogleAuthConfig(): Promise<GoogleAuthConfig> {
  const envClientId = ((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '').trim();
  const res = await apiRequest<GoogleAuthConfig>('/auth/google/config', {
    method: 'GET',
    suppressToast: true,
    useCache: false,
  });

  if (res.success && res.data) {
    const resolvedClientId = res.data.clientId || envClientId || null;
    return {
      configured: Boolean(resolvedClientId || res.data.configured),
      clientId: resolvedClientId,
      oauthRedirectEnabled: Boolean(res.data.oauthRedirectEnabled),
      callbackUrl: res.data.callbackUrl,
    };
  }

  return {
    configured: Boolean(envClientId),
    clientId: envClientId || null,
    oauthRedirectEnabled: false,
  };
}

export function loadGoogleIdentityScript(timeoutMs = 10000): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).google?.accounts?.oauth2) return Promise.resolve(true);
  if (gisLoadPromise) return gisLoadPromise;

  gisLoadPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT_URL}"]`);
    const timer = window.setTimeout(() => {
      gisLoadPromise = null;
      resolve(false);
    }, timeoutMs);

    const finalize = (loaded: boolean) => {
      window.clearTimeout(timer);
      if (!loaded) gisLoadPromise = null;
      resolve(loaded);
    };

    if (existing) {
      existing.addEventListener('load', () => finalize(Boolean((window as any).google?.accounts?.oauth2)), { once: true });
      existing.addEventListener('error', () => finalize(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => finalize(Boolean((window as any).google?.accounts?.oauth2));
    script.onerror = () => finalize(false);
    document.head.appendChild(script);
  });

  return gisLoadPromise;
}

/**
 * Opens Google's official OAuth2 account selector popup via Google Identity Services
 * and resolves with a real verified Google access token.
 */
export async function requestGoogleAccessToken(clientId: string): Promise<GoogleTokenResult> {
  const loaded = await loadGoogleIdentityScript();
  const oauth2 = (window as any).google?.accounts?.oauth2;

  if (!loaded || !oauth2) {
    return {
      popupBlocked: true,
      errorMessage: 'No se pudo cargar el SDK oficial de Google Identity Services.',
    };
  }

  return new Promise<GoogleTokenResult>((resolve) => {
    let settled = false;
    const finish = (result: GoogleTokenResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    try {
      const tokenClient = oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        prompt: 'select_account',
        callback: (response: any) => {
          if (response?.error) {
            if (response.error === 'access_denied') {
              finish({ cancelled: true, errorMessage: 'Inicio de sesión con Google cancelado.' });
              return;
            }
            finish({ errorMessage: response.error_description || `Error de Google OAuth: ${response.error}` });
            return;
          }
          if (response?.access_token) {
            finish({ accessToken: response.access_token });
            return;
          }
          finish({ errorMessage: 'Google no devolvió un token de acceso válido.' });
        },
        error_callback: (err: any) => {
          if (err?.type === 'popup_closed') {
            finish({ cancelled: true });
            return;
          }
          if (err?.type === 'popup_failed_to_open') {
            finish({
              popupBlocked: true,
              errorMessage: 'El navegador bloqueó la ventana emergente de Google.',
            });
            return;
          }
          finish({ errorMessage: err?.message || 'Error al abrir la autenticación con Google.' });
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err: any) {
      finish({ errorMessage: err?.message || 'Error inicializando el cliente OAuth de Google.' });
    }
  });
}

export function startGoogleRedirectFlow(tenantSlug?: string | null): void {
  const params = new URLSearchParams();
  params.set('origin', window.location.origin);
  if (tenantSlug) {
    params.set('tenant', tenantSlug);
  }
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  window.location.href = `${base}/auth/google/start?${params.toString()}`;
}
