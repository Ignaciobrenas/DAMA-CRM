import React from 'react';
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
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  onDeleteExpense,
  onUpdateStatus,
}) => {
  const { t } = useTranslation();

  const getCategoryBadge = (category: string) => {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        {category}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">{t('expenses.statusPaid')}</span>;
      case 'PENDING':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">{t('expenses.statusPending')}</span>;
      case 'CANCELLED':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">{t('expenses.statusCancelled')}</span>;
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400 dark:text-slate-500">
        <p className="text-base">{t('expenses.noExpensesFound')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
            <th className="py-3.5 px-4">{t('expenses.expenseNumber')}</th>
            <th className="py-3.5 px-4">{t('expenses.supplier')}</th>
            <th className="py-3.5 px-4">{t('expenses.category')}</th>
            <th className="py-3.5 px-4">{t('expenses.date')}</th>
            <th className="py-3.5 px-4">{t('expenses.subtotal')}</th>
            <th className="py-3.5 px-4">{t('expenses.taxAmount')} (IVA)</th>
            <th className="py-3.5 px-4">{t('expenses.total')}</th>
            <th className="py-3.5 px-4">{t('expenses.status')}</th>
            <th className="py-3.5 px-4 text-right">{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {expenses.map((expense) => (
            <tr key={expense.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
              <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                {expense.expenseNumber}
              </td>
              <td className="py-3.5 px-4">
                <div className="font-semibold text-slate-900 dark:text-white">
                  {expense.supplierName}
                </div>
                {expense.supplierTaxId && (
                  <div className="text-xs text-slate-400 font-mono">
                    {expense.supplierTaxId}
                  </div>
                )}
              </td>
              <td className="py-3.5 px-4">{getCategoryBadge(expense.category)}</td>
              <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs">
                {new Date(expense.issueDate).toLocaleDateString()}
              </td>
              <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                {expense.subtotal.toFixed(2)} €
              </td>
              <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs">
                {expense.taxAmount.toFixed(2)} € ({expense.taxRate}%)
              </td>
              <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                {expense.total.toFixed(2)} €
              </td>
              <td className="py-3.5 px-4">
                <button
                  onClick={() =>
                    onUpdateStatus(
                      expense.id,
                      expense.status === 'PAID' ? 'PENDING' : 'PAID'
                    )
                  }
                  title="Click para alternar estado de pago"
                  className="cursor-pointer"
                >
                  {getStatusBadge(expense.status)}
                </button>
              </td>
              <td className="py-3.5 px-4 text-right">
                <button
                  onClick={() => onDeleteExpense(expense.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                  title={t('common.delete')}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
