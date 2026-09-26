import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Expense, ExpenseTable } from '../components/expenses/ExpenseTable';
import { PnLData, ExpenseKpis } from '../components/expenses/ExpenseKpis';
import { PnLBreakdown } from '../components/expenses/PnLBreakdown';
import { NewExpenseModal } from '../components/expenses/NewExpenseModal';
import { LoadingScreen } from '../components/common/Loading';

export const Expenses: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pnl, setPnl] = useState<PnLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

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
      toast.error(t('expenses.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [searchQuery, categoryFilter, statusFilter]);

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm(t('expenses.confirmDelete'))) return;
    try {
      const res = await api.delete(`/expenses/${id}`);
      if (res.data?.success) {
        toast.success(t('expenses.deletedSuccess'));
        fetchExpenses();
      }
    } catch (err) {
      toast.error(t('expenses.deleteError'));
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await api.patch(`/expenses/${id}`, { status: newStatus });
      if (res.data?.success) {
        toast.success(t('expenses.statusUpdated'));
        fetchExpenses();
      }
    } catch (err) {
      toast.error(t('expenses.updateError'));
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
      toast.success(t('expenses.exportSuccess'));
    } catch (err) {
      toast.error(t('expenses.exportError'));
    }
  };

  if (loading && expenses.length === 0) {
    return <LoadingScreen message={t('common.loading')} />;
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            💸 {t('expenses.pageTitle')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('expenses.pageSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Export AEAT Tax Books */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => handleExportTaxBooks('tax-issued')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition"
              title="Exportar Libro Registro de Facturas Expedidas (Ventas)"
            >
              📥 {t('expenses.exportIssued')}
            </button>
            <button
              onClick={() => handleExportTaxBooks('tax-received')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition"
              title="Exportar Libro Registro de Facturas Recibidas (Gastos/Compras)"
            >
              📥 {t('expenses.exportReceived')}
            </button>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <span>+ {t('expenses.newExpense')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (P&L Margin + Tax Balance) */}
      <ExpenseKpis pnl={pnl} />

      {/* Visual Category Breakdown & P&L Info */}
      <PnLBreakdown pnl={pnl} />

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('expenses.searchPlaceholder')}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium outline-none"
          >
            <option value="">{t('expenses.allCategories')}</option>
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
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium outline-none"
          >
            <option value="">{t('expenses.allStatuses')}</option>
            <option value="PAID">{t('expenses.statusPaid')}</option>
            <option value="PENDING">{t('expenses.statusPending')}</option>
            <option value="CANCELLED">{t('expenses.statusCancelled')}</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <ExpenseTable
        expenses={expenses}
        onDeleteExpense={handleDeleteExpense}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* New Expense Modal */}
      <NewExpenseModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onExpenseCreated={() => {
          fetchExpenses();
        }}
      />
    </div>
  );
};

export default Expenses;
