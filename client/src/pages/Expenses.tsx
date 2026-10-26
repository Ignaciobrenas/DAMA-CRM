import React, { useState, useEffect } from 'react';
import { WalletCards, Download, Plus, FileSpreadsheet, FileText, Search, X } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { api, downloadFile } from '../services/api';
import { Expense, ExpenseTable } from '../components/expenses/ExpenseTable';
import { PnLData, ExpenseKpis } from '../components/expenses/ExpenseKpis';
import { PnLBreakdown } from '../components/expenses/PnLBreakdown';
import { NewExpenseModal } from '../components/expenses/NewExpenseModal';
import { EditExpenseModal } from '../components/expenses/EditExpenseModal';
import { LoadingScreen } from '../components/common/Loading';

export const Expenses: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pnl, setPnl] = useState<PnLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchExpenses = async () => {
    try {
      const [expRes, pnlRes] = await Promise.all([
        api.get('/expenses', {
          params: {
            search: searchQuery || undefined,
            category: categoryFilter || undefined,
            status: statusFilter || undefined,
          },
        }),
        api.get('/expenses/pnl/summary'),
      ]);

      if (expRes.success && expRes.data) {
        setExpenses(expRes.data);
      } else if (expRes.data?.success) {
        setExpenses(expRes.data.data);
      }
      if (pnlRes.success && pnlRes.data) {
        setPnl(pnlRes.data);
      } else if (pnlRes.data?.success) {
        setPnl(pnlRes.data.data);
      }
    } catch (err: any) {
      toast.error(t('expenses.fetchError', 'Error al cargar los gastos'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [searchQuery, categoryFilter, statusFilter]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const expId = params.get('expenseId') || params.get('id');
    const q = params.get('q');
    const isNew = params.get('new') === 'true';

    if (q) setSearchQuery(q);
    if (isNew) setShowNewModal(true);
    if (expId && expenses.length > 0) {
      const found = expenses.find((e) => e.id === expId || e.expenseNumber === expId);
      if (found) {
        setEditingExpense(found);
        setShowEditModal(true);
      }
    }
  }, [expenses]);

  const handleDeleteExpense = async (id: string) => {
    const isConfirmed = await confirm({
      title: t('expenses.confirmDelete', '¿Eliminar gasto?'),
      description: '¿Estás seguro de que deseas eliminar este registro de gasto? Esta acción modificará el balance de pérdidas y ganancias.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!isConfirmed) return;
    try {
      const res = await api.delete(`/expenses/${id}`);
      if (res.data?.success || res.success) {
        toast.success(t('expenses.deletedSuccess', 'Gasto eliminado correctamente'));
        fetchExpenses();
      }
    } catch (err) {
      toast.error(t('expenses.deleteError', 'Error al eliminar gasto'));
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await api.patch(`/expenses/${id}`, { status: newStatus });
      if (res.data?.success || res.success) {
        toast.success(t('expenses.statusUpdated', 'Estado de pago actualizado'));
        fetchExpenses();
      }
    } catch (err) {
      toast.error(t('expenses.updateError', 'Error al actualizar gasto'));
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowEditModal(true);
  };

  const handleExportCSV = async () => {
    try {
      await downloadFile('/expenses/export/csv', `gastos_${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success(t('expenses.exportSuccess', 'Gastos exportados correctamente'));
    } catch (err) {
      toast.error(t('expenses.exportError', 'Error al exportar gastos'));
    }
  };

  const handleExportPDF = async () => {
    try {
      await downloadFile('/expenses/export/pdf', `informe_gastos_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(t('expenses.exportPdfSuccess', 'Informe PDF generado correctamente'));
    } catch (err) {
      toast.error(t('expenses.exportError', 'Error al generar informe PDF'));
    }
  };

  const handleExportTaxBooks = async (type: 'tax-issued' | 'tax-received') => {
    try {
      const res = await api.get(`/reports/export?type=${type}`);
      const blob = res.data instanceof Blob ? res.data : new Blob([typeof res.data === 'string' ? res.data : ''], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        type === 'tax-issued'
          ? 'Libro-Facturas-Expedidas-AEAT-Mod303.csv'
          : 'Libro-Facturas-Recibidas-AEAT-Mod303.csv'
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t('expenses.exportSuccess', 'Libro de facturas oficial exportado con éxito'));
    } catch (err) {
      toast.error(t('expenses.exportError', 'Error al exportar libro de facturas'));
    }
  };

  if (loading && expenses.length === 0) {
    return <LoadingScreen message={t('common.loading', 'Cargando...')} />;
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <WalletCards className="w-6 h-6" />
            </div>
            <span>{t('expenses.pageTitle', 'Control de Gastos & Margen P&L')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('expenses.pageSubtitle', 'Registro de compras, facturas de proveedores y liquidación de impuestos (Modelo 303)')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* General Exporters */}
          <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              onClick={handleExportCSV}
              data-testid="btn-export-csv"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
              title="Exportar Gastos a Excel (CSV)"
              aria-label="Exportar Gastos a Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              data-testid="btn-export-pdf"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
              title="Descargar Informe de Gastos en PDF"
              aria-label="Descargar Informe PDF de Gastos"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF</span>
            </button>
          </div>

          {/* Export AEAT Tax Books */}
          <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              onClick={() => handleExportTaxBooks('tax-issued')}
              data-testid="btn-export-aeat-issued"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
              title="Exportar Libro Registro de Facturas Expedidas (Ventas)"
              aria-label="Exportar Libro Registro de Facturas Expedidas"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{t('expenses.exportIssued', 'Libro Ventas')}</span>
            </button>
            <button
              onClick={() => handleExportTaxBooks('tax-received')}
              data-testid="btn-export-aeat-received"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
              title="Exportar Libro Registro de Facturas Recibidas (Gastos/Compras)"
              aria-label="Exportar Libro Registro de Facturas Recibidas"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">{t('expenses.exportReceived', 'Libro Gastos')}</span>
            </button>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            data-testid="btn-new-expense"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            aria-label="Registrar nuevo gasto"
          >
            <Plus className="w-4 h-4" />
            <span>{t('expenses.newExpense', 'Nuevo Gasto')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (P&L Margin + Tax Balance) */}
      <ExpenseKpis pnl={pnl} />

      {/* Visual Category Breakdown & P&L Info */}
      <PnLBreakdown pnl={pnl} />

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('expenses.searchPlaceholder', 'Buscar por proveedor, NIF o concepto...')}
            aria-label="Buscar gastos por proveedor, NIF o concepto"
            data-testid="input-search-expenses"
            className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              data-testid="btn-clear-search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filtrar gastos por categoría"
            data-testid="select-category-filter"
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-medium outline-none cursor-pointer"
          >
            <option value="">{t('expenses.allCategories', 'Todas las categorías')}</option>
            <option value="SOFTWARE">Software & Cloud</option>
            <option value="OPERATIONAL">Operaciones</option>
            <option value="MARKETING">Marketing</option>
            <option value="TRAVEL">Viajes & Dietas</option>
            <option value="OFFICE">Oficina</option>
            <option value="UTILITIES">Suministros</option>
            <option value="LEGAL">Asesoría Legal / Fiscal</option>
            <option value="OTHER">Otros</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrar gastos por estado"
            data-testid="select-status-filter"
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-medium outline-none cursor-pointer"
          >
            <option value="">{t('expenses.allStatuses', 'Todos los estados')}</option>
            <option value="PAID">{t('expenses.statusPaid', 'Pagado')}</option>
            <option value="PENDING">{t('expenses.statusPending', 'Pendiente')}</option>
            <option value="CANCELLED">{t('expenses.statusCancelled', 'Cancelado')}</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <ExpenseTable
        expenses={expenses}
        onDeleteExpense={handleDeleteExpense}
        onUpdateStatus={handleUpdateStatus}
        onEditExpense={handleEditExpense}
        onOpenNewExpense={() => setShowNewModal(true)}
      />

      {/* New Expense Modal */}
      <NewExpenseModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onExpenseCreated={() => {
          fetchExpenses();
        }}
      />

      {/* Edit Expense Modal */}
      <EditExpenseModal
        isOpen={showEditModal}
        expense={editingExpense}
        onClose={() => {
          setShowEditModal(false);
          setEditingExpense(null);
        }}
        onExpenseUpdated={() => {
          fetchExpenses();
        }}
      />
    </div>
  );
};

export default Expenses;
