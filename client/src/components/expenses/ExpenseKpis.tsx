import React from 'react';
import { useTranslation } from '../../context/LanguageContext';

export interface PnLData {
  totalInvoiced: number;
  paidRevenue: number;
  invoicedSubtotal: number;
  outputVat: number;
  totalExpenses: number;
  paidExpenses: number;
  expensesSubtotal: number;
  deductibleVat: number;
  operatingProfit: number;
  operatingMarginPct: number;
  vatBalanceToPay: number;
  categoryBreakdown: Array<{ category: string; amount: number }>;
}

interface ExpenseKpisProps {
  pnl: PnLData | null;
}

export const ExpenseKpis: React.FC<ExpenseKpisProps> = ({ pnl }) => {
  const { t } = useTranslation();

  if (!pnl) return null;

  const isProfitPositive = pnl.operatingProfit >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Invoiced Sales */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>{t('expenses.totalInvoicedRevenue')}</span>
          <span className="text-emerald-500 text-base">📈</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {pnl.totalInvoiced.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
          </span>
        </div>
        <span className="text-[11px] text-slate-400 block mt-1">
          {t('expenses.paidRevenue')}: {pnl.paidRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
        </span>
      </div>

      {/* Operating Expenses */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>{t('expenses.totalExpenses')}</span>
          <span className="text-rose-500 text-base">📉</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {pnl.totalExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
          </span>
        </div>
        <span className="text-[11px] text-slate-400 block mt-1">
          {t('expenses.paidExpenses')}: {pnl.paidExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
        </span>
      </div>

      {/* Operating Profit Margin (P&L) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>{t('expenses.operatingMargin')} (P&L)</span>
          <span className="text-base">{isProfitPositive ? '✨' : '⚠️'}</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-2xl font-black ${isProfitPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {pnl.operatingProfit.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isProfitPositive ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400'}`}>
            {pnl.operatingMarginPct}%
          </span>
        </div>
        <span className="text-[11px] text-slate-400 block mt-1">
          {t('expenses.preTaxMargin')}
        </span>
      </div>

      {/* Tax / AEAT Modelo 303 Net Balance */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>{t('expenses.vatBalance')} (Mod 303)</span>
          <span className="text-blue-500 text-base">🏛️</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {pnl.vatBalanceToPay.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
          </span>
        </div>
        <span className="text-[11px] text-slate-400 block mt-1">
          {t('expenses.vatRepercutido')} ({pnl.outputVat}€) - {t('expenses.vatSoportado')} ({pnl.deductibleVat}€)
        </span>
      </div>
    </div>
  );
};
