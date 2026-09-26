import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { wsService } from '../services/websocket';
import { Ticket, TicketListTable } from '../components/tickets/TicketListTable';
import { TicketKanbanBoard } from '../components/tickets/TicketKanbanBoard';
import { TicketDetailDrawer } from '../components/tickets/TicketDetailDrawer';
import { NewTicketModal } from '../components/tickets/NewTicketModal';
import { LoadingScreen } from '../components/common/Loading';

export const Tickets: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    urgent: 0,
    complianceRate: 100,
  });

  const fetchTickets = async () => {
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        api.get('/tickets', {
          params: {
            search: searchQuery || undefined,
            priority: priorityFilter || undefined,
            category: categoryFilter || undefined,
          },
        }),
        api.get('/tickets/stats/summary'),
      ]);

      if (ticketsRes.success && ticketsRes.data) {
        setTickets(ticketsRes.data);
      } else if (ticketsRes.data?.success) {
        setTickets(ticketsRes.data.data);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      } else if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
    } catch (err: any) {
      toast.error(t('tickets.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [searchQuery, priorityFilter, categoryFilter]);

  // Subscribe to live WebSocket events
  useEffect(() => {
    const unsubCreated = wsService.on('ticket:created', (newTicket: Ticket) => {
      setTickets((prev) => [newTicket, ...prev]);
      toast.info(`${t('tickets.newTicketAlert')}: ${newTicket.ticketNumber}`);
    });

    const unsubUpdated = wsService.on('ticket:updated', (updated: Ticket) => {
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      if (selectedTicket && selectedTicket.id === updated.id) {
        setSelectedTicket(updated);
      }
    });

    const unsubMessage = wsService.on('ticket:message', (payload: { ticketId: string; message: any }) => {
      if (selectedTicket && selectedTicket.id === payload.ticketId) {
        setSelectedTicket((prev) => prev ? {
          ...prev,
          messages: [...(prev.messages || []), payload.message],
        } : null);
      }
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubMessage();
    };
  }, [selectedTicket]);

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const res = await api.patch(`/tickets/${ticketId}`, { status: newStatus });
      if (res.data?.success) {
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? res.data.data : t)));
        toast.success(t('tickets.statusUpdated'));
      }
    } catch (err) {
      toast.error(t('tickets.updateError'));
    }
  };

  if (loading && tickets.length === 0) {
    return <LoadingScreen message={t('common.loading')} />;
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            🎫 {t('tickets.pageTitle')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('tickets.pageSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📊 {t('tickets.viewKanban')}
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📋 {t('tickets.viewTable')}
            </button>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <span>+ {t('tickets.newTicket')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">{t('tickets.kpiTotal')}</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">{stats.total}</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">{t('tickets.kpiOpen')}</span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 block">{stats.open}</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">{t('tickets.kpiUrgent')}</span>
          <span className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1 block">{stats.urgent}</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">{t('tickets.kpiSlaCompliance')}</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">{stats.complianceRate}%</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('tickets.searchPlaceholder')}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium outline-none"
          >
            <option value="">{t('tickets.allPriorities')}</option>
            <option value="URGENT">{t('tickets.priorityUrgent')}</option>
            <option value="HIGH">{t('tickets.priorityHigh')}</option>
            <option value="MEDIUM">{t('tickets.priorityMedium')}</option>
            <option value="LOW">{t('tickets.priorityLow')}</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium outline-none"
          >
            <option value="">{t('tickets.allCategories')}</option>
            <option value="TECHNICAL">{t('tickets.categoryTechnical')}</option>
            <option value="BILLING">{t('tickets.categoryBilling')}</option>
            <option value="SALES">{t('tickets.categorySales')}</option>
            <option value="GENERAL">{t('tickets.categoryGeneral')}</option>
          </select>
        </div>
      </div>

      {/* Main View Area (Kanban vs Table) */}
      {viewMode === 'kanban' ? (
        <TicketKanbanBoard
          tickets={tickets}
          onSelectTicket={(t) => setSelectedTicket(t)}
          onUpdateStatus={handleUpdateStatus}
        />
      ) : (
        <TicketListTable
          tickets={tickets}
          onSelectTicket={(t) => setSelectedTicket(t)}
        />
      )}

      {/* Ticket Details & Chat Drawer */}
      <TicketDetailDrawer
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onTicketUpdated={(updated) => {
          setSelectedTicket(updated);
          setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        }}
      />

      {/* New Ticket Modal */}
      <NewTicketModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onTicketCreated={() => {
          fetchTickets();
        }}
      />
    </div>
  );
};

export default Tickets;
