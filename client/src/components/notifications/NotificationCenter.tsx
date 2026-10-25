import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  FileText,
  Tag,
  Headphones,
  DollarSign,
  Layers,
  Sparkles,
  Inbox,
  Filter,
  Zap,
  X,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { wsClient } from '../../services/websocket';
import { soundService } from '../../services/sound';
import { AnimatedIcon } from '../ui/AnimatedIcon';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  desc?: string;
  type: string;
  priority?: string;
  actionUrl?: string;
  read: boolean;
  unread?: boolean;
  createdAt: string;
  time?: string;
}

export const NotificationCenter: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<'unread' | 'all'>('unread');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch notifications from server
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications', {
        params: { limit: 50 },
      });
      if (res.success && res.data) {
        const mapped = res.data.map((n: any) => ({
          ...n,
          desc: n.message,
          unread: !n.read,
        }));
        setNotifications(mapped);
        setUnreadCount(res.unreadCount || mapped.filter((n: any) => !n.read).length);
      }
    } catch {
      // Fallback gracefully without interrupting user workflow
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen for real-time WebSocket notifications & event triggers
  useEffect(() => {
    const unsubNewNotif = wsClient.on('notification:new', (notif: any) => {
      const item: NotificationItem = {
        id: notif.id || String(Date.now()),
        title: notif.title || t('notifications.newAlert'),
        message: notif.message || notif.desc || '',
        desc: notif.message || notif.desc || '',
        type: notif.type || 'info',
        priority: notif.priority || 'normal',
        actionUrl: notif.actionUrl,
        read: false,
        unread: true,
        createdAt: notif.createdAt || new Date().toISOString(),
      };

      setNotifications((prev) => [item, ...prev.filter((p) => p.id !== item.id)]);
      setUnreadCount((c) => c + 1);

      if (notif.priority === 'urgent' || notif.type === 'stock') {
        soundService.playAlertSound();
      } else if (notif.type === 'deal' || notif.type === 'quote') {
        soundService.playSuccessChime();
      } else {
        soundService.playMessageChime();
      }
    });

    const unsubTicketCreated = wsClient.on('ticket:created', () => {
      soundService.playMessageChime();
    });

    const unsubQuoteConverted = wsClient.on('quote:converted', () => {
      soundService.playCompleteSound();
    });

    return () => {
      unsubNewNotif();
      unsubTicketCreated();
      unsubQuoteConverted();
    };
  }, [t]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Mark single notification as read & navigate to destination
  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true, unread: false } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      api.patch(`/notifications/${notif.id}/read`).catch(() => {});
    }

    setIsOpen(false);

    if (notif.actionUrl) {
      window.history.pushState({}, '', notif.actionUrl);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, unread: false })));
    setUnreadCount(0);
    try {
      await api.patch('/notifications/read-all');
    } catch {}
  };

  // Delete single notification
  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const target = notifications.find((n) => n.id === id);
    if (target && !target.read) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await api.delete(`/notifications/${id}`);
    } catch {}
  };

  // Clear all read notifications
  const handleClearRead = async () => {
    setNotifications((prev) => prev.filter((n) => !n.read));
    try {
      await api.delete('/notifications/clear-read');
    } catch {}
  };

  // Format relative time helper
  const formatTime = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return t('notifications.justNow');
      if (diffMins < 60) return `${diffMins}m`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d`;
    } catch {
      return '';
    }
  };

  // Filtered notifications list
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread' && n.read) return false;
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <Layers className="w-3.5 h-3.5 text-blue-500" />;
      case 'ticket':
        return <Headphones className="w-3.5 h-3.5 text-blue-500" />;
      case 'invoice':
      case 'quote':
        return <FileText className="w-3.5 h-3.5 text-emerald-500" />;
      case 'deal':
      case 'lead':
        return <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />;
      case 'stock':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
      case 'chat':
        return <MessageSquare className="w-3.5 h-3.5 text-sky-500" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-violet-500" />;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        aria-label={t('notifications.title', 'Notificaciones')}
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-pointer"
        title={t('notifications.title', 'Notificaciones')}
      >
        {unreadCount > 0 ? (
          <AnimatedIcon animation="shake">
            <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </AnimatedIcon>
        ) : (
          <Bell className="w-4 h-4" />
        )}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Stay at the Top: Top-Right Dropdown mounted directly on document.body */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                {/* Transparent Click-Away Layer without darkening topbar */}
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setIsOpen(false)}
                />

                {/* Dropdown pinned at the Top Right below Topbar */}
                <div className="fixed top-14 right-2 sm:right-6 z-50 pointer-events-none">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -8 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                    className="pointer-events-auto w-[calc(100vw-1rem)] sm:w-[420px] max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden max-h-[calc(100vh-4.5rem)]"
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Bell className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                                {t('notifications.title', 'Notificaciones')}
                              </h3>
                              {unreadCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              Tiempo real & alertas
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          {unreadCount > 0 && (
                            <button
                              type="button"
                              onClick={handleMarkAllAsRead}
                              className="px-2 py-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition flex items-center space-x-1"
                              title={t('notifications.markAllRead')}
                            >
                              <CheckCheck className="w-3 h-3" />
                              <span className="hidden sm:inline">{t('notifications.markAllRead')}</span>
                            </button>
                          )}
                          {notifications.some((n) => n.read) && (
                            <button
                              type="button"
                              onClick={handleClearRead}
                              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                              title={t('notifications.clearRead')}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition ml-1"
                            aria-label={t('close')}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Tabs & Category Filter Controls */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex p-0.5 bg-slate-200/80 dark:bg-slate-800 rounded-lg text-xs">
                            <button
                              type="button"
                              onClick={() => setActiveTab('unread')}
                              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition ${
                                activeTab === 'unread'
                                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                              }`}
                            >
                              {t('notifications.tabUnread')} {unreadCount > 0 && `(${unreadCount})`}
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTab('all')}
                              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition ${
                                activeTab === 'all'
                                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                              }`}
                            >
                              {t('notifications.tabAll')} ({notifications.length})
                            </button>
                          </div>

                          {/* Filter Dropdown */}
                          <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 rounded-lg text-xs shadow-2xs">
                            <Filter className="w-3 h-3 text-blue-500 shrink-0" />
                            <select
                              value={typeFilter}
                              onChange={(e) => setTypeFilter(e.target.value)}
                              className="text-[10px] font-semibold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                            >
                              <option value="all" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">{t('notifications.filterAll')}</option>
                              <option value="task" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Tareas</option>
                              <option value="ticket" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">{t('notifications.filterTickets')}</option>
                              <option value="invoice" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">{t('notifications.filterInvoices')}</option>
                              <option value="quote" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">{t('notifications.filterQuotes')}</option>
                              <option value="deal" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">{t('notifications.filterDeals')}</option>
                              <option value="stock" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">{t('notifications.filterStock')}</option>
                            </select>
                          </div>
                        </div>

                        {/* Quick Chips */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                          {[
                            { id: 'all', label: t('notifications.filterAll') },
                            { id: 'task', label: 'Tareas' },
                            { id: 'ticket', label: t('notifications.filterTickets') },
                            { id: 'invoice', label: t('notifications.filterInvoices') },
                            { id: 'deal', label: t('notifications.filterDeals') },
                            { id: 'stock', label: t('notifications.filterStock') },
                          ].map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setTypeFilter(cat.id)}
                              className={`px-2 py-0.5 rounded text-[9px] font-semibold transition shrink-0 active:scale-[0.98] ${
                                typeFilter === cat.id
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200/60 dark:border-slate-700/60'
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Notifications Scrollable List */}
                    <div className="overflow-y-auto flex-1 p-2 space-y-1.5 max-h-[360px]">
                      {filteredNotifications.length === 0 ? (
                        <div className="py-10 px-4 text-center">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-400">
                            <Inbox className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {activeTab === 'unread'
                              ? t('notifications.emptyUnread')
                              : t('notifications.emptyAll')}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {t('notifications.emptyDesc')}
                          </p>
                        </div>
                      ) : (
                        filteredNotifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`group relative p-2.5 rounded-xl text-xs transition cursor-pointer flex items-start space-x-2.5 active:scale-[0.99] ${
                              !n.read
                                ? 'bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 border border-blue-200/70 dark:border-blue-900/40 shadow-2xs'
                                : 'bg-white dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/70 dark:border-slate-700">
                              {getTypeIcon(n.type)}
                            </div>

                            <div className="flex-1 min-w-0 pr-6">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-semibold text-slate-900 dark:text-white truncate">
                                  {n.title}
                                </span>
                                {!n.read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                                {n.message || n.desc}
                              </p>
                              <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                                <span>{formatTime(n.createdAt)}</span>
                                {n.actionUrl && (
                                  <span className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium">
                                    <ExternalLink className="w-2.5 h-2.5 mr-0.5" />
                                    {t('notifications.viewDetails')}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteNotification(e, n.id)}
                              className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded-lg transition"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="p-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 text-center">
                        <span className="inline-flex items-center space-x-1 text-[10px] text-slate-400 dark:text-slate-500">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>{t('notifications.realtimeConnected')}</span>
                        </span>
                      </div>
                    )}
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};
