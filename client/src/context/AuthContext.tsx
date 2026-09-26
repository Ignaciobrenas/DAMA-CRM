import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { soundService } from '../services/sound';

export interface UserPreferences {
  soundEnabled?: boolean;
  sidebarCollapsed?: boolean;
  sidebarPinnedItems?: string[];
  dashboardWidgets?: string[];
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  emailNotifications?: boolean;
  compactMode?: boolean;
  onboardingCompleted?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  twoFactorEnabled: boolean;
  preferences?: UserPreferences;
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
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<boolean>;
  updateProfile: (profile: { name?: string; avatar?: string }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('dama_token');
    const saved = localStorage.getItem('dama_user');
    if (!token || !saved) {
      localStorage.removeItem('dama_token');
      localStorage.removeItem('dama_user');
      return null;
    }
    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem('dama_user');
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('dama_token');
      localStorage.removeItem('dama_user');
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    // Verify session
    const token = localStorage.getItem('dama_token');
    if (token) {
      apiRequest('/auth/me')
        .then((res) => {
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('dama_user', JSON.stringify(res.user));
            if (res.user.preferences?.soundEnabled !== undefined) {
              soundService.setMuted(!res.user.preferences.soundEnabled);
            }
          } else {
            setUser(null);
            localStorage.removeItem('dama_token');
            localStorage.removeItem('dama_user');
          }
          setIsLoading(false);
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem('dama_token');
          localStorage.removeItem('dama_user');
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
      return { require2FA: true, tempToken: res.tempToken, success: true, message: res.message };
    }

    if (res.success && (res as any).token && (res as any).user) {
      localStorage.setItem('dama_token', (res as any).token);
      localStorage.setItem('dama_user', JSON.stringify((res as any).user));
      setUser((res as any).user);
      if ((res as any).user.preferences?.soundEnabled !== undefined) {
        soundService.setMuted(!(res as any).user.preferences.soundEnabled);
      }
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

    return { success: false, message: res.message || 'Error al crear la cuenta' };
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
      if ((res as any).user.preferences?.soundEnabled !== undefined) {
        soundService.setMuted(!(res as any).user.preferences.soundEnabled);
      }
      return { success: true };
    }

    return { success: false, message: res.message || 'Código 2FA incorrecto' };
  };

  const logout = () => {
    localStorage.removeItem('dama_token');
    localStorage.removeItem('dama_user');
    sessionStorage.removeItem('dama_intended_route');
    setUser(null);
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return (
      user.permissions?.some(
        (p) => (p.resource === resource || p.resource === '*') && (p.action === action || p.action === 'manage')
      ) || false
    );
  };

  const updatePreferences = async (newPreferences: Partial<UserPreferences>): Promise<boolean> => {
    if (!user) return false;

    const mergedPrefs = { ...(user.preferences || {}), ...newPreferences };
    const updatedUser = { ...user, preferences: mergedPrefs };

    // Optimistically update local state & sound
    setUser(updatedUser);
    localStorage.setItem('dama_user', JSON.stringify(updatedUser));
    if (newPreferences.soundEnabled !== undefined) {
      soundService.setMuted(!newPreferences.soundEnabled);
    }

    try {
      const res = await apiRequest('/users/preferences', {
        method: 'PATCH',
        body: JSON.stringify(newPreferences),
      });
      if (res.success && res.data) {
        const finalUser = { ...user, preferences: res.data };
        setUser(finalUser);
        localStorage.setItem('dama_user', JSON.stringify(finalUser));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const updateProfile = async (profile: { name?: string; avatar?: string }): Promise<boolean> => {
    if (!user) return false;

    try {
      const res = await apiRequest('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify(profile),
      });
      if (res.success && res.data) {
        const updated = { ...user, ...res.data };
        setUser(updated);
        localStorage.setItem('dama_user', JSON.stringify(updated));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user && localStorage.getItem('dama_token')),
        isLoading,
        login,
        register,
        verify2FA,
        logout,
        hasPermission,
        updatePreferences,
        updateProfile,
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
