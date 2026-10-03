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
  useCache?: boolean; // NEW: optional cache flag
}

// Simple in-memory cache for GET requests
const apiCache = new Map<string, { timestamp: number; data: ApiResponse }>();
const CACHE_TTL_MS = 60000; // 60 seconds

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

  const switchTenant = localStorage.getItem('dama_switch_tenant');
  if (switchTenant && !headers.has('X-Switch-Tenant-ID')) {
    headers.set('X-Switch-Tenant-ID', switchTenant);
  }

  // Automatic Subdomain Tenant Detection
  try {
    if (typeof window !== 'undefined') {
      const hostParts = window.location.hostname.toLowerCase().split('.');
      if (
        (window.location.hostname.endsWith('.dama.com') ||
          window.location.hostname.endsWith('.damacrm.local') ||
          window.location.hostname.endsWith('.localhost')) &&
        hostParts.length >= 3
      ) {
        const sub = hostParts[0];
        if (sub && sub !== 'app' && sub !== 'www' && sub !== 'api') {
          if (!headers.has('X-Tenant-Slug')) {
            headers.set('X-Tenant-Slug', sub);
          }
          if (!headers.has('X-Switch-Tenant-ID') && !switchTenant) {
            headers.set('X-Switch-Tenant-ID', sub);
          }
        }
      }
    }
  } catch {}

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

  // Check cache for GET requests if useCache is enabled (defaults to true for simple GETs)
  const isGetRequest = !options.method || options.method.toUpperCase() === 'GET';
  const shouldCache = isGetRequest && (options.useCache !== false);
  const cacheKey = fullUrl;

  if (shouldCache) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data; // Return fresh cached data instantly
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

    // Cache successful GET responses
    if (shouldCache && data.success !== false) {
      apiCache.set(cacheKey, { timestamp: Date.now(), data });
    }

    // If mutating data (POST, PUT, DELETE, PATCH), invalidate cache
    if (!isGetRequest) {
      apiCache.clear(); // Brutal clear for simplicity to ensure consistency
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

export async function downloadFile(endpoint: string, fallbackFilename: string): Promise<boolean> {
  try {
    const token = localStorage.getItem('dama_token');
    const switchTenant = localStorage.getItem('dama_switch_tenant');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (switchTenant) headers['X-Switch-Tenant-ID'] = switchTenant;

    const fullUrl = `${API_BASE}${endpoint}`;
    const res = await fetch(fullUrl, { headers });

    if (!res.ok) throw new Error('Error al descargar archivo');

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fallbackFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return true;
  } catch (err: any) {
    console.error('Download failed:', err);
    window.dispatchEvent(
      new CustomEvent('app:toast-error', {
        detail: {
          title: 'Error de Descarga',
          message: err.message || 'No se pudo descargar el archivo.',
        },
      })
    );
    return false;
  }
}
