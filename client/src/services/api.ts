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

    const data = await res.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error de conexión con el servidor',
    };
  }
}
