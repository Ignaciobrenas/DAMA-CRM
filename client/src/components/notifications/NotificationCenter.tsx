import React, { useState, useEffect, useRef } from 'react';
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

      // Sound alerts depending on type/priority
      if (notif.priority === 'urgent' || notif.type === 'stock') {
        soundService.playAlertSound();
      } else if (notif.type === 'deal' || notif.type === 'quote') {
        soundService.playSuccessChime();
      } else {
        soundService.playMessageChime();
      }
    });

    const unsubTicketCreated = wsClient.on('ticket:created', (ticket: any) => {
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

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark single notification as read & navigate to destination
  const handleNotificationClick = async (notif: NotificationItem) => {
    // Optimistically update local state
    if (!notif.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true, unread: false } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      // Persist to server
      api.patch(`/notifications/${notif.id}/read`).catch(() => {});
    }

    // Close notification center
    setIsOpen(false);

    // Navigate to target route seamlessly if actionUrl exists
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
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        aria-label={t('notifications.title')}
        className="relative p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
        title={t('notifications.title')}
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

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="absolute right-0 mt-2 w-96 max-w-[92vw] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col z-50 overflow-hidden"
            style={{ maxHeight: '85vh' }}
          >
            {/* Header */}
            <div className="p-3.5 border-b border-gray-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {t('notifications.title')}
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {unreadCount} {t('notifications.unreadBadge')}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="px-2 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition flex items-center space-x-1"
                      title={t('notifications.markAllRead')}
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>{t('notifications.markAllRead')}</span>
                    </button>
                  )}
                  {notifications.some((n) => n.read) && (
                    <button
                      onClick={handleClearRead}
                      className="p-1 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                      title={t('notifications.clearRead')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs: Unread vs All */}
              <div className="flex items-center justify-between">
                <div className="flex p-0.5 bg-gray-200/60 dark:bg-slate-800 rounded-lg text-xs">
                  <button
                    onClick={() => setActiveTab('unread')}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      activeTab === 'unread'
                        ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                    }`}
                  >
                    {t('notifications.tabUnread')} {unreadCount > 0 && `(${unreadCount})`}
                  </button>
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      activeTab === 'all'
                        ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                    }`}
                  >
                    {t('notifications.tabAll')} ({notifications.length})
                  </button>
                </div>

                {/* Category filter select */}
                <div className="flex items-center space-x-1 text-xs">
                  <Filter className="w-3 h-3 text-gray-400" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="text-[11px] bg-transparent border-0 font-medium text-gray-600 dark:text-gray-300 focus:outline-none cursor-pointer"
                  >
                    <option value="all">{t('notifications.filterAll')}</option>
                    <option value="ticket">{t('notifications.filterTickets')}</option>
                    <option value="invoice">{t('notifications.filterInvoices')}</option>
                    <option value="quote">{t('notifications.filterQuotes')}</option>
                    <option value="deal">{t('notifications.filterDeals')}</option>
                    <option value="stock">{t('notifications.filterStock')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notifications Scrollable List */}
            <div className="overflow-y-auto flex-1 p-2 space-y-1.5 divide-y divide-transparent max-h-[380px]">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-gray-400">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {activeTab === 'unread'
                      ? t('notifications.emptyUnread')
                      : t('notifications.emptyAll')}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {t('notifications.emptyDesc')}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`group relative p-2.5 rounded-xl text-xs transition cursor-pointer flex items-start space-x-2.5 ${
                      !n.read
                        ? 'bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 border border-blue-100/80 dark:border-blue-900/40'
                        : 'bg-transparent hover:bg-gray-100/70 dark:hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    {/* Type Icon Badge */}
                    <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-xs border border-gray-100 dark:border-slate-700">
                      {getTypeIcon(n.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-gray-900 dark:text-white truncate">
                          {n.title}
                        </span>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message || n.desc}
                      </p>
                      <div className="flex items-center space-x-2 mt-1 text-[10px] text-gray-400 dark:text-slate-500">
                        <span>{formatTime(n.createdAt)}</span>
                        {n.actionUrl && (
                          <span className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium">
                            <ExternalLink className="w-2.5 h-2.5 mr-0.5" />
                            {t('notifications.viewDetails')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete item action */}
                    <button
                      onClick={(e) => handleDeleteNotification(e, n.id)}
                      className="absolute top-2.5 right-2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-500 rounded-md transition"
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
              <div className="p-2 border-t border-gray-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
                <span className="text-[10px] text-gray-400 dark:text-slate-500">
                  ⚡ {t('notifications.realtimeConnected')}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
