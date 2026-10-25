import React from 'react';
import { TrendingUp, TrendingDown, Sparkles, AlertTriangle, Building2 } from 'lucide-react';
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

  if (!pnl) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs h-28 flex flex-col justify-between">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2"></div>
            <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
            <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const isProfitPositive = pnl.operatingProfit >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Invoiced Sales */}
      <div data-testid="kpi-invoiced" className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs transition hover:shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>{t('expenses.totalInvoicedRevenue', 'Ingresos Facturados')}</span>
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {pnl.totalInvoiced.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
          </span>
        </div>
        <span className="text-[11px] text-slate-400 block mt-1">
          {t('expenses.paidRevenue', 'Cobrado')}: {pnl.paidRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
        </span>
      </div>

      {/* Operating Expenses */}
      <div data-testid="kpi-expenses" className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs transition hover:shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>{t('expenses.totalExpenses', 'Gastos Operativos')}</span>
          <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {pnl.totalExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
          </span>
        </div>
        <span className="text-[11px] text-slate-400 block mt-1">
          {t('expenses.paidExpenses', 'Pagado')}: {pnl.paidExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
        </span>
      </div>

      {/* Operating Profit Margin (P&L) */}
      <div data-testid="kpi-operating-profit" className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs transition hover:shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>{t('expenses.operatingMargin', 'Margen Operativo')} (P&L)</span>
          <div className={`p-1.5 rounded-lg ${isProfitPositive ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'}`}>
            {isProfitPositive ? <Sparkles className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </div>
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
          {t('expenses.preTaxMargin', 'Margen neto antes de impuestos')}
        </span>
      </div>

      {/* Tax / AEAT Modelo 303 Net Balance */}
      <div data-testid="kpi-vat-balance" className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs transition hover:shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>{t('expenses.vatBalance', 'Saldo IVA')} (Mod 303)</span>
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {pnl.vatBalanceToPay.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
          </span>
        </div>
        <span className="text-[11px] text-slate-400 block mt-1">
          {t('expenses.vatRepercutido', 'Repercutido')} ({pnl.outputVat}€) - {t('expenses.vatSoportado', 'Soportado')} ({pnl.deductibleVat}€)
        </span>
      </div>
    </div>
  );
};
