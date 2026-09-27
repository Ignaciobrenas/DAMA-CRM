import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  Briefcase,
  AlertCircle,
  Bell,
  Sparkles,
  Link as LinkIcon,
  Download,
  RefreshCw,
  Trash2,
  Edit2,
  Check,
  Copy,
  ExternalLink,
  Shield,
  Layers,
  Search,
  X,
  Smartphone,
  Globe,
  Tag,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { soundService } from '../services/sound';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useBranding } from '../context/BrandingContext';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface CalendarEventItem {
  id: string;
  tenantId?: string;
  userId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  location?: string;
  color?: string;
  type: string; // 'EVENT' | 'MEETING' | 'DEADLINE' | 'MILESTONE' | 'REMINDER' | 'CALL' | 'TIME_BLOCK'
  isCompanyWide: boolean;
  status: string;
  projectId?: string;
  taskId?: string;
  dealId?: string;
  contactId?: string;
  user?: { id: string; name: string; email: string; avatar?: string };
  project?: { id: string; name: string; status?: string };
  task?: { id: string; title: string; status?: string; priority?: string };
  deal?: { id: string; title: string; value?: number };
  contact?: { id: string; firstName: string; lastName: string; email: string };
  reminders?: Array<{ id: string; minutesBefore: number; method: string; isDismissed: boolean }>;
  isVirtualTaskEvent?: boolean;
}

