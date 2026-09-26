import React, { useState, useEffect } from 'react';
import { Plus, Download, FileText, CheckCircle, Clock, AlertCircle, X, Trash2, ArrowRight } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/common/Modal';
import { PermissionGate } from '../components/common/PermissionGate';
import { AgingReportModal } from '../components/invoicing/AgingReportModal';
import { QuoteSignModal } from '../components/invoicing/QuoteSignModal';

export const Invoicing: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'invoices' | 'quotes'>('invoices');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);

  // SME Suite Modals
  const [isAgingModalOpen, setIsAgingModalOpen] = useState(false);
  const [signingQuote, setSigningQuote] = useState<any>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'invoice' | 'quote'>('invoice');
  const [companyId, setCompanyId] = useState('');
  const [contactId, setContactId] = useState('');
  const [taxRate, setTaxRate] = useState('21');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ description: string; quantity: number; unitPrice: number }>>([
    { description: '', quantity: 1, unitPrice: 0 },
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
    toast.success(t('success'), 'Factura marcada como pagada');
    loadData();
  };

  const handleConvertQuote = async (quoteId: string) => {
    setIsConverting(true);
    try {
      const res = await apiRequest(`/invoices/quotes/${quoteId}/convert`, { method: 'POST' });
      if (res.success) {
        toast.success(t('success'), t('convertedToInvoiceSuccess'));
        await loadData();
        setActiveTab('invoices');
      } else {
        toast.error(t('error'), res.message || 'Error al convertir presupuesto');
      }
    } catch {
      toast.error(t('error'), 'Error de conexión');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDeleteDocument = async (id: string, type: 'invoice' | 'quote', number: string) => {
    const confirmMsg = type === 'invoice' ? t('confirmDeleteInvoice') : t('confirmDeleteQuote');
    if (!window.confirm(`${confirmMsg} (${number})`)) return;

    const endpoint = type === 'invoice' ? `/invoices/${id}` : `/invoices/quotes/${id}`;
    const res = await apiRequest(endpoint, { method: 'DELETE' });
    if (res.success) {
      toast.success(t('success'), res.message || 'Documento eliminado');
      loadData();
    } else {
      toast.error(t('error'), res.message || 'Error al eliminar');
    }
  };

  const addItemRow = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, idx) => idx !== index));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = modalType === 'invoice' ? '/invoices' : '/invoices/quotes';
    const numPrefix = modalType === 'invoice' ? 'FAC' : 'PRE';
    const number = `${numPrefix}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const body: any = {
      contactId: contactId || null,
      companyId: companyId || null,
      taxRate: parseFloat(taxRate),
      currency: 'EUR',
      notes,
      items: items.map((it) => ({
        description: it.description,
        quantity: Number(it.quantity),
        unitPrice: parseFloat(it.unitPrice as any),
      })),
    };

    if (modalType === 'invoice') {
      body.invoiceNumber = number;
    } else {
      body.quoteNumber = number;
    }

    const res = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (res.success) {
      toast.success(t('success'), modalType === 'invoice' ? 'Factura generada' : 'Presupuesto creado');
      setIsModalOpen(false);
      setNotes('');
      setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
      loadData();
    } else {
      toast.error(t('error'), res.message || 'Error al crear documento');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('invoicing')}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {t('invoicingSubtitle')}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg border border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'invoices'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              Facturas ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('quotes')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'quotes'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              {t('quotes')} ({quotes.length})
            </button>
          </div>

          <button
            onClick={() => setIsAgingModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            title="Informe de Antigüedad de Deuda y Control de Morosidad"
          >
            <span>📊 {t('dunning.agingButton')}</span>
          </button>

          <PermissionGate resource="invoices" action="create">
            <button
              onClick={() => {
                setModalType('invoice');
                setIsModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('newInvoice')}</span>
            </button>
          </PermissionGate>
          <PermissionGate resource="invoices" action="create">
            <button
              onClick={() => {
                setModalType('quote');
                setIsModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('newQuote')}</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Tab: Invoices List */}
      {activeTab === 'invoices' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
              <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">{t('invoiceNumber')}</th>
                  <th className="px-4 py-3">{t('client')}</th>
                  <th className="px-4 py-3">{t('issueDate')}</th>
                  <th className="px-4 py-3">{t('dueDate')}</th>
                  <th className="px-4 py-3">{t('status')}</th>
                  <th className="px-4 py-3">{t('total')}</th>
                  <th className="px-4 py-3 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-xs text-gray-400">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span>{t('loading')}</span>
                      </div>
                    </td>
                  </tr>
                ) : invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {inv.company?.name || `${inv.contact?.firstName} ${inv.contact?.lastName}`}
                        </div>
                      </td>
                      <td className="px-4 py-3">{new Date(inv.issueDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {inv.status === 'PAID' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <CheckCircle className="w-3 h-3" />
                            <span>{t('statusPaid')}</span>
                          </span>
                        ) : inv.status === 'SENT' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400">
                            <Clock className="w-3 h-3" />
                            <span>{t('statusPending')}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-300">
                            <AlertCircle className="w-3 h-3" />
                            <span>{t('statusDraft')}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                        {inv.total.toLocaleString('es-ES', { style: 'currency', currency: inv.currency })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center space-x-1">
                          {inv.status !== 'PAID' && (
                            <button
                              onClick={() => handleMarkPaid(inv.id)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded text-xs font-semibold"
                            >
                              Marcar Cobrado
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                            className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-xs font-semibold"
                            title="Descargar PDF"
                          >
                            <Download className="w-3 h-3" />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(inv.id, 'invoice', inv.invoiceNumber)}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
                            title={t('deleteInvoice')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-xs text-gray-400">
                      Sin facturas emitidas todavía.
                    </td>
                  </tr>
                )}
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
                  <th className="px-4 py-3">{t('invoicing.invoiceNumberCol')}</th>
                  <th className="px-4 py-3">{t('client')}</th>
                  <th className="px-4 py-3">{t('issueDate')}</th>
                  <th className="px-4 py-3">{t('status')}</th>
                  <th className="px-4 py-3">{t('total')}</th>
                  <th className="px-4 py-3 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
                {quotes.length > 0 ? (
                  quotes.map((q) => (
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
                        <div className="inline-flex items-center space-x-1.5">
                          {q.status === 'ACCEPTED' || q.signatureData ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded text-[11px] font-bold">
                              ✍️ {t('quotes.signed')}
                            </span>
                          ) : (
                            <button
                              onClick={() => setSigningQuote(q)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 rounded text-xs font-semibold"
                              title="Firmar presupuesto en pantalla"
                            >
                              <span>✍️ {t('quotes.sign')}</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const signUrl = `${window.location.origin}/quote/sign/${q.publicToken || q.id}`;
                              navigator.clipboard.writeText(signUrl);
                              toast.success(t('quotes.linkCopied'), signUrl);
                            }}
                            className="inline-flex items-center space-x-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-semibold"
                            title="Copiar enlace público de firma para el cliente"
                          >
                            <span>🔗</span>
                          </button>
                          {q.status !== 'ACCEPTED' && (
                            <button
                              onClick={() => handleConvertQuote(q.id)}
                              disabled={isConverting}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded text-xs font-semibold"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>{t('convertToInvoice')}</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadQuotePdf(q.id, q.quoteNumber)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-xs font-semibold"
                          >
                            <Download className="w-3 h-3" />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(q.id, 'quote', q.quoteNumber)}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
                            title={t('deleteQuote')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-gray-400">
                      Sin presupuestos creados todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalType === 'invoice' ? t('newInvoice') : t('newQuote')}
        size="lg"
      >
        <form onSubmit={handleCreateDocument} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('companies')}</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="">{t('invoicing.selectCompanyPrompt')}</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('contacts')}</label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="">{t('invoicing.selectContactPrompt')}</option>
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
              <label className="text-xs font-bold text-gray-900 dark:text-white">{t('lineItems')}</label>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                + {t('addLine')}
              </button>
            </div>

            {items.map((it, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder={t('conceptDescription')}
                  required
                  value={it.description}
                  onChange={(e) => updateItem(idx, 'description', e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                />
                <input
                  type="number"
                  placeholder={t('quantity')}
                  required
                  min="1"
                  value={it.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                  className="w-20 px-2 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white text-center"
                />
                <input
                  type="number"
                  placeholder={t('invoicing.pricePlaceholder')}
                  required
                  step="0.01"
                  value={it.unitPrice}
                  onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
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
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('notes')}</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('invoicing.paymentTermsPlaceholder')}
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
              {modalType === 'invoice' ? t('newInvoice') : t('newQuote')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Aging Debt Report Modal */}
      <AgingReportModal
        isOpen={isAgingModalOpen}
        onClose={() => setIsAgingModalOpen(false)}
        onPaymentRecorded={() => {
          loadData();
        }}
      />

      {/* Quote Digital Signing Modal */}
      {signingQuote && (
        <QuoteSignModal
          isOpen={Boolean(signingQuote)}
          onClose={() => setSigningQuote(null)}
          quoteId={signingQuote.id}
          quoteNumber={signingQuote.quoteNumber}
          total={signingQuote.total}
          publicToken={signingQuote.publicToken}
          onSignedSuccess={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
};
