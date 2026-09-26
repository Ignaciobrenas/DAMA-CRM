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
  GripVertical,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Building2,
  Receipt,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';
import { AnimatedIcon } from '../components/ui/AnimatedIcon';
import { BarChart } from '../components/ui/Charts';

const DEFAULT_WIDGETS = ['kpis', 'cashflow_forecast', 'pipeline_chart', 'recent_tasks', 'top_deals', 'quick_actions'];

export const Dashboard: React.FC<{ onNavigate: (route: string) => void }> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { user, updatePreferences } = useAuth();
  const toast = useToast();

  const [pipelineData, setPipelineData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [contactsCount, setContactsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [chartView, setChartView] = useState<'bars' | 'list'>('bars');

  const [timeframe, setTimeframe] = useState<'today' | 'thisWeek' | 'thisMonth' | 'thisQuarter' | 'thisYear'>('thisMonth');
  const [invoices, setInvoices] = useState<any[]>([]);

  // Drag and drop state
  const [widgets, setWidgets] = useState<string[]>(DEFAULT_WIDGETS);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragOverWidget, setDragOverWidget] = useState<string | null>(null);

  // Sync widgets with user preferences on mount / change
  useEffect(() => {
    if (user?.preferences?.dashboardWidgets && Array.isArray(user.preferences.dashboardWidgets)) {
      // Ensure all current widgets are included even if schema updated
      const saved = user.preferences.dashboardWidgets.filter((w) => DEFAULT_WIDGETS.includes(w));
      const missing = DEFAULT_WIDGETS.filter((w) => !saved.includes(w));
      setWidgets([...saved, ...missing]);
    } else {
      setWidgets(DEFAULT_WIDGETS);
    }
  }, [user?.preferences?.dashboardWidgets]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [resPipeline, resTasks, resContacts, resInvoices] = await Promise.all([
        apiRequest('/deals/pipeline'),
        apiRequest('/projects/tasks/all'),
        apiRequest('/contacts?limit=1'),
        apiRequest('/invoices?limit=100'),
      ]);

      if (resPipeline.success) setPipelineData(resPipeline.data);
      if (resTasks.success) setTasks(resTasks.data || []);
      if (resContacts.success) setContactsCount(resContacts.pagination?.total || 0);
      if (resInvoices.success && resInvoices.data) setInvoices(resInvoices.data);

      setIsLoading(false);
    }
    loadData();
  }, []);

  const totalValue = pipelineData?.summary?.totalValue || 0;
  const wonValue = pipelineData?.summary?.wonValue || 0;
  const activeDeals = pipelineData?.summary?.totalDeals || 0;
  const pendingTasks = tasks.filter((t) => t.status !== 'DONE').length;

  // Conversion rate
  const conversionRate = activeDeals > 0 ? Math.min(100, Math.round((wonValue / (totalValue || 1)) * 100)) : 24;

  // Cashflow forecast calculation based on pending invoices & pipeline
  const pendingInvoicesList = invoices.filter((inv) => inv.status === 'SENT' || inv.status === 'OVERDUE');
  const now = Date.now();
  const d30 = now + 30 * 86400000;
  const d60 = now + 60 * 86400000;
  const d90 = now + 90 * 86400000;

  const forecastNext30 = pendingInvoicesList
    .filter((inv) => new Date(inv.dueDate || inv.createdAt).getTime() <= d30)
    .reduce((sum, inv) => sum + (inv.total || 0), 0) + (pipelineData?.summary?.weightedValue || 0) * 0.4;

  const forecast30to60 = pendingInvoicesList
    .filter((inv) => {
      const t = new Date(inv.dueDate || inv.createdAt).getTime();
      return t > d30 && t <= d60;
    })
    .reduce((sum, inv) => sum + (inv.total || 0), 0) + (pipelineData?.summary?.weightedValue || 0) * 0.35;

  const forecast60to90 = pendingInvoicesList
    .filter((inv) => {
      const t = new Date(inv.dueDate || inv.createdAt).getTime();
      return t > d60 && t <= d90;
    })
    .reduce((sum, inv) => sum + (inv.total || 0), 0) + (pipelineData?.summary?.weightedValue || 0) * 0.25;

  const stageChartData =
    pipelineData?.stages?.map((stage: any) => ({
      label: stage.name,
      value: stage.metrics.totalValue,
      color: stage.color,
    })) || [];

  // Extract top deals sorted by value
  const allDeals = (pipelineData?.stages || [])
    .flatMap((stage: any) =>
      (stage.deals || []).map((deal: any) => ({
        ...deal,
        stageName: stage.name,
        stageColor: stage.color,
      }))
    )
    .sort((a: any, b: any) => (b.value || 0) - (a.value || 0));

  const topDeals = allDeals.slice(0, 5);

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

  // Reorder helper
  const handleReorder = async (newOrder: string[]) => {
    setWidgets(newOrder);
    const success = await updatePreferences({ dashboardWidgets: newOrder });
    if (success) {
      toast.success('Diseño guardado', 'La distribución del dashboard se ha guardado en tu perfil.');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.setData('text/plain', widgetId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, widgetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverWidget !== widgetId) {
      setDragOverWidget(widgetId);
    }
  };

  const handleDragLeave = () => {
    setDragOverWidget(null);
  };

  const handleDrop = async (e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault();
    setDragOverWidget(null);
    if (!draggedWidget || draggedWidget === targetWidgetId) {
      setDraggedWidget(null);
      return;
    }

    const currentOrder = [...widgets];
    const fromIndex = currentOrder.indexOf(draggedWidget);
    const toIndex = currentOrder.indexOf(targetWidgetId);

    if (fromIndex !== -1 && toIndex !== -1) {
      currentOrder.splice(fromIndex, 1);
      currentOrder.splice(toIndex, 0, draggedWidget);
      await handleReorder(currentOrder);
    }

    setDraggedWidget(null);
  };

  const moveWidget = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= widgets.length) return;

    const newOrder = [...widgets];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    await handleReorder(newOrder);
  };

  const resetWidgets = async () => {
    await handleReorder(DEFAULT_WIDGETS);
    toast.info('Diseño restablecido', 'Se ha recuperado el orden predeterminado de las tarjetas.');
  };

  // Widget Renderers
  const renderWidgetHeader = (id: string, title: string, subtitle: string, index: number) => {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/80 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800 rounded-t-xl select-none">
        <div className="flex items-center space-x-2">
          <div
            title="Arrastra para mover este bloque"
            className="cursor-grab active:cursor-grabbing p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-slate-700/60 transition-colors"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-800 dark:text-slate-200">{title}</h3>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 hidden sm:block">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => moveWidget(index, 'up')}
            title="Subir widget"
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={index === widgets.length - 1}
            onClick={() => moveWidget(index, 'down')}
            title="Bajar widget"
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const renderWidgetContent = (widgetId: string, index: number) => {
    switch (widgetId) {
      case 'kpis':
        return (
          <div className="p-4">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
            >
              {/* Total Revenue / Pipeline */}
              <motion.div
                variants={cardVariants}
                whileHover={{ y: -3, transition: { duration: 0.18 } }}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('pipelineTotal')}</span>
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <AnimatedIcon animation="hover-scale">
                      <DollarSign className="w-4 h-4" />
                    </AnimatedIcon>
                  </div>
                </div>
                <div className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                  <AnimatedCounter
                    to={totalValue}
                    formatter={(val) =>
                      val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
                    }
                  />
                </div>
                <div className="mt-1 flex items-center text-[11px] text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                  <span>
                    {t('dashboard.pipelineWeighted')}:{' '}
                    {(pipelineData?.summary?.weightedValue || 0).toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </motion.div>

              {/* Closed Won Revenue */}
              <motion.div
                variants={cardVariants}
                whileHover={{ y: -3, transition: { duration: 0.18 } }}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('wonSales')}</span>
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <AnimatedIcon animation="hover-scale">
                      <TrendingUp className="w-4 h-4" />
                    </AnimatedIcon>
                  </div>
                </div>
                <div className="mt-2 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  <AnimatedCounter
                    to={wonValue}
                    formatter={(val) =>
                      val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
                    }
                  />
                </div>
                <div className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">{t('invoicedAndExecuted')}</div>
              </motion.div>

              {/* Conversion Rate */}
              <motion.div
                variants={cardVariants}
                whileHover={{ y: -3, transition: { duration: 0.18 } }}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('dashboard.conversionRate')}</span>
                  <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                    <AnimatedIcon animation="hover-scale">
                      <CheckCircle2 className="w-4 h-4" />
                    </AnimatedIcon>
                  </div>
                </div>
                <div className="mt-2 text-xl font-bold text-teal-600 dark:text-teal-400">
                  <AnimatedCounter to={conversionRate} formatter={(val) => `${val}%`} />
                </div>
                <div className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">{activeDeals} {t('deals')}</div>
              </motion.div>

              {/* Active Deals */}
              <motion.div
                variants={cardVariants}
                whileHover={{ y: -3, transition: { duration: 0.18 } }}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('activeDeals')}</span>
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <AnimatedIcon animation="hover-scale">
                      <Briefcase className="w-4 h-4" />
                    </AnimatedIcon>
                  </div>
                </div>
                <div className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                  <AnimatedCounter to={activeDeals} />
                </div>
                <div className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">{t('dealsInPipeline')}</div>
              </motion.div>

              {/* Open Tasks */}
              <motion.div
                variants={cardVariants}
                whileHover={{ y: -3, transition: { duration: 0.18 } }}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{t('openTasks')}</span>
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                    <AnimatedIcon animation="hover-scale">
                      <CheckSquare className="w-4 h-4" />
                    </AnimatedIcon>
                  </div>
                </div>
                <div className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                  <AnimatedCounter to={pendingTasks} />
                </div>
                <div className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">{t('tasksInActiveSprints')}</div>
              </motion.div>
            </motion.div>
          </div>
        );

      case 'cashflow_forecast':
        return (
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/40 dark:bg-blue-950/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300">{t('dashboard.forecast30')}</span>
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-xl font-extrabold text-blue-700 dark:text-blue-400">
                  {forecastNext30.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                </div>
                <div className="w-full bg-blue-200/50 dark:bg-blue-900/40 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: '85%' }} />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/40 dark:bg-indigo-950/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">{t('dashboard.forecast60')}</span>
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-xl font-extrabold text-indigo-700 dark:text-indigo-400">
                  {forecast30to60.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                </div>
                <div className="w-full bg-indigo-200/50 dark:bg-indigo-900/40 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: '60%' }} />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-purple-100 dark:border-purple-900/30 bg-purple-50/40 dark:bg-purple-950/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-300">{t('dashboard.forecast90')}</span>
                  <DollarSign className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-xl font-extrabold text-purple-700 dark:text-purple-400">
                  {forecast60to90.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                </div>
                <div className="w-full bg-purple-200/50 dark:bg-purple-900/40 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: '40%' }} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'pipeline_chart':
        return (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('dashboard.pipelineDistributionTitle')}</h4>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">{t('dashboard.pipelineTotalVolume')}</p>
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
        );

      case 'recent_tasks':
        return (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('myTasks')}</h4>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">{t('dashboard.activeSprintTasks')}</p>
              </div>
              <button
                onClick={() => onNavigate('/agile')}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Ver Todas
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400">{t('dashboard.noPendingTasks')}</div>
            ) : (
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
                        {task.project?.name || t('dashboard.generalProject')} • {t('priority')}: {task.priority}
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
            )}
          </div>
        );

      case 'top_deals':
        return (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('dashboard.topDealsTitle')}</h4>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">{t('dashboard.topDealsSubtitle')}</p>
              </div>
              <button
                onClick={() => onNavigate('/pipeline')}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Abrir Pipeline
              </button>
            </div>

            {topDeals.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400">{t('dashboard.noDealsRegistered')}</div>
            ) : (
              <div className="space-y-2.5">
                {topDeals.map((deal: any) => (
                  <div
                    key={deal.id}
                    onClick={() => onNavigate('/pipeline')}
                    className="p-3 rounded-lg border border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-gray-900 dark:text-white flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: deal.stageColor }} />
                        <span>{deal.title}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-slate-400 flex items-center space-x-2">
                        {deal.company?.name && (
                          <span className="flex items-center">
                            <Building2 className="w-3 h-3 mr-0.5" />
                            {deal.company.name}
                          </span>
                        )}
                        <span>• {t('stage')}: {deal.stageName}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {(deal.value || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-slate-500">{deal.probability || 50}% prob.</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'quick_actions':
        return (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('dashboard.quickOperationsTitle')}</h4>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">{t('dashboard.quickOperationsSubtitle')}</p>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Operativo
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/pipeline')}
                className="p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xs transition-all text-left group"
              >
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 w-fit mb-2 group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-gray-900 dark:text-white">{t('dashboard.pipelineCrmLink')}</div>
                <div className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">{activeDeals} {t('ongoing')}</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/invoicing')}
                className="p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-xs transition-all text-left group"
              >
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 w-fit mb-2 group-hover:scale-105 transition-transform">
                  <Receipt className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-gray-900 dark:text-white">{t('dashboard.invoicingLink')}</div>
                <div className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">{t('dashboard.invoicingCreate')}</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/omnichannel')}
                className="p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-xs transition-all text-left group"
              >
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 w-fit mb-2 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-gray-900 dark:text-white">{t('dashboard.omnichannelLink')}</div>
                <div className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">{t('dashboard.omnichannelChat')}</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/reports')}
                className="p-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-xs transition-all text-left group"
              >
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 w-fit mb-2 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-gray-900 dark:text-white">{t('dashboard.reportsBiLink')}</div>
                <div className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">{t('dashboard.reportsBiMetrics')}</div>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getWidgetInfo = (id: string) => {
    switch (id) {
      case 'kpis':
        return { title: t('dashboard.kpisTitle'), subtitle: t('dashboard.kpisSubtitle') };
      case 'cashflow_forecast':
        return { title: t('dashboard.cashflowForecast'), subtitle: t('dashboard.forecast30') + ' • ' + t('dashboard.forecast60') + ' • ' + t('dashboard.forecast90') };
      case 'pipeline_chart':
        return { title: t('dashboard.pipelineChartTitle'), subtitle: t('dashboard.pipelineChartSubtitle') };
      case 'recent_tasks':
        return { title: t('dashboard.recentTasksTitle'), subtitle: t('dashboard.recentTasksSubtitle') };
      case 'top_deals':
        return { title: t('dashboard.topDealsWidgetTitle'), subtitle: t('dashboard.topDealsWidgetSubtitle') };
      case 'quick_actions':
        return { title: t('dashboard.quickActionsTitle'), subtitle: t('dashboard.quickActionsSubtitle') };
      default:
        return { title: id, subtitle: '' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions, Timeframe & Drag Info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{t('dashboard')}</h1>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
              <Sparkles className="w-3 h-3" />
              <span>{t('dashboard.customizableDragDrop')}</span>
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {t('dashboard.dragDropInstructions')}
          </p>
        </div>

        {/* Timeframe Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Pills */}
          <div className="flex p-1 bg-gray-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold">
            {[
              { id: 'today', label: t('dashboard.today') },
              { id: 'thisWeek', label: t('dashboard.thisWeek') },
              { id: 'thisMonth', label: t('dashboard.thisMonth') },
              { id: 'thisQuarter', label: t('dashboard.thisQuarter') },
              { id: 'thisYear', label: t('dashboard.thisYear') },
            ].map((period) => (
              <button
                key={period.id}
                type="button"
                onClick={() => setTimeframe(period.id as any)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  timeframe === period.id
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetWidgets}
            title={t('dashboard.resetLayoutDefault')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
            <span className="hidden sm:inline">{t('dashboard.resetLayout')}</span>
          </motion.button>
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

      {/* Draggable Widgets Stack */}
      <div className="space-y-6">
        {widgets.map((widgetId, index) => {
          const info = getWidgetInfo(widgetId);
          const isDragging = draggedWidget === widgetId;
          const isOver = dragOverWidget === widgetId && draggedWidget !== widgetId;

          return (
            <div
              key={widgetId}
              draggable
              onDragStart={(e) => handleDragStart(e, widgetId)}
              onDragOver={(e) => handleDragOver(e, widgetId)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, widgetId)}
              className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 shadow-xs ${
                isDragging
                  ? 'opacity-40 border-dashed border-blue-500 scale-[0.99]'
                  : isOver
                  ? 'border-2 border-blue-500 ring-4 ring-blue-500/10 bg-blue-50/20 dark:bg-blue-950/20'
                  : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700'
              }`}
            >
              {renderWidgetHeader(widgetId, info.title, info.subtitle, index)}
              {renderWidgetContent(widgetId, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
