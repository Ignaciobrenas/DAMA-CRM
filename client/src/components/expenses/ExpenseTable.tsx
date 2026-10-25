import React from 'react';
import { Trash2, Pencil, ExternalLink, Receipt, Plus } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

export interface Expense {
  id: string;
  expenseNumber: string;
  supplierName: string;
  supplierTaxId?: string;
  category: string;
  issueDate: string;
  dueDate?: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: string;
  paymentMethod?: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
}

interface ExpenseTableProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: string) => void;
  onEditExpense: (expense: Expense) => void;
  onOpenNewExpense?: () => void;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  onDeleteExpense,
  onUpdateStatus,
  onEditExpense,
  onOpenNewExpense,
}) => {
  const { t } = useTranslation();

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'SOFTWARE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/40">
            Software & Cloud
          </span>
        );
      case 'OPERATIONAL':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40">
            Operaciones
          </span>
        );
      case 'MARKETING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/40">
            Marketing
          </span>
        );
      case 'TRAVEL':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/40">
            Viajes & Dietas
          </span>
        );
      case 'OFFICE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40">
            Oficina
          </span>
        );
      case 'UTILITIES':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/60 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800/40">
            Suministros
          </span>
        );
      case 'LEGAL':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">
            Asesoría Legal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/40">
            {category || 'Otros'}
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {t('expenses.statusPaid', 'Pagado')}
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            {t('expenses.statusPending', 'Pendiente')}
          </span>
        );
      case 'CANCELLED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            {t('expenses.statusCancelled', 'Cancelado')}
          </span>
        );
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="py-16 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Receipt className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
          {t('expenses.noExpensesFound', 'No se encontraron gastos registrados')}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
          Comience registrando facturas de compra, licencias o recibos operativos para controlar el margen P&L.
        </p>
        {onOpenNewExpense && (
          <button
            onClick={onOpenNewExpense}
            data-testid="btn-empty-new-expense"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('expenses.newExpense', 'Nuevo Gasto')}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      <table className="w-full text-left border-collapse text-sm" data-testid="table-expenses">
        <caption className="sr-only">Listado de gastos y compras registradas</caption>
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
            <th scope="col" className="py-3.5 px-4">{t('expenses.expenseNumber', 'Nº Gasto')}</th>
            <th scope="col" className="py-3.5 px-4">{t('expenses.supplier', 'Proveedor')}</th>
            <th scope="col" className="py-3.5 px-4">{t('expenses.category', 'Categoría')}</th>
            <th scope="col" className="py-3.5 px-4">{t('expenses.date', 'Fecha')}</th>
            <th scope="col" className="py-3.5 px-4">{t('expenses.subtotal', 'Base')}</th>
            <th scope="col" className="py-3.5 px-4">{t('expenses.taxAmount', 'Cuota IVA')}</th>
            <th scope="col" className="py-3.5 px-4">{t('expenses.total', 'Total')}</th>
            <th scope="col" className="py-3.5 px-4">{t('expenses.status', 'Estado')}</th>
            <th scope="col" className="py-3.5 px-4 text-right">{t('common.actions', 'Acciones')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {expenses.map((expense) => (
            <tr key={expense.id} data-testid={`expense-row-${expense.id}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
              <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span data-testid={`expense-number-${expense.id}`}>{expense.expenseNumber}</span>
                  {expense.receiptUrl && (
                    <a
                      href={expense.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ver factura/comprobante adjunto"
                      aria-label={`Ver comprobante del gasto ${expense.expenseNumber}`}
                      className="text-blue-500 hover:text-blue-700 transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </span>
              </td>
              <td className="py-3.5 px-4">
                <div data-testid={`expense-supplier-${expense.id}`} className="font-semibold text-slate-900 dark:text-white">
                  {expense.supplierName}
                </div>
                {expense.supplierTaxId && (
                  <div className="text-xs text-slate-400 font-mono">
                    {expense.supplierTaxId}
                  </div>
                )}
                {expense.notes && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs" title={expense.notes}>
                    {expense.notes}
                  </div>
                )}
              </td>
              <td className="py-3.5 px-4">{getCategoryBadge(expense.category)}</td>
              <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs">
                {new Date(expense.issueDate).toLocaleDateString()}
              </td>
              <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono text-xs">
                {expense.subtotal.toFixed(2)} €
              </td>
              <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs font-mono">
                {expense.taxAmount.toFixed(2)} € <span className="text-slate-400">({expense.taxRate}%)</span>
              </td>
              <td data-testid={`expense-total-${expense.id}`} className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-mono text-xs">
                {expense.total.toFixed(2)} €
              </td>
              <td className="py-3.5 px-4">
                <button
                  type="button"
                  data-testid={`btn-toggle-status-${expense.id}`}
                  onClick={() =>
                    onUpdateStatus(
                      expense.id,
                      expense.status === 'PAID' ? 'PENDING' : 'PAID'
                    )
                  }
                  title="Click para alternar estado de pago"
                  aria-label={`Alternar estado de pago de ${expense.status}`}
                  className="cursor-pointer hover:opacity-85 transition"
                >
                  {getStatusBadge(expense.status)}
                </button>
              </td>
              <td className="py-3.5 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    data-testid={`btn-edit-expense-${expense.id}`}
                    onClick={() => onEditExpense(expense)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title={t('common.edit', 'Editar')}
                    aria-label={`Editar gasto ${expense.expenseNumber}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    data-testid={`btn-delete-expense-${expense.id}`}
                    onClick={() => onDeleteExpense(expense.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title={t('common.delete', 'Eliminar')}
                    aria-label={`Eliminar gasto ${expense.expenseNumber}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
