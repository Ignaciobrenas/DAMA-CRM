import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User as UserIcon,
  Shield,
  Building2,
  Clock,
  Settings,
  LogOut,
  CheckCircle2,
  Lock,
  Smartphone,
  Sparkles,
  ExternalLink,
  ChevronRight,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import { useLanguage } from '../../context/LanguageContext';
import { soundService } from '../../services/sound';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  onOpenGodMode?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenGodMode,
}) => {
  const { user, logout, updatePreferences } = useAuth();
  const { branding } = useBranding();
  const { t } = useLanguage();

  const [rememberSession, setRememberSession] = useState<boolean>(() => {
    return localStorage.getItem('dama_remember_device') !== 'false';
  });

  const [switchAccountOpen, setSwitchAccountOpen] = useState(false);

  // Stored secondary accounts for fast profile switching
  const [savedAccounts, setSavedAccounts] = useState<Array<{ name: string; email: string; role: string }>>(() => {
    try {
      const list = localStorage.getItem('dama_known_accounts');
      if (list) return JSON.parse(list);
    } catch {
      // fallback
    }
    return [
      { name: 'Ignacio God Admin', email: 'ignaciobrenas@gmail.com', role: 'ADMIN' },
      { name: 'Admin Demo S.L.', email: 'admin@dama-crm.local', role: 'ADMIN' },
      { name: 'Comercial Ventas', email: 'sales@damacrm.local', role: 'SALES' },
      { name: 'Técnico Soporte', email: 'tech@damacrm.local', role: 'TECH' },
    ];
  });

  const handleToggleRemember = (checked: boolean) => {
    setRememberSession(checked);
    localStorage.setItem('dama_remember_device', String(checked));
    soundService.playPopSound();
  };

  const handleNavigation = (route: string) => {
    soundService.playPopSound();
    onClose();
    onNavigate(route);
  };

  const handleSwitchToAccount = (acc: { email: string; name: string }) => {
    soundService.playSuccessChime();
    onClose();
    // Prompt login with prefilled email
    localStorage.setItem('dama_prefill_email', acc.email);
    logout();
  };

  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      >
        {/* Modal / Popup Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header Banner */}
          <div
            className="p-5 text-white relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${branding.primaryColor || '#2563EB'}, #1E293B)`,
            }}
          >
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs uppercase tracking-widest font-bold opacity-80 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {t('userProfile', 'Perfil de Usuario')}
              </span>
              <button
                onClick={onClose}
                className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Main Identity */}
            <div className="mt-3 flex items-center space-x-3.5 relative z-10">
              <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center font-bold text-xl text-white shadow-md">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base text-white truncate">{user.name}</h3>
                <p className="text-xs text-white/80 font-mono truncate">{user.email}</p>
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-xs text-white border border-white/30">
                    <Shield className="w-2.5 h-2.5" /> {user.role}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/20 text-white/90">
                    <Building2 className="w-2.5 h-2.5" /> {branding.companyName || 'Empresa'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 space-y-3.5 max-h-[72vh] overflow-y-auto">
            {/* Remember Session / Trust Device Toggle */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                    Recordar sesión en este equipo
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Mantiene el token seguro persistido para accesos rápidos
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(e) => handleToggleRemember(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Quick Actions Menu */}
            <div className="space-y-1">
              <button
                onClick={() => handleNavigation('/settings/profile')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center space-x-2.5">
                  <UserIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Mi Perfil & Datos Personales</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => handleNavigation('/my-time')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span>Mi Tiempo & Fichajes</span>
                </div>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono font-medium">
                  Laboral
                </span>
              </button>

              <button
                onClick={() => handleNavigation('/settings')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center space-x-2.5">
                  <Settings className="w-4 h-4 text-blue-500" />
                  <span>Configuración del Sistema</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* God Mode Trigger if Admin */}
              {onOpenGodMode && (user.role === 'ADMIN' || user.email === 'ignaciobrenas@gmail.com') && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenGodMode();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition border border-amber-200/60 dark:border-amber-800/40"
                >
                  <div className="flex items-center space-x-2.5">
                    <Shield className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold">Panel SuperAdmin & Multi-Tenant</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
                </button>
              )}
            </div>

            {/* Switch Account Section */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSwitchAccountOpen(!switchAccountOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center space-x-2">
                  <RefreshCw className={`w-3.5 h-3.5 text-blue-500 transition-transform ${switchAccountOpen ? 'rotate-180' : ''}`} />
                  <span>Cambiar de cuenta</span>
                </div>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                  {switchAccountOpen ? 'Ocultar' : 'Ver cuentas'}
                </span>
              </button>

              {switchAccountOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 space-y-1.5 pl-2"
                >
                  {savedAccounts.map((acc, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSwitchToAccount(acc)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition border ${
                        acc.email === user.email
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 dark:text-white truncate">
                          {acc.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {acc.email}
                        </div>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300">
                        {acc.role}
                      </span>
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      onClose();
                      logout();
                    }}
                    className="w-full flex items-center justify-center space-x-1.5 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Iniciar sesión con otra cuenta</span>
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer with Logout */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              Sesión activa
            </div>
            <button
              onClick={() => {
                soundService.playPopSound();
                onClose();
                logout();
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition border border-rose-200 dark:border-rose-900/50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
