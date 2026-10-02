import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ExternalLink,
  Shield,
  Layers,
  DollarSign,
  TrendingUp,
  Percent,
  XCircle,
  FileText,
  User,
  Phone,
  RefreshCw,
  Send,
  Download,
} from 'lucide-react';
import { apiRequest, downloadFile } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { soundService } from '../services/sound';

export type CarrierType = 'GLS' | 'NACEX' | 'AMAZON' | 'CORREOS_EXPRESS' | 'DHL' | 'MRW' | 'SEUR';
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

const CARRIER_CONFIG: Record<string, { name: string; color: string; bgBadge: string; logoUrl?: string }> = {
  GLS: { name: 'GLS Spain', color: '#002B7F', bgBadge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200' },
  NACEX: { name: 'NACEX', color: '#E30613', bgBadge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200' },
  AMAZON: { name: 'Amazon Shipping', color: '#FF9900', bgBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200' },
  CORREOS_EXPRESS: { name: 'Correos Express', color: '#FFD700', bgBadge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-200' },
  DHL: { name: 'DHL Express', color: '#D40511', bgBadge: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-200' },
  SEUR: { name: 'SEUR / DPD', color: '#E4002B', bgBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200' },
  MRW: { name: 'MRW Urgente', color: '#E31B23', bgBadge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200' },
};

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              {t('logistics.title', 'Logística, Paquetería & Envíos')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              GLS • NACEX • Amazon • Correos Express
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {t('logistics.subtitle', 'Seguimiento de paquetes en tiempo real, cálculo de costes de envío y sincronización con agencias de transporte')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => downloadFile('/logistics/export/csv', 'manifiesto_envios.csv')}
            className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-slate-200 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center space-x-1.5"
            title="Exportar Manifiesto de Envíos en CSV / Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('exportCsv', 'Exportar Excel')}</span>
          </button>
          <button
            onClick={() => downloadFile('/logistics/export/pdf', 'informe_logistica_envios.pdf')}
            className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-slate-200 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center space-x-1.5"
            title="Descargar informe oficial de expedición en PDF"
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>{t('exportPdf', 'Informe PDF')}</span>
          </button>
          <button
            onClick={() => setIsNewShipmentModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{t('logistics.newShipment', 'Nuevo Envío / Paquete')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Shipments */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-sky-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400">Envíos Activos en Red</span>
            <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {stats?.activeShipments || 0}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            {stats?.inTransitCount || 0} en tránsito entre plataformas
          </div>
        </div>

        {/* Card 2: Out For Delivery */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">En Reparto Hoy</span>
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {stats?.outForDeliveryCount || 0}
          </div>
          <div className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            Entregas programadas antes de 19:00h
          </div>
        </div>

        {/* Card 3: Success Rate */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Tasa de Entrega Exitosa</span>
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {stats?.deliveryRate || 100}%
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            {stats?.deliveredCount || 0} paquetes entregados
          </div>
        </div>

        {/* Card 4: Total Shipping Cost */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-purple-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Gasto Total en Portes</span>
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {(stats?.totalShippingSpend || 0).toFixed(2)}€
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            Total {stats?.totalShipments || 0} expediciones
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('shipments')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'shipments'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>{t('logistics.tabShipments', 'Lista de Envíos & Tracking')}</span>
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
          <span>{t('logistics.tabAnalytics', 'Métricas de Transportistas')}</span>
        </button>

        <button
          onClick={() => setActiveTab('connectors')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'connectors'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>{t('logistics.tabConnectors', 'Conectores de Agencias')}</span>
        </button>
      </div>

      {/* VIEW 1: Shipments List & Live Tracking */}
      {activeTab === 'shipments' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-800">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por código de seguimiento, destinatario o ciudad..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={filterCarrier}
                onChange={(e) => setFilterCarrier(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-300 font-medium"
              >
                <option value="ALL">Todas las agencias</option>
                <option value="GLS">GLS</option>
                <option value="NACEX">NACEX</option>
                <option value="AMAZON">Amazon Shipping</option>
                <option value="CORREOS_EXPRESS">Correos Express</option>
                <option value="DHL">DHL Express</option>
                <option value="SEUR">SEUR</option>
                <option value="MRW">MRW</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-300 font-medium"
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

          {/* Shipments Table / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredShipments.map((s) => {
              const carrierInfo = CARRIER_CONFIG[s.carrier] || { name: s.carrier, color: '#333', bgBadge: 'bg-gray-100 text-gray-800 border-gray-200' };
              const statusInfo = STATUS_CONFIG[s.status] || STATUS_CONFIG.PRE_TRANSIT;
              const lastEvent = s.events[s.events.length - 1];

              return (
                <div
                  key={s.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs hover:border-blue-300 dark:hover:border-blue-800 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Carrier & Status */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${carrierInfo.bgBadge}`}>
                        {carrierInfo.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center space-x-1 ${statusInfo.color}`}>
                        {statusInfo.icon}
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>

                    {/* Tracking Number */}
                    <div className="mt-2.5 font-mono text-xs font-black text-gray-900 dark:text-white flex items-center justify-between">
                      <span>{s.trackingNumber}</span>
                      {s.orderNumber && (
                        <span className="text-[10px] font-normal text-gray-400 font-sans">{s.orderNumber}</span>
                      )}
                    </div>

                    {/* Recipient & Location */}
                    <div className="mt-3 space-y-1">
                      <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-blue-500" />
                        <span className="truncate">{s.recipientName}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{s.destinationCity} ({s.destinationPostalCode})</span>
                      </div>
                    </div>

                    {/* Latest Event Snippet */}
                    {lastEvent && (
                      <div className="mt-3 p-2 bg-gray-50 dark:bg-slate-800/60 rounded-xl text-[11px] text-gray-600 dark:text-slate-300 border border-gray-100 dark:border-slate-800">
                        <div className="font-bold text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          Último Evento ({lastEvent.location}):
                        </div>
                        <p className="mt-0.5 truncate">{lastEvent.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer: Details Button & Status Simulator */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{s.shippingCost.toFixed(2)}€</span>
                      <span className="text-[10px] text-gray-400 ml-1">({s.weightKg} kg)</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedShipment(s)}
                        className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-lg transition-colors"
                      >
                        Ver Tracking
                      </button>

                      {s.status === 'PRE_TRANSIT' && (
                        <button
                          onClick={() => handleProgressStatus(s.id, 'IN_TRANSIT')}
                          className="px-2 py-1 text-[10px] font-bold bg-sky-600 text-white rounded-md"
                          title="Enviar a Tránsito"
                        >
                          → Tránsito
                        </button>
                      )}
                      {s.status === 'IN_TRANSIT' && (
                        <button
                          onClick={() => handleProgressStatus(s.id, 'OUT_FOR_DELIVERY')}
                          className="px-2 py-1 text-[10px] font-bold bg-amber-600 text-white rounded-md"
                          title="Pasar a Reparto"
                        >
                          → Reparto
                        </button>
                      )}
                      {s.status === 'OUT_FOR_DELIVERY' && (
                        <button
                          onClick={() => handleProgressStatus(s.id, 'DELIVERED')}
                          className="px-2 py-1 text-[10px] font-bold bg-emerald-600 text-white rounded-md"
                          title="Marcar Entregado"
                        >
                          ✓ Entregar
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
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <Truck className="w-4 h-4 text-blue-500" />
              <span>Volumen y Gasto por Agencia de Transporte</span>
            </h3>

            <div className="space-y-3">
              {stats.carrierBreakdown?.map((item: any, idx: number) => {
                const carrierConf = CARRIER_CONFIG[item.carrier] || { name: item.carrier, bgBadge: '' };
                return (
                  <div key={idx} className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white">{carrierConf.name}</div>
                      <div className="text-[10px] text-gray-400">
                        {item.count} envíos realizados ({item.delivered} entregados con éxito)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-blue-600 dark:text-blue-400">
                        {item.totalCost.toFixed(2)}€
                      </div>
                      <div className="text-[10px] text-gray-400">Coste acumulado</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
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

            <div className="text-xs text-gray-500 space-y-2">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span>Tiempo Medio de Tránsito</span>
                <span className="font-bold text-gray-900 dark:text-white">24.5 horas</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span>Integración Webhooks</span>
                <span className="font-bold text-emerald-600">Activo (Tiempo Real)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Connectors Setup */}
      {activeTab === 'connectors' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(CARRIER_CONFIG).map(([key, item]) => (
            <div
              key={key}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${item.bgBadge}`}>
                  {item.name}
                </span>
                <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Conectado</span>
                </span>
              </div>

              <p className="text-xs text-gray-500">
                Integración API REST con generación automática de etiquetas, códigos de barras y sincronización de eventos de entrega.
              </p>

              <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center text-[11px]">
                <span className="text-gray-400">Modo Producción</span>
                <button className="text-blue-600 font-bold hover:underline">Configurar API</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Detailed Tracking Timeline View */}
      {selectedShipment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Historial de Tracking</span>
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  {selectedShipment.trackingNumber} ({selectedShipment.carrier})
                </h3>
              </div>
              <button onClick={() => setSelectedShipment(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient & Destination Summary */}
            <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-[10px] text-gray-400">Destinatario</div>
                <div className="font-bold text-gray-900 dark:text-white">{selectedShipment.recipientName}</div>
                <div className="text-gray-500">{selectedShipment.destinationAddress}</div>
                <div className="text-gray-500">{selectedShipment.destinationCity}, {selectedShipment.destinationPostalCode}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400">Detalles Envío</div>
                <div className="text-gray-700 dark:text-slate-300">Peso: {selectedShipment.weightKg} kg</div>
                <div className="text-gray-700 dark:text-slate-300">Porte: {selectedShipment.shippingCost.toFixed(2)}€</div>
                {selectedShipment.signatureProof && (
                  <div className="mt-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-1 rounded">
                    ✓ {selectedShipment.signatureProof}
                  </div>
                )}
              </div>
            </div>

            {/* Vertical Timeline */}
            <div className="space-y-4 pl-2">
              <div className="text-xs font-bold text-gray-900 dark:text-white">Eventos de Expedición:</div>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-200 dark:before:bg-blue-900">
                {selectedShipment.events.map((evt, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900" />
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-900 dark:text-white">{evt.location}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(evt.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-slate-300 mt-0.5">{evt.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedShipment(null)}
                className="px-4 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nuevo Envío */}
      {isNewShipmentModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <Truck className="w-4 h-4 text-blue-500" />
                <span>Generar Nueva Expedición / Paquete</span>
              </h3>
              <button onClick={() => setIsNewShipmentModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Transportista *</label>
                <select
                  value={carrier}
                  onChange={(e: any) => setCarrier(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white font-semibold"
                >
                  <option value="GLS">GLS Spain (Envío Urgente 24h)</option>
                  <option value="NACEX">NACEX (Garantía Horaria)</option>
                  <option value="AMAZON">Amazon Shipping / FBA</option>
                  <option value="CORREOS_EXPRESS">Correos Express Paq 24</option>
                  <option value="DHL">DHL Express Internacional</option>
                  <option value="SEUR">SEUR / DPD Classic</option>
                  <option value="MRW">MRW Urgente</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Nombre del Destinatario *</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Ej: Salón Estética Glow / Ana Belén"
                  className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Teléfono</label>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Referencia / Nº Pedido</label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="PED-2026-099"
                    className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Dirección de Entrega *</label>
                <input
                  type="text"
                  required
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  placeholder="Calle Gran Vía 28, 4º"
                  className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Ciudad *</label>
                  <input
                    type="text"
                    required
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value)}
                    placeholder="Madrid"
                    className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Código Postal *</label>
                  <input
                    type="text"
                    required
                    value={destinationPostalCode}
                    onChange={(e) => setDestinationPostalCode(e.target.value)}
                    placeholder="28013"
                    className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Coste Envío (€)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Notas / Instrucciones al Transportista</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Dejar en conserjería si no contesta..."
                  className="w-full mt-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewShipmentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Crear y Generar Tracking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
