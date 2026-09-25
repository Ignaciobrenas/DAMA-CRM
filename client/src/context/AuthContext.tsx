import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  twoFactorEnabled: boolean;
  permissions: Array<{ resource: string; action: string }>;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ require2FA?: boolean; tempToken?: string; success: boolean; message?: string }>;
  register: (name: string, email: string, password: string, companyName?: string) => Promise<{ success: boolean; message?: string }>;
  verify2FA: (tempToken: string, code: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  hasPermission: (resource: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('dama_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    // Verify session
    const token = localStorage.getItem('dama_token');
    if (token) {
      apiRequest('/auth/me').then((res) => {
        if (res.success && res.user) {
          setUser(res.user);
          localStorage.setItem('dama_user', JSON.stringify(res.user));
        } else {
          setUser(null);
          localStorage.removeItem('dama_token');
          localStorage.removeItem('dama_user');
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }

    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.require2FA && res.tempToken) {
      return { require2FA: true, tempToken: res.tempToken, success: true };
    }

    if (res.success && (res as any).token && (res as any).user) {
      localStorage.setItem('dama_token', (res as any).token);
      localStorage.setItem('dama_user', JSON.stringify((res as any).user));
      setUser((res as any).user);
      return { success: true };
    }

    return { success: false, message: res.message || 'Error al iniciar sesión' };
  };

  const register = async (name: string, email: string, password: string, companyName?: string) => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, companyName }),
    });

    if (res.success && (res as any).token && (res as any).user) {
      localStorage.setItem('dama_token', (res as any).token);
      localStorage.setItem('dama_user', JSON.stringify((res as any).user));
      setUser((res as any).user);
      return { success: true };
    }

    return { success: false, message: res.message || 'Error al registrar usuario' };
  };

  const verify2FA = async (tempToken: string, code: string) => {
    const res = await apiRequest('/auth/verify-2fa', {
      method: 'POST',
      body: JSON.stringify({ tempToken, code }),
    });

    if (res.success && (res as any).token && (res as any).user) {
      localStorage.setItem('dama_token', (res as any).token);
      localStorage.setItem('dama_user', JSON.stringify((res as any).user));
      setUser((res as any).user);
      return { success: true };
    }

    return { success: false, message: res.message || 'Código 2FA incorrecto' };
  };

  const logout = () => {
    localStorage.removeItem('dama_token');
    localStorage.removeItem('dama_user');
    setUser(null);
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return user.permissions.some(
      (p) => (p.resource === resource || p.resource === '*') && (p.action === action || p.action === 'manage')
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        verify2FA,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
