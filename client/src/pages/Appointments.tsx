import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  CalendarCheck,
  Plus,
  TrendingUp,
  DollarSign,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  CreditCard,
  Percent,
  ChevronRight,
  Phone,
  Mail,
  Edit3,
  Trash2,
  Award,
  Layers,
  Check,
  Download,
  FileText,
  Briefcase,
} from 'lucide-react';
import { apiRequest, downloadFile } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { soundService } from '../services/sound';

export interface SalonServiceItem {
  id: string;
  name: string;
  category: 'CONSULTATION' | 'TECHNICAL' | 'ADVISORY' | 'SERVICE' | 'TREATMENT' | 'OTHER';
  durationMin: number;
  price: number;
  supplyCost: number;
  description?: string;
  isPopular?: boolean;
}

export interface AppointmentData {
  id: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  staffId: string;
  staffName: string;
  serviceIds: string[];
  services: SalonServiceItem[];
  startTime: string;
  endTime: string;
  durationMin: number;
  totalPrice: number;
  totalSupplyCost: number;
  estimatedProfit: number;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  paymentMethod?: 'CASH' | 'CARD' | 'BIZUM' | 'TRANSFER';
  notes?: string;
  createdAt: string;
}

const CATEGORY_NAMES: Record<string, string> = {
  CONSULTATION: 'Consultoría & Estrategia',
  TECHNICAL: 'Servicio Técnico / IT',
  ADVISORY: 'Asesoría & Legal',
  SERVICE: 'Servicios Profesionales',
  TREATMENT: 'Tratamientos & Salud',
  OTHER: 'Otros Servicios',
};

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: 'Programada', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200' },
  CONFIRMED: { label: 'Confirmada', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200' },
  IN_PROGRESS: { label: 'En Curso', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200' },
  COMPLETED: { label: 'Completada', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200' },
  CANCELLED: { label: 'Cancelada', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200' },
  NO_SHOW: { label: 'No Presentado', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200' },
};

export const Appointments: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [activeTab, setActiveTab] = useState<'appointments' | 'services' | 'analytics'>('appointments');
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [services, setServices] = useState<SalonServiceItem[]>([]);
  const [revenueStats, setRevenueStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterStaff, setFilterStaff] = useState<string>('ALL');

  // Modals
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedAppointmentForPayment, setSelectedAppointmentForPayment] = useState<AppointmentData | null>(null);

  // Form State for Appointment
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [staffName, setStaffName] = useState('Ignacio (Especialista Senior)');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointmentTime, setAppointmentTime] = useState('11:00');
  const [appointmentNotes, setAppointmentNotes] = useState('');

  // Form State for Service
  const [serviceName, setServiceName] = useState('');
  const [serviceCategory, setServiceCategory] = useState<SalonServiceItem['category']>('CONSULTATION');
  const [serviceDuration, setServiceDuration] = useState('45');
  const [servicePrice, setServicePrice] = useState('60');
  const [serviceSupplyCost, setServiceSupplyCost] = useState('5.0');
  const [serviceDescription, setServiceDescription] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    const [aptRes, srvRes, statsRes] = await Promise.all([
      apiRequest('/appointments'),
      apiRequest('/appointments/services'),
      apiRequest('/appointments/stats/revenue'),
    ]);

    if (aptRes.success && aptRes.data) setAppointments(aptRes.data);
    if (srvRes.success && srvRes.data) setServices(srvRes.data);
    if (statsRes.success && statsRes.data) setRevenueStats(statsRes.data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || selectedServiceIds.length === 0) return;

    const startDateTime = new Date(`${appointmentDate}T${appointmentTime}:00`).toISOString();

    const res = await apiRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify({
        clientName,
        clientPhone,
        clientEmail,
        staffName,
        serviceIds: selectedServiceIds,
        startTime: startDateTime,
        notes: appointmentNotes,
      }),
    });

    if (res.success) {
      soundService.playSuccessChime();
      setIsNewAppointmentModalOpen(false);
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setSelectedServiceIds([]);
      setAppointmentNotes('');
      loadData();
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim() || !servicePrice) return;

    const res = await apiRequest('/appointments/services', {
      method: 'POST',
      body: JSON.stringify({
        name: serviceName,
        category: serviceCategory,
        durationMin: Number(serviceDuration),
        price: Number(servicePrice),
        supplyCost: Number(serviceSupplyCost),
        description: serviceDescription,
      }),
    });

    if (res.success) {
      soundService.playSuccessChime();
      setIsServiceModalOpen(false);
      setServiceName('');
      setServicePrice('60');
      setServiceSupplyCost('5.0');
      setServiceDescription('');
      loadData();
    }
  };

  const handleUpdateStatus = async (id: string, status: AppointmentData['status']) => {
    const res = await apiRequest(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    if (res.success) {
      soundService.playSuccessChime();
      loadData();
    }
  };

  const handleProcessPayment = async (paymentMethod: 'CASH' | 'CARD' | 'BIZUM' | 'TRANSFER') => {
    if (!selectedAppointmentForPayment) return;
    const res = await apiRequest(`/appointments/${selectedAppointmentForPayment.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        paymentMethod,
      }),
    });

    if (res.success) {
      soundService.playSuccessChime();
      setSelectedAppointmentForPayment(null);
      loadData();
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    const apt = appointments.find((a) => a.id === id);
    const dateFormatted = apt?.startTime ? new Date(apt.startTime).toLocaleString() : '';
    const isConfirmed = await confirm({
      title: '¿Eliminar cita?',
      description: '¿Estás seguro de que deseas eliminar esta cita? Esta acción no se puede deshacer.',
      entityName: apt ? `${apt.clientName}${dateFormatted ? ` (${dateFormatted})` : ''}` : undefined,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!isConfirmed) return;
    const res = await apiRequest(`/appointments/${id}`, { method: 'DELETE' });
    if (res.success) {
      toast.success('Cita eliminada', 'La cita se ha eliminado correctamente.');
      loadData();
    } else {
      toast.error('Error al eliminar', res.message || 'No se pudo eliminar la cita.');
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filterStatus !== 'ALL' && apt.status !== filterStatus) return false;
    if (filterStaff !== 'ALL' && apt.staffName !== filterStaff) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      apt.clientName.toLowerCase().includes(q) ||
      apt.clientPhone?.toLowerCase().includes(q) ||
      apt.staffName.toLowerCase().includes(q) ||
      apt.services.some((s) => s.name.toLowerCase().includes(q))
    );
  });

  const selectedServicesCalculations = services
    .filter((s) => selectedServiceIds.includes(s.id))
    .reduce(
      (acc, s) => ({
        duration: acc.duration + (s.durationMin || 0),
        total: acc.total + (s.price || 0),
        cost: acc.cost + (s.supplyCost || 0),
        profit: acc.profit + (s.price - s.supplyCost),
      }),
      { duration: 0, total: 0, cost: 0, profit: 0 }
    );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              {t('appointments.title', 'Citas & Servicios Profesionales')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Gestión Universal de Citas
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {t('appointments.subtitle', 'Gestión integral de reservas, cálculo automático de márgenes por servicio y control de agenda')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => downloadFile('/appointments/export/csv', 'citas_servicios.csv')}
            className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-slate-200 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center space-x-1.5"
            title="Exportar a Excel / CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('exportCsv', 'Exportar Excel')}</span>
          </button>
          <button
            onClick={() => downloadFile('/appointments/export/pdf', 'informe_citas_servicios.pdf')}
            className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-slate-200 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center space-x-1.5"
            title="Descargar informe oficial en PDF"
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>{t('exportPdf', 'Informe PDF')}</span>
          </button>
          <button
            onClick={() => setIsServiceModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-slate-200 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center space-x-1.5"
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-500" />
            <span>{t('appointments.addService', '+ Servicio / Tarifa')}</span>
          </button>
          <button
            onClick={() => setIsNewAppointmentModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t('appointments.newAppointment', 'Nueva Cita')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Revenue & Margin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today Expected Revenue */}
        <div className="bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-900/60 p-4 rounded-xl border border-blue-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Ingresos Previstos Hoy</span>
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {(revenueStats?.today?.estimatedRevenue || 0).toFixed(2)}€
          </div>
          <div className="mt-1 flex items-center text-[11px] text-gray-500 space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Cobrados: {(revenueStats?.today?.realizedRevenue || 0).toFixed(2)}€</span>
          </div>
        </div>

        {/* Card 2: Estimated Net Profit */}
        <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-slate-900 dark:to-slate-900/60 p-4 rounded-xl border border-emerald-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Beneficio Neto Estimado</span>
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {(revenueStats?.month?.estimatedProfit || 0).toFixed(2)}€
          </div>
          <div className="mt-1 flex items-center text-[11px] text-emerald-600 font-semibold space-x-1">
            <Percent className="w-3.5 h-3.5" />
            <span>Margen: {revenueStats?.month?.profitMarginPercent || 0}% tras gastos directos</span>
          </div>
        </div>

        {/* Card 3: Average Ticket */}
        <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-900/60 p-4 rounded-xl border border-indigo-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Ticket Medio / Cita</span>
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {(revenueStats?.month?.averageTicket || 0).toFixed(2)}€
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            Total citas mes: {revenueStats?.month?.totalAppointments || 0}
          </div>
        </div>

        {/* Card 4: Appointments Count */}
        <div className="bg-gradient-to-br from-purple-50 to-white dark:from-slate-900 dark:to-slate-900/60 p-4 rounded-xl border border-purple-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Citas de Hoy</span>
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {revenueStats?.today?.appointmentCount || 0}
          </div>
          <div className="mt-1 text-[11px] text-purple-600 dark:text-purple-400 font-medium">
            {revenueStats?.today?.completedCount || 0} completadas hoy
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'appointments'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>{t('appointments.tabAppointments', 'Agenda de Citas')}</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'services'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>{t('appointments.tabServices', 'Catálogo de Servicios & Costes')}</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{t('appointments.tabAnalytics', 'Rendimiento por Especialista')}</span>
        </button>
      </div>

      {/* VIEW 1: Appointments List & Agenda */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-800">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por cliente, teléfono, especialista o servicio..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-300 font-medium"
              >
                <option value="ALL">Todos los estados</option>
                <option value="SCHEDULED">Programadas</option>
                <option value="CONFIRMED">Confirmadas</option>
                <option value="IN_PROGRESS">En curso</option>
                <option value="COMPLETED">Completadas</option>
                <option value="CANCELLED">Canceladas</option>
              </select>
            </div>
          </div>

          {/* Appointments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAppointments.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 text-gray-400">
                <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-blue-400" />
                <p className="text-sm font-semibold">No se encontraron citas con los filtros seleccionados</p>
                <button
                  onClick={() => setIsNewAppointmentModalOpen(true)}
                  className="mt-3 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-bold"
                >
                  Agendar la primera cita
                </button>
              </div>
            ) : (
              filteredAppointments.map((apt) => {
                const statusBadge = STATUS_BADGES[apt.status] || STATUS_BADGES.SCHEDULED;
                const startDate = new Date(apt.startTime);
                const timeFormatted = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateFormatted = startDate.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });

                return (
                  <div
                    key={apt.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs hover:border-blue-300 dark:hover:border-blue-800 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Date & Status Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-900 dark:text-white">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          <span>{timeFormatted}</span>
                          <span className="text-gray-400 font-normal">({dateFormatted})</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </div>

                      {/* Client Info */}
                      <div className="mt-3 flex items-start space-x-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {apt.clientName.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{apt.clientName}</h4>
                          <div className="text-[11px] text-gray-500 flex items-center space-x-2 mt-0.5">
                            {apt.clientPhone && (
                              <span className="flex items-center space-x-1">
                                <Phone className="w-3 h-3 text-gray-400" />
                                <span>{apt.clientPhone}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Services & Duration */}
                      <div className="mt-3 space-y-1">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Servicios:</div>
                        <div className="flex flex-wrap gap-1">
                          {apt.services.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300"
                            >
                              {s.name} ({s.durationMin}m)
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Staff Assigned */}
                      <div className="mt-2 text-xs text-gray-600 dark:text-slate-400 flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{apt.staffName}</span>
                      </div>

                      {apt.notes && (
                        <p className="mt-2 text-[11px] text-gray-500 italic bg-gray-50 dark:bg-slate-800/60 p-2 rounded-lg">
                          "{apt.notes}"
                        </p>
                      )}
                    </div>

                    {/* Financial Footer & Actions */}
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-base font-black text-gray-900 dark:text-white">
                          {apt.totalPrice.toFixed(2)}€
                        </div>
                        <div className="text-[10px] text-emerald-600 font-bold">
                          Ganancia: +{apt.estimatedProfit.toFixed(2)}€
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-1.5">
                        {apt.status === 'SCHEDULED' && (
                          <button
                            onClick={() => handleUpdateStatus(apt.id, 'IN_PROGRESS')}
                            className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 rounded-lg transition-colors"
                          >
                            Iniciar
                          </button>
                        )}
                        {apt.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => setSelectedAppointmentForPayment(apt)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center space-x-1"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Cobrar</span>
                          </button>
                        )}
                        {apt.paymentStatus === 'PAID' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            ✓ Pagado ({apt.paymentMethod || 'Bizum'})
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteAppointment(apt.id)}
                          className="p-1 text-gray-400 hover:text-rose-500 rounded"
                          title="Eliminar cita"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: Services Catalog & Costs */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Tarifas, Tiempos y Costes Directos / Materiales
            </h3>
            <button
              onClick={() => setIsServiceModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Servicio</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((srv) => {
              const margin = srv.price > 0 ? (((srv.price - srv.supplyCost) / srv.price) * 100).toFixed(0) : 0;
              return (
                <div
                  key={srv.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                        {CATEGORY_NAMES[srv.category] || srv.category}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-1.5">{srv.name}</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-gray-900 dark:text-white">{srv.price.toFixed(2)}€</div>
                      <div className="text-[10px] text-gray-400">{srv.durationMin} minutos</div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">{srv.description || 'Sin descripción detallada'}</p>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 dark:bg-slate-800/60 p-2 rounded-lg">
                      <div className="text-[10px] text-gray-400">Coste Operativo</div>
                      <div className="font-bold text-rose-600 dark:text-rose-400">-{srv.supplyCost.toFixed(2)}€</div>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg">
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400">Margen ({margin}%)</div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-300">
                        +{(srv.price - srv.supplyCost).toFixed(2)}€
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: Specialist Analytics & Top Services */}
      {activeTab === 'analytics' && revenueStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Specialists Breakdown */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Ingresos por Profesional / Especialista (Mes Actual)</span>
            </h3>

            <div className="space-y-3">
              {revenueStats.staffBreakdown?.map((item: any, idx: number) => (
                <div key={idx} className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 flex items-center justify-center font-bold text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white">{item.staffName}</div>
                      <div className="text-[10px] text-gray-400">{item.appointmentCount} citas realizadas</div>
                    </div>
                  </div>
                  <div className="text-sm font-black text-gray-900 dark:text-white">
                    {item.totalRevenue.toFixed(2)}€
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Services */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-500" />
              <span>Servicios más Demandados & Facturación</span>
            </h3>

            <div className="space-y-3">
              {revenueStats.topServices?.map((item: any, idx: number) => (
                <div key={idx} className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">{item.serviceName}</div>
                    <div className="text-[10px] text-gray-400">{item.count} veces solicitado</div>
                  </div>
                  <div className="text-sm font-black text-blue-600 dark:text-blue-400">
                    {item.revenue.toFixed(2)}€
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Cita (Strictly Centered) */}
      {isNewAppointmentModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 m-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <CalendarCheck className="w-4 h-4 text-blue-500" />
                <span>Agendar Nueva Cita & Reserva</span>
              </h3>
              <button onClick={() => setIsNewAppointmentModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Nombre del Cliente *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej: Carmen Navarro"
                  className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Teléfono (WhatsApp)</label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Profesional / Asignado *</label>
                  <select
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="Ignacio (Especialista Senior)">Ignacio (Especialista Senior)</option>
                    <option value="Sofía Martínez (Consultor Senior)">Sofía Martínez (Consultor Senior)</option>
                    <option value="David R. (Asesor Técnico)">David R. (Asesor Técnico)</option>
                  </select>
                </div>
              </div>

              {/* Service Selection Checklist */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                  Seleccionar Servicios ({selectedServiceIds.length} elegidos) *
                </label>
                <div className="mt-1 space-y-1.5 max-h-40 overflow-y-auto p-2 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700">
                  {services.map((srv) => {
                    const isChecked = selectedServiceIds.includes(srv.id);
                    return (
                      <label
                        key={srv.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                          isChecked ? 'bg-blue-100 dark:bg-blue-950/60 font-bold text-blue-900 dark:text-blue-200' : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedServiceIds([...selectedServiceIds, srv.id]);
                              } else {
                                setSelectedServiceIds(selectedServiceIds.filter((id) => id !== srv.id));
                              }
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span>{srv.name}</span>
                        </div>
                        <div className="text-right font-mono">
                          <span>{srv.price}€</span>
                          <span className="text-[10px] text-gray-400 ml-1.5">({srv.durationMin}m)</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Live Revenue & Margin Summary Box */}
              {selectedServiceIds.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-800/60 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">Duración Total</div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">
                      {selectedServicesCalculations.duration} min
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">Precio Total</div>
                    <div className="text-sm font-black text-blue-600 dark:text-blue-400">
                      {selectedServicesCalculations.total.toFixed(2)}€
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">Ganancia Neta</div>
                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      +{selectedServicesCalculations.profit.toFixed(2)}€
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Hora *</label>
                  <input
                    type="time"
                    required
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Notas / Objetivos de la sesión</label>
                <textarea
                  rows={2}
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                  placeholder="Detalles sobre los requerimientos, documentación previa..."
                  className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewAppointmentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Confirmar y Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nuevo Servicio (Strictly Centered) */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 m-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-blue-500" />
                <span>Añadir Servicio al Catálogo</span>
              </h3>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Nombre del Servicio *</label>
                <input
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Ej: Auditoría Técnica & Optimización"
                  className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Categoría</label>
                  <select
                    value={serviceCategory}
                    onChange={(e: any) => setServiceCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="CONSULTATION">Consultoría & Estrategia</option>
                    <option value="TECHNICAL">Servicio Técnico / IT</option>
                    <option value="ADVISORY">Asesoría & Legal</option>
                    <option value="SERVICE">Servicios Profesionales</option>
                    <option value="TREATMENT">Tratamientos & Salud</option>
                    <option value="OTHER">Otros Servicios</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Duración (min)</label>
                  <input
                    type="number"
                    value={serviceDuration}
                    onChange={(e) => setServiceDuration(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Precio Venta (€) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Coste Insumos / Directo (€)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={serviceSupplyCost}
                    onChange={(e) => setServiceSupplyCost(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Descripción / Entregables</label>
                <textarea
                  rows={2}
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder="Incluye diagnóstico, informe de resultados y soporte directo..."
                  className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Guardar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Cobro Rápido / Checkout (Strictly Centered) */}
      {selectedAppointmentForPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 m-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 dark:border-slate-800 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Cobro Rápido de Cita</h3>
              <p className="text-xs text-gray-500">{selectedAppointmentForPayment.clientName}</p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">Total a Cobrar</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {selectedAppointmentForPayment.totalPrice.toFixed(2)}€
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-500">Selecciona Método de Pago:</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleProcessPayment('BIZUM')}
                  className="p-2.5 bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 font-bold text-xs rounded-xl border border-gray-200 dark:border-slate-700 transition-colors"
                >
                  ⚡ Bizum
                </button>
                <button
                  onClick={() => handleProcessPayment('CARD')}
                  className="p-2.5 bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 font-bold text-xs rounded-xl border border-gray-200 dark:border-slate-700 transition-colors"
                >
                  💳 Tarjeta / TPV
                </button>
                <button
                  onClick={() => handleProcessPayment('CASH')}
                  className="p-2.5 bg-gray-50 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 font-bold text-xs rounded-xl border border-gray-200 dark:border-slate-700 transition-colors"
                >
                  💵 Efectivo
                </button>
                <button
                  onClick={() => handleProcessPayment('TRANSFER')}
                  className="p-2.5 bg-gray-50 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 font-bold text-xs rounded-xl border border-gray-200 dark:border-slate-700 transition-colors"
                >
                  🏦 Transferencia
                </button>
              </div>
            </div>

            <button
              onClick={() => setSelectedAppointmentForPayment(null)}
              className="w-full py-2 text-xs text-gray-400 hover:text-gray-600"
            >
              Cerrar sin cobrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
