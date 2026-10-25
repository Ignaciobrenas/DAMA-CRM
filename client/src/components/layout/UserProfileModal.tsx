import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User as UserIcon,
  Shield,
  Building2,
  Clock,
  Settings,
  LogOut,
  Smartphone,
  Sparkles,
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
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const { t } = useLanguage();

  const [rememberSession, setRememberSession] = useState<boolean>(() => {
    return localStorage.getItem('dama_remember_device') !== 'false';
  });

  const [switchAccountOpen, setSwitchAccountOpen] = useState(false);

  // Stored secondary accounts for fast profile switching
  const [savedAccounts] = useState<Array<{ name: string; email: string; role: string }>>(() => {
    try {
      const list = localStorage.getItem('dama_known_accounts');
      if (list) return JSON.parse(list);
    } catch {
      // fallback
    }
    return [
      { name: 'Ignacio Admin', email: 'ignaciobrenas@gmail.com', role: 'ADMIN' },
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
    localStorage.setItem('dama_prefill_email', acc.email);
    logout();
  };

  if (!isOpen || !user) return null;

  return createPortal(
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        onClick={onClose}
        className="fixed top-14 inset-x-0 bottom-0 z-40 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      >
        {/* Modal / Popup Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden z-50 max-h-[85vh] flex flex-col m-auto"
        >
          {/* Homologated Emil Kowalski Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm border border-blue-400/30 shrink-0 overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {user.name}
                  </h3>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                    <Shield className="w-2.5 h-2.5" /> {user.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                  {user.email}
                </p>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{branding.companyName || 'Empresa'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label={t('close', 'Cerrar')}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 space-y-3 max-h-[65vh] overflow-y-auto">
            {/* Remember Session / Trust Device Toggle */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                    Recordar sesión en este equipo
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Mantiene el token seguro persistido
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  aria-label="Recordar sesión en este equipo"
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
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition active:scale-[0.99]"
              >
                <div className="flex items-center space-x-2.5">
                  <UserIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Mi Perfil & Datos Personales</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => handleNavigation('/my-time')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition active:scale-[0.99]"
              >
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span>Mi Tiempo & Fichajes</span>
                </div>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md font-mono font-medium">
                  Laboral
                </span>
              </button>

              <button
                onClick={() => handleNavigation('/settings')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition active:scale-[0.99]"
              >
                <div className="flex items-center space-x-2.5">
                  <Settings className="w-4 h-4 text-blue-500" />
                  <span>Configuración del Sistema</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            {/* Switch Account Section */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={() => setSwitchAccountOpen(!switchAccountOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
              >
                <div className="flex items-center space-x-2">
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-blue-500 transition-transform ${
                      switchAccountOpen ? 'rotate-180' : ''
                    }`}
                  />
                  <span>Cambiar de cuenta</span>
                </div>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-semibold">
                  {switchAccountOpen ? 'Ocultar' : 'Ver cuentas'}
                </span>
              </button>

              {switchAccountOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 space-y-1.5"
                >
                  {savedAccounts.map((acc, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSwitchToAccount(acc)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition border active:scale-[0.99] ${
                        acc.email === user.email
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {acc.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {acc.email}
                        </div>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300 font-semibold border border-slate-200/60 dark:border-slate-700">
                        {acc.role}
                      </span>
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      onClose();
                      logout();
                    }}
                    className="w-full flex items-center justify-center space-x-1.5 py-2 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Iniciar sesión con otra cuenta</span>
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer with Logout */}
          <div className="px-5 py-3.5 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              Sesión activa
            </span>
            <button
              onClick={() => {
                soundService.playPopSound();
                onClose();
                logout();
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition border border-rose-200 dark:border-rose-900/50 active:scale-[0.98]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
