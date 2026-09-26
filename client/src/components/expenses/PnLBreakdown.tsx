import React from 'react';
import { PnLData } from './ExpenseKpis';
import { useTranslation } from '../../context/LanguageContext';

interface PnLBreakdownProps {
  pnl: PnLData | null;
}

export const PnLBreakdown: React.FC<PnLBreakdownProps> = ({ pnl }) => {
  const { t } = useTranslation();

  if (!pnl || pnl.categoryBreakdown.length === 0) return null;

  const total = pnl.categoryBreakdown.reduce((sum, item) => sum + item.amount, 0) || 1;

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>📊</span> {t('expenses.categoryBreakdownTitle')}
        </h3>
        <span className="text-xs font-semibold text-slate-400">
          {t('expenses.total')}: {total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
        </span>
      </div>

      <div className="space-y-3">
        {pnl.categoryBreakdown.map((item) => {
          const pct = Math.round((item.amount / total) * 100);

          return (
            <div key={item.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {item.category}
                </span>
                <span className="font-mono text-slate-500 dark:text-slate-400">
                  {item.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} € ({pct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
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
