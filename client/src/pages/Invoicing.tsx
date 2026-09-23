import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Download,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Trash2,
  ArrowRightLeft,
  Search,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

export const Invoicing: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'invoices' | 'quotes'>('invoices');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [convertingQuoteId, setConvertingQuoteId] = useState<string | null>(null);

  // Search, Filter & Sort State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('DATE_DESC');

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'invoice' | 'quote'>('invoice');
  const [companyId, setCompanyId] = useState('');
  const [contactId, setContactId] = useState('');
  const [taxRate, setTaxRate] = useState('21');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ description: string; quantity: number; unitPrice: number }>>([
    { description: 'Licencia / Servicio CRM', quantity: 1, unitPrice: 1500 },
  ]);
  const [isCreating, setIsCreating] = useState(false);

  // Delete State
  const [deletingItem, setDeletingItem] = useState<{ id: string; number: string; type: 'invoice' | 'quote' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    const res = await apiRequest(`/invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'PAID' }),
    });
    if (res.success) {
      toast.success('Factura actualizada', 'La factura ha sido marcada como cobrada.');
      loadData();
    } else {
      toast.error('Error al actualizar', res.message || 'No se pudo actualizar el estado de la factura.');
    }
  };

  const handleConvertQuote = async (id: string, number: string) => {
    setConvertingQuoteId(id);
    const res = await apiRequest(`/invoices/quotes/${id}/convert`, {
      method: 'POST',
    });
    setConvertingQuoteId(null);
    if (res.success) {
      toast.success(
        'Presupuesto convertido',
        `Presupuesto ${number} convertido con éxito en la factura ${res.data?.invoiceNumber || ''}!`
      );
      await loadData();
      setActiveTab('invoices');
    } else {
      toast.error('Error de conversión', res.message || 'Error al convertir el presupuesto.');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    const endpoint = deletingItem.type === 'invoice'
      ? `/invoices/${deletingItem.id}`
      : `/invoices/quotes/${deletingItem.id}`;

    const res = await apiRequest(endpoint, {
      method: 'DELETE',
    });
    setIsDeleting(false);

    if (res.success) {
      toast.success(
        `${deletingItem.type === 'invoice' ? 'Factura' : 'Presupuesto'} eliminado`,
        `El documento ${deletingItem.number} ha sido eliminado con éxito.`
      );
      setDeletingItem(null);
      loadData();
    } else {
      toast.error('Error al eliminar', res.message || 'No se pudo eliminar el documento.');
    }
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

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.warning('Líneas requeridas', 'Debes incluir al menos un concepto en el documento.');
      return;
    }

    setIsCreating(true);
    const endpoint = modalType === 'invoice' ? '/invoices' : '/invoices/quotes';
    const res = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        companyId: companyId || null,
        contactId: contactId || null,
        taxRate: parseFloat(taxRate) || 21,
        notes,
        items,
      }),
    });
    setIsCreating(false);

    if (res.success) {
      toast.success(
        `${modalType === 'invoice' ? 'Factura' : 'Presupuesto'} creado`,
        'Documento registrado y generado correctamente.'
      );
      setIsModalOpen(false);
      setNotes('');
      setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
      loadData();
    } else {
      toast.error('Error al crear documento', res.message || 'No se pudo registrar el documento.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle className="w-2.5 h-2.5 mr-1" /> {status === 'PAID' ? 'Cobrada' : 'Aceptado'}
          </span>
        );
      case 'SENT':
      case 'ISSUED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
            <Clock className="w-2.5 h-2.5 mr-1" /> {status === 'SENT' ? 'Enviado' : 'Emitida'}
          </span>
        );
      case 'OVERDUE':
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400">
            <AlertCircle className="w-2.5 h-2.5 mr-1" /> {status === 'OVERDUE' ? 'Vencida' : 'Rechazado'}
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

  // Filtered & Sorted Invoices
  const filteredAndSortedInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const num = (inv.invoiceNumber || '').toLowerCase();
          const client = (inv.company?.name || `${inv.contact?.firstName || ''} ${inv.contact?.lastName || ''}`).toLowerCase();
          if (!num.includes(q) && !client.includes(q)) return false;
        }
        if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'DATE_DESC') return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
        if (sortBy === 'DATE_ASC') return new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
        if (sortBy === 'TOTAL_DESC') return (b.total || 0) - (a.total || 0);
        if (sortBy === 'TOTAL_ASC') return (a.total || 0) - (b.total || 0);
        if (sortBy === 'NUMBER_ASC') return (a.invoiceNumber || '').localeCompare(b.invoiceNumber || '');
        return 0;
      });
  }, [invoices, search, statusFilter, sortBy]);

  // Filtered & Sorted Quotes
  const filteredAndSortedQuotes = useMemo(() => {
    return quotes
      .filter((q) => {
        if (search.trim()) {
          const query = search.toLowerCase().trim();
          const num = (q.quoteNumber || '').toLowerCase();
          const client = (q.company?.name || `${q.contact?.firstName || ''} ${q.contact?.lastName || ''}`).toLowerCase();
          if (!num.includes(query) && !client.includes(query)) return false;
        }
        if (statusFilter !== 'ALL' && q.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'DATE_DESC') return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
        if (sortBy === 'DATE_ASC') return new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
        if (sortBy === 'TOTAL_DESC') return (b.total || 0) - (a.total || 0);
        if (sortBy === 'TOTAL_ASC') return (a.total || 0) - (b.total || 0);
        if (sortBy === 'NUMBER_ASC') return (a.quoteNumber || '').localeCompare(b.quoteNumber || '');
        return 0;
      });
  }, [quotes, search, statusFilter, sortBy]);

  return (
    <div className="space-y-4">
      {/* Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('invoicing')}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Generación de presupuestos y facturas mercantiles con exportación PDF nativa y gestión CRUD
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab('invoices');
                setStatusFilter('ALL');
              }}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'invoices'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              Facturas ({invoices.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('quotes');
                setStatusFilter('ALL');
              }}
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
            onClick={() => {
              setModalType(activeTab === 'invoices' ? 'invoice' : 'quote');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{activeTab === 'invoices' ? t('newInvoice') : 'Nuevo Presupuesto'}</span>
          </button>
        </div>
      </div>

      {/* Toolbar Filters & Sorting */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número o cliente..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">Todos los estados</option>
              {activeTab === 'invoices' ? (
                <>
                  <option value="DRAFT">Borrador</option>
                  <option value="ISSUED">Emitida</option>
                  <option value="PAID">Cobrada</option>
                  <option value="OVERDUE">Vencida</option>
                </>
              ) : (
                <>
                  <option value="DRAFT">Borrador</option>
                  <option value="SENT">Enviado</option>
                  <option value="ACCEPTED">Aceptado</option>
                  <option value="REJECTED">Rechazado</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center space-x-2 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500 hidden sm:inline">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 font-medium"
          >
            <option value="DATE_DESC">Fecha (Más recientes)</option>
            <option value="DATE_ASC">Fecha (Más antiguos)</option>
            <option value="TOTAL_DESC">Importe (Mayor a Menor)</option>
            <option value="TOTAL_ASC">Importe (Menor a Mayor)</option>
            <option value="NUMBER_ASC">Número de Documento</option>
          </select>
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
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      Cargando facturas...
                    </td>
                  </tr>
                ) : filteredAndSortedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      No se encontraron facturas con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {inv.company?.name || `${inv.contact?.firstName || ''} ${inv.contact?.lastName || ''}`}
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
                        {inv.total.toLocaleString('es-ES', { style: 'currency', currency: inv.currency || 'EUR' })}
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
                        <button
                          onClick={() => setDeletingItem({ id: inv.id, number: inv.invoiceNumber, type: 'invoice' })}
                          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors inline-flex items-center"
                          title="Eliminar Factura"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
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
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">Cliente / Empresa</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      Cargando presupuestos...
                    </td>
                  </tr>
                ) : filteredAndSortedQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      No se encontraron presupuestos con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedQuotes.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">
                        {q.quoteNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {q.company?.name || `${q.contact?.firstName || ''} ${q.contact?.lastName || ''}`}
                        </div>
                      </td>
                      <td className="px-4 py-3">{new Date(q.issueDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {getStatusBadge(q.status)}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                        {q.total.toLocaleString('es-ES', { style: 'currency', currency: q.currency || 'EUR' })}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        <button
                          onClick={() => handleConvertQuote(q.id, q.quoteNumber)}
                          disabled={convertingQuoteId === q.id || q.status === 'ACCEPTED'}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                            q.status === 'ACCEPTED'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 cursor-default'
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                          }`}
                          title={q.status === 'ACCEPTED' ? 'Ya facturado' : 'Convertir este presupuesto en factura'}
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>
                            {convertingQuoteId === q.id
                              ? 'Convirtiendo...'
                              : q.status === 'ACCEPTED'
                              ? 'Facturado'
                              : 'Convertir'}
                          </span>
                        </button>
                        <button
                          onClick={() => handleDownloadQuotePdf(q.id, q.quoteNumber)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded text-xs font-semibold"
                        >
                          <Download className="w-3 h-3" />
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={() => setDeletingItem({ id: q.id, number: q.quoteNumber, type: 'quote' })}
                          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors inline-flex items-center"
                          title="Eliminar Presupuesto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                {modalType === 'invoice' ? 'Nueva Factura' : 'Nuevo Presupuesto'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Empresa</label>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
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
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
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
                  <label className="text-xs font-bold text-gray-900 dark:text-white">Líneas de Detalle</label>
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
                      min="1"
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                      className="w-16 px-2 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white text-center"
                    />
                    <input
                      type="number"
                      placeholder="Precio €"
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
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs"
                >
                  {isCreating ? 'Guardando...' : `Generar ${modalType === 'invoice' ? 'Factura' : 'Presupuesto'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">
              Eliminar {deletingItem.type === 'invoice' ? 'Factura' : 'Presupuesto'}
            </h2>
            <p className="text-xs text-gray-600 dark:text-slate-400 mb-5">
              ¿Estás seguro de que deseas eliminar el documento{' '}
              <strong className="text-gray-900 dark:text-white">{deletingItem.number}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-xs"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
