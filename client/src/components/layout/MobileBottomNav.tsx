import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Receipt,
  Menu,
  Sparkles,
} from 'lucide-react';
import { soundService } from '../../services/sound';
import { useLanguage } from '../../context/LanguageContext';

interface MobileBottomNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentRoute,
  onNavigate,
  onOpenMenu,
}) => {
  const { t } = useLanguage();

  const navTabs = [
    { id: 'dashboard', label: 'Inicio', route: '/', icon: LayoutDashboard },
    { id: 'pipeline', label: 'Ventas', route: '/pipeline', icon: TrendingUp },
    { id: 'contacts', label: 'Clientes', route: '/contacts', icon: Users },
    { id: 'invoicing', label: 'Facturas', route: '/invoicing', icon: Receipt },
  ];

  const handleTabClick = (route: string) => {
    soundService.playPopSound();
    onNavigate(route);
  };

  const handleMenuClick = () => {
    soundService.playPopSound();
    onOpenMenu();
  };

  return (
    <nav
      aria-label="Navegación Móvil Inferior"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl transition-all"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentRoute === tab.route;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.route)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-150 touch-manipulation active:scale-95 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeMobileTabPill"
                  className="absolute inset-0 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200/50 dark:border-blue-800/40"
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
              </div>
            </button>
          );
        })}

        {/* Menu / All Modules Trigger */}
        <button
          onClick={handleMenuClick}
          className="relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-all duration-150 touch-manipulation active:scale-95"
          title="Abrir menú de todos los módulos"
        >
          <div className="relative flex flex-col items-center">
            <Menu className="w-5 h-5 stroke-2" />
            <span className="text-[10px] tracking-tight mt-0.5">Menú</span>
          </div>
        </button>
      </div>
    </nav>
  );
};
