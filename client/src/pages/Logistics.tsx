import React, { useState, useEffect } from 'react';
import {
  Truck,
  Check,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Shield,
  DollarSign,
  TrendingUp,
  XCircle,
  FileText,
  User,
  RefreshCw,
  Download,
  Printer,
  Calculator,
  Sparkles,
} from 'lucide-react';
import { apiRequest, downloadFile } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { soundService } from '../services/sound';
import { CarrierLogo, CARRIERS_CATALOG } from '../components/logistics/CarrierLogo';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';

export type CarrierType = string;
export type ShipmentStatus = 'PRE_TRANSIT' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'EXCEPTION' | 'RETURNED';

export interface TrackingEvent {
  id: string;
  status: ShipmentStatus;
  description: string;
  location: string;
  timestamp: string;
}

export interface ShipmentData {
  id: string;
  trackingNumber: string;
  carrier: CarrierType;
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  destinationAddress: string;
  destinationCity: string;
  destinationPostalCode: string;
  destinationCountry: string;
  status: ShipmentStatus;
  weightKg: number;
  packageType: 'STANDARD_BOX' | 'ENVELOPE' | 'PALLET' | 'FRAGILE';
  shippingCost: number;
  orderNumber?: string;
  notes?: string;
  estimatedDeliveryDate: string;
  actualDeliveryDate?: string;
  signatureProof?: string;
  events: TrackingEvent[];
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PRE_TRANSIT: { label: 'Etiqueta Creada', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200', icon: <FileText className="w-3.5 h-3.5" /> },
  IN_TRANSIT: { label: 'En Tránsito', color: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200', icon: <Truck className="w-3.5 h-3.5" /> },
  OUT_FOR_DELIVERY: { label: 'En Reparto', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> },
  DELIVERED: { label: 'Entregado', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  EXCEPTION: { label: 'Incidencia', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  RETURNED: { label: 'Devuelto', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200', icon: <RefreshCw className="w-3.5 h-3.5" /> },
};

export const Logistics: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();

  const [shipments, setShipments] = useState<ShipmentData[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'shipments' | 'analytics' | 'connectors'>('shipments');
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCarrier, setFilterCarrier] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modals
  const [isNewShipmentModalOpen, setIsNewShipmentModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentData | null>(null);
  const [isRateComparatorOpen, setIsRateComparatorOpen] = useState(false);

  // Rate Comparator State
  const [rateWeight, setRateWeight] = useState('2.5');
  const [ratePostalCode, setRatePostalCode] = useState('28001');
  const [rateUrgent, setRateUrgent] = useState(false);
  const [comparedRates, setComparedRates] = useState<any[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  // Form State
  const [carrier, setCarrier] = useState<CarrierType>('GLS');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [destinationPostalCode, setDestinationPostalCode] = useState('');
  const [weightKg, setWeightKg] = useState('2.5');
  const [shippingCost, setShippingCost] = useState('6.95');
  const [orderNumber, setOrderNumber] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    const [shipRes, statsRes] = await Promise.all([
      apiRequest('/logistics/shipments'),
      apiRequest('/logistics/stats'),
    ]);

    if (shipRes.success && shipRes.data) setShipments(shipRes.data);
    if (statsRes.success && statsRes.data) setStats(statsRes.data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedShipment) setSelectedShipment(null);
        else if (isNewShipmentModalOpen) setIsNewShipmentModalOpen(false);
        else if (isRateComparatorOpen) setIsRateComparatorOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedShipment, isNewShipmentModalOpen, isRateComparatorOpen]);

  const handleCompareRates = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsComparing(true);
    try {
      const res = await apiRequest('/logistics/rates/compare', {
        method: 'POST',
        body: JSON.stringify({
          weightKg: Number(rateWeight) || 2.0,
          destinationPostalCode: ratePostalCode || '28001',
          urgent: rateUrgent,
        }),
      });
      if (res.success && res.data?.rates) {
        setComparedRates(res.data.rates);
      }
    } finally {
      setIsComparing(false);
    }
  };

  const handleDownloadLabelPdf = async (shipmentId: string, trackingNumber: string) => {
    const res = await apiRequest(`/logistics/shipments/${shipmentId}/label`);
    if (res.success && res.data) {
      const url = window.URL.createObjectURL(res.data as any);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Etiqueta-10x15-${trackingNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Etiqueta Térmica 10x15 PDF', `Generada etiqueta oficial para ${trackingNumber}`);
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !destinationAddress.trim() || !destinationCity.trim()) return;

    const res = await apiRequest('/logistics/shipments', {
      method: 'POST',
      body: JSON.stringify({
        carrier,
        recipientName,
        recipientPhone,
        recipientEmail,
        destinationAddress,
        destinationCity,
        destinationPostalCode,
        weightKg: Number(weightKg),
        shippingCost: Number(shippingCost),
        orderNumber,
        notes,
      }),
    });

    if (res.success) {
      soundService.playSuccessChime();
      toast.success('Expedición Creada', `Envío registrado con ${carrier}`);
      setIsNewShipmentModalOpen(false);
      setRecipientName('');
      setRecipientPhone('');
      setDestinationAddress('');
      setDestinationCity('');
      setDestinationPostalCode('');
      setOrderNumber('');
      setNotes('');
      loadData();
    }
  };

  const handleProgressStatus = async (shipmentId: string, nextStatus: ShipmentStatus) => {
    let description = 'Actualización en tránsito';
    if (nextStatus === 'OUT_FOR_DELIVERY') description = 'Paquete asignado a repartidor local. En reparto.';
    if (nextStatus === 'DELIVERED') description = 'Paquete entregado con éxito en mano del destinatario.';

    const res = await apiRequest(`/logistics/shipments/${shipmentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        status: nextStatus,
        description,
        signatureProof: nextStatus === 'DELIVERED' ? 'Firma digital confirmada' : undefined,
      }),
    });

    if (res.success) {
      soundService.playSuccessChime();
      if (selectedShipment && selectedShipment.id === shipmentId) {
        setSelectedShipment(res.data);
      }
      loadData();
    }
  };

  const filteredShipments = shipments.filter((s) => {
    if (filterCarrier !== 'ALL' && s.carrier !== filterCarrier) return false;
    if (filterStatus !== 'ALL' && s.status !== filterStatus) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.trackingNumber.toLowerCase().includes(q) ||
      s.recipientName.toLowerCase().includes(q) ||
      s.destinationCity.toLowerCase().includes(q) ||
      (s.orderNumber && s.orderNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {t('logistics.title', 'Logística, Paquetería & Envíos')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {Object.keys(CARRIERS_CATALOG).length} Agencias Integradas (GLS, NACEX, DHL, SEUR, Correos, MRW, UPS...)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('logistics.subtitle', 'Seguimiento en tiempo real, comparador de tarifas multicarrier y generación de etiquetas térmicas 10x15cm PDF')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="btn-compare-rates"
            onClick={() => {
              setIsRateComparatorOpen(true);
              handleCompareRates();
            }}
            className="px-3 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-all active:scale-[0.98] flex items-center space-x-1.5"
          >
            <Calculator className="w-3.5 h-3.5 text-indigo-600" />
            <span>Comparador Tarifas</span>
          </button>
          <button
            type="button"
            onClick={() => downloadFile('/logistics/export/csv', 'manifiesto_envios.csv')}
            className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center space-x-1.5"
            title="Exportar Manifiesto de Envíos en CSV / Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('exportCsv', 'Exportar Excel')}</span>
          </button>
          <button
            type="button"
            onClick={() => downloadFile('/logistics/export/pdf', 'informe_logistica_envios.pdf')}
            className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center space-x-1.5"
            title="Descargar informe oficial de expedición en PDF"
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>{t('exportPdf', 'Informe PDF')}</span>
          </button>
          <button
            type="button"
            data-testid="btn-new-shipment"
            onClick={() => setIsNewShipmentModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t('logistics.newShipment', 'Nuevo Envío / Paquete')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400">Envíos Activos en Red</span>
            <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {stats?.activeShipments || 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {stats?.inTransitCount || 0} en tránsito entre plataformas
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">En Reparto Hoy</span>
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {stats?.outForDeliveryCount || 0}
          </div>
          <div className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            Entregas programadas antes de 19:00h
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Tasa de Entrega Exitosa</span>
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {stats?.deliveryRate || 100}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {stats?.deliveredCount || 0} paquetes entregados
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Gasto Total en Portes</span>
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {(stats?.totalShippingSpend || 0).toFixed(2)}€
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Total {stats?.totalShipments || 0} expediciones
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Secciones de Logística" className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          role="tab"
          aria-selected={activeTab === 'shipments'}
          data-testid="tab-logistics-shipments"
          onClick={() => setActiveTab('shipments')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'shipments'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>{t('logistics.tabShipments', 'Lista de Envíos & Tracking')}</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'analytics'}
          data-testid="tab-logistics-analytics"
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{t('logistics.tabAnalytics', 'Métricas de Transportistas')}</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'connectors'}
          data-testid="tab-logistics-connectors"
          onClick={() => setActiveTab('connectors')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'connectors'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>{t('logistics.tabConnectors', 'Conectores de Agencias (22)')}</span>
        </button>
      </div>

      {/* VIEW 1: Shipments List & Live Tracking */}
      {activeTab === 'shipments' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por código de seguimiento, destinatario o ciudad..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                aria-label="Filtrar por agencia de transporte" title="Filtrar por agencia de transporte" value={filterCarrier}
                onChange={(e) => setFilterCarrier(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="ALL">Todas las agencias ({Object.keys(CARRIERS_CATALOG).length})</option>
                {Object.values(CARRIERS_CATALOG).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.shortName} — {c.serviceType}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filtrar por estado de envío" title="Filtrar por estado de envío" value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="ALL">Todos los estados</option>
                <option value="PRE_TRANSIT">Etiqueta Creada</option>
                <option value="IN_TRANSIT">En Tránsito</option>
                <option value="OUT_FOR_DELIVERY">En Reparto</option>
                <option value="DELIVERED">Entregados</option>
                <option value="EXCEPTION">Incidencias</option>
              </select>
            </div>
          </div>

          {/* Shipments Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredShipments.map((s) => {
              const statusInfo = STATUS_CONFIG[s.status] || STATUS_CONFIG.PRE_TRANSIT;
              const lastEvent = s.events[s.events.length - 1];

              return (
                <div
                  key={s.id}
                  data-testid={`shipment-card-${s.trackingNumber}`}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:border-blue-300 dark:hover:border-blue-800 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: CarrierLogo & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <CarrierLogo carrier={s.carrier} size="md" />
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center space-x-1 ${statusInfo.color}`}>
                        {statusInfo.icon}
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>

                    {/* Tracking Number */}
                    <div className="mt-2.5 font-mono text-xs font-black text-slate-900 dark:text-white flex items-center justify-between">
                      <span>{s.trackingNumber}</span>
                      {s.orderNumber && (
                        <span className="text-[10px] font-normal text-slate-400 font-sans">{s.orderNumber}</span>
                      )}
                    </div>

                    {/* Recipient & Location */}
                    <div className="mt-3 space-y-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-blue-500" />
                        <span className="truncate">{s.recipientName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{s.destinationCity} ({s.destinationPostalCode})</span>
                      </div>
                    </div>

                    {/* Latest Event Snippet */}
                    {lastEvent && (
                      <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                        <div className="font-bold text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          Último Evento ({lastEvent.location}):
                        </div>
                        <p className="mt-0.5 truncate">{lastEvent.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer: Details Button, Thermal Label PDF & Status Simulator */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{s.shippingCost.toFixed(2)}€</span>
                      <span className="text-[10px] text-slate-400 ml-1">({s.weightKg} kg)</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <button
                        type="button"
                        data-testid={`btn-shipment-label-${s.trackingNumber}`}
                        onClick={() => handleDownloadLabelPdf(s.id, s.trackingNumber)}
                        className="px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg inline-flex items-center gap-1 transition-all active:scale-[0.98]"
                        title="Imprimir Etiqueta Térmica 10x15cm PDF"
                      >
                        <Printer className="w-3 h-3 text-blue-600" />
                        <span>Etiqueta PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedShipment(s)}
                        className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-lg transition-colors"
                      >
                        Tracking
                      </button>

                      {s.status === 'PRE_TRANSIT' && (
                        <button
                          type="button"
                          onClick={() => handleProgressStatus(s.id, 'IN_TRANSIT')}
                          className="px-2 py-1 text-[10px] font-bold bg-sky-600 text-white rounded-md"
                          title="Enviar a Tránsito"
                        >
                          → Tránsito
                        </button>
                      )}
                      {s.status === 'IN_TRANSIT' && (
                        <button
                          type="button"
                          onClick={() => handleProgressStatus(s.id, 'OUT_FOR_DELIVERY')}
                          className="px-2 py-1 text-[10px] font-bold bg-amber-600 text-white rounded-md"
                          title="Pasar a Reparto"
                        >
                          → Reparto
                        </button>
                      )}
                      {s.status === 'OUT_FOR_DELIVERY' && (
                        <button
                          type="button"
                          onClick={() => handleProgressStatus(s.id, 'DELIVERED')}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-emerald-600 text-white rounded-md"
                          title="Marcar Entregado"
                        >
                          <Check className="w-3 h-3" /> Entregar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: Analytics & Carrier Performance */}
      {activeTab === 'analytics' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Truck className="w-4 h-4 text-blue-500" />
              <span>Volumen y Gasto por Agencia de Transporte</span>
            </h3>

            <div className="space-y-3">
              {stats.carrierBreakdown?.map((item: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CarrierLogo carrier={item.carrier} size="md" />
                    <div>
                      <div className="text-[10px] text-slate-500">
                        {item.count} envíos realizados ({item.delivered} entregados con éxito)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-blue-600 dark:text-blue-400">
                      {item.totalCost.toFixed(2)}€
                    </div>
                    <div className="text-[10px] text-slate-400">Coste acumulado</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Cumplimiento de Plazos & SLAs Logísticos</span>
            </h3>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.deliveryRate}%
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                Tasa de éxito en primer intento de entrega sin incidencias
              </p>
            </div>

            <div className="text-xs text-slate-500 space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Tiempo Medio de Tránsito</span>
                <span className="font-bold text-slate-900 dark:text-white">24.5 horas</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Integración Webhooks & Etiquetas ZPL/PDF</span>
                <span className="font-bold text-emerald-600">Activo (22 Agencias)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: All 22 Connectors Setup */}
      {activeTab === 'connectors' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" data-testid="carriers-connectors-grid">
          {Object.values(CARRIERS_CATALOG).map((item) => (
            <div
              key={item.code}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <CarrierLogo carrier={item.code} size="md" />
                  <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Activo</span>
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-2.5">
                  {item.name}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Servicio: <strong>{item.serviceType}</strong> · SLA: {item.slaHours}h · Tarifa base: {item.baseRateEur.toFixed(2)}€
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-mono">API REST + Etiqueta 10x15</span>
                <button
                  type="button"
                  onClick={() => {
                    setCarrier(item.code);
                    setShippingCost(String(item.baseRateEur));
                    setIsNewShipmentModalOpen(true);
                  }}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Enviar con {item.shortName}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: Detailed Tracking Timeline View */}
      <Modal
        isOpen={Boolean(selectedShipment)}
        onClose={() => setSelectedShipment(null)}
        title={selectedShipment ? `${selectedShipment.trackingNumber} (${selectedShipment.carrier})` : 'Tracking'}
        subtitle="Historial de eventos de expedición y prueba de entrega (POD)"
        icon={Truck}
        size="lg"
      >
        {selectedShipment && (
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl grid grid-cols-2 gap-3 text-xs border border-slate-200 dark:border-slate-700">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Destinatario</div>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedShipment.recipientName}</div>
                <div className="text-slate-500">{selectedShipment.destinationAddress}</div>
                <div className="text-slate-500">{selectedShipment.destinationCity}, {selectedShipment.destinationPostalCode}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Detalles Envío</div>
                <div className="mt-0.5"><CarrierLogo carrier={selectedShipment.carrier} size="sm" /></div>
                <div className="text-slate-700 dark:text-slate-300 mt-1">Peso: {selectedShipment.weightKg} kg · Porte: {selectedShipment.shippingCost.toFixed(2)}€</div>
                {selectedShipment.signatureProof && (
                  <div className="mt-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-1 rounded">
                    <span className="inline-flex items-center gap-1"><Check className="w-3 h-3" />{selectedShipment.signatureProof}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 pl-2">
              <div className="text-xs font-bold text-slate-900 dark:text-white">Línea Temporal de Eventos:</div>
              <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-200 dark:before:bg-blue-900">
                {selectedShipment.events.map((evt, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900" />
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">{evt.location}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(evt.timestamp).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{evt.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleDownloadLabelPdf(selectedShipment.id, selectedShipment.trackingNumber)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Descargar Etiqueta Térmica 10x15 PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedShipment(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: Nuevo Envío */}
      <Modal
        isOpen={isNewShipmentModalOpen}
        onClose={() => setIsNewShipmentModalOpen(false)}
        title="Generar Nueva Expedición / Paquete"
        subtitle="Emisión automática de tracking y etiqueta térmica homologada"
        icon={Truck}
        size="lg"
      >
        <form onSubmit={handleCreateShipment} className="space-y-3" data-testid="form-new-shipment">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Agencia de Transporte *</label>
            <select
              data-testid="select-shipment-carrier"
              value={carrier}
              onChange={(e) => {
                const c = e.target.value;
                setCarrier(c);
                if (CARRIERS_CATALOG[c]) {
                  setShippingCost(String(CARRIERS_CATALOG[c].baseRateEur));
                }
              }}
              className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
            >
              {Object.values(CARRIERS_CATALOG).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} — ({c.baseRateEur.toFixed(2)}€)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nombre del Destinatario *</label>
            <input
              type="text"
              required
              data-testid="input-shipment-recipient"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Ej: Salón Estética Glow / Ana Belén"
              className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Teléfono</label>
              <input
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="+34 600 000 000"
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Referencia / Nº Pedido</label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="PED-2026-099"
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Dirección de Entrega *</label>
            <input
              type="text"
              required
              data-testid="input-shipment-address"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              placeholder="Calle Gran Vía 28, 4º"
              className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ciudad *</label>
              <input
                type="text"
                required
                data-testid="input-shipment-city"
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                placeholder="Madrid"
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Código Postal *</label>
              <input
                type="text"
                required
                data-testid="input-shipment-postal"
                value={destinationPostalCode}
                onChange={(e) => setDestinationPostalCode(e.target.value)}
                placeholder="28013"
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Coste Envío (€)</label>
              <input
                type="number"
                step="0.05"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notas / Instrucciones al Transportista</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Dejar en conserjería si no contesta..."
              className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewShipmentModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="btn-submit-new-shipment"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              Crear y Generar Tracking
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Comparador de Tarifas Multi-Agencia */}
      <Modal
        isOpen={isRateComparatorOpen}
        onClose={() => setIsRateComparatorOpen(false)}
        title="Comparador Inteligente de Tarifas Multi-Agencia"
        subtitle="Cotización en tiempo real según peso volumétrico, código postal y SLA de entrega"
        icon={Calculator}
        size="xl"
      >
        <div className="space-y-4" data-testid="rate-comparator-modal">
          <form onSubmit={handleCompareRates} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 items-end">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Peso del Bulto (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={rateWeight}
                onChange={(e) => setRateWeight(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                C.P. Destino
              </label>
              <input
                type="text"
                value={ratePostalCode}
                onChange={(e) => setRatePostalCode(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Prioridad SLA
              </label>
              <select
                value={rateUrgent ? 'URGENT' : 'ECONOMY'}
                onChange={(e) => setRateUrgent(e.target.value === 'URGENT')}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="ECONOMY">Mejor Precio (24/48h)</option>
                <option value="URGENT">Urgente Matinal (14h/19h)</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isComparing}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
            >
              {isComparing ? 'Calculando...' : 'Recalcular Tarifas'}
            </button>
          </form>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {comparedRates.map((r, idx) => (
              <div
                key={r.carrier}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  idx === 0
                    ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CarrierLogo carrier={r.carrier} size="md" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{r.serviceName}</span>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600 text-white flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          Mejor Opción
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Entrega estimada: <strong>{r.slaHours}h</strong> · {r.recommendedFor}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900 dark:text-white font-mono">
                      {Number(r.priceEur).toFixed(2)} €
                    </div>
                    <div className="text-[9px] text-slate-400">IVA no incl.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCarrier(r.carrier);
                      setWeightKg(rateWeight);
                      setDestinationPostalCode(ratePostalCode);
                      setShippingCost(String(r.priceEur));
                      setIsRateComparatorOpen(false);
                      setIsNewShipmentModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold"
                  >
                    Seleccionar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
