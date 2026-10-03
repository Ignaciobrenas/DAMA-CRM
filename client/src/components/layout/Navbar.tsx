import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Sun,
  Moon,
  Globe,
  LogOut,
  Menu,
  Shield,
  ShieldAlert,
  Volume2,
  VolumeX,
  HelpCircle,
  Check,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { soundService } from '../../services/sound';
import { SUPPORTED_LANGUAGES, Language } from '../../i18n';
import { GodModeModal } from '../modals/GodModeModal';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { ClockWidget } from '../employee-portal/ClockWidget';
import { OnboardingTourModal } from '../onboarding/OnboardingTourModal';
import { UserProfileModal } from './UserProfileModal';
import { LanguageModal } from './LanguageModal';

interface NavbarProps {
  onOpenSearch: () => void;
  onToggleSidebar: () => void;
  onNavigate?: (route: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch, onToggleSidebar, onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, logout, updatePreferences } = useAuth();
  const [isMuted, setIsMuted] = useState(() => soundService.isMuted());
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // God Mode SuperAdmin state
  const [isGodModalOpen, setIsGodModalOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [activeTenant, setActiveTenant] = useState<any>(() => {
    const savedSlug = localStorage.getItem('dama_switch_tenant');
    const savedName = localStorage.getItem('dama_switch_tenant_name');
    if (savedSlug && savedSlug !== 'master') {
      return { slug: savedSlug, name: savedName || savedSlug };
    }
    return { slug: 'master', name: 'Master (Global)' };
  });
  const isSuperAdmin = user?.role === 'ADMIN' || user?.email === 'ignaciobrenas@gmail.com' || user?.email === 'admin@dama-crm.local';

  const handleSwitchTenant = (tenant: any) => {
    if (!tenant || tenant.slug === 'master' || tenant.isGodTenant) {
      localStorage.removeItem('dama_switch_tenant');
      localStorage.removeItem('dama_switch_tenant_name');
      setActiveTenant({ slug: 'master', name: 'Master (Global)' });
    } else {
      localStorage.setItem('dama_switch_tenant', tenant.slug);
      localStorage.setItem('dama_switch_tenant_name', tenant.name);
      setActiveTenant(tenant);
    }
    window.dispatchEvent(new CustomEvent('app:tenant-switched', { detail: tenant }));
    // Force refresh the window data gracefully
    setTimeout(() => {
      window.location.reload();
    }, 150);
  };

  const handleResetToMaster = () => {
    handleSwitchTenant({ slug: 'master', name: 'Master (Global)', isGodTenant: true });
  };

  const handleToggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundService.setMuted(nextMuted);
    if (!nextMuted) {
      soundService.playPopSound();
    }
    updatePreferences({ soundEnabled: !nextMuted });
  };


  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 shadow-sm text-slate-100">
      {/* Left: Mobile hamburger & Global Search Pill */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl md:hidden text-slate-200 hover:bg-slate-800/80 border border-slate-700/80 transition-colors"
          title={t('menu')}
          aria-label={t('menu')}
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenSearch}
          className="flex items-center space-x-2.5 px-3.5 py-2 rounded-xl bg-slate-800/80 text-slate-200 hover:bg-slate-700/90 border border-slate-700/80 hover:border-slate-600 text-xs font-medium transition-all shadow-2xs group cursor-pointer w-40 sm:w-56 md:w-64"
          title="Buscar"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors shrink-0" />
          <span className="truncate text-slate-300">Buscar</span>
          <kbd className="ml-auto hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-md bg-slate-900 border border-slate-700 text-slate-300 shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Real-time status, God Mode, Sound, Language, Theme & User Profile */}
      <div className="flex items-center space-x-2 sm:space-x-2.5">
        {/* God Mode SuperAdmin Tenant Switcher */}
        {isSuperAdmin && (
          <button
            onClick={() => setIsGodModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/80 hover:bg-amber-500/25 transition shadow-2xs"
            title="Panel de SuperAdmin God Mode & Multi-Tenant"
          >
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span className="hidden md:inline font-mono font-bold">{activeTenant?.name || 'God Mode'}</span>
          </button>
        )}

        {/* 1-Click Clock In/Out Real-Time Widget */}
        <ClockWidget compact />

        {/* Utility Group Divider */}
        <div className="hidden sm:block h-6 w-px bg-slate-700 mx-0.5" />

        {/* Audio Mute/Unmute toggle */}
        <button
          onClick={handleToggleSound}
          aria-label={isMuted ? t('enableSound') : t('muteSound')}
          className="p-2 rounded-xl text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
          title={isMuted ? t('enableSound') : t('muteSound')}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Language selector popup - opens centered LanguageModal */}
        <button
          onClick={() => {
            soundService.playPopSound();
            setIsLanguageModalOpen(true);
          }}
          aria-label={t('languageSelect')}
          title={t('languageSelect')}
          className="p-2 rounded-xl text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors flex items-center space-x-1"
        >
          <Globe className="w-4 h-4" />
          <span className="text-[10px] font-mono font-bold uppercase py-0.5 px-1 rounded bg-slate-800 text-slate-300">
            {language}
          </span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={t('themeToggle')}
          className="p-2 rounded-xl text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
          title={theme === 'dark' ? t('lightMode') : t('darkMode')}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
        </button>



