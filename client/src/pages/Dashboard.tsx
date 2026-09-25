import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  CheckSquare,
  ArrowUpRight,
  Plus,
  Briefcase,
  ExternalLink,
  Zap,
  ShoppingCart,
  LifeBuoy,
  Calendar,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { SkeletonCard } from '../components/common/Loading';

export const Dashboard: React.FC<{ onNavigate: (route: string) => void }> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [contactsCount, setContactsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [resPipeline, resTasks, resContacts] = await Promise.all([
        apiRequest('/deals/pipeline'),
        apiRequest('/projects/tasks/all'),
        apiRequest('/contacts?limit=1'),
      ]);

      if (resPipeline.success) setPipelineData(resPipeline.data);
      if (resTasks.success) setTasks(resTasks.data || []);
      if (resContacts.success) setContactsCount(resContacts.pagination?.total || 0);

      setIsLoading(false);
    }
    loadData();
  }, []);

  const totalValue = pipelineData?.summary?.totalValue || 0;
  const wonValue = pipelineData?.summary?.wonValue || 0;
  const activeDeals = pipelineData?.summary?.totalDeals || 0;
  const pendingTasks = tasks.filter((t) => t.status !== 'DONE').length;

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('dashboard')}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {t('dashboardSubtitle')}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('/lead-capture')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{t('quickCapture')}</span>
          </button>
          <button
            onClick={() => onNavigate('/pipeline')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('newDeal')}</span>
          </button>
          <button
            onClick={() => onNavigate('/invoicing')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('newInvoice')}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue / Pipeline */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('pipelineTotal')}</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {totalValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>{t('weightedValue')}: {(pipelineData?.summary?.weightedValue || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* Closed Won Revenue */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('wonSales')}</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {wonValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
            {t('invoicedAndExecuted')}
          </div>
        </div>

        {/* Active Deals */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('activeDeals')}</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {activeDeals}
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
            {t('dealsInPipeline')}
          </div>
        </div>

        {/* Open Tasks */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('openTasks')}</span>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {pendingTasks}
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
            {t('tasksInActiveSprints')}
          </div>
        </div>
      </div>

      {/* Lead Capture & E-commerce Operational Intelligence Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Web Leads Captured */}
        <div
          onClick={() => onNavigate('/lead-capture')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('webLeadsCaptured')}</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {contactsCount}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
            <span>{t('formsAndMagnets')}</span>
            <span className="text-[10px] underline">{t('viewCenter')}</span>
          </div>
        </div>

        {/* E-commerce Abandoned Cart Recovery */}
        <div
          onClick={() => onNavigate('/lead-capture')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('abandonedCarts')}</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            1.420 €
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
            3 {t('activeCartFlows')}
          </div>
        </div>

        {/* Helpdesk & Ticketing SLA */}
        <div
          onClick={() => onNavigate('/portal')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-cyan-300 dark:hover:border-cyan-700 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('supportTickets')}</span>
            <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
              <LifeBuoy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            100% SLA
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
            Tiempo medio resp: 12 min
          </div>
        </div>

        {/* Web Tracking Dwell Time */}
        <div
          onClick={() => onNavigate('/lead-capture')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Píxel Telemetría</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            2m 45s
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
            Permanencia media web
          </div>
        </div>
      </div>

      {/* Pipeline Funnel Distribution & Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Stages Breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t('pipelineSubtitle')}</h2>
            <button
              onClick={() => onNavigate('/pipeline')}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center"
            >
              <span>{t('pipeline')}</span> <ExternalLink className="w-3 h-3 ml-1" />
            </button>
          </div>

          <div className="space-y-3">
            {pipelineData?.stages?.map((stage: any) => {
              const maxVal = Math.max(...(pipelineData?.stages?.map((s: any) => s.metrics.totalValue) || [1]));
              const percent = maxVal > 0 ? (stage.metrics.totalValue / maxVal) * 100 : 0;

              return (
                <div key={stage.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-700 dark:text-slate-300 flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: stage.color }} />
                      {stage.name} ({stage.metrics.count})
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {stage.metrics.totalValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(percent, 4)}%`,
                        backgroundColor: stage.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Urgent Tasks Checklist */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t('myTasks')}</h2>
            <button
              onClick={() => onNavigate('/agile')}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              {t('allTasks')}
            </button>
          </div>

          <div className="space-y-2.5">
            {tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="p-2.5 rounded-lg border border-gray-100 dark:border-slate-800/80 bg-gray-50 dark:bg-slate-800/40 flex items-start justify-between space-x-2"
              >
                <div>
                  <div className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                    {task.title}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">
                    {task.project?.name} • {task.priority}
                  </div>
                </div>
                <span
                  className={`text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    task.status === 'DONE'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : task.status === 'IN_PROGRESS'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                      : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )}
</div>
);
};