interface CalendarIntegrationItem {
  id: string;
  provider: string;
  isEnabled: boolean;
  syncToken?: string;
  feedUrl?: string;
  webcalUrl?: string;
  lastSyncAt?: string;
  config?: any;
}

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { branding } = useBranding();

  // Navigation & Date State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'personal' | 'company' | 'assigned_projects'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [integrations, setIntegrations] = useState<CalendarIntegrationItem[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [alertsList, setAlertsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);
  const [copiedFeed, setCopiedFeed] = useState(false);

  // Delete Confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; eventId: string | null }>({
    isOpen: false,
    eventId: null,
  });

  // Form State for Event Creation/Edit
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '10:00',
    allDay: false,
    location: '',
    color: '#3B82F6',
    type: 'EVENT',
    isCompanyWide: false,
    projectId: '',
    minutesBefore: 15,
  });

  const eventTypes = [
    { value: 'EVENT', label: 'Evento General', color: '#3B82F6' },
    { value: 'MEETING', label: 'Reunión de Equipo / Cliente', color: '#8B5CF6' },
    { value: 'DEADLINE', label: 'Entrega de Proyecto / Tarea', color: '#EF4444' },
    { value: 'MILESTONE', label: 'Hito Estratégico', color: '#10B981' },
    { value: 'CALL', label: 'Llamada Comercial', color: '#F59E0B' },
    { value: 'TIME_BLOCK', label: 'Bloque de Enfoque / Deep Work', color: '#06B6D4' },
    { value: 'REMINDER', label: 'Recordatorio Personal', color: '#EC4899' },
  ];

  const colorPresets = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#8B5CF6', // Purple
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#EC4899', // Pink
    '#6366F1', // Indigo
  ];

  // Fetch events, integrations and projects
  const fetchCalendarData = async () => {
    setIsLoading(true);
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString();
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0).toISOString();

      const [eventsRes, integRes, projRes, alertsRes] = await Promise.all([
        apiRequest(`/calendar/events?startDate=${startOfMonth}&endDate=${endOfMonth}&viewMode=${scopeFilter}&type=${typeFilter}`),
        apiRequest('/calendar/integrations'),
        apiRequest('/projects'),
        apiRequest('/calendar/alerts'),
      ]);

      if (eventsRes?.success) {
        setEvents(eventsRes.events || []);
      }
      if (integRes?.success) {
        setIntegrations(integRes.integrations || []);
      }
      if (projRes) {
        setProjectsList(Array.isArray(projRes) ? projRes : projRes.projects || []);
      }
      if (alertsRes?.success) {
        setAlertsList(alertsRes.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, scopeFilter, typeFilter]);

  // Calendar Date Math Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

  const handlePrevMonth = () => {
    soundService.playPopSound();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    soundService.playPopSound();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    soundService.playPopSound();
    setCurrentDate(new Date());
  };

  // Open Create Event Modal
  const handleOpenCreateModal = (defaultDate?: Date) => {
    soundService.playPopSound();
    const d = defaultDate || new Date();
    const dateStr = d.toISOString().split('T')[0];

    setSelectedEvent(null);
    setFormData({
      title: '',
      description: '',
      startDate: dateStr,
      startTime: '09:00',
      endDate: dateStr,
      endTime: '10:00',
      allDay: false,
      location: '',
      color: '#3B82F6',
      type: 'EVENT',
      isCompanyWide: false,
      projectId: '',
      minutesBefore: 15,
    });
    setIsEventModalOpen(true);
  };

  // Open Edit Event Modal
  const handleOpenEditModal = (event: CalendarEventItem) => {
    if (event.isVirtualTaskEvent) {
      return; // Handled separately or link to task
    }
    soundService.playPopSound();
    setSelectedEvent(event);

    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    setFormData({
      title: event.title,
      description: event.description || '',
      startDate: start.toISOString().split('T')[0],
      startTime: start.toTimeString().substring(0, 5),
      endDate: end.toISOString().split('T')[0],
      endTime: end.toTimeString().substring(0, 5),
      allDay: event.allDay,
      location: event.location || '',
      color: event.color || '#3B82F6',
      type: event.type,
      isCompanyWide: event.isCompanyWide,
      projectId: event.projectId || '',
      minutesBefore: event.reminders?.[0]?.minutesBefore || 15,
    });
    setIsEventModalOpen(true);
  };

  // Save Event (Create or Update)
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      const startDateTime = formData.allDay
        ? new Date(`${formData.startDate}T00:00:00.000Z`)
        : new Date(`${formData.startDate}T${formData.startTime}:00.000Z`);

      const endDateTime = formData.allDay
        ? new Date(`${formData.endDate}T23:59:59.000Z`)
        : new Date(`${formData.endDate}T${formData.endTime}:00.000Z`);

      const payload = {
        title: formData.title,
        description: formData.description,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        allDay: formData.allDay,
        location: formData.location,
        color: formData.color,
        type: formData.type,
        isCompanyWide: formData.isCompanyWide,
        projectId: formData.projectId || null,
        reminders: [{ minutesBefore: Number(formData.minutesBefore), method: 'NOTIFICATION' }],
      };

      if (selectedEvent) {
        await apiRequest(`/calendar/events/${selectedEvent.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/calendar/events', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      soundService.playSuccessChime();
      setIsEventModalOpen(false);
      fetchCalendarData();
    } catch (error) {
      console.error('Error saving calendar event:', error);
      soundService.playAlertSound();
    }
  };

  // Delete Event
  const handleDeleteEvent = async () => {
    if (!deleteConfirm.eventId) return;
    try {
      await apiRequest(`/calendar/events/${deleteConfirm.eventId}`, {
        method: 'DELETE',
      });
      soundService.playSuccessChime();
      setDeleteConfirm({ isOpen: false, eventId: null });
      setIsEventModalOpen(false);
      fetchCalendarData();
    } catch (error) {
      console.error('Error deleting event:', error);
      soundService.playAlertSound();
    }
  };

  // Sync with External Provider
  const handleSyncProvider = async (provider: string) => {
    setIsSyncing(true);
    soundService.playPopSound();
    try {
      const res = await apiRequest(`/calendar/integrations/${provider}/sync`, {
        method: 'POST',
      });
      if (res?.success) {
        soundService.playSuccessChime();
        fetchCalendarData();
      }
    } catch (error) {
      console.error('Error syncing provider:', error);
      soundService.playAlertSound();
    } finally {
      setIsSyncing(false);
    }
  };

  // Dismiss Alert
  const handleDismissAlert = async (alertId: string) => {
    try {
      await apiRequest(`/calendar/alerts/${alertId}/dismiss`, {
        method: 'POST',
      });
      setAlertsList((prev) => prev.filter((a) => a.id !== alertId));
      soundService.playPopSound();
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  // Copy WebCal feed URL
  const handleCopyFeed = (url?: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedFeed(true);
    soundService.playSuccessChime();
    setTimeout(() => setCopiedFeed(false), 2500);
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ev.title.toLowerCase().includes(q);
        const matchDesc = ev.description?.toLowerCase().includes(q);
        const matchLoc = ev.location?.toLowerCase().includes(q);
        const matchProj = ev.project?.name.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchLoc && !matchProj) return false;
      }
      return true;
    });
  }, [events, searchQuery]);

  // Events map by day key (YYYY-MM-DD)
  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEventItem[]> = {};
    for (const ev of filteredEvents) {
      const dateKey = new Date(ev.startDate).toISOString().split('T')[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(ev);
    }
    return map;
  }, [filteredEvents]);

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Action Banner */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md"
            style={{ backgroundColor: branding.primaryColor || '#2563EB' }}
          >
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {t('calendar', 'Calendario & Agenda')}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/50">
                Google & Apple Sync
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Gestiona eventos personales, agenda global de empresa, entregas y sincronización bidireccional.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-300/60 dark:border-slate-700 shadow-xs"
          >
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span>Vincular Google / Apple</span>
          </button>

          <button
            onClick={() => handleOpenCreateModal()}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition transform active:scale-95"
            style={{ backgroundColor: branding.primaryColor || '#2563EB' }}
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Evento</span>
          </button>
        </div>
      </div>

      {/* Active Alerts Banner (if any upcoming reminders) */}
      {alertsList.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300 dark:border-amber-800/60 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <Bell className="w-4 h-4 text-amber-500 animate-bounce" />
              <span>Recordatorios y Alertas Próximas ({alertsList.length})</span>
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
              Próximas 24 horas
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {alertsList.map((alert) => (
              <div
                key={alert.id}
                className="p-2.5 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-amber-200/80 dark:border-amber-900/50 flex items-center justify-between shadow-xs text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-slate-900 dark:text-white truncate">
                    {alert.event?.title}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span>{new Date(alert.event?.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {alert.event?.location && (
                      <span className="truncate">| {alert.event.location}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDismissAlert(alert.id)}
                  className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 shrink-0 transition"
                  title="Descartar recordatorio"
                >
                  Entendido
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scope, View Controls & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Scope Tabs (All, Personal, Company, Assigned Projects) */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => {
              soundService.playPopSound();
              setScopeFilter('all');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              scopeFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todos los Eventos
          </button>
          <button
            onClick={() => {
              soundService.playPopSound();
              setScopeFilter('personal');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              scopeFilter === 'personal'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Mi Calendario Personal
          </button>
          <button
            onClick={() => {
              soundService.playPopSound();
              setScopeFilter('company');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              scopeFilter === 'company'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Global Empresa
          </button>
          <button
            onClick={() => {
              soundService.playPopSound();
              setScopeFilter('assigned_projects');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              scopeFilter === 'assigned_projects'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Proyectos Asignados
          </button>
        </div>

        {/* View Switcher (Month, Week, Day, Agenda) & Date Navigator */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar evento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">Todos los tipos</option>
            {eventTypes.map((et) => (
              <option key={et.value} value={et.value}>
                {et.label}
              </option>
            ))}
          </select>

          {/* View Mode Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['month', 'agenda'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  soundService.playPopSound();
                  setViewMode(mode);
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition ${
                  viewMode === mode
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {mode === 'month' ? 'Mes' : 'Agenda'}
              </button>
            ))}
          </div>

          {/* Month Stepper */}
          <div className="flex items-center space-x-1 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Hoy
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Month / Agenda View Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Month Header Banner */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{monthNames[month]} {year}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
              {filteredEvents.length} eventos
            </span>
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500"></span> Personal
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500 ml-2"></span> Empresa
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 ml-2"></span> Entregas
          </div>
        </div>

        {/* View Mode: Month Grid */}
        {viewMode === 'month' && (
          <div className="p-2 sm:p-4 overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Day Name Columns */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                {dayNames.map((d, i) => (
                  <div
                    key={d}
                    className={`text-center py-2 text-xs font-bold uppercase tracking-wider ${
                      i >= 5 ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid of Days */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 auto-rows-fr">
                {/* Empty cells before month starts */}
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    className="h-24 sm:h-32 p-1 sm:p-2 rounded-xl bg-slate-50/40 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50 opacity-40"
                  />
                ))}

                {/* Days of Month */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dateObj = new Date(year, month, dayNum);
                  const dateKey = dateObj.toISOString().split('T')[0];
                  const dayEvents = eventsByDay[dateKey] || [];
                  const isToday =
                    new Date().getDate() === dayNum &&
                    new Date().getMonth() === month &&
                    new Date().getFullYear() === year;

                  return (
                    <div
                      key={`day-${dayNum}`}
                      onClick={() => handleOpenCreateModal(dateObj)}
                      className={`h-24 sm:h-32 p-1.5 sm:p-2 rounded-xl border transition-all duration-150 flex flex-col justify-between group cursor-pointer ${
                        isToday
                          ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700 ring-2 ring-blue-400/30'
                          : 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xs'
                      }`}
                    >
                      {/* Day Number Header */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg ${
                            isToday
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-700 dark:text-slate-300 group-hover:text-blue-600'
                          }`}
                        >
                          {dayNum}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCreateModal(dateObj);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Añadir evento en este día"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Event Chips List */}
                      <div className="space-y-1 mt-1 overflow-y-auto max-h-16 sm:max-h-20 scrollbar-none">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(ev);
                            }}
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold truncate text-white transition transform hover:scale-[1.02] shadow-2xs"
                            style={{ backgroundColor: ev.color || '#3B82F6' }}
                            title={`${ev.title} - ${ev.description || ''}`}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[9px] font-bold text-slate-500 dark:text-slate-400 px-1">
                            +{dayEvents.length - 3} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* View Mode: Agenda / List */}
        {viewMode === 'agenda' && (
          <div className="p-4 sm:p-6 space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No hay eventos para los filtros seleccionados</p>
                <button
                  onClick={() => handleOpenCreateModal()}
                  className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Crear primer evento
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEvents.map((ev) => {
                  const start = new Date(ev.startDate);
                  const end = new Date(ev.endDate);

                  return (
                    <div
                      key={ev.id}
                      onClick={() => handleOpenEditModal(ev)}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-3 rounded-xl transition cursor-pointer group"
                    >
                      <div className="flex items-start space-x-3 min-w-0">
                        <div
                          className="w-3.5 h-3.5 rounded-full mt-1 shrink-0 shadow-xs"
                          style={{ backgroundColor: ev.color || '#3B82F6' }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition">
                              {ev.title}
                            </h4>
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                              style={{
                                backgroundColor: `${ev.color || '#3B82F6'}15`,
                                color: ev.color || '#3B82F6',
                              }}
                            >
                              {ev.type}
                            </span>
                            {ev.isCompanyWide && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                                Empresa
                              </span>
                            )}
                          </div>

                          {ev.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                              {ev.description}
                            </p>
                          )}

                          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-blue-500" />
                              {start.toLocaleDateString()} ({ev.allDay ? 'Todo el día' : `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`})
                            </span>

                            {ev.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-emerald-500" />
                                {ev.location}
                              </span>
                            )}

                            {ev.project && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3 text-purple-500" />
                                {ev.project.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-1.5 self-end sm:self-center shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(ev);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Editar evento"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!ev.isVirtualTaskEvent && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({ isOpen: true, eventId: ev.id });
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                            title="Eliminar evento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Event Modal */}
      <AnimatePresence>
        {isEventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div
                className="p-5 text-white flex items-center justify-between"
                style={{ backgroundColor: formData.color || branding.primaryColor || '#2563EB' }}
              >
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-5 h-5" />
                  <h3 className="font-bold text-base">
                    {selectedEvent ? 'Editar Evento' : 'Nuevo Evento en Calendario'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsEventModalOpen(false)}
                  className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveEvent} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Título del Evento *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Reunión de Seguimiento de Sprint con Cliente"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                {/* Event Type & Color Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tipo de Evento
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => {
                        const selectedType = eventTypes.find((t) => t.value === e.target.value);
                        setFormData({
                          ...formData,
                          type: e.target.value,
                          color: selectedType?.color || formData.color,
                        });
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
                    >
                      {eventTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Color de Identificación
                    </label>
                    <div className="flex items-center gap-1.5 pt-1">
                      {colorPresets.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: c })}
                          className={`w-6 h-6 rounded-full transition transform ${
                            formData.color === c ? 'scale-125 ring-2 ring-offset-2 ring-blue-500' : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* All Day Toggle */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Evento de todo el día
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allDay}
                      onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Dates & Times */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Inicio
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
                      />
                      {!formData.allDay && (
                        <input
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          className="w-24 px-2 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Fin
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        required
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
                      />
                      {!formData.allDay && (
                        <input
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          className="w-24 px-2 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Location / Meeting URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ubicación o Enlace de Reunión (Meet / Zoom / Teams)
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="https://meet.google.com/xyz o Sala de Juntas Principal"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                {/* Project Association */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vincular a Proyecto CRM (Opcional)
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
                  >
                    <option value="">Sin proyecto vinculado</option>
                    {projectsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reminder Alert Preset */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Alerta / Recordatorio
                    </label>
                    <select
                      value={formData.minutesBefore}
                      onChange={(e) => setFormData({ ...formData, minutesBefore: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
                    >
                      <option value={0}>Al momento del evento</option>
                      <option value={5}>5 minutos antes</option>
                      <option value={15}>15 minutos antes</option>
                      <option value={30}>30 minutos antes</option>
                      <option value={60}>1 hora antes</option>
                      <option value={1440}>1 día antes</option>
                    </select>
                  </div>

                  {/* Company Wide Switch */}
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={formData.isCompanyWide}
                        onChange={(e) => setFormData({ ...formData, isCompanyWide: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Visible para toda la Empresa</span>
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Descripción / Notas del Evento
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Detalles, orden del día, enlaces..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
                  />
                </div>

                {/* Footer buttons */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  {selectedEvent && !selectedEvent.isVirtualTaskEvent ? (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ isOpen: true, eventId: selectedEvent.id })}
                      className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition border border-rose-200 dark:border-rose-900/50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsEventModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition"
                      style={{ backgroundColor: formData.color || branding.primaryColor || '#2563EB' }}
                    >
                      {selectedEvent ? 'Guardar Cambios' : 'Crear Evento'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Google & Apple Calendar Sync Integration Modal */}
      <AnimatePresence>
        {isSyncModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Globe className="w-5 h-5" />
                  <div>
                    <h3 className="font-bold text-base">Sincronización de Calendarios</h3>
                    <p className="text-xs text-white/80">Google Calendar, Apple iCal, Outlook y WebCal</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSyncModalOpen(false)}
                  className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                {/* Apple Calendar Subscription Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
                      <Smartphone className="w-4 h-4 text-purple-600" />
                      <span>Apple Calendar (iPhone, iPad, Mac)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono">
                      iCal / WebCal
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">
                    Suscríbete desde tu app de Calendario de Apple. Se actualizará en tiempo real en todos tus dispositivos Apple.
                  </p>

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={integrations.find((i) => i.provider === 'APPLE_ICAL')?.webcalUrl || `${window.location.origin}/api/calendar/feed/my-feed.ics`}
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-[11px] font-mono select-all focus:outline-none text-slate-700 dark:text-slate-300"
                    />
                    <button
                      onClick={() => handleCopyFeed(integrations.find((i) => i.provider === 'APPLE_ICAL')?.webcalUrl)}
                      className="px-3 py-1.5 rounded-xl font-semibold bg-purple-600 text-white hover:bg-purple-700 transition flex items-center space-x-1 shrink-0"
                    >
                      {copiedFeed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedFeed ? 'Copiado' : 'Copiar URL'}</span>
                    </button>
                  </div>
                </div>

                {/* Google Calendar Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
                      <Globe className="w-4 h-4 text-blue-500" />
                      <span>Google Calendar</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono">
                      Bidireccional
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">
                    Sincroniza tus citas de Google Workspace y reuniones de Google Meet directamente con tus proyectos de DAMA-CRM.
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-slate-400">
                      Última sincronización: Hace unos momentos
                    </div>
                    <button
                      onClick={() => handleSyncProvider('GOOGLE')}
                      disabled={isSyncing}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}</span>
                    </button>
                  </div>
                </div>

                {/* Direct ICS Download */}
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>Descargar archivo .ics de respaldo</span>
                  </div>
                  <a
                    href={integrations.find((i) => i.provider === 'APPLE_ICAL')?.feedUrl || '/api/calendar/feed/export.ics'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 bg-white dark:bg-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition"
                  >
                    Descargar .ics
                  </a>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setIsSyncModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 transition"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, eventId: null })}
        onConfirm={handleDeleteEvent}
        title="Eliminar Evento del Calendario"
        message="¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer."
        confirmLabel="Eliminar Evento"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
};
