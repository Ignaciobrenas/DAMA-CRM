import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Sun,
  Moon,
  Globe,
  LogOut,
  Menu,
  Shield,
  Bell,
  Check,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { wsClient } from '../../services/websocket';
import { soundService } from '../../services/sound';
import { AnimatedIcon } from '../ui/AnimatedIcon';
import { SUPPORTED_LANGUAGES, Language } from '../../i18n';

interface NavbarProps {
  onOpenSearch: () => void;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch, onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, logout, updatePreferences } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => soundService.isMuted());
  const notifRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Nuevo WhatsApp recibido',
      desc: 'Laura Gómez: "¿Podéis enviarme la propuesta revisada?"',
      time: 'Hace 5m',
      type: 'chat',
      unread: true,
    },
    {
      id: '2',
      title: 'Fase de Negocio actualizada',
      desc: 'Acme Corp avanza a "Negociación" (€18.500)',
      time: 'Hace 25m',
      type: 'deal',
      unread: true,
    },
    {
      id: '3',
      title: 'Alerta de Stock (UnoPIM)',
      desc: 'Servidor Rack 1U tiene menos de 3 unidades disponibles',
      time: 'Hace 1h',
      type: 'stock',
      unread: false,
    },
  ]);

  // Click-outside listener to automatically close notifications dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const unsubNotif = wsClient.on('notification:new', (notif: any) => {
      setNotifications((prev) => [
        {
          id: String(Date.now()),
          title: notif.title || 'Nueva notificación',
          desc: notif.desc || '',
          time: 'Ahora mismo',
          type: notif.type || 'deal',
          unread: true,
        },
        ...prev,
      ]);
      soundService.playMessageChime();
    });

    const unsubLead = wsClient.on('lead:captured', (data: any) => {
      setNotifications((prev) => [
        {
          id: String(Date.now()),
          title: '🎯 ¡Nuevo Lead Web Capturado!',
          desc: `${data.name} (${data.email}) desde ${data.source}`,
          time: 'Ahora mismo',
          type: 'deal',
          unread: true,
        },
        ...prev,
      ]);
      soundService.playSuccessChime();
    });

    const unsubCart = wsClient.on('ecommerce:cart_abandoned', (data: any) => {
      setNotifications((prev) => [
        {
          id: String(Date.now()),
          title: '🛒 Carrito Abandonado Detectado',
          desc: `${data.customerName || 'Cliente anónimo'} dejó €${data.cartTotal} en el checkout`,
          time: 'Ahora mismo',
          type: 'deal',
          unread: true,
        },
        ...prev,
      ]);
      soundService.playAlertSound();
    });

    const unsubSync = wsClient.on('system:data_synced', (data: any) => {
      setNotifications((prev) => [
        {
          id: String(Date.now()),
          title: '⚡ UnoPIM & ERP Sincronizados',
          desc: `${data.productsCount || 'Varios'} artículos e inventario actualizados`,
          time: 'Ahora mismo',
          type: 'stock',
          unread: true,
        },
        ...prev,
      ]);
      soundService.playPopSound();
    });

    const unsubDeal = wsClient.on('deal:created', (deal: any) => {
      setNotifications((prev) => [
        {
          id: String(Date.now()),
          title: '💼 Nuevo Negocio Registrado',
          desc: `${deal.title} (${deal.value} ${deal.currency})`,
          time: 'Ahora mismo',
          type: 'deal',
          unread: true,
        },
        ...prev,
      ]);
      soundService.playSuccessChime();
    });

    const unsubQuote = wsClient.on('quote:converted', (data: any) => {
      setNotifications((prev) => [
        {
          id: String(Date.now()),
          title: '🧾 Presupuesto Convertido a Factura',
          desc: `Factura ${data.invoiceNumber} emitida desde ${data.quoteNumber}`,
          time: 'Ahora mismo',
          type: 'deal',
          unread: true,
        },
        ...prev,
      ]);
      soundService.playCompleteSound();
    });

    return () => {
      unsubNotif();
      unsubLead();
      unsubCart();
      unsubSync();
      unsubDeal();
      unsubQuote();
    };
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
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

      {/* Right: Real-time status, Sound, Language, Theme & User Profile */}
      <div className="flex items-center space-x-2">
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

        {/* Notification Center */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            aria-label={t('notifications')}
            className="relative p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            title={t('notifications')}
          >
            {unreadCount > 0 ? (
              <AnimatedIcon animation="shake">
                <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </AnimatedIcon>
            ) : (
              <Bell className="w-4 h-4" />
            )}
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-3 z-50"
              >
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{t('notifications')}</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                        {unreadCount} {t('newNotificationsCount')}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-0.5"
                    >
                      <Check className="w-3 h-3" />
                      <span>{t('markAsRead')}</span>
                    </button>
                  )}
                </div>

                <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2 rounded-lg text-xs space-y-0.5 transition-colors ${
                        n.unread
                          ? 'bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40'
                          : 'bg-gray-50/50 dark:bg-slate-800/40 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 font-semibold text-gray-800 dark:text-slate-200">
                          {n.type === 'chat' && <MessageSquare className="w-3 h-3 text-blue-500" />}
                          {n.type === 'deal' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                          {n.type === 'stock' && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                          <span className="truncate">{n.title}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-slate-400">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
