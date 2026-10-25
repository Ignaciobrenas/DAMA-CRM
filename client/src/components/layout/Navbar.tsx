import React, { useState } from 'react';
import {
  Search,
  Sun,
  Moon,
  Globe,
  Menu,
  Volume2,
  VolumeX,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import { soundService } from '../../services/sound';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { ClockWidget } from '../employee-portal/ClockWidget';
import { OnboardingTourModal } from '../onboarding/OnboardingTourModal';
import { UserProfileModal } from './UserProfileModal';
import { LanguageModal } from './LanguageModal';
import { MODULE_TOURS } from '../common/ModuleOnboardingModal';

interface NavbarProps {
  currentRoute?: string;
  onOpenSearch: () => void;
  onToggleSidebar: () => void;
  onNavigate?: (route: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute = '/',
  onOpenSearch,
  onToggleSidebar,
  onNavigate,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { language, t } = useLanguage();
  const { user, updatePreferences } = useAuth();
  const { branding } = useBranding();
  const [isMuted, setIsMuted] = useState(() => soundService.isMuted());
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  const currentModuleTitle =
    MODULE_TOURS[currentRoute]?.moduleTitle || t('dashboard', 'Panel Principal');

  const handleToggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundService.setMuted(nextMuted);
    if (!nextMuted) {
      soundService.playPopSound();
    }
    updatePreferences({ soundEnabled: !nextMuted });
  };

  const handleOpenModuleGuide = () => {
    window.dispatchEvent(new CustomEvent('dama:open-module-tour'));
  };

  return (
    <header
      data-testid="app-topbar"
      className="sticky top-0 z-30 flex items-center justify-between h-14 px-3 sm:px-6 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 transition-colors"
    >
      {/* Left: Mobile Menu + Contextual Breadcrumb + Command Bar (⌘K) */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="h-9 w-9 inline-flex items-center justify-center rounded-xl md:hidden bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 transition-colors shrink-0"
          title={t('menu')}
          aria-label={t('menu')}
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Contextual Breadcrumb (Desktop) */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs select-none mr-1 truncate max-w-[260px]">
          <span className="font-medium text-slate-400 dark:text-slate-500 truncate">
            {branding.companyName}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
            {currentModuleTitle}
          </span>
        </div>

        {/* Sleek Linear/Vercel Command Search Trigger */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="h-9 flex items-center gap-2 px-2.5 sm:px-3 rounded-xl bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-medium transition-all shadow-2xs cursor-pointer w-9 sm:w-44 md:w-52 justify-center sm:justify-start shrink-0"
          title="Buscar módulos, clientes o comandos (⌘K)"
          aria-label="Buscar"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="hidden sm:inline truncate">Buscar...</span>
          <kbd className="ml-auto hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Module Guide, Tenant Switcher, ClockWidget, Utility Dock & User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Module Onboarding Guide Trigger */}
        <button
          type="button"
          onClick={handleOpenModuleGuide}
          data-testid="reopen-module-onboarding-btn"
          aria-label={`Abrir guía de inicio rápido de ${currentModuleTitle}`}
          title={`Ver guía de uso de ${currentModuleTitle}`}
          className="h-9 inline-flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-2xs transition-all cursor-pointer shrink-0"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
          <span className="hidden md:inline">Guía del Módulo</span>
        </button>

        {/* 1-Click Clock In/Out Real-Time Widget */}
        <ClockWidget compact />

        {/* Unified Utility Dock (Sound, Language, Theme, Notifications) */}
        <div className="h-9 flex items-center gap-0.5 px-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          {/* Audio Mute/Unmute toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            aria-label={isMuted ? t('enableSound') : t('muteSound')}
            className="hidden lg:inline-flex w-7 h-7 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isMuted ? t('enableSound') : t('muteSound')}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Language selector popup */}
          <button
            type="button"
            onClick={() => {
              soundService.playPopSound();
              setIsLanguageModalOpen(true);
            }}
            aria-label={t('languageSelect')}
            title={t('languageSelect')}
            className="hidden sm:inline-flex h-7 px-1.5 items-center justify-center gap-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-mono font-semibold uppercase">{language}</span>
          </button>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={t('themeToggle')}
            className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={theme === 'dark' ? t('lightMode') : t('darkMode')}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Real-time Notification Center */}
          <NotificationCenter />
        </div>

        {/* User Pill & Profile Popup Trigger */}
        {user && (
          <button
            type="button"
            onClick={() => {
              soundService.playPopSound();
              setIsProfileModalOpen(true);
            }}
            className="h-9 flex items-center gap-2 pl-1.5 pr-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left shadow-2xs cursor-pointer shrink-0"
            title="Ver perfil de usuario, preferencias y sesión"
          >
            <div className="w-6 h-6 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center font-bold text-[11px] shrink-0 overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="hidden lg:block text-left leading-none">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[110px]">
                {user.name}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                {user.role}
              </div>
            </div>
          </button>
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
      />

      {/* Centered Language Selection Modal */}
      <LanguageModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
      />

      {/* Interactive Capabilities & Onboarding Tour Modal */}
      <OnboardingTourModal
        isOpen={isTourOpen}
        forceOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </header>
  );
};
