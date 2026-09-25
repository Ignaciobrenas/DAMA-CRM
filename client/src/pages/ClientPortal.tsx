import React, { useState, useEffect } from 'react';
import {
  Building2,
  Download,
  CheckCircle,
  FileText,
  ExternalLink,
  ShieldCheck,
  LifeBuoy,
  Send,
  Clock,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useBranding } from '../context/BrandingContext';
import { LoadingSpinner, SkeletonTable } from '../components/common/Loading';

export const ClientPortal: React.FC = () => {
  const { branding } = useBranding();
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [portalData, setPortalData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'invoices' | 'tickets' | 'privacy'>('invoices');
  const [isLoading, setIsLoading] = useState(true);

  // Tickets state
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketPriority, setTicketPriority] = useState('MEDIUM');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState('');

  useEffect(() => {
    apiRequest('/companies?limit=10').then((res) => {
      if (res.success && res.data) {
        setCompanies(res.data);
        if (res.data.length > 0) {
          setSelectedCompanyId(res.data[0].id);
        }
      }
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      apiRequest(`/omnichannel/portal/${selectedCompanyId}`).then((res) => {
        if (res.success) {
          setPortalData(res.data);
          // Load tickets for company email if available
          if (res.data.company?.email) {
            loadTickets(res.data.company.email);
          }
        }
      });
    }
  }, [selectedCompanyId]);

  const loadTickets = async (email: string) => {
    setIsLoadingTickets(true);
    const res = await apiRequest(`/lead-capture/tickets?email=${encodeURIComponent(email)}`);
    setIsLoadingTickets(false);
    if (res.success && res.data) {
      setTickets(res.data);
    }
  };

  const handleDownloadPdf = async (invoiceId: string, number: string) => {
    const res = await apiRequest(`/invoices/portal/${invoiceId}/pdf`);
    if (res.success && res.data) {
      const url = window.URL.createObjectURL(res.data as any);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Factura-${number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalData?.company?.email) return;

    const res = await apiRequest('/lead-capture/tickets', {
      method: 'POST',
      body: JSON.stringify({
        email: portalData.company.email,
        name: portalData.company.name,
        subject: ticketSubject,
        priority: ticketPriority,
        message: ticketMessage,
      }),
    });

    if (res.success) {
      setTicketSuccess(`✅ Ticket creado con éxito: ${res.ticketNumber}. Asignado al equipo de soporte.`);
      setTicketSubject('');
      setTicketMessage('');
      loadTickets(portalData.company.email);
      setTimeout(() => setTicketSuccess(''), 5000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-blue-200 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Portal de Autoservicio B2B & Helpdesk</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Área Privada de Clientes</h1>
            <p className="text-xs text-blue-100 max-w-xl">
              Descarga tus facturas, consulta estados de cuenta mercantiles y abre tickets directos con nuestro equipo técnico.
            </p>
          </div>

          {branding.logoUrl && (
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shrink-0 self-start sm:self-center">
              <img src={branding.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
            </div>
          )}
        </div>

        {/* Company Switcher for Demo Simulation */}
        <div className="pt-2 flex items-center space-x-2 text-xs border-t border-white/10">
          <span className="text-blue-200 font-medium">Simular vista como cliente:</span>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="bg-white/20 text-white border border-white/30 rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id} className="text-gray-900">
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'invoices'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Mis Facturas</span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'tickets'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          <span>Soporte Técnico (Helpdesk)</span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'privacy'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Privacidad & RGPD</span>
        </button>
      </div>

      {isLoading && <SkeletonTable rows={4} cols={4} />}

      {/* Tab 1: Invoices */}
      {!isLoading && activeTab === 'invoices' && portalData && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                {portalData.company.name}
              </div>
              <div className="text-xs text-gray-500">
                CIF: {portalData.company.taxId || 'B-99887766'} • {portalData.company.email || 'contacto@empresa.com'}
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              Cliente Verificado
            </span>
          </div>

          {/* Invoices List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 font-bold text-xs text-gray-900 dark:text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Mis Facturas Disponibles</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
                <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Número Factura</th>
                    <th className="px-4 py-3">Fecha de Emisión</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Importe Total</th>
                    <th className="px-4 py-3 text-right">Descarga</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
                  {portalData.invoices?.length > 0 ? (
                    portalData.invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-4 py-3">{new Date(inv.issueDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                          {inv.total.toLocaleString('es-ES', { style: 'currency', currency: inv.currency })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Descargar PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-400">
                        No hay facturas emitidas para esta empresa aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Tickets */}
      {!isLoading && activeTab === 'tickets' && (
        <div className="space-y-6">
          {/* New Ticket Form */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Abrir Nueva Incidencia de Soporte Técnico
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Las solicitudes se registran como tickets con SLA y se asignan de inmediato a un agente del equipo técnico.
              </p>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Asunto de la Incidencia
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Problema con sincronización de inventario..."
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="LOW">Baja (Consulta general)</option>
                    <option value="MEDIUM">Media (Incidencia no crítica)</option>
                    <option value="HIGH">Alta (Afecta operaciones)</option>
                    <option value="URGENT">Urgente (Servicio interrumpido)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Descripción Detallada
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Por favor describe los pasos para reproducir la incidencia o el motivo de tu consulta..."
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Ticket de Soporte</span>
              </button>
            </form>

            {ticketSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300">
                {ticketSuccess}
              </div>
            )}
          </div>

          {/* Tickets List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 font-bold text-xs text-gray-900 dark:text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Historial de Tickets de Soporte</span>
              </div>
              <span className="text-[11px] text-gray-500 font-normal">
                {tickets.length} tickets registrados
              </span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {tickets.length > 0 ? (
                tickets.map((t) => (
                  <div key={t.id} className="p-4 hover:bg-gray-50/50 dark:hover:bg-slate-800/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          {t.ticketNumber}
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {t.subject}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        {t.status === 'RESOLVED' ? 'RESUELTO' : 'EN TRAMITACIÓN'}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-slate-400">
                      Fecha: {new Date(t.createdAt).toLocaleString()} • Prioridad: {t.priority}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-gray-400">
                  No tienes tickets de soporte pendientes.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Privacy */}
      {!isLoading && activeTab === 'privacy' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Tus Derechos de Privacidad & RGPD
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Control total sobre tus datos de facturación y preferencias de comunicación.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 space-y-3 text-xs">
            <div>
              <span className="font-bold text-gray-900 dark:text-white">Descarga de datos personales (Portabilidad):</span>
              <p className="text-gray-500 text-[11px] mt-0.5">
                Puedes descargar una copia digital de todas tus facturas, tickets de soporte y mensajes en formato JSON.
              </p>
            </div>
            <a
              href={`/api/lead-capture/privacy-export?email=${encodeURIComponent(portalData?.company?.email || '')}`}
              download
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar mis datos completos (JSON)</span>
            </a>
          </div>

          <div className="pt-2">
            <a
              href="/privacy"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              <span>Consultar la Política de Privacidad íntegra del CRM</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
