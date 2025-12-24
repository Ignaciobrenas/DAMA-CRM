import React, { useState, useEffect } from 'react';
import { Building2, Download, CheckCircle, FileText, ExternalLink, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../services/api';

export const ClientPortal: React.FC = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [portalData, setPortalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        }
      });
    }
  }, [selectedCompanyId]);

  const handleDownloadPdf = async (invoiceId: string, number: string) => {
    // Uses the public portal PDF download endpoint: /api/invoices/portal/:id/pdf
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-lg space-y-2">
        <div className="flex items-center space-x-2 text-blue-200 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Portal de Autoservicio B2B para Clientes</span>
        </div>
        <h1 className="text-2xl font-bold">Descarga Autónoma de Facturas Mercantiles</h1>
        <p className="text-xs text-blue-100 max-w-xl">
          Espacio seguro y aislado para que sus clientes consulten su estado de cuenta, presupuestos aprobados y descarguen sus facturas en PDF sin requerir cuenta administrativa en el CRM.
        </p>

        {/* Company Switcher for Demo Simulation */}
        <div className="pt-2 flex items-center space-x-2 text-xs">
          <span className="text-blue-200">Simular vista como cliente:</span>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="bg-white/20 text-white border border-white/30 rounded-lg px-2.5 py-1 text-xs focus:outline-none cursor-pointer"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id} className="text-gray-900">
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Portal Details */}
      {portalData && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
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
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
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
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
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
    </div>
  );
};
