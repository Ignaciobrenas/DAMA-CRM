import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Users,
  CheckSquare,
  ArrowUpRight,
  Plus,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';
import { AnimatedIcon } from '../components/ui/AnimatedIcon';
import { BarChart } from '../components/ui/Charts';

export const Dashboard: React.FC<{ onNavigate: (route: string) => void }> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [contactsCount, setContactsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [chartView, setChartView] = useState<'bars' | 'list'>('bars');

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

  const stageChartData =
    pipelineData?.stages?.map((stage: any) => ({
      label: stage.name,
      value: stage.metrics.totalValue,
      color: stage.color,
    })) || [];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 350, damping: 25 },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('dashboard')}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Resumen operativo y comercial de la empresa en tiempo real
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('/pipeline')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('newDeal')}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('/invoicing')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('newInvoice')}</span>
          </motion.button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Total Revenue / Pipeline */}
        <motion.div
          variants={cardVariants}
          whileHover={{ y: -4, transition: { duration: 0.18 } }}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Total en Pipeline</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <AnimatedIcon animation="hover-scale">
                <DollarSign className="w-4 h-4" />
              </AnimatedIcon>
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            <AnimatedCounter
              to={totalValue}
              formatter={(val) => val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            />
          </div>
          <div className="mt-1 flex items-center text-[11px] text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>Valor ponderado: {(pipelineData?.summary?.weightedValue || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
          </div>
        </motion.div>

        {/* Closed Won Revenue */}
        <motion.div
          variants={cardVariants}
          whileHover={{ y: -4, transition: { duration: 0.18 } }}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Ventas Ganadas</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <AnimatedIcon animation="hover-scale">
                <TrendingUp className="w-4 h-4" />
              </AnimatedIcon>
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            <AnimatedCounter
              to={wonValue}
              formatter={(val) => val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            />
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
            Facturadas y en ejecución
          </div>
        </motion.div>

        {/* Active Deals */}
        <motion.div
          variants={cardVariants}
          whileHover={{ y: -4, transition: { duration: 0.18 } }}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('activeDeals')}</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <AnimatedIcon animation="hover-scale">
                <Briefcase className="w-4 h-4" />
              </AnimatedIcon>
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            <AnimatedCounter to={activeDeals} />
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
            Oportunidades en embudo
          </div>
        </motion.div>

        {/* Open Tasks */}
        <motion.div
          variants={cardVariants}
          whileHover={{ y: -4, transition: { duration: 0.18 } }}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('openTasks')}</span>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <AnimatedIcon animation="hover-scale">
                <CheckSquare className="w-4 h-4" />
              </AnimatedIcon>
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            <AnimatedCounter to={pendingTasks} />
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
            En sprints de desarrollo activo
          </div>
        </motion.div>
      </motion.div>

      {/* Pipeline Funnel Distribution & Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Stages Breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Distribución del Embudo Comercial</h2>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">Volumen económico acumulado por fase</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex p-0.5 bg-gray-100 dark:bg-slate-800 rounded-lg text-[10px] font-semibold">
                  <button
                    onClick={() => setChartView('bars')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      chartView === 'bars'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                    }`}
                  >
                    Gráfico
                  </button>
                  <button
                    onClick={() => setChartView('list')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      chartView === 'list'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                    }`}
                  >
                    Desglose
                  </button>
                </div>
                <button
                  onClick={() => onNavigate('/pipeline')}
                  className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center ml-2"
                >
                  Ver Kanban <ExternalLink className="w-3 h-3 ml-1" />
                </button>
              </div>
            </div>

            {chartView === 'bars' ? (
              <div className="py-2">
                <BarChart
                  data={stageChartData}
                  height={180}
                  valueFormatter={(v) =>
                    v.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
                  }
                />
              </div>
            ) : (
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
            )}
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
              Ver Todas
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
    </div>
  );
};
