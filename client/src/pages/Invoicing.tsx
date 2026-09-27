import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Bell,
  FileSpreadsheet,
  Upload,
  BarChart3,
  Copy,
  RotateCcw,
  Mail,
  FileText,
  Zap,
  PenTool,
  Link as LinkIcon,
  Pause,
  Play,
  Percent,
  Receipt,
  FileCheck2,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { PermissionGate } from '../components/common/PermissionGate';
import { AgingReportModal } from '../components/invoicing/AgingReportModal';
import { QuoteSignModal } from '../components/invoicing/QuoteSignModal';
import { exportToCSV } from '../utils/exportUtils';
import { ExcelCsvImportModal } from '../components/common/ExcelCsvImportModal';

interface ItemRow {
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export const Invoicing: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'invoices' | 'quotes' | 'recurring' | 'contracts'>('invoices');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [recurringInvoices, setRecurringInvoices] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'ALL' | 'PAID' | 'SENT' | 'DRAFT'>('ALL');

  // SME Suite Modals
  const [isAgingModalOpen, setIsAgingModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [signingQuote, setSigningQuote] = useState<any>(null);

  // Custom Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    onConfirm: () => {},
  });

  // Rectification Modal state
  const [rectifyModal, setRectifyModal] = useState<{
    isOpen: boolean;
    invoice: any | null;
    reason: string;
  }>({
    isOpen: false,
    invoice: null,
    reason: 'Devolución de mercancía o corrección de datos de facturación',
  });

  // Modal State for creation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'invoice' | 'quote' | 'recurring' | 'contract'>('invoice');
  const [companyId, setCompanyId] = useState('');
  const [contactId, setContactId] = useState('');
  const [taxRate, setTaxRate] = useState('21');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [irpfRate, setIrpfRate] = useState('0');
  const [paymentTerms, setPaymentTerms] = useState('DAYS_30');
  const [isProforma, setIsProforma] = useState(false);
  const [frequency, setFrequency] = useState('MONTHLY');
  const [contractType, setContractType] = useState('SERVICE');
  const [contractValue, setContractValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemRow[]>([
    { description: '', quantity: 1, unitPrice: 0, discount: 0 },
  ]);

  const loadData = async () => {
    setIsLoading(true);
    const [resInvoices, resQuotes, resRecurring, resContracts, resCompanies, resContacts] = await Promise.all([
      apiRequest('/invoices'),
      apiRequest('/invoices/quotes/all'),
      apiRequest('/invoices/recurring/all'),
      apiRequest('/contracts'),
      apiRequest('/companies?limit=100'),
      apiRequest('/contacts?limit=100'),
    ]);

    if (resInvoices.success) setInvoices(resInvoices.data || []);
    if (resQuotes.success) setQuotes(resQuotes.data || []);
    if (resRecurring.success) setRecurringInvoices(resRecurring.data || []);
    if (resContracts.success) setContracts(resContracts.data || []);
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

  const handleSendReminder = async (invoice: any) => {
    const clientName = invoice.company?.name || `${invoice.contact?.firstName || ''} ${invoice.contact?.lastName || ''}`.trim() || 'Cliente';
    toast.success(t('invoicing.reminderSent'), `${invoice.invoiceNumber} - ${clientName}`);
  };

  const handleSendEmail = async (id: string, invoiceNumber: string) => {
    try {
      const res = await apiRequest(`/invoices/${id}/send-email`, { method: 'POST' });
      if (res.success) {
        toast.success(t('success'), res.message || `Factura ${invoiceNumber} enviada por email al cliente`);
      } else {
        toast.error(t('error'), res.message || 'Error al enviar email');
      }
    } catch {
      toast.error(t('error'), 'Fallo de conexión');
    }
  };

  const handleDuplicateInvoice = async (id: string) => {
    try {
      const res = await apiRequest(`/invoices/${id}/duplicate`, { method: 'POST' });
      if (res.success) {
        toast.success(t('success'), `Factura duplicada: ${res.data?.invoiceNumber || ''}`);
        loadData();
      } else {
        toast.error(t('error'), res.message || 'Error al duplicar factura');
      }
    } catch {
      toast.error(t('error'), 'Fallo de conexión al duplicar');
    }
  };

  const handleConfirmRectify = async () => {
    if (!rectifyModal.invoice) return;
    try {
      const res = await apiRequest(`/invoices/${rectifyModal.invoice.id}/rectify`, {
        method: 'POST',
        body: JSON.stringify({ reason: rectifyModal.reason }),
      });
      if (res.success) {
        toast.success(t('success'), `Factura Rectificativa generada: ${res.data?.invoiceNumber || ''}`);
        setRectifyModal({ isOpen: false, invoice: null, reason: '' });
        loadData();
      } else {
        toast.error(t('error'), res.message || 'Error al generar abono/rectificativa');
      }
    } catch {
      toast.error(t('error'), 'Fallo al procesar rectificativa');
    }
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

  const handleDeleteDocument = (id: string, type: 'invoice' | 'quote', number: string) => {
    const isInv = type === 'invoice';
    setConfirmModal({
      isOpen: true,
      title: isInv ? t('deleteInvoice') : t('deleteQuote'),
      message: `¿Estás seguro de que deseas eliminar permanentemente ${isInv ? 'la factura' : 'el presupuesto'} "${number}"? Esta acción no se puede deshacer.`,
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        const endpoint = isInv ? `/invoices/${id}` : `/invoices/quotes/${id}`;
        const res = await apiRequest(endpoint, { method: 'DELETE' });
        if (res.success) {
          toast.success(t('success'), res.message || 'Documento eliminado');
          loadData();
        } else {
          toast.error(t('error'), res.message || 'Error al eliminar');
        }
      },
    });
  };

  const addItemRow = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, discount: 0 }]);
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

  // Live modal math calculations
  const calculatedSubtotal = useMemo(() => {
    return items.reduce((acc, it) => {
      const gross = (Number(it.quantity) || 0) * (parseFloat(it.unitPrice as any) || 0);
      const lineDisc = (Number(it.discount) || 0) / 100;
      return acc + (gross - gross * lineDisc);
    }, 0);
  }, [items]);

  const calculatedGlobalDiscount = useMemo(() => {
    const rate = parseFloat(discountPercent) || 0;
    return (calculatedSubtotal * rate) / 100;
  }, [calculatedSubtotal, discountPercent]);

  const calculatedBase = useMemo(() => {
    return Math.max(0, calculatedSubtotal - calculatedGlobalDiscount);
  }, [calculatedSubtotal, calculatedGlobalDiscount]);

  const calculatedTaxAmount = useMemo(() => {
    const rate = parseFloat(taxRate) || 0;
    return calculatedBase * (rate / 100);
  }, [calculatedBase, taxRate]);

  const calculatedIrpfAmount = useMemo(() => {
    const rate = parseFloat(irpfRate) || 0;
    return calculatedBase * (rate / 100);
  }, [calculatedBase, irpfRate]);

  const calculatedTotal = useMemo(() => {
    return calculatedBase + calculatedTaxAmount - calculatedIrpfAmount;
  }, [calculatedBase, calculatedTaxAmount, calculatedIrpfAmount]);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    let endpoint = '/invoices';
    const numPrefix = modalType === 'invoice' ? (isProforma ? 'PRO' : 'FAC') : 'PRE';
    const number = `${numPrefix}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    if (modalType === 'quote') {
      endpoint = '/invoices/quotes';
    } else if (modalType === 'recurring') {
      endpoint = '/invoices/recurring';
    } else if (modalType === 'contract') {
      endpoint = '/contracts';
    }

    let body: any = {};

    if (modalType === 'contract') {
      body = {
        title: title || 'Contrato de Servicios',
        type: contractType,
        value: parseFloat(contractValue) || 0,
        startDate: startDate || new Date().toISOString(),
        endDate: endDate || null,
        companyId: companyId || null,
        contactId: contactId || null,
        terms: notes,
      };
    } else if (modalType === 'recurring') {
      body = {
        title: title || 'Suscripción Recurrente',
        frequency,
        startDate: startDate || new Date().toISOString(),
        nextIssueDate: startDate || new Date().toISOString(),
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
    } else {
      body = {
        contactId: contactId || null,
        companyId: companyId || null,
        taxRate: parseFloat(taxRate),
        discountPercent: parseFloat(discountPercent) || 0,
        irpfRate: parseFloat(irpfRate) || 0,
        paymentTerms,
        proforma: isProforma,
        currency: 'EUR',
        notes,
        items: items.map((it) => ({
          description: it.description,
          quantity: Number(it.quantity),
          unitPrice: parseFloat(it.unitPrice as any),
          discount: parseFloat((it.discount as any) || 0),
        })),
      };

      if (modalType === 'invoice') {
        body.invoiceNumber = number;
      } else {
        body.quoteNumber = number;
      }
    }

    const res = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (res.success) {
      toast.success(
        t('success'),
        modalType === 'invoice'
          ? (isProforma ? 'Factura Proforma generada' : 'Factura generada')
          : modalType === 'quote'
          ? 'Presupuesto creado'
          : modalType === 'recurring'
          ? 'Suscripción recurrente configurada'
          : 'Contrato registrado'
      );
      setIsModalOpen(false);
      setNotes('');
      setTitle('');
      setContractValue('');
      setDiscountPercent('0');
      setIrpfRate('0');
      setIsProforma(false);
      setItems([{ description: '', quantity: 1, unitPrice: 0, discount: 0 }]);
      loadData();
    } else {
      toast.error(t('error'), res.message || 'Error al crear documento');
    }
  };

  const handleTriggerRecurring = async (id: string) => {
    try {
      const res = await apiRequest(`/invoices/recurring/${id}/generate`, { method: 'POST' });
      if (res.success) {
        toast.success(t('success'), res.message || 'Factura emitida automáticamente');
        await loadData();
        setActiveTab('invoices');
      } else {
        toast.error(t('error'), res.message || 'Error al emitir factura');
      }
    } catch {
      toast.error(t('error'), 'Fallo al procesar emisión');
    }
  };

  const handleToggleRecurringStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const res = await apiRequest(`/invoices/recurring/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.success) {
      toast.success(t('success'), `Suscripción ${nextStatus === 'ACTIVE' ? 'activada' : 'pausada'}`);
      loadData();
    }
  };

  const handleDeleteRecurring = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Suscripción',
      message: `¿Estás seguro de que deseas eliminar la suscripción recurrente "${name}"? No se generarán más facturas programadas.`,
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        const res = await apiRequest(`/invoices/recurring/${id}`, { method: 'DELETE' });
        if (res.success) {
          toast.success(t('success'), 'Suscripción eliminada');
          loadData();
        }
      },
    });
  };

  const handleDeleteContract = (id: string, number: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Contrato',
      message: `¿Estás seguro de que deseas eliminar el contrato "${number}"?`,
      variant: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        const res = await apiRequest(`/contracts/${id}`, { method: 'DELETE' });
        if (res.success) {
          toast.success(t('success'), 'Contrato eliminado');
          loadData();
        }
      },
    });
  };

  const filteredInvoices = useMemo(() => {
    if (invoiceStatusFilter === 'ALL') return invoices;
    return invoices.filter((inv) => inv.status === invoiceStatusFilter);
  }, [invoices, invoiceStatusFilter]);

  const handleExportInvoicesCsv = () => {
    const headers = [
      'Número Factura',
      'Cliente / Empresa',
      'Tipo / Proforma',
      'Fecha Emisión',
      'Fecha Vencimiento',
      'Estado',
      'Base Imponible (€)',
      'Descuento (€)',
      'IVA (€)',
      'IRPF Retención (€)',
      'Total (€)',
      'Moneda',
    ];
    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNumber,
      inv.company?.name || `${inv.contact?.firstName || ''} ${inv.contact?.lastName || ''}`.trim() || 'N/A',
      inv.isRectifying ? 'Rectificativa' : inv.proforma ? 'Proforma' : 'Ordinaria',
      new Date(inv.issueDate).toLocaleDateString(),
      inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A',
      inv.status,
      inv.subtotal || inv.total,
      inv.discountAmount || 0,
      inv.taxAmount || 0,
      inv.irpfAmount || 0,
      inv.total,
      inv.currency || 'EUR',
    ]);

    exportToCSV(`facturas_export_${new Date().toISOString().split('T')[0]}`, headers, rows);
    toast.success(t('success'), `${filteredInvoices.length} facturas exportadas a CSV`);
  };

  const handleExportQuotesCsv = () => {
    const headers = ['Número Presupuesto', 'Cliente / Empresa', 'Fecha Emisión', 'Estado', 'Total (€)', 'Moneda'];
    const rows = quotes.map((q) => [
      q.quoteNumber,
      q.company?.name || `${q.contact?.firstName || ''} ${q.contact?.lastName || ''}`.trim() || 'N/A',
      new Date(q.issueDate).toLocaleDateString(),
      q.status,
      q.total,
      q.currency || 'EUR',
    ]);

    exportToCSV(`presupuestos_export_${new Date().toISOString().split('T')[0]}`, headers, rows);
    toast.success(t('success'), `${quotes.length} presupuestos exportados a CSV`);
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

        <div className="flex flex-wrap items-center gap-2">
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
            <button
              onClick={() => setActiveTab('recurring')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'recurring'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              Suscripciones ({recurringInvoices.length})
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'contracts'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              Contratos ({contracts.length})
            </button>
          </div>

          <button
            onClick={() => setIsAgingModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            title="Informe de Antigüedad de Deuda y Control de Morosidad"
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('dunning.agingButton')}</span>
          </button>

          <button
            onClick={activeTab === 'invoices' ? handleExportInvoicesCsv : handleExportQuotesCsv}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            title="Exportar listado a archivo CSV compatible con Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">{t('exportCsv')}</span>
          </button>

          <PermissionGate resource="invoices" action="create">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
              title="Importar Facturas por Excel o CSV"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Importar Facturas</span>
            </button>
          </PermissionGate>

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
          <PermissionGate resource="invoices" action="create">
            <button
              onClick={() => {
                setModalType('recurring');
                setIsModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Suscripción</span>
            </button>
          </PermissionGate>
          <PermissionGate resource="deals" action="create">
            <button
              onClick={() => {
                setModalType('contract');
                setIsModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Contrato</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Tab: Invoices List */}
      {activeTab === 'invoices' && (
        <div className="space-y-3">
          {/* Status filter bar */}
          <div className="flex items-center space-x-2">
            {[
              { id: 'ALL', label: t('invoicing.filterAll') },
              { id: 'PAID', label: t('invoicing.filterPaid') },
              { id: 'SENT', label: t('invoicing.filterPending') },
              { id: 'DRAFT', label: t('invoicing.filterDraft') },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setInvoiceStatusFilter(f.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  invoiceStatusFilter === f.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
                <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">{t('invoiceNumber')}</th>
                    <th className="px-4 py-3">{t('client')}</th>
                    <th className="px-4 py-3">Tipo / Términos</th>
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
                      <td colSpan={8} className="p-8 text-center text-xs text-gray-400">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <span>{t('loading')}</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredInvoices.length > 0 ? (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">
                          <div className="flex items-center space-x-1.5">
                            <span>{inv.invoiceNumber}</span>
                            {inv.isRectifying && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                Abono / Rectificativa
                              </span>
                            )}
                            {inv.proforma && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                                Proforma
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {inv.company?.name || `${inv.contact?.firstName || ''} ${inv.contact?.lastName || ''}`.trim() || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-slate-400">
                          <span className="inline-block text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {inv.paymentTerms === 'IMMEDIATE'
                              ? 'Al contado'
                              : inv.paymentTerms === 'DAYS_15'
                              ? '15 días'
                              : inv.paymentTerms === 'DAYS_30'
                              ? '30 días'
                              : inv.paymentTerms === 'DAYS_60'
                              ? '60 días'
                              : inv.paymentTerms === 'END_OF_MONTH'
                              ? 'Fin de mes'
                              : inv.paymentTerms || '30 días'}
                          </span>
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
                          <div>
                            {inv.total.toLocaleString('es-ES', { style: 'currency', currency: inv.currency || 'EUR' })}
                          </div>
                          {(inv.irpfAmount > 0 || inv.discountAmount > 0) && (
                            <div className="text-[10px] font-normal text-slate-400">
                              {inv.discountAmount > 0 && <span>Dto: -{inv.discountAmount}€ </span>}
                              {inv.irpfAmount > 0 && <span>IRPF: -{inv.irpfAmount}€</span>}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center space-x-1">
                            {inv.status !== 'PAID' && (
                              <>
                                <button
                                  onClick={() => handleMarkPaid(inv.id)}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded text-xs font-semibold"
                                >
                                  Marcar Cobrado
                                </button>
                                <button
                                  onClick={() => handleSendReminder(inv)}
                                  className="inline-flex items-center space-x-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 rounded text-xs font-semibold"
                                  title={t('invoicing.sendReminder')}
                                >
                                  <Bell className="w-3 h-3" />
                                  <span className="hidden md:inline">{t('invoicing.sendReminder')}</span>
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleSendEmail(inv.id, inv.invoiceNumber)}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded"
                              title="Enviar por email al cliente"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicateInvoice(inv.id)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded"
                              title="Duplicar factura"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {!inv.isRectifying && (
                              <button
                                onClick={() => setRectifyModal({ isOpen: true, invoice: inv, reason: 'Devolución de mercancía o rectificación' })}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded"
                                title="Crear Factura Rectificativa / Abono"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
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
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
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
                      <td colSpan={8} className="p-8 text-center text-xs text-gray-400">
                        Sin facturas en este estado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                          {q.company?.name || `${q.contact?.firstName || ''} ${q.contact?.lastName || ''}`.trim() || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">{new Date(q.issueDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                          {q.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                        {q.total.toLocaleString('es-ES', { style: 'currency', currency: q.currency || 'EUR' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          {q.status === 'ACCEPTED' || q.signatureData ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded text-[11px] font-bold">
                              <FileCheck2 className="w-3.5 h-3.5" />
                              <span>{t('quotes.signed')}</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => setSigningQuote(q)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 rounded text-xs font-semibold"
                              title="Firmar presupuesto en pantalla"
                            >
                              <PenTool className="w-3 h-3" />
                              <span>{t('quotes.sign')}</span>
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
                            <LinkIcon className="w-3 h-3" />
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

      {/* Tab: Recurring Invoices (Subscriptions) */}
      {activeTab === 'recurring' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
              <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Concepto / Título</th>
                  <th className="px-4 py-3">{t('client')}</th>
                  <th className="px-4 py-3">Frecuencia</th>
                  <th className="px-4 py-3">Próxima Emisión</th>
                  <th className="px-4 py-3">{t('status')}</th>
                  <th className="px-4 py-3">{t('total')}</th>
                  <th className="px-4 py-3 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
                {recurringInvoices.length > 0 ? (
                  recurringInvoices.map((rec) => (
                    <tr key={rec.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                        {rec.title}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {rec.company?.name || `${rec.contact?.firstName || ''} ${rec.contact?.lastName || ''}`.trim() || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-mono">
                          {rec.frequency}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-slate-300">
                        {new Date(rec.nextIssueDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleRecurringStatus(rec.id, rec.status)}
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition ${
                            rec.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}
                          title="Clic para pausar o activar suscripción"
                        >
                          {rec.status === 'ACTIVE' ? (
                            <>
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>Activa</span>
                            </>
                          ) : (
                            <>
                              <Pause className="w-2.5 h-2.5 fill-current" />
                              <span>Pausada</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                        {rec.total.toLocaleString('es-ES', { style: 'currency', currency: rec.currency || 'EUR' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => handleTriggerRecurring(rec.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 rounded text-xs font-semibold shadow-xs"
                            title="Emitir factura ahora sin esperar al ciclo programado"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Emitir Ya</span>
                          </button>
                          <button
                            onClick={() => handleDeleteRecurring(rec.id, rec.title)}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
                            title="Eliminar suscripción"
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
                      Sin suscripciones recurrentes activas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Contracts */}
      {activeTab === 'contracts' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
              <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Nº Contrato</th>
                  <th className="px-4 py-3">Título / Objeto</th>
                  <th className="px-4 py-3">{t('client')}</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Vigencia</th>
                  <th className="px-4 py-3">{t('total')}</th>
                  <th className="px-4 py-3">{t('status')}</th>
                  <th className="px-4 py-3 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
                {contracts.length > 0 ? (
                  contracts.map((ctr) => (
                    <tr key={ctr.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">
                        {ctr.contractNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                        {ctr.title}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {ctr.company?.name || `${ctr.contact?.firstName || ''} ${ctr.contact?.lastName || ''}`.trim() || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-mono">
                          {ctr.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-slate-300">
                        {new Date(ctr.startDate).toLocaleDateString()}
                        {ctr.endDate ? ` → ${new Date(ctr.endDate).toLocaleDateString()}` : ' (Indefinido)'}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                        {(ctr.value || 0).toLocaleString('es-ES', { style: 'currency', currency: ctr.currency || 'EUR' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                          {ctr.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => handleDeleteContract(ctr.id, ctr.contractNumber)}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
                            title="Eliminar contrato"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-xs text-gray-400">
                      Sin contratos registrados todavía.
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
        title={
          modalType === 'invoice'
            ? t('newInvoice')
            : modalType === 'quote'
            ? t('newQuote')
            : modalType === 'recurring'
            ? 'Nueva Suscripción Recurrente'
            : 'Nuevo Contrato de Cliente'
        }
        size="lg"
      >
        <form onSubmit={handleCreateDocument} className="space-y-4">
          {/* Proforma toggle for Invoices */}
          {modalType === 'invoice' && (
            <div className="flex items-center justify-between p-2.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/40">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white">Factura Proforma</div>
                  <div className="text-[10px] text-gray-500 dark:text-slate-400">Genera un documento informativo previo sin validez contable fiscal</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isProforma}
                  onChange={(e) => setIsProforma(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}

          {/* Custom title for contracts or recurring */}
          {(modalType === 'recurring' || modalType === 'contract') && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {modalType === 'recurring' ? 'Nombre de la Suscripción *' : 'Título del Contrato *'}
              </label>
              <input
                type="text"
                required
                placeholder={modalType === 'recurring' ? 'p.ej. Mantenimiento Web Mensual' : 'p.ej. Contrato Marco de Consultoría IT'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

            {modalType === 'recurring' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Periodicidad</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="MONTHLY">Mensual</option>
                  <option value="QUARTERLY">Trimestral</option>
                  <option value="BIANNUAL">Semestral</option>
                  <option value="YEARLY">Anual</option>
                  <option value="WEEKLY">Semanal</option>
                </select>
              </div>
            ) : modalType === 'contract' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Tipo de Contrato</label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="SERVICE">Servicios</option>
                  <option value="SLA">SLA / Mantenimiento</option>
                  <option value="NDA">Confidencialidad (NDA)</option>
                  <option value="LICENSE">Licencia Software</option>
                  <option value="PARTNERSHIP">Alianza / Partner</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('invoicing.taxSelect')}</label>
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="21">{t('invoicing.taxGeneral')} (21%)</option>
                  <option value="10">{t('invoicing.taxReduced')} (10%)</option>
                  <option value="4">{t('invoicing.taxSuperReduced')} (4%)</option>
                  <option value="0">{t('invoicing.taxExempt')} (0%)</option>
                  <option value="7">{t('invoicing.taxCanary')} (7%)</option>
                </select>
              </div>
            )}
          </div>

          {/* Payment Terms, Global Discount & IRPF for Invoice/Quote */}
          {(modalType === 'invoice' || modalType === 'quote') && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Términos de Pago</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="IMMEDIATE">Pago al Contado</option>
                  <option value="DAYS_15">15 Días Fecha Factura</option>
                  <option value="DAYS_30">30 Días Fecha Factura</option>
                  <option value="DAYS_60">60 Días Fecha Factura</option>
                  <option value="END_OF_MONTH">Fin de Mes</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Descuento Global (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="w-full pl-3 pr-7 py-1.5 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                  />
                  <Percent className="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Retención IRPF (%)</label>
                <select
                  value={irpfRate}
                  onChange={(e) => setIrpfRate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="0">Sin Retención (0%)</option>
                  <option value="7">Nuevos Autónomos (7%)</option>
                  <option value="15">Profesionales Estándar (15%)</option>
                  <option value="19">Alquileres / Otros (19%)</option>
                </select>
              </div>
            </div>
          )}

          {modalType === 'contract' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Importe Contrato (€)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={contractValue}
                  onChange={(e) => setContractValue(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Fecha de Inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Fecha de Fin (Opcional)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Items Table in Modal (for invoice, quote, and recurring) */}
          {modalType !== 'contract' && (
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
                    className="w-16 px-2 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white text-center"
                  />
                  <input
                    type="number"
                    placeholder={t('invoicing.pricePlaceholder')}
                    required
                    step="0.01"
                    value={it.unitPrice}
                    onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white text-right"
                  />
                  <input
                    type="number"
                    placeholder="Dto %"
                    min="0"
                    max="100"
                    step="1"
                    value={it.discount || 0}
                    onChange={(e) => updateItem(idx, 'discount', parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white text-center"
                    title="Descuento individual por línea (%)"
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
          )}

          {/* Live Breakdown Box */}
          {modalType !== 'contract' && (
            <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700/80 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-slate-400">
                <span>{t('invoicing.subtotal')}:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {calculatedSubtotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
              {calculatedGlobalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Descuento global ({discountPercent}%):</span>
                  <span className="font-semibold">
                    -{calculatedGlobalDiscount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-gray-600 dark:text-slate-400">
                <span>{t('invoicing.taxAmount')} ({taxRate}%):</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  +{calculatedTaxAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
              {calculatedIrpfAmount > 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>Retención IRPF (-{irpfRate}%):</span>
                  <span className="font-semibold">
                    -{calculatedIrpfAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white pt-1.5 border-t border-gray-200 dark:border-slate-700">
                <span>{t('invoicing.totalAmount')}:</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {calculatedTotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              {modalType === 'contract' ? 'Términos y Cláusulas del Contrato' : t('notes')}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={modalType === 'contract' ? 'Cláusulas, condiciones de renovación, confidencialidad...' : t('invoicing.paymentTermsPlaceholder')}
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
              className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs"
            >
              {modalType === 'invoice'
                ? (isProforma ? 'Generar Proforma' : t('invoicing.createInvoiceAction'))
                : modalType === 'quote'
                ? t('invoicing.createQuoteAction')
                : modalType === 'recurring'
                ? 'Guardar Suscripción'
                : 'Crear Contrato'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Rectify Invoice Modal */}
      <Modal
        isOpen={rectifyModal.isOpen}
        onClose={() => setRectifyModal({ isOpen: false, invoice: null, reason: '' })}
        title="Emitir Factura Rectificativa / Abono"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-200">
            Se generará una factura rectificativa vinculada a la factura <strong>{rectifyModal.invoice?.invoiceNumber}</strong> con importes negativos correspondientes al abono fiscal.
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Motivo legal de la rectificación *
            </label>
            <input
              type="text"
              required
              value={rectifyModal.reason}
              onChange={(e) => setRectifyModal({ ...rectifyModal, reason: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setRectifyModal({ isOpen: false, invoice: null, reason: '' })}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmRectify}
              className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
            >
              Emitir Factura Rectificativa
            </button>
          </div>
        </div>
      </Modal>

      {/* SME Modals */}
      <AgingReportModal
        isOpen={isAgingModalOpen}
        onClose={() => setIsAgingModalOpen(false)}
        onPaymentRecorded={loadData}
      />

      {signingQuote && (
        <QuoteSignModal
          isOpen={Boolean(signingQuote)}
          onClose={() => setSigningQuote(null)}
          quoteId={signingQuote.id}
          quoteNumber={signingQuote.quoteNumber}
          total={signingQuote.total}
          publicToken={signingQuote.publicToken}
          onSignedSuccess={() => {
            setSigningQuote(null);
            loadData();
          }}
        />
      )}

      <ExcelCsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        targetType="invoices"
        onSuccess={() => {
          setIsImportModalOpen(false);
          loadData();
        }}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
