import React from 'react';
import { Search, Sun, Moon, Globe, LogOut, Menu, Shield } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { SUPPORTED_LANGUAGES, Language } from '../../i18n';

interface NavbarProps {
  onOpenSearch: () => void;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch, onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800">
      {/* Left: Mobile hamburger & Global Search Button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg md:hidden text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
          title="Menú"
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

      {/* Right: Language, Theme & User Profile */}
      <div className="flex items-center space-x-2">
        {/* Language selector */}
        <div className="relative flex items-center">
          <Globe className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 mr-1.5 hidden sm:inline" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            aria-label="Seleccionar idioma"
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
          aria-label="Alternar modo claro u oscuro"
          className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

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
    </header>
  );
};