        {/* Real-time Notification Center with Interactive Navigation */}
        <NotificationCenter />

        {/* User Pill & Profile Popup Trigger */}
        {user && (
          <div className="flex items-center pl-1 sm:pl-2 border-l border-slate-700">
            <button
              onClick={() => {
                soundService.playPopSound();
                setIsProfileModalOpen(true);
              }}
              className="flex items-center space-x-2.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition group text-left shadow-2xs"
              title="Ver perfil de usuario, cambiar cuenta y sesión"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-500/30 group-hover:ring-blue-500 transition shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold leading-tight text-slate-100 group-hover:text-blue-400 transition truncate max-w-[120px]">{user.name}</div>
                <div className="text-[10px] text-blue-300 font-semibold flex items-center mt-0.5">
                  <Shield className="w-2.5 h-2.5 mr-0.5 inline shrink-0" /> {user.role}
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* User Profile, Account Switcher & Session Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onNavigate={(route) => {
          if (onNavigate) {
            onNavigate(route);
          } else {
            window.location.href = route;
          }
        }}
        onOpenGodMode={isSuperAdmin ? () => setIsGodModalOpen(true) : undefined}
      />

      {/* Centered Language Selection Modal */}
      <LanguageModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
      />

      {/* God Mode SuperAdmin Multi-Tenant Modal */}
      {isSuperAdmin && (
        <GodModeModal
          isOpen={isGodModalOpen}
          onClose={() => setIsGodModalOpen(false)}
          activeTenantSlug={activeTenant?.slug || 'master'}
          onSelectTenant={(t) => {
            handleSwitchTenant(t);
          }}
        />
      )}

      {/* Interactive Capabilities & Onboarding Tour Modal */}
      <OnboardingTourModal
        isOpen={isTourOpen}
        forceOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />

      {/* Sub-Tenant Impersonation Active Banner */}
      {isSuperAdmin && activeTenant?.slug && activeTenant.slug !== 'master' && (
        <div className="absolute top-16 left-0 right-0 z-20 px-4 py-2 bg-amber-600 text-white flex items-center justify-between text-xs shadow-md">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px] bg-black/25 px-2 py-0.5 rounded">
              SuperAdmin Activo
            </span>
            <span>
              Viendo datos aislados de: <strong>{activeTenant.name}</strong> ({activeTenant.slug})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGodModalOpen(true)}
              className="px-2.5 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white font-medium transition"
            >
              Cambiar Empresa
            </button>
            <button
              onClick={handleResetToMaster}
              className="px-2.5 py-0.5 rounded bg-black/40 hover:bg-black/60 text-white font-medium transition flex items-center space-x-1"
            >
              <LogOut className="w-3 h-3" />
              <span>Salir a Master</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
