import React from 'react';
import { PieChart, Layers } from 'lucide-react';
import { PnLData } from './ExpenseKpis';
import { useTranslation } from '../../context/LanguageContext';

interface PnLBreakdownProps {
  pnl: PnLData | null;
}

export const PnLBreakdown: React.FC<PnLBreakdownProps> = ({ pnl }) => {
  const { t } = useTranslation();

  if (!pnl || pnl.categoryBreakdown.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <span>{t('expenses.categoryBreakdownTitle', 'Desglose de Gastos por Categoría')}</span>
        </div>
        <span className="text-slate-400">Sin datos registrados de desglose por categoría</span>
      </div>
    );
  }

  const total = pnl.categoryBreakdown.reduce((sum, item) => sum + item.amount, 0) || 1;

  const getBarColor = (category: string) => {
    switch (category) {
      case 'SOFTWARE':
        return 'bg-indigo-500';
      case 'OPERATIONAL':
        return 'bg-blue-500';
      case 'MARKETING':
        return 'bg-purple-500';
      case 'TRAVEL':
        return 'bg-sky-500';
      case 'OFFICE':
        return 'bg-amber-500';
      case 'UTILITIES':
        return 'bg-teal-500';
      case 'LEGAL':
        return 'bg-emerald-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <PieChart className="w-4 h-4 text-blue-500" />
          <span>{t('expenses.categoryBreakdownTitle', 'Desglose de Gastos por Categoría')}</span>
        </h3>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {t('expenses.total', 'Total')}: <span className="font-mono font-bold text-slate-900 dark:text-white">{total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
        </span>
      </div>

      <div className="space-y-3">
        {pnl.categoryBreakdown.map((item) => {
          const pct = Math.max(1, Math.round((item.amount / total) * 100));

          return (
            <div key={item.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {item.category}
                </span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  {item.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} € ({pct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getBarColor(item.category)} rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
