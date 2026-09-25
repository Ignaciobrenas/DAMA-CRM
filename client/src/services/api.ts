const API_BASE = '/api';

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

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('dama_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/verify-2fa')) {
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

      return {
        success: false,
        message: friendlyMsg,
      };
    }

    return data;
  } catch {
    return {
      success: false,
      message: 'No se pudo conectar con el servidor. Comprueba tu conexión de red.',
    };
  }
}
