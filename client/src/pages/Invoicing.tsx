import React, { useState, useEffect } from 'react';
import { Plus, Download, FileText, CheckCircle, Clock, AlertCircle, X, Trash2 } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const Invoicing: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'invoices' | 'quotes'>('invoices');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const [contactId, setContactId] = useState('');
  const [taxRate, setTaxRate] = useState('21');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ description: string; quantity: number; unitPrice: number }>>([
    { description: 'Licencia / Servicio CRM', quantity: 1, unitPrice: 1500 },
  ]);

  const loadData = async () => {
    setIsLoading(true);
    const [resInvoices, resQuotes, resCompanies, resContacts] = await Promise.all([
      apiRequest('/invoices'),
      apiRequest('/invoices/quotes/all'),
      apiRequest('/companies?limit=100'),
      apiRequest('/contacts?limit=100'),
    ]);

    if (resInvoices.success) setInvoices(resInvoices.data || []);
    if (resQuotes.success) setQuotes(resQuotes.data || []);
    if (resCompanies.success) setCompanies(resCompanies.data || []);
    if (resContacts.success) setContacts(resContacts.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownloadPdf = async (id: string, number: string) => {
    const res = await apiRequest(`/invoices/${id}/pdf`);
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

  const handleDownloadQuotePdf = async (id: string, number: string) => {
    const res = await apiRequest(`/invoices/quotes/${id}/pdf`);
    if (res.success && res.data) {
      const url = window.URL.createObjectURL(res.data as any);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Presupuesto-${number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  const handleMarkPaid = async (id: string) => {
    await apiRequest(`/invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'PAID' }),
    });
    loadData();
  };

  const addItemRow = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, val: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = val;
    setItems(newItems);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const res = await apiRequest('/invoices', {
      method: 'POST',
      body: JSON.stringify({
        companyId: companyId || null,
        contactId: contactId || null,
        taxRate: parseFloat(taxRate) || 21,
        notes,
        items,
      }),
    });

    if (res.success) {
      setIsModalOpen(false);
      setNotes('');
      setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
      loadData();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle className="w-2.5 h-2.5 mr-1" /> Cobrada
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
            <Clock className="w-2.5 h-2.5 mr-1" /> Enviada
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400">
            <AlertCircle className="w-2.5 h-2.5 mr-1" /> Vencida
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300">
            Borrador
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('invoicing')}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Generación de presupuestos y facturas mercantiles con exportación PDF nativa
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'invoices'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              Facturas ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('quotes')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'quotes'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              Presupuestos ({quotes.length})
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('newInvoice')}</span>
          </button>
        </div>
      </div>

      {/* Tab: Invoices List */}
      {activeTab === 'invoices' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
              <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">Cliente / Empresa</th>
                  <th className="px-4 py-3">Fecha Emisión</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {inv.company?.name || `${inv.contact?.firstName} ${inv.contact?.lastName}`}
                      </div>
                      {inv.contact?.email && (
                        <div className="text-[10px] text-gray-400">{inv.contact.email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                      {inv.total.toLocaleString('es-ES', { style: 'currency', currency: inv.currency })}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      {inv.status !== 'PAID' && (
                        <button
                          onClick={() => handleMarkPaid(inv.id)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded text-xs font-semibold"
                        >
                          Marcar Cobrada
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded text-xs font-semibold"
                        title="Descargar PDF"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Quotes List */}
      {activeTab === 'quotes' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
              <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">Cliente / Empresa</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">
                      {q.quoteNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {q.company?.name || `${q.contact?.firstName} ${q.contact?.lastName}`}
                      </div>
                    </td>
                    <td className="px-4 py-3">{new Date(q.issueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                        {q.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                      {q.total.toLocaleString('es-ES', { style: 'currency', currency: q.currency })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDownloadQuotePdf(q.id, q.quoteNumber)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded text-xs font-semibold"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t('newInvoice')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Empresa</label>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="">-- Seleccionar Empresa --</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Contacto</label>
                  <select
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="">-- Seleccionar Contacto --</option>
                    {contacts.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.firstName} {ct.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Table in Modal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-900 dark:text-white">Líneas de Factura</label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    + Añadir Línea
                  </button>
                </div>

                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Descripción del concepto"
                      required
                      value={it.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Cant."
                      required
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      className="w-16 px-2 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white text-center"
                    />
                    <input
                      type="number"
                      placeholder="Precio €"
                      required
                      value={it.unitPrice}
                      onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                      className="w-24 px-2 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white text-right"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Notas u Observaciones</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Plazos de pago, datos bancarios..."
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 rounded-lg"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Generar Factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
