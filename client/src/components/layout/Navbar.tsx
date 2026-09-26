import React, { useState } from 'react';
import {
  Search,
  Sun,
  Moon,
  Globe,
  LogOut,
  Menu,
  Shield,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { soundService } from '../../services/sound';
import { SUPPORTED_LANGUAGES, Language } from '../../i18n';
import { GodModeModal } from '../modals/GodModeModal';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { ClockWidget } from '../employee-portal/ClockWidget';

interface NavbarProps {
  onOpenSearch: () => void;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch, onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, logout, updatePreferences } = useAuth();
  const [isMuted, setIsMuted] = useState(() => soundService.isMuted());

  // God Mode SuperAdmin state
  const [isGodModalOpen, setIsGodModalOpen] = useState(false);
  const [activeTenant, setActiveTenant] = useState<any>({ slug: 'master', name: 'Master Tenant' });
  const isSuperAdmin = user?.role === 'ADMIN' || user?.email === 'ignaciobrenas@gmail.com' || user?.email === 'admin@dama-crm.local';

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
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800">
      {/* Left: Mobile hamburger & Global Search Button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg md:hidden text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
          title={t('menu')}
          aria-label={t('menu')}
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenSearch}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 text-xs transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('searchPlaceholder')}</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 shadow-xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Real-time status, God Mode, Sound, Language, Theme & User Profile */}
      <div className="flex items-center space-x-2">
        {/* God Mode SuperAdmin Tenant Switcher */}
        {isSuperAdmin && (
          <button
            onClick={() => setIsGodModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60 hover:bg-amber-500/20 transition shadow-xs"
            title="Panel de SuperAdmin God Mode & Multi-Tenant"
          >
            <span>👑</span>
            <span className="hidden md:inline font-mono">{activeTenant?.name || 'God Mode'}</span>
          </button>
        )}

        {/* 1-Click Clock In/Out Real-Time Widget */}
        <ClockWidget compact />

        {/* Real-time sync indicator */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>{t('liveSync')}</span>
        </div>

        {/* Audio Mute/Unmute toggle */}
        <button
          onClick={handleToggleSound}
          aria-label={isMuted ? t('enableSound') : t('muteSound')}
          className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          title={isMuted ? t('enableSound') : t('muteSound')}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
        </button>

        {/* Language selector */}
        <div className="relative flex items-center">
          <Globe className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 mr-1.5 hidden sm:inline" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            aria-label={t('languageSelect')}
            className="text-xs bg-transparent border border-gray-200 dark:border-slate-700 rounded-md py-1 px-1.5 text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="dark:bg-slate-900">
                {l.nativeName}
              </option>
            ))}
          </select>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={t('themeToggle')}
          className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'dark' ? t('lightMode') : t('darkMode')}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Real-time Notification Center with Interactive Navigation */}
        <NotificationCenter />

        {/* User Pill & Logout */}
        {user && (
          <div className="flex items-center pl-2 space-x-2 border-l border-gray-200 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold leading-tight text-gray-800 dark:text-slate-100">{user.name}</div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center">
                  <Shield className="w-2.5 h-2.5 mr-0.5 inline" /> {user.role}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title={t('logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* God Mode SuperAdmin Multi-Tenant Modal */}
      {isSuperAdmin && (
        <GodModeModal
          isOpen={isGodModalOpen}
          onClose={() => setIsGodModalOpen(false)}
          activeTenantSlug={activeTenant?.slug || 'master'}
          onSelectTenant={(t) => {
            setActiveTenant(t);
          }}
        />
      )}
    </header>
  );
};
