const API_BASE =
  typeof window !== 'undefined' && window.location.port === '5173'
    ? 'http://localhost:4000/api'
    : '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  user?: any;
  token?: string;
  pagination?: { total: number; page: number; limit: number; pages: number };
  message?: string;
  require2FA?: boolean;
  tempToken?: string;
  [key: string]: any;
}

export interface ApiOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  suppressToast?: boolean;
  responseType?: string;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('dama_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let fullUrl = `${API_BASE}${endpoint}`;
  if (options.params) {
    const searchParams = new URLSearchParams();
    for (const [k, v] of Object.entries(options.params)) {
      if (v !== undefined && v !== null && v !== '') {
        searchParams.append(k, String(v));
      }
    }
    const qs = searchParams.toString();
    if (qs) {
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
    }
  }

  try {
    const res = await fetch(fullUrl, {
      ...options,
      headers,
    });

    if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/verify-2fa') && !endpoint.includes('/branding')) {
      localStorage.removeItem('dama_token');
      localStorage.removeItem('dama_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    // For file downloads (like PDF)
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/pdf')) {
      const blob = await res.blob();
      return { success: true, data: blob as any };
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      let friendlyMsg = data?.message;
      if (!friendlyMsg || friendlyMsg.length > 120 || friendlyMsg.includes('Prisma') || friendlyMsg.includes('SQL')) {
        if (res.status === 403) {
          friendlyMsg = 'No tienes permisos suficientes para realizar esta acción.';
        } else if (res.status === 404) {
          friendlyMsg = 'El elemento solicitado no se encuentra disponible.';
        } else if (res.status === 409) {
          friendlyMsg = 'Ya existe un elemento idéntico registrado en el sistema.';
        } else if (res.status >= 500) {
          friendlyMsg = 'Ha ocurrido una incidencia en el servidor. Por favor, reinténtalo.';
        } else {
          friendlyMsg = 'No se pudo completar la solicitud.';
        }
      }

      if (!(options as any).suppressToast) {
        const errorTitle =
          res.status === 403
            ? 'Permiso Denegado'
            : res.status === 404
            ? 'Elemento No Encontrado'
            : res.status === 409
            ? 'Conflicto de Registro'
            : res.status >= 500
            ? 'Error del Servidor'
            : 'Error en la Solicitud';

        window.dispatchEvent(
          new CustomEvent('app:toast-error', {
            detail: {
              title: errorTitle,
              message: friendlyMsg,
            },
          })
        );
      }

      return {
        success: false,
        message: friendlyMsg,
      };
    }

    return data;
  } catch {
    const errorMsg = 'No se pudo conectar con el servidor. Comprueba tu conexión de red.';
    if (!(options as any).suppressToast) {
      window.dispatchEvent(
        new CustomEvent('app:toast-error', {
          detail: {
            title: 'Fallo de Red',
            message: errorMsg,
          },
        })
      );
    }

    return {
      success: false,
      message: errorMsg,
    };
  }
}

export const api = {
  get: (url: string, options?: ApiOptions) => apiRequest(url, { ...options, method: 'GET' }),
  post: (url: string, data?: any, options?: ApiOptions) =>
    apiRequest(url, { ...options, method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  put: (url: string, data?: any, options?: ApiOptions) =>
    apiRequest(url, { ...options, method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  patch: (url: string, data?: any, options?: ApiOptions) =>
    apiRequest(url, { ...options, method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  delete: (url: string, options?: ApiOptions) => apiRequest(url, { ...options, method: 'DELETE' }),
};


